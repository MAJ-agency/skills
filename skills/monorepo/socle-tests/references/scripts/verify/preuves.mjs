#!/usr/bin/env node
/**
 * Gate `preuves` (skill `socle-tests`, la preuve suffisante d'Anchorpost, `SPEC_ALL_ANC-5` § 5) : un relais vers
 * `anchorpost compare`, qui dit, pour les règles que le travail touche, leur criticité, leurs cas prouvés et ce qui
 * manque, et qui refuse quand le projet est en `enforce`.
 *
 * Pourquoi un relais. Le jugement vit dans la CLI `@maj-agency/anchorpost` (≥ 2.0.0), versionné : ce fichier ne juge
 * rien. Il choisit la base comme `coverage-diff --base-auto` (ce sur quoi le travail sera fusionné), joue
 * `anchorpost compare --base <base> --json`, résume le rapport en quelques lignes et rend la sortie de la CLI.
 *
 * Ce qu'il fait, dans l'ordre.
 *   1. L'index commis `anchorpost/anchorpost.json` : absent, le projet ne suit pas Anchorpost ; d'un autre schéma que
 *      "3", la preuve suffisante ne s'y juge pas encore (le régime d'avant, A-56) : rien à comparer, sortie 0. Présent
 *      mais pas du JSON : sortie 2 (le gate Anchorpost le refuse aussi).
 *   2. La base : `--base <ref>` (la CI : la cible de la PR) ; sinon celle de `coverage-diff --base-auto`, la branche
 *      `sujet/<nom>` visée par le push (`PRE_PUSH_REFS`, l'entrée du hook pre-push) ou le plus proche d'`origin/develop`
 *      et des `origin/sujet/*` (develop à égalité). Une base introuvable en local : premier push d'un dépôt neuf (le
 *      distant n'a aucune branche), sortie 0 ; sinon sortie 2, avec le geste qui la rapatrie.
 *   3. `node_modules/.bin/anchorpost compare --base <base> --json` depuis la racine. Le résumé : la base, le mode jugé,
 *      les règles touchées, puis chaque écart (un refus en `enforce`, un avertissement en `observe`) et chaque
 *      avertissement. Sous GitHub Actions (`GITHUB_STEP_SUMMARY`), le rapport entier en markdown s'ajoute au résumé
 *      du job (un second passage de la CLI, sa sortie ignorée).
 *
 * Limites. Au pre-push et en fin de tour, une branche de mise à jour d'un sujet (develop fusionné dans le sujet) se
 * compare à la plus proche de ses deux bases, pas à la fusion recalculée de `coverage-diff` ni toujours au sujet que
 * `coverage-diff --base-auto` retient pour elle, et chacune a son angle mort. Le sujet, quand il a plus de commits que
 * develop n'en apporte, la base de la CI, qui compare à la cible de la PR : la comparaison juge aussi des règles que
 * develop a touchées, mais ne voit pas, la CI non plus, ce que la mise à jour défait de develop (une règle, un cas, une
 * criticité que la résolution remet comme sur le sujet) ; la livraison du sujet, comparée à develop, le juge. Develop,
 * quand il en apporte autant ou plus : elle juge tout le travail du sujet, mais ne voit pas ce que la mise à jour
 * défait du sujet (une règle, un cas, une criticité que la résolution remet comme sur develop) ; la CI, qui compare à
 * la cible de la PR, le sujet, le juge. Et `compare` juge l'arbre de travail, non commis et non suivi compris, pas le
 * commit poussé : au pre-push, une preuve restée hors du commit le fait passer, un travail en cours peut le bloquer ;
 * la CI juge le commit.
 *
 * Usage :
 *   node scripts/verify/preuves.mjs                    fin de tour (`gatesRapides`) : la base de `--base-auto`
 *   node scripts/verify/preuves.mjs --base-auto        pre-push, après `check:coverage` (PRE_PUSH_REFS exporté)
 *   node scripts/verify/preuves.mjs --base origin/develop   CI, la cible de la PR
 * Sorties : 0 rien à comparer, ou la CLI sort en 0 (aucun écart, ou `observe`) · 1 un écart en `enforce` · 2 usage (tout
 * argument autre que `--base <ref>` et `--base-auto`),
 * index illisible, base introuvable, CLI absente, en panne ou illisible.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BASE_DEFAUT, baseDepuisPush, choisirBase, decisionSansBase } from "./coverage-diff-regles.mjs";

export const INDEX = "anchorpost/anchorpost.json";
export const CLI = "node_modules/.bin/anchorpost";

/**
 * L'état de l'index commis, depuis son texte : `absent` (`undefined`), `illisible` (pas du JSON, ou pas un objet),
 * `autre` (un `schema` autre que "3", rendu dans `schema`), `pivot-3`.
 */
export function etatDeLIndex(texte) {
  if (texte === undefined) return { etat: "absent" };
  let lu;
  try {
    lu = JSON.parse(texte);
  } catch {
    return { etat: "illisible" };
  }
  if (lu === null || typeof lu !== "object" || Array.isArray(lu)) return { etat: "illisible" };
  return lu.schema === "3" ? { etat: "pivot-3" } : { etat: "autre", schema: lu.schema };
}

/** Une valeur du rapport sur une seule ligne de terminal : caractères de contrôle et sauts de ligne en espaces. */
const ligne = (v) => String(v ?? "").replace(/[\p{Cc}\u2028\u2029]+/gu, " ").trim();

/**
 * Le résumé du rapport JSON de `compare` (`CompareReport` de la CLI : `sufficiency`, `touched`, `gaps`, `warnings`),
 * une ligne par écart et par avertissement. `base` : la référence comparée.
 */
export function resume(rapport, base) {
  const mode = rapport?.sufficiency === "enforce" ? "enforce" : "observe";
  const touchees = Array.isArray(rapport?.touched) ? rapport.touched : [];
  const ecarts = Array.isArray(rapport?.gaps) ? rapport.gaps : [];
  const avertissements = Array.isArray(rapport?.warnings) ? rapport.warnings : [];
  const lignes = [
    `preuves : base ${ligne(base)}, mode jugé ${mode} ; ${touchees.length} règle(s) touchée(s), ${ecarts.length} écart(s), ${avertissements.length} avertissement(s)`,
  ];
  const sorte = mode === "enforce" ? "refus" : "avertissement (observe)";
  for (const e of ecarts) lignes.push(`  ${sorte} ${ligne(e?.kind)} ${ligne(e?.subject)} : ${ligne(e?.message)}`);
  for (const a of avertissements) lignes.push(`  avertissement ${ligne(a?.kind)} ${ligne(a?.subject)} : ${ligne(a?.message)}`);
  if (ecarts.length + avertissements.length > 0) lignes.push(`  le rapport entier : pnpm exec anchorpost compare --base ${ligne(base)}`);
  return lignes;
}

/** Racine du dépôt : `PROJET_RACINE`, sinon deux dossiers au-dessus de `scripts/verify/`. */
const racineDuDepot = () => resolve(process.env.PROJET_RACINE ?? fileURLToPath(new URL("../..", import.meta.url)));

function main(args) {
  const ROOT = racineDuDepot();
  const dire = (texte) => process.stdout.write(`${texte}\n`);
  const refuser = (texte, code = 2) => {
    process.stderr.write(`preuves : ${texte}\n`);
    return code;
  };
  const i = args.indexOf("--base");
  const nommee = i === -1 ? null : args[i + 1];
  // Tout argument autre que `--base`, sa valeur et `--base-auto` est un usage faux : un `HEAD~3` sans `--base` n'est pas lu.
  const inconnues = args.filter((a, k) => a !== "--base" && a !== "--base-auto" && !(k === i + 1 && i !== -1));
  if ((i !== -1 && (!nommee || nommee.startsWith("--"))) || inconnues.length) return refuser("usage : node scripts/verify/preuves.mjs [--base <ref> | --base-auto]");

  // 1. L'index commis.
  const chemin = join(ROOT, INDEX);
  const index = etatDeLIndex(existsSync(chemin) ? readFileSync(chemin, "utf8") : undefined);
  if (index.etat === "absent") {
    dire(`preuves : pas d'index ${INDEX} : le projet ne suit pas Anchorpost, rien à comparer`);
    return 0;
  }
  if (index.etat === "illisible") return refuser(`${INDEX} illisible (pas un objet JSON) : régénérer l'index, puis relancer`);
  if (index.etat === "autre") {
    dire(`preuves : index ${INDEX} au schéma ${JSON.stringify(index.schema)} : la preuve suffisante se juge au pivot 3 (CLI Anchorpost ≥ 2.0.0), rien à comparer`);
    return 0;
  }

  // 2. La base.
  const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  const gitOk = (...a) => {
    try {
      return git(...a);
    } catch {
      return null;
    }
  };
  const existe = (ref) => gitOk("rev-parse", "--verify", "--quiet", `${ref}^{commit}`) !== null;
  let base = nommee;
  if (!base) {
    const poussee = baseDepuisPush(process.env.PRE_PUSH_REFS, gitOk("rev-parse", "HEAD"));
    if (poussee && existe(poussee)) base = poussee;
    else {
      const refs = (gitOk("for-each-ref", "--format=%(refname:short)", "refs/remotes/origin/sujet") ?? "").split("\n").filter(Boolean);
      const candidats = [BASE_DEFAUT, ...refs].filter(existe).map((ref) => ({ ref, distance: Number(gitOk("rev-list", "--count", `${ref}..HEAD`)) }));
      base = choisirBase(candidats);
    }
  }
  if (!existe(base)) {
    const branche = base.replace(/^origin\//, "");
    const decision = decisionSansBase(gitOk("ls-remote", "--heads", "origin"), branche);
    if (decision === "premier-push") {
      dire(`preuves : dépôt distant vide, premier push — rien à comparer (la base « ${base} » naîtra avec la chaîne)`);
      return 0;
    }
    const conseil = {
      "base-a-fetcher": `elle existe sur le distant : git fetch origin ${branche}`,
      "base-absente": "le distant a des branches mais pas celle-là : la créer, ou passer --base <branche>",
      "distant-muet": `et le distant ne répond pas : git fetch origin ${branche} quand il répond`,
    }[decision];
    return refuser(`référence de base « ${base} » introuvable en local — ${conseil}`);
  }

  // 3. La CLI.
  const cli = join(ROOT, CLI);
  if (!existsSync(cli)) return refuser(`la CLI Anchorpost est introuvable (${CLI}) : pnpm install (\`@maj-agency/anchorpost\` ≥ 2.0.0 en devDependency)`);
  const r = spawnSync(cli, ["compare", "--base", base, "--json"], { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0 && r.status !== 1) {
    const cause = ligne((r.stderr || r.error?.message || "").split("\n").filter((l) => l.trim()).pop() ?? "sans cause écrite");
    return refuser(`anchorpost compare en panne (sortie ${r.status ?? r.signal}) : ${cause}`);
  }
  let rapport;
  try {
    rapport = JSON.parse(r.stdout);
  } catch {
    return refuser("le rapport de anchorpost compare --json ne se lit pas (CLI Anchorpost ≥ 2.0.0 attendue)");
  }
  for (const l of resume(rapport, base)) dire(l);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = spawnSync(cli, ["compare", "--base", base], { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${md.stdout ?? ""}\n`);
  }
  return r.status;
}

/** Vrai quand ce fichier est lancé en ligne de commande : lien symbolique, chemin à espace ou à accent, `--preserve-symlinks-main` compris. */
function estPointEntree() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (estPointEntree()) process.exit(main(process.argv.slice(2)));
