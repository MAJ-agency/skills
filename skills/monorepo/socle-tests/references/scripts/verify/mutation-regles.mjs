/**
 * Périmètre de la mutation « règles prouvées » (skill socle-tests, ADR « score de mutation »).
 *
 * Un projet suivi par Anchorpost commit un index, `anchorpost/anchorpost.json` (schéma "2"). Chaque
 * règle y porte sa réalisation (`realisation.status`) et les fichiers de code qui la réalisent
 * (`code`, champ du standard). Le périmètre est l'union des `code` des règles `proven` : les fichiers
 * dont les tests sont réputés prouver une règle métier, donc ceux dont la force se mesure.
 *
 * Ce module lit le JSON lui-même : il n'importe pas le paquet `@maj-agency/anchorpost`. Aucun
 * identifiant n'y est analysé : une clé de règle est portée telle que l'index l'écrit, zéros de tête
 * compris (`RULE_FNSMR_LIC-05`), et l'ordre est celui de l'index, qui est trié et stable.
 *
 * Sans index, ou d'un autre schéma : périmètre vide, la raison est dite, sortie 0. Le standard vaut
 * pour tous les projets, Anchorpost est une option par-dessus.
 *
 *   node scripts/verify/mutation-regles.mjs --list      le périmètre du dépôt, un fichier par ligne
 *   node scripts/verify/mutation-regles.mjs --lancer    (depuis un paquet) Stryker sur les fichiers
 *                                                       du paquet, puis le rapport des survivants
 *
 * Ce que le script n'est pas : un plancher. `mutation:regles` produit un rapport (règle → fichiers →
 * mutants survivants), il ne refuse rien en V1 ; le plancher reste celui du noyau (`mutation`).
 *
 * Variable : `PROJET_RACINE` (racine du dépôt ; par défaut, deux dossiers au-dessus du script).
 * Sorties : 0 (y compris périmètre vide) · 1 Stryker a échoué ou n'a rien rapporté · 2 usage.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const INDEX = "anchorpost/anchorpost.json";
export const SCHEMA = "2";
export const RAPPORT_JSON = "reports/mutation/mutation.json";

const CODE_MUTABLE = /\.[cm]?[jt]sx?$/;
const PAS_DU_CODE = /\.(?:spec|test|e2e-spec|property\.spec|d)\.[cm]?[jt]sx?$/;

/** Chemin du dépôt, en slashs et sans `./` ; `null` s'il sort du dépôt (absolu, `..`, vide). */
export function normaliser(chemin) {
  if (typeof chemin !== "string") return null;
  const c = posix.normalize(chemin.trim().replaceAll("\\", "/"));
  if (c === "." || c === ".." || c.startsWith("../") || c.startsWith("/") || c[1] === ":") return null;
  return c;
}

/**
 * Le périmètre d'un index.
 *
 * @param index  l'index parsé ; `undefined` : aucun index ; autre valeur non objet (`null` d'un JSON
 *               illisible comprise) : index illisible.
 * @param existe `(cheminDuDepot) => boolean`, vrai si le chemin est un fichier du dépôt.
 * @returns `fichiers` triés et sans doublon ; `regles` : pour chaque règle prouvée qui a des fichiers
 *          retenus, `{ regle, fichiers }`, dans l'ordre de l'index ; `ecartes` : `{ regle, chemin,
 *          motif }` pour un chemin laissé de côté ; `raison` quand `fichiers` est vide.
 */
export function perimetre(index, existe) {
  const vide = (raison) => ({ fichiers: [], regles: [], ecartes: [], raison });
  if (index === undefined) return vide(`pas d'index ${INDEX} : le projet ne suit pas Anchorpost, rien à muter`);
  if (index === null || typeof index !== "object" || Array.isArray(index)) {
    return vide(`index ${INDEX} illisible : rien à muter`);
  }
  if (index.schema !== SCHEMA) {
    return vide(`index ${INDEX} de schéma ${JSON.stringify(index.schema)}, la mutation lit le schéma "${SCHEMA}" : rien à muter`);
  }
  if (!Array.isArray(index.rules)) return vide(`index ${INDEX} sans liste de règles : rien à muter`);

  const prouvees = index.rules.filter((r) => r?.realisation?.status === "proven");
  const ecartes = [];
  const regles = [];
  for (const r of prouvees) {
    const regle = String(r.key ?? r.id ?? "?");
    const retenus = [];
    for (const brut of Array.isArray(r.code) ? r.code : []) {
      const chemin = normaliser(brut);
      if (chemin === null) ecartes.push({ regle, chemin: String(brut), motif: "hors du dépôt" });
      else if (!existe(chemin)) ecartes.push({ regle, chemin, motif: "absent du dépôt" });
      else if (!CODE_MUTABLE.test(chemin) || PAS_DU_CODE.test(chemin)) {
        ecartes.push({ regle, chemin, motif: "pas du code mutable (test, déclaration ou autre langage)" });
      } else if (!retenus.includes(chemin)) retenus.push(chemin);
    }
    if (retenus.length) regles.push({ regle, fichiers: retenus });
  }
  const fichiers = [...new Set(regles.flatMap((r) => r.fichiers))].sort();
  if (fichiers.length) return { fichiers, regles, ecartes };
  return {
    fichiers,
    regles,
    ecartes,
    raison: prouvees.length
      ? `${prouvees.length} règle(s) prouvée(s), aucune ne déclare de fichier de code utilisable (champ \`code\`) : rien à muter`
      : "aucune règle prouvée dans l'index : rien à muter",
  };
}

/** Racine du dépôt : `PROJET_RACINE`, sinon deux dossiers au-dessus de `scripts/verify/`. */
export const racineDuDepot = () => process.env.PROJET_RACINE ?? fileURLToPath(new URL("../..", import.meta.url));

const estUnFichier = (racine) => (chemin) => statSync(join(racine, chemin), { throwIfNoEntry: false })?.isFile() === true;

/** Lit l'index commis et en calcule le périmètre. */
export function perimetreDuDepot(racine = racineDuDepot()) {
  let index;
  if (existsSync(join(racine, INDEX))) {
    try {
      index = JSON.parse(readFileSync(join(racine, INDEX), "utf8"));
    } catch {
      index = null;
    }
  }
  return perimetre(index, estUnFichier(racine));
}

/** Le même périmètre, restreint aux fichiers sous `cwd` (le paquet), en chemins relatifs à `cwd`. */
export function perimetreDuPaquet(racine = racineDuDepot(), cwd = process.cwd()) {
  const p = perimetreDuDepot(racine);
  const dedans = (f) => {
    const rel = relative(resolve(cwd), resolve(racine, f));
    return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) ? rel.split(sep).join("/") : null;
  };
  const regles = p.regles
    .map((r) => ({ regle: r.regle, fichiers: r.fichiers.filter((f) => dedans(f) !== null) }))
    .filter((r) => r.fichiers.length);
  const fichiers = p.fichiers.filter((f) => dedans(f) !== null);
  const dehors = p.fichiers.length - fichiers.length;
  return {
    fichiers,
    mutate: fichiers.map(dedans),
    regles,
    ecartes: p.ecartes,
    dehors,
    raison: fichiers.length
      ? undefined
      : p.raison ?? `aucun des ${p.fichiers.length} fichier(s) du périmètre n'est dans ce paquet : rien à muter ici`,
  };
}

/** Une cellule de code Markdown sûre : une ligne, sans accent grave, tronquée. */
const code = (texte, max = 80) => {
  const t = String(texte ?? "").replace(/\s+/g, " ").replaceAll("`", "'").trim();
  return `\`${t.length > max ? `${t.slice(0, max - 1)}…` : t}\``;
};

const SURVIVANTS = new Set(["Survived", "NoCoverage"]);
const TUES = new Set(["Killed", "Timeout"]);

/**
 * Le rapport des survivants, par règle : règle → fichiers → mutants survivants, en Markdown.
 *
 * @param regles   `[{ regle, fichiers }]` de `perimetre` (ou `perimetreDuPaquet`).
 * @param mutation le JSON du reporter `json` de Stryker (`files[chemin].mutants[]`).
 * @param versDepot convertit une clé de `mutation.files` en chemin du dépôt (défaut : identité).
 */
export function rapport(regles, mutation, versDepot = (c) => c) {
  const parFichier = new Map();
  for (const [cle, f] of Object.entries(mutation?.files ?? {})) parFichier.set(versDepot(cle), f?.mutants ?? []);
  const comptes = { tues: 0, survivants: 0 };
  for (const mutants of new Set(regles.flatMap((r) => r.fichiers).map((f) => parFichier.get(f) ?? []))) {
    for (const m of mutants) {
      if (TUES.has(m.status)) comptes.tues += 1;
      else if (SURVIVANTS.has(m.status)) comptes.survivants += 1;
    }
  }
  const mesures = comptes.tues + comptes.survivants;
  const fichiers = new Set(regles.flatMap((r) => r.fichiers)).size;
  const lignes = [
    "# Mutation des règles prouvées",
    "",
    `${regles.length} règle(s), ${fichiers} fichier(s). ` +
      (mesures ? `Score : ${Math.round((100 * comptes.tues) / mesures)} % (${comptes.tues} tués, ${comptes.survivants} survivants).` : "Aucun mutant mesuré."),
    "",
    "Pas de plancher : ce rapport nomme les assertions qui manquent, il ne refuse rien.",
  ];
  for (const { regle, fichiers: fs } of regles) {
    const parChemin = fs.map((f) => ({
      f,
      survivants: (parFichier.get(f) ?? []).filter((m) => SURVIVANTS.has(m.status)).sort((a, b) => (a.location?.start?.line ?? 0) - (b.location?.start?.line ?? 0)),
    }));
    const total = parChemin.reduce((n, x) => n + x.survivants.length, 0);
    lignes.push("", `## ${regle} — ${total ? `${total} survivant(s)` : "aucun survivant"}`);
    for (const { f, survivants } of parChemin) {
      lignes.push("", `- ${code(f, 200)} — ${survivants.length ? `${survivants.length} survivant(s)` : "aucun survivant"}`);
      for (const m of survivants) {
        const ou = m.location?.start?.line ?? "?";
        lignes.push(`  - ligne ${ou} : ${m.mutatorName ?? "?"}${m.replacement ? ` → ${code(m.replacement)}` : ""} (${m.status === "NoCoverage" ? "aucun test ne l'atteint" : "survécu"})`);
      }
    }
  }
  return `${lignes.join("\n")}\n`;
}

function dire(p, sortie) {
  for (const e of p.ecartes) sortie(`mutation-regles : écarté ${e.regle} ${e.chemin} — ${e.motif} (c'est \`anchorpost check\` qui le refuse)`);
  if (p.raison) sortie(`mutation-regles : périmètre vide — ${p.raison}`);
}

function main(args) {
  const racine = racineDuDepot();
  if (args[0] === "--list") {
    const p = perimetreDuDepot(racine);
    dire(p, (m) => console.error(m));
    for (const f of p.fichiers) console.log(f);
    return 0;
  }
  if (args[0] === "--lancer") {
    const cwd = process.cwd();
    const p = perimetreDuPaquet(racine, cwd);
    dire(p, (m) => console.log(m));
    if (!p.fichiers.length) return 0;
    console.log(`mutation-regles : ${p.regles.length} règle(s), ${p.fichiers.length} fichier(s) à muter`);
    const r = spawnSync("pnpm", ["exec", "stryker", "run", "stryker.regles.config.mjs"], { stdio: "inherit", cwd });
    if (r.status !== 0) return r.status ?? 1;
    if (!existsSync(join(cwd, RAPPORT_JSON))) {
      console.error(`mutation-regles : Stryker n'a pas écrit ${RAPPORT_JSON} (reporter \`json\` absent de la configuration ?)`);
      return 1;
    }
    const md = rapport(p.regles, JSON.parse(readFileSync(join(cwd, RAPPORT_JSON), "utf8")), (c) =>
      relative(racine, resolve(cwd, c)).split(sep).join("/"),
    );
    console.log(md);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
    return 0;
  }
  console.error("usage : node scripts/verify/mutation-regles.mjs --list | --lancer");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
