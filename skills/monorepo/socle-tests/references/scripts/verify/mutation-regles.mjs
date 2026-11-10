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
 *                                                       du paquet ; périmètre vide : rien n'est lancé
 *
 * Le rapport des survivants par règle est écrit par `mutation-regles-synthese.mjs`. Ce n'est pas un
 * plancher : `mutation:regles` ne refuse rien en V1 ; le plancher reste celui du noyau (`mutation`).
 *
 * Variables : `PROJET_RACINE` (racine du dépôt ; par défaut, deux dossiers au-dessus du script) ;
 * `STRYKER_MUTATE` (essai local : des fichiers séparés par des virgules, relatifs au paquet, qui
 * remplacent le périmètre de l'index — la configuration les lit, `--lancer` ne court-circuite pas).
 * Sorties : 0 (y compris périmètre vide) · le code de Stryker s'il échoue · 2 usage.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const INDEX = "anchorpost/anchorpost.json";
export const SCHEMA = "2";

const CODE_MUTABLE = /\.[cm]?[jt]sx?$/;
const PAS_DU_CODE = /\.(?:spec|test|e2e-spec|property\.spec|d)\.[cm]?[jt]sx?$/;
// Du câblage et des formes, pas de la logique : un mutant y survit toujours (mêmes exclusions que `coverage-diff`).
const CABLAGE = [/\.(?:controller|module)\.[cm]?[jt]sx?$/, /(^|\/)dto\//, /(^|\/)templates\//];

/** Chemin du dépôt, en slashs et sans `./` ; `null` s'il sort du dépôt (absolu, `..`, vide). */
export function normaliser(chemin) {
  if (typeof chemin !== "string" || chemin.includes("\0")) return null;
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
      else if (!CODE_MUTABLE.test(chemin) || PAS_DU_CODE.test(chemin) || CABLAGE.some((r) => r.test(chemin))) {
        ecartes.push({ regle, chemin, motif: "hors périmètre de la mutation (test, déclaration, contrôleur, module, dto, gabarit ou autre langage)" });
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

const estUnFichier = (racine) => (chemin) => {
  try {
    return statSync(join(racine, chemin), { throwIfNoEntry: false })?.isFile() === true;
  } catch {
    return false; // chemin que le système refuse (trop long, octet nul…) : pas un fichier du dépôt
  }
};

/**
 * Stryker lit `mutate` comme des globs : `[id].ts` (route Next) ou `(groupe)/x.ts` ne se mutent pas
 * eux-mêmes sans échappement. Le backslash n'y marche pas (mesuré) ; la classe à un caractère, si :
 * `[id].ts` → `[[]id].ts`. `]`, `!`, `+` et `@` restent littéraux dans un chemin relatif.
 */
export const echapperGlob = (chemin) => chemin.replace(/[[*?{}()]/g, (c) => `[${c}]`);

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
    mutate: fichiers.map(dedans).map(echapperGlob),
    regles,
    ecartes: p.ecartes,
    dehors,
    raison: fichiers.length
      ? undefined
      : p.raison ?? `aucun des ${p.fichiers.length} fichier(s) du périmètre n'est dans ce paquet : rien à muter ici`,
  };
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
    if (!p.fichiers.length && !process.env.STRYKER_MUTATE) return 0;
    console.log(`mutation-regles : ${process.env.STRYKER_MUTATE ? "essai local" : `${p.regles.length} règle(s), ${p.fichiers.length} fichier(s) à muter`}`);
    const r = spawnSync("pnpm", ["exec", "stryker", "run", "stryker.regles.config.mjs"], { stdio: "inherit", cwd });
    return r.status ?? 1;
  }
  console.error("usage : node scripts/verify/mutation-regles.mjs --list | --lancer");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
