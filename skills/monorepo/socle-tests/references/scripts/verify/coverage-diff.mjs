#!/usr/bin/env node
/**
 * Couverture du DIFF : chaque fichier de code modifié ou ajouté par rapport à la base est
 * exécuté par au moins un test, et suffisamment.
 *
 * Pourquoi. Sur un premier projet, quatre revues indépendantes ont trouvé que les PR
 * laissaient la moitié de leurs surfaces sans exécution : des fichiers du diff à 0 % de
 * fonctions, jamais chargés par un test, avec des bugs exactement là. Un plancher global de
 * couverture ne voit pas cela : 10 % du dépôt absorbent un fichier neuf à 0 %. Ce gate regarde
 * le diff, pas le dépôt.
 *
 * Ce qu'il fait.
 *   1. Fichiers du diff (`git diff <merge-base(base, HEAD)>`, index et arbre de travail
 *      compris, fichiers non suivis compris), filtrés sur le code (`coverage-diff-regles.mjs`).
 *      Base introuvable et distant sans aucune branche (`git ls-remote --heads origin` vide) :
 *      premier push d'un dépôt neuf, rien à comparer, sortie 0 ; sinon sortie 2.
 *   2. Par paquet, `vitest related <fichiers>` sous couverture v8 (`@vitest/coverage-v8`),
 *      rapport istanbul `coverage-final.json`, `coverage.all` pour qu'un fichier qu'aucune
 *      suite ne charge apparaisse à zéro. Si le paquet a un `vitest.db.config.ts` et que
 *      `DATABASE_URL` est définie, les suites sur base sont jouées aussi et les deux rapports
 *      additionnés : un repository n'est prouvé que contre Postgres.
 *   3. Verdict par fichier (seuils de `coverage-diff-regles.mjs`) :
 *        - fichier modifié sous 80 % de lignes OU 70 % de branches   → échec
 *        - fichier NOUVEAU sous 90 % de lignes (branches : 70 %)      → échec
 *        - aucun test ne l'exécute (0 fonction, 0 ligne couverte)     → échec, nommé tel quel
 *      Un fichier d'un paquet sans Vitest est « non mesurable » : dit en sortie, hors verdict.
 *
 * Exemption nommée, dans les dix premières lignes du fichier :
 *   `// coverage-diff: ignore — <raison>`  (amorçage, code d'adaptation sans logique…)
 *
 * Usage :
 *   node scripts/verify/coverage-diff.mjs                        (pre-push, après pnpm check ; job CI test-db)
 *   node scripts/verify/coverage-diff.mjs --base origin/develop  (défaut ; la CI nomme la cible de la PR)
 *   node scripts/verify/coverage-diff.mjs --base-auto            (pre-push : base = ce sur quoi on fusionnera,
 *       PRE_PUSH_REFS = stdin du hook ; push vers sujet/<nom> → origin/sujet/<nom> ; sinon le plus proche
 *       (moins de commits de HEAD absents) parmi develop et origin/sujet/*, develop à égalité)
 *   node scripts/verify/coverage-diff.mjs --dry-run              (fichiers du diff, sans lancer Vitest)
 *   node scripts/verify/coverage-diff.mjs --seuil-lignes 80 --seuil-branches 70
 * Sorties : 0 OK (ou distant vide au premier push) · 1 un fichier sous les seuils ou jamais exécuté, ou des tests rouges · 2 usage, base introuvable.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import {
  BASE_DEFAUT,
  SEUILS,
  baseDepuisPush,
  choisirBase,
  compterSuites,
  decisionSansBase,
  exemption,
  fusionner,
  inScope,
  messageEchec,
  metriques,
  plages,
  verdict,
} from "./coverage-diff-regles.mjs";

const ROOT = resolve(process.env.PROJET_RACINE ?? new URL("../..", import.meta.url).pathname);
const args = process.argv.slice(2);
const opt = (nom, defaut) => {
  const i = args.indexOf(nom);
  return i === -1 ? defaut : args[i + 1];
};
const DRY_RUN = args.includes("--dry-run");
const DEJA_NOMMEE = args.includes("--base");
const seuils = {
  lignes: Number(opt("--seuil-lignes", SEUILS.lignes)),
  branches: Number(opt("--seuil-branches", SEUILS.branches)),
  lignesNouveau: SEUILS.lignesNouveau,
};
if (Number.isNaN(seuils.lignes) || Number.isNaN(seuils.branches)) {
  console.log("coverage-diff: seuils invalides (--seuil-lignes, --seuil-branches)");
  process.exit(2);
}

// ── 1. Fichiers du diff ────────────────────────────────────────────────────────────────
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
const gitOk = (...a) => {
  try {
    return git(...a);
  } catch {
    return null;
  }
};

/** Ce sur quoi le travail sera fusionné (voir `choisirBase`) : jamais develop par défaut. */
function baseAuto() {
  const head = gitOk("rev-parse", "HEAD");
  const poussee = baseDepuisPush(process.env.PRE_PUSH_REFS, head);
  if (poussee && gitOk("rev-parse", "--verify", "--quiet", poussee)) return poussee;
  const refs = (gitOk("for-each-ref", "--format=%(refname:short)", "refs/remotes/origin/sujet") ?? "")
    .split("\n")
    .filter(Boolean);
  const candidats = [BASE_DEFAUT, ...refs]
    .filter((ref) => gitOk("rev-parse", "--verify", "--quiet", ref) !== null)
    .map((ref) => ({ ref, distance: Number(gitOk("rev-list", "--count", `${ref}..HEAD`)) }));
  return choisirBase(candidats);
}
// `--base` nommée gagne (CI : la cible de la PR) ; `--base-auto` (pre-push) la devine ; sinon develop.
const BASE = DEJA_NOMMEE ? opt("--base", BASE_DEFAUT) : args.includes("--base-auto") ? baseAuto() : BASE_DEFAUT;
let mergeBase;
try {
  mergeBase = git("merge-base", BASE, "HEAD");
} catch {
  // Premier push d'un dépôt neuf : le distant n'a encore aucune branche, donc aucune base.
  // Il n'y a rien à comparer ; refuser ici bloquerait la naissance même de la branche de base.
  let tetesDistantes = null;
  try {
    tetesDistantes = git("ls-remote", "--heads", "origin");
  } catch {
    tetesDistantes = null; // pas de distant, ou injoignable : la base manque vraiment
  }
  if (decisionSansBase(tetesDistantes) === "premier-push") {
    console.log(`coverage-diff: dépôt distant vide, premier push — rien à comparer (la base « ${BASE} » naîtra avec la chaîne)`);
    process.exit(0);
  }
  console.log(`coverage-diff: référence de base « ${BASE} » introuvable (git fetch origin develop ?)`);
  process.exit(2);
}
/** fichier → 'A' (nouveau) | 'M' (modifié). */
const statuts = new Map();
for (const ligne of git("diff", "--name-status", "--diff-filter=ACMR", mergeBase).split("\n")) {
  if (!ligne) continue;
  const [statut, ...chemins] = ligne.split("\t");
  statuts.set(chemins.at(-1), statut.startsWith("A") ? "A" : "M");
}
for (const f of git("ls-files", "--others", "--exclude-standard").split("\n")) if (f) statuts.set(f, "A");

const fichiers = [...statuts.keys()].filter((f) => inScope(f) && existsSync(join(ROOT, f))).sort();
if (fichiers.length === 0) {
  console.log(`coverage-diff: aucun fichier de code dans le diff par rapport à ${BASE} (${mergeBase.slice(0, 8)})`);
  console.log("coverage-diff: OK");
  process.exit(0);
}

// ── 2. Exemptions, paquets ─────────────────────────────────────────────────────────────
const exemptes = [];
const aMesurer = [];
for (const f of fichiers) {
  const raison = exemption(readFileSync(join(ROOT, f), "utf8"));
  if (raison) exemptes.push({ f, raison });
  else aMesurer.push(f);
}
const paquetDe = (f) => f.split("/").slice(0, 2).join("/");
const aVitest = (pkg) => {
  const p = join(ROOT, pkg, "package.json");
  return existsSync(p) && /\bvitest\b/.test(JSON.parse(readFileSync(p, "utf8")).scripts?.test ?? "");
};
const parPaquet = new Map();
const nonMesurables = [];
for (const f of aMesurer) {
  const pkg = paquetDe(f);
  if (!aVitest(pkg)) nonMesurables.push(f);
  else parPaquet.set(pkg, [...(parPaquet.get(pkg) ?? []), f]);
}
console.log(
  `coverage-diff: base ${BASE} (${mergeBase.slice(0, 8)}) — ${fichiers.length} fichier(s) de code dans le diff` +
    `${exemptes.length ? `, ${exemptes.length} exempté(s)` : ""}${nonMesurables.length ? `, ${nonMesurables.length} non mesurable(s)` : ""}`,
);
console.log(
  `  seuils : modifié ≥ ${seuils.lignes} % lignes et ≥ ${seuils.branches} % branches ; nouveau ≥ ${Math.max(seuils.lignesNouveau, seuils.lignes)} % lignes`,
);
for (const e of exemptes) console.log(`  ⤷ exempté : ${e.f} — ${e.raison}`);
for (const f of nonMesurables) console.log(`  ⤷ non mesurable : ${f} (le paquet ${paquetDe(f)} n'a pas de suite Vitest — trou connu)`);

// ── 3. Vitest par paquet ───────────────────────────────────────────────────────────────
const vitestBin = (pkg) => {
  const local = join(ROOT, pkg, "node_modules/.bin/vitest");
  return existsSync(local) ? local : join(ROOT, "node_modules/.bin/vitest");
};

const withoutForceColor = (env) => {
  const copie = { ...env };
  delete copie.FORCE_COLOR;
  return copie;
};

/** `vitest related` sous couverture sur les fichiers → rapport istanbul (chemins absolus). */
function mesurer(pkg, fichiersDuPaquet, config) {
  const rel = fichiersDuPaquet.map((f) => relative(join(ROOT, pkg), join(ROOT, f)));
  const dir = mkdtempSync(join(tmpdir(), "coverage-diff-"));
  const r = spawnSync(
    vitestBin(pkg),
    [
      "related",
      ...rel,
      "--run",
      "--passWithNoTests",
      ...(config ? ["--config", config] : []),
      "--coverage.enabled=true",
      "--coverage.provider=v8",
      "--coverage.reporter=json",
      "--coverage.all=true",
      `--coverage.reportsDirectory=${dir}`,
      // Une mesure partielle ne répond pas d'un plancher global du paquet.
      "--coverage.thresholds.lines=0",
      "--coverage.thresholds.branches=0",
      "--coverage.thresholds.functions=0",
      "--coverage.thresholds.statements=0",
      ...rel.map((f) => `--coverage.include=${f}`),
    ],
    { cwd: join(ROOT, pkg), env: { ...withoutForceColor(process.env), CI: "1", NO_COLOR: "1" }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
  );
  const chemin = join(dir, "coverage-final.json");
  const rapport = existsSync(chemin) ? JSON.parse(readFileSync(chemin, "utf8")) : {};
  rmSync(dir, { recursive: true, force: true });
  if (r.status !== 0) {
    if (/MISSING DEPENDENCY/.test(r.stderr + r.stdout)) {
      console.log(`  ✖ ${pkg} : @vitest/coverage-v8 manque — pnpm add -D @vitest/coverage-v8 --filter <paquet>`);
      process.exit(2);
    }
    console.log(`  ✖ ${pkg} : des tests échouent (code ${r.status}) — corriger avant de mesurer`);
    console.log((r.stdout + r.stderr).split("\n").filter((l) => /FAIL|Error|✗|×/.test(l)).slice(0, 20).join("\n"));
    process.exit(1);
  }
  return { rapport, suites: compterSuites(r.stdout + r.stderr) };
}

const lignesTableau = [];
let suitesTotal = 0;
const debut = Date.now();
for (const [pkg, fs] of parPaquet) {
  const avecBase = existsSync(join(ROOT, pkg, "vitest.db.config.ts")) && Boolean(process.env.DATABASE_URL);
  console.log(`\n── ${pkg} : ${fs.length} fichier(s)${avecBase ? ", suites sans base puis sur base" : ""}`);
  for (const f of fs) console.log(`   • ${f}${statuts.get(f) === "A" ? " (nouveau)" : ""}`);
  if (DRY_RUN) continue;
  let { rapport, suites } = mesurer(pkg, fs, null);
  if (avecBase) {
    const db = mesurer(pkg, fs, "vitest.db.config.ts");
    rapport = fusionner(rapport, db.rapport);
    suites += db.suites;
  }
  suitesTotal += suites;
  console.log(`   ↳ ${suites} suite(s) liée(s)`);
  for (const f of fs) {
    const entree = rapport[join(ROOT, f)];
    const m = entree ? metriques(entree) : null;
    const nouveau = statuts.get(f) === "A";
    lignesTableau.push({ f, nouveau, m, problemes: verdict(m, { nouveau, seuils }) });
  }
}

if (DRY_RUN) {
  console.log(`\ncoverage-diff: --dry-run — ${aMesurer.length} fichier(s) à mesurer ; Vitest non lancé`);
  process.exit(0);
}

// ── 4. Tableau et verdict ──────────────────────────────────────────────────────────────
const fmt = (v) => (v === null || v === undefined ? "    n/a" : `${String(v).padStart(5)} %`);
const largeur = Math.max(7, ...lignesTableau.map((r) => r.f.length));
console.log(`\n${"fichier".padEnd(largeur)} | lignes  | branches | fonctions | lignes non couvertes`);
console.log(`${"-".repeat(largeur)}-|---------|----------|-----------|---------------------`);
for (const r of lignesTableau) {
  const marque = r.problemes.length ? "✖" : "✔";
  const nc = r.m?.nonCouvertes?.length ? plages(r.m.nonCouvertes) : "";
  console.log(`${r.f.padEnd(largeur)} | ${fmt(r.m?.lignes)} | ${fmt(r.m?.branches)}  | ${fmt(r.m?.fonctions)}   | ${nc} ${marque}${r.nouveau ? " (nouveau)" : ""}`);
}
const echecs = lignesTableau.filter((r) => r.problemes.length);
console.log(`\ncoverage-diff: ${lignesTableau.length} fichier(s) mesuré(s), ${suitesTotal} suite(s), ${Math.round((Date.now() - debut) / 1000)} s`);
for (const r of echecs) console.log(`  ✖ ${r.f} : ${r.problemes.join(" ; ")}`);
if (echecs.length) {
  console.log(
    "  → écrire la suite qui exécute ces lignes (nominal, limites, erreurs), ou exempter avec\n" +
      "    `// coverage-diff: ignore — <raison>` en tête de fichier si le fichier n'est pas testable en unitaire.\n" +
      "    Repository : les suites *.db.spec.ts comptent quand DATABASE_URL est définie (compose.yaml en local).",
  );
  console.log(messageEchec(echecs));
  process.exit(1);
}
console.log("coverage-diff: OK");
