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
 *      PR de mise à jour d'un sujet : le diff part de la fusion recalculée de develop dans le sujet.
 *      Autre forme de réception de develop (fusion dont le premier parent est develop, retouche avant
 *      la fusion, sujet qui a avancé, fusion d'essai de GitHub) : quand HEAD contient `origin/develop`
 *      et que la base non, le diff part du merge-base de develop et de HEAD, et la sortie le dit. Limite :
 *      le travail propre du sujet qui n'est pas dans develop est alors remesuré, c'est plus que l'écart
 *      à la fusion, jamais moins ; la fusion recalculée reste la mesure la plus juste quand elle s'applique.
 *      `origin/develop` illisible : pas de repli, une note le dit.
 *      Base introuvable et distant sans aucune branche (`git ls-remote --heads origin` vide) :
 *      premier push d'un dépôt neuf, rien à comparer, sortie 0 ; sinon sortie 2, en disant où la
 *      base manque (à rapatrier du distant, absente du distant aussi, distant muet).
 *   2. Par paquet, `vitest related <fichiers>` sous couverture v8 (`@vitest/coverage-v8`),
 *      rapport istanbul `coverage-final.json`, `coverage.all` pour qu'un fichier qu'aucune
 *      suite ne charge apparaisse à zéro. Si le paquet a un `vitest.db.config.ts` et que
 *      `DATABASE_URL` est définie, les suites sur base sont jouées aussi et les deux rapports
 *      additionnés : un repository n'est prouvé que contre Postgres. Sans `DATABASE_URL` (et hors GitHub
 *      Actions), elles ne sont pas jouées : un fichier en échec qu'une suite `*.db.spec.ts` du paquet cible
 *      (import relatif ou alias du tsconfig, lu dans les sources) passe en avertissement, `⚠`, sortie 0 s'il
 *      n'y a pas d'autre échec ; la CI, qui a Postgres, le juge.
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
import { existsSync, mkdtempSync, readFileSync, rmSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import {
  BASE_DEFAUT,
  aliasDeTsconfig,
  SEUILS,
  baseDepuisPush,
  choisirBase,
  decisionSansBase,
  exemption,
  fusionner,
  inScope,
  metriques,
  plages,
  referenceDuDiff,
  suiteSurBaseCible,
  verdict,
} from "./coverage-diff-regles.mjs";

/**
 * Le journal, écrit d'un bloc synchrone sur la sortie standard : `console.log` suivi de `process.exit` coupe une
 * sortie longue lue par un tube (le tube n'est pas vidé à la sortie). EAGAIN (tube plein, descripteur non
 * bloquant) : on réessaie.
 */
function dire(texte = "") {
  const octets = Buffer.from(`${texte}\n`);
  for (let ecrit = 0; ecrit < octets.length; ) {
    try {
      ecrit += writeSync(1, octets, ecrit);
    } catch (e) {
      if (e.code !== "EAGAIN") throw e;
    }
  }
}

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
  dire("coverage-diff: seuils invalides (--seuil-lignes, --seuil-branches)");
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

/**
 * PR de mise à jour d'un sujet (la fusion de develop dans le sujet, puis des retouches) : le premier commit de
 * HEAD hors de `sujet` est une fusion à deux parents, le sommet du sujet puis un commit de develop absent du sujet.
 * Rend l'arbre de la fusion recalculée par git (`merge-tree`, git >= 2.38), à qui on compare le sommet : seules les
 * retouches et les conflits résolus comptent, pas ce que develop apporte. Null si HEAD n'a pas cette forme, ou si
 * git ne sait pas la recalculer : la mesure est alors celle d'avant, plus stricte, jamais plus lâche.
 */
function fusionRecalculee(sujet) {
  const sommet = gitOk("rev-parse", "--verify", "--quiet", `${sujet}^{commit}`);
  if (!sommet) return null;
  const premier = (gitOk("rev-list", "--first-parent", "--reverse", `${sommet}..HEAD`) ?? "").split("\n")[0];
  if (!premier) return null;
  const [, p1, p2, reste] = (gitOk("rev-list", "--parents", "-n", "1", premier) ?? "").split(" ");
  if (p1 !== sommet || !p2 || reste) return null;
  if (gitOk("merge-base", "--is-ancestor", p2, BASE_DEFAUT) === null) return null;
  if (gitOk("merge-base", "--is-ancestor", p2, sommet) !== null) return null;
  const r = spawnSync("git", ["merge-tree", "--write-tree", "--no-messages", p1, p2], { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 || r.status === 1 ? r.stdout.split("\n")[0] || null : null;
}

/** Ce sur quoi le travail sera fusionné (voir `choisirBase`) : jamais develop par défaut. */
function baseAuto() {
  const head = gitOk("rev-parse", "HEAD");
  const poussee = baseDepuisPush(process.env.PRE_PUSH_REFS, head);
  if (poussee && gitOk("rev-parse", "--verify", "--quiet", poussee)) return poussee;
  const refs = (gitOk("for-each-ref", "--format=%(refname:short)", "refs/remotes/origin/sujet") ?? "")
    .split("\n")
    .filter(Boolean);
  // Une branche de mise à jour d'un sujet se mesure contre ce sujet, même à égalité de distance avec develop.
  const sujetMisAJour = refs.find((ref) => fusionRecalculee(ref));
  if (sujetMisAJour) return sujetMisAJour;
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
    tetesDistantes = null; // pas de distant, ou injoignable : on ne sait rien de lui
  }
  const branche = String(BASE).replace(/^origin\//, ""); // `--base` sans valeur : BASE est undefined, sortie 2 comme avant
  const decision = decisionSansBase(tetesDistantes, branche);
  if (decision === "premier-push") {
    dire(`coverage-diff: dépôt distant vide, premier push — rien à comparer (la base « ${BASE} » naîtra avec la chaîne)`);
    process.exit(0);
  }
  const conseil = {
    "base-a-fetcher": `elle existe sur le distant : git fetch origin ${branche}`,
    "base-absente":
      `le distant a des branches mais pas celle-là : la créer` +
      (branche === "develop" ? ` depuis main (bash scripts/github/develop.sh quand le socle de la chaîne est posé)` : "") +
      `, ou passer --base <branche>`,
    "distant-muet": `et le distant ne répond pas : git fetch origin ${branche} quand il répond`,
  }[decision];
  dire(`coverage-diff: référence de base « ${BASE} » introuvable en local — ${conseil}`);
  process.exit(2);
}
// PR de mise à jour : on compare le sommet à la fusion recalculée, pas à la base.
const fusion = /^origin\/sujet\//.test(String(BASE)) ? fusionRecalculee(BASE) : null;
// Réception de develop d'une autre forme : HEAD contient develop et la base non, on lit contre develop.
const developLisible = gitOk("rev-parse", "--verify", "--quiet", `${BASE_DEFAUT}^{commit}`) !== null;
const contient = (ref) => gitOk("merge-base", "--is-ancestor", BASE_DEFAUT, ref) !== null;
const { reference: REFERENCE, sorte, note } = referenceDuDiff({
  base: BASE,
  mergeBase,
  mergeBaseDevelop: developLisible ? gitOk("merge-base", BASE_DEFAUT, "HEAD") : null,
  fusion,
  developLisible,
  headContientDevelop: developLisible && contient("HEAD"),
  baseContientDevelop: developLisible && contient(BASE),
});
const COMPARE_A =
  sorte === "fusion"
    ? `la fusion recalculée de develop dans ${BASE} (${fusion.slice(0, 8)})`
    : sorte === "develop"
      ? `${BASE_DEFAUT} (${REFERENCE.slice(0, 8)}), HEAD contient develop et ${BASE} non : le code que develop apporte n'est pas remesuré`
      : `${BASE} (${mergeBase.slice(0, 8)})`;
if (note) dire(`coverage-diff: ${note}`);

/** fichier → 'A' (nouveau) | 'M' (modifié). */
const statuts = new Map();
for (const ligne of git("diff", "--name-status", "--diff-filter=ACMR", REFERENCE).split("\n")) {
  if (!ligne) continue;
  const [statut, ...chemins] = ligne.split("\t");
  statuts.set(chemins.at(-1), statut.startsWith("A") ? "A" : "M");
}
for (const f of git("ls-files", "--others", "--exclude-standard").split("\n")) if (f) statuts.set(f, "A");

const fichiers = [...statuts.keys()].filter((f) => inScope(f) && existsSync(join(ROOT, f))).sort();
if (fichiers.length === 0) {
  dire(`coverage-diff: aucun fichier de code dans le diff par rapport à ${COMPARE_A}`);
  dire("coverage-diff: OK");
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
dire(
  `coverage-diff: base ${COMPARE_A} — ${fichiers.length} fichier(s) de code dans le diff` +
    `${exemptes.length ? `, ${exemptes.length} exempté(s)` : ""}${nonMesurables.length ? `, ${nonMesurables.length} non mesurable(s)` : ""}`,
);
dire(
  `  seuils : modifié ≥ ${seuils.lignes} % lignes et ≥ ${seuils.branches} % branches ; nouveau ≥ ${Math.max(seuils.lignesNouveau, seuils.lignes)} % lignes`,
);
for (const e of exemptes) dire(`  ⤷ exempté : ${e.f} — ${e.raison}`);
for (const f of nonMesurables) dire(`  ⤷ non mesurable : ${f} (le paquet ${paquetDe(f)} n'a pas de suite Vitest — trou connu)`);

// ── 3. Vitest par paquet ───────────────────────────────────────────────────────────────
const vitestBin = (pkg) => {
  const local = join(ROOT, pkg, "node_modules/.bin/vitest");
  return existsSync(local) ? local : join(ROOT, "node_modules/.bin/vitest");
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
    { cwd: join(ROOT, pkg), env: { ...process.env, CI: "1", FORCE_COLOR: "0" }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 },
  );
  const chemin = join(dir, "coverage-final.json");
  const rapport = existsSync(chemin) ? JSON.parse(readFileSync(chemin, "utf8")) : {};
  rmSync(dir, { recursive: true, force: true });
  if (r.status !== 0) {
    if (/MISSING DEPENDENCY/.test(r.stderr + r.stdout)) {
      dire(`  ✖ ${pkg} : @vitest/coverage-v8 manque — pnpm add -D @vitest/coverage-v8 --filter <paquet>`);
      process.exit(2);
    }
    dire(`  ✖ ${pkg} : des tests échouent (code ${r.status}) — corriger avant de mesurer`);
    dire((r.stdout + r.stderr).split("\n").filter((l) => /FAIL|Error|✗|×/.test(l)).slice(0, 20).join("\n"));
    process.exit(1);
  }
  const suites = ((r.stdout + r.stderr).match(/Test Files\s+(\d+)/) ?? [])[1] ?? "0";
  return { rapport, suites: Number(suites) || 0 };
}

/** Les suites sur base (`*.db.spec.ts`) du paquet, suivies ou non, hors ignorées ; leur source, et les alias du tsconfig. */
function suitesSurBase(pkg) {
  const liste = gitOk("ls-files", "--cached", "--others", "--exclude-standard", "--", pkg) ?? "";
  return liste
    .split("\n")
    .filter((f) => /\.db\.spec\.tsx?$/.test(f) && existsSync(join(ROOT, f)))
    .map((f) => ({ chemin: relative(pkg, f), source: readFileSync(join(ROOT, f), "utf8") }));
}
function aliasDuPaquet(pkg) {
  try {
    return aliasDeTsconfig(readFileSync(join(ROOT, pkg, "tsconfig.json"), "utf8"));
  } catch {
    return []; // tsconfig absent : seuls les imports relatifs comptent
  }
}

const aConfigBase = (pkg) => existsSync(join(ROOT, pkg, "vitest.db.config.ts"));
// Sans base locale (jamais sous GitHub Actions, qui doit l'avoir), les suites sur base ne sont pas jouées.
const paquetsSansBase = process.env.DATABASE_URL || process.env.GITHUB_ACTIONS === "true" ? [] : [...parPaquet.keys()].filter(aConfigBase);
if (paquetsSansBase.length) {
  dire(
    `\n  ⚠ suites sur base non jouées (*.db.spec.ts) : DATABASE_URL absente (${paquetsSansBase.join(", ")}). ` +
      `Un fichier que seules elles ciblent est seulement signalé, jugé par la CI avec Postgres.`,
  );
}
const lignesTableau = [];
let suitesTotal = 0;
const debut = Date.now();
for (const [pkg, fs] of parPaquet) {
  const avecBase = aConfigBase(pkg) && Boolean(process.env.DATABASE_URL);
  const sansBase = paquetsSansBase.includes(pkg);
  dire(`\n── ${pkg} : ${fs.length} fichier(s)${avecBase ? ", suites sans base puis sur base" : ""}`);
  for (const f of fs) dire(`   • ${f}${statuts.get(f) === "A" ? " (nouveau)" : ""}`);
  if (DRY_RUN) continue;
  let { rapport, suites } = mesurer(pkg, fs, null);
  if (avecBase) {
    const db = mesurer(pkg, fs, "vitest.db.config.ts");
    rapport = fusionner(rapport, db.rapport);
    suites += db.suites;
  }
  suitesTotal += suites;
  const specsSurBase = sansBase ? suitesSurBase(pkg) : [];
  const aliasPaquet = sansBase ? aliasDuPaquet(pkg) : [];
  dire(`   ↳ ${suites} suite(s) liée(s)`);
  for (const f of fs) {
    const entree = rapport[join(ROOT, f)];
    const m = entree ? metriques(entree) : null;
    const nouveau = statuts.get(f) === "A";
    const problemes = verdict(m, { nouveau, seuils });
    const surBase =
      problemes.length > 0 &&
      sansBase &&
      suiteSurBaseCible(relative(pkg, f), specsSurBase, aliasPaquet, (c) => existsSync(join(ROOT, pkg, c)));
    lignesTableau.push({ f, nouveau, m, problemes: surBase ? [] : problemes, avertissement: surBase ? problemes : [] });
  }
}

if (DRY_RUN) {
  dire(`\ncoverage-diff: --dry-run — ${aMesurer.length} fichier(s) à mesurer ; Vitest non lancé`);
  process.exit(0);
}

// ── 4. Tableau et verdict ──────────────────────────────────────────────────────────────
const fmt = (v) => (v === null || v === undefined ? "    n/a" : `${String(v).padStart(5)} %`);
const largeur = Math.max(7, ...lignesTableau.map((r) => r.f.length));
dire(`\n${"fichier".padEnd(largeur)} | lignes  | branches | fonctions | lignes non couvertes`);
dire(`${"-".repeat(largeur)}-|---------|----------|-----------|---------------------`);
for (const r of lignesTableau) {
  const marque = r.problemes.length ? "✖" : r.avertissement.length ? "⚠" : "✔";
  const nc = r.m?.nonCouvertes?.length ? plages(r.m.nonCouvertes) : "";
  dire(`${r.f.padEnd(largeur)} | ${fmt(r.m?.lignes)} | ${fmt(r.m?.branches)}  | ${fmt(r.m?.fonctions)}   | ${nc} ${marque}${r.nouveau ? " (nouveau)" : ""}`);
}
const echecs = lignesTableau.filter((r) => r.problemes.length);
dire(`\ncoverage-diff: ${lignesTableau.length} fichier(s) mesuré(s), ${suitesTotal} suite(s), ${Math.round((Date.now() - debut) / 1000)} s`);
for (const r of echecs) dire(`  ✖ ${r.f} : ${r.problemes.join(" ; ")}`);
for (const r of lignesTableau.filter((x) => x.avertissement.length)) {
  dire(`  AVERTISSEMENT ${r.f} : couverture non mesurée sans base : la CI la juge avec Postgres (${r.avertissement.join(" ; ")})`);
}
if (echecs.length) {
  dire(
    "  → écrire la suite qui exécute ces lignes (nominal, limites, erreurs), ou exempter avec\n" +
      "    `// coverage-diff: ignore — <raison>` en tête de fichier si le fichier n'est pas testable en unitaire.\n" +
      "    Repository : les suites *.db.spec.ts comptent quand DATABASE_URL est définie (compose.yaml en local).",
  );
  process.exit(1);
}
dire("coverage-diff: OK");
