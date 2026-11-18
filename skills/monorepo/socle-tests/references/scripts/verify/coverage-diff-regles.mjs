/**
 * Règles pures du gate `coverage-diff` : périmètre, lecture d'un rapport istanbul, fusion de
 * deux rapports (suites sans base et suites sur base), décision quand la base manque, verdict
 * par fichier. Rien n'est lu ni lancé ici : `coverage-diff.mjs` orchestre git et Vitest, ce
 * module décide. Testé par `coverage-diff-regles.test.mjs`.
 */

/** Périmètre : le code exécutable, testable en unitaire. */
export const IN_SCOPE = [
  /^apps\/[^/]+\/src\/.+\.tsx?$/,
  /^packages\/[^/]+\/src\/.+\.tsx?$/,
];
export const OUT_OF_SCOPE = [
  /\.(spec|e2e-spec|test|property\.spec|d)\.tsx?$/,
  /\.module\.ts$/,
  /(^|\/)migrations\//,
  /(^|\/)db\/types\.ts$/, // types générés par kysely-codegen
  /^apps\/[^/]+\/src\/main\.ts$/,
  /^apps\/web\/src\/app\//, // routes Next.js : minces, prouvées par Playwright
  /^apps\/mobile\/app\//, // routes Expo Router : idem, prouvées par le bundle
  /(^|\/)components\/ui\//, // shadcn/ui vendored
];
export const inScope = (f) =>
  IN_SCOPE.some((r) => r.test(f)) && !OUT_OF_SCOPE.some((r) => r.test(f));

/** Seuils : un fichier modifié, un fichier neuf (sans histoire pour excuser ses trous). */
export const SEUILS = { lignes: 80, branches: 70, lignesNouveau: 90 };

export const IGNORE = /coverage-diff:\s*ignore\s*[—–:-]\s*(\S.*)$/;

/** Raison d'exemption si l'une des dix premières lignes la porte, sinon null. */
export function exemption(texte) {
  const m = texte
    .split("\n")
    .slice(0, 10)
    .map((l) => l.match(IGNORE))
    .find(Boolean);
  return m ? m[1].trim() : null;
}

/** Plages de lignes « 12-15, 20 » à partir d'une liste triée. */
export function plages(lignes) {
  const out = [];
  for (const n of lignes) {
    const last = out.at(-1);
    if (last && n === last[1] + 1) last[1] = n;
    else out.push([n, n]);
  }
  return out.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(", ");
}

/** Lecture d'une entrée de coverage-final.json (istanbul) → métriques du fichier. */
export function metriques(entree) {
  const parLigne = new Map();
  for (const [id, range] of Object.entries(entree.statementMap)) {
    const ligne = range.start.line;
    parLigne.set(ligne, Math.max(parLigne.get(ligne) ?? 0, entree.s[id] ?? 0));
  }
  const lignes = [...parLigne.keys()].sort((a, b) => a - b);
  const nonCouvertes = lignes.filter((l) => parLigne.get(l) === 0);
  const branches = Object.values(entree.b).flat();
  const fonctions = Object.values(entree.f);
  const pct = (couvert, total) =>
    total === 0 ? null : Math.round((couvert / total) * 1000) / 10;
  return {
    lignes: pct(lignes.length - nonCouvertes.length, lignes.length),
    branches: pct(branches.filter((n) => n > 0).length, branches.length),
    fonctions: pct(fonctions.filter((n) => n > 0).length, fonctions.length),
    totalFonctions: fonctions.length,
    totalLignes: lignes.length,
    nonCouvertes,
  };
}

/**
 * Fusion de deux rapports istanbul sur les mêmes fichiers (suites sans base, puis suites sur
 * base) : les compteurs s'additionnent, les cartes sont celles du rapport qui a le plus exécuté
 * le fichier — `coverage.all` fabrique, pour un fichier qu'aucune suite n'a chargé, une entrée
 * squelette dont les cartes (statements, fonctions) ne sont pas celles d'une vraie exécution.
 */
export function fusionner(a, b) {
  const out = { ...a };
  for (const [fichier, entree] of Object.entries(b)) {
    const deja = out[fichier];
    if (!deja) {
      out[fichier] = entree;
      continue;
    }
    const executions = (e) => Object.values(e.s).reduce((n, v) => n + v, 0);
    const [base, autre] =
      executions(entree) > executions(deja) ? [entree, deja] : [deja, entree];
    const somme = (x, y) =>
      Object.fromEntries(
        Object.keys(x).map((k) => [k, (x[k] ?? 0) + (y[k] ?? 0)]),
      );
    const sommeB = Object.fromEntries(
      Object.keys(base.b).map((k) => [
        k,
        base.b[k].map((n, i) => n + (autre.b[k]?.[i] ?? 0)),
      ]),
    );
    out[fichier] = {
      ...base,
      s: somme(base.s, autre.s),
      f: somme(base.f, autre.f),
      b: sommeB,
    };
  }
  return out;
}

/**
 * Décision quand la base est introuvable en local, d'après la sortie de `git ls-remote --heads
 * origin` et le nom de la branche de base. Un distant sans aucune branche est un dépôt neuf à son
 * premier push — rien à comparer, le gate passe (`premier-push`). Tout le reste est un refus, qui
 * dit où la base manque : le distant la liste, il suffit de la rapatrier (`base-a-fetcher`) ; il a
 * des branches mais pas celle-là, elle n'existe encore nulle part (`base-absente`) ; `ls-remote`
 * en échec (`null`), on ne sait rien du distant (`distant-muet`).
 */
export function decisionSansBase(tetesDistantes, branche = "develop") {
  if (typeof tetesDistantes !== "string") return "distant-muet";
  if (tetesDistantes.trim() === "") return "premier-push";
  const listee = tetesDistantes
    .split("\n")
    .some((l) => l.trimEnd().endsWith(`\trefs/heads/${branche}`));
  return listee ? "base-a-fetcher" : "base-absente";
}

/** Verdict d'un fichier : la liste de ses problèmes, vide s'il passe. */
export function verdict(m, { nouveau, seuils = SEUILS }) {
  if (
    !m ||
    (m.lignes === 0 && m.totalLignes > 0) ||
    (m.fonctions === 0 && m.totalFonctions > 0)
  ) {
    return ["aucun test n'exécute ce fichier"];
  }
  const problemes = [];
  const minLignes = nouveau
    ? Math.max(seuils.lignesNouveau, seuils.lignes)
    : seuils.lignes;
  if (m.lignes !== null && m.lignes < minLignes)
    problemes.push(`lignes ${m.lignes} % < ${minLignes} %`);
  if (m.branches !== null && m.branches < seuils.branches)
    problemes.push(`branches ${m.branches} % < ${seuils.branches} %`);
  return problemes;
}

export const BASE_DEFAUT = "origin/develop";

/**
 * Base d'un push, lue sur l'entrée du hook pre-push (`<local_ref> <local_sha> <remote_ref>
 * <remote_sha>`, une ligne par ref) : pousser vers `refs/heads/sujet/<nom>` se fusionne dans
 * `origin/sujet/<nom>`. On retient la ligne qui pousse HEAD ; une suppression ne compte pas.
 * Null si aucun push vers un sujet.
 */
export function baseDepuisPush(stdin, headSha) {
  const lignes = (stdin ?? "")
    .split("\n")
    .map((l) => l.trim().split(/\s+/))
    .filter((c) => c.length >= 4 && !/^0+$/.test(c[1]));
  const vers = (c) => /^refs\/heads\/(sujet\/.+)$/.exec(c[2])?.[1];
  const ligne = lignes.find((c) => c[1] === headSha && vers(c)) ?? lignes.find((c) => vers(c));
  return ligne ? `origin/${vers(ligne)}` : null;
}

/**
 * Base d'une branche de travail : le candidat (develop ou `origin/sujet/*`) dont il manque le
 * moins de commits à HEAD (`distance` = `rev-list --count <ref>..HEAD`). Pas d'ascendance exigée :
 * une branche dont le sujet a avancé (sous-PR sœur squashée, `sujet.sh rafraichir`) ne l'a plus
 * pour ancêtre, mais seuls ses propres commits lui manquent, donc son sujet reste le plus proche ;
 * un sujet étranger lui manque au moins tous les commits du sien. À égalité develop l'emporte : un
 * sujet livré n'est jamais plus proche, et une branche partie de develop (correctif `hors-sujet`,
 * dont le ticket déclare pourtant un sujet) garde develop.
 */
export function choisirBase(candidats) {
  const tri = [...candidats].sort(
    (a, b) =>
      a.distance - b.distance ||
      (b.ref === BASE_DEFAUT) - (a.ref === BASE_DEFAUT) ||
      a.ref.localeCompare(b.ref),
  );
  return tri[0]?.ref ?? BASE_DEFAUT;
}

/**
 * Les imports qu'une source exécute : `from "…"`, `import "…"` et `import("…")`. Un `import type`
 * et un `export type … from` ne comptent pas, un type n'est pas exécuté.
 */
export function importsDe(source) {
  const trouves = [];
  // Deux motifs sans retour arrière : `from "…"` (statique) et `import "…"` ou `import("…")`.
  for (const m of source.matchAll(/\bfrom\s*(["'])([^"'\r\n]+)\1|\bimport\s*\(?\s*(["'])([^"'\r\n]+)\3/g)) {
    if (m[2] !== undefined) {
      // Le type se lit sur l'instruction : du dernier `import` ou `export` qui précède, jusqu'à `from`.
      const avant = source.slice(0, m.index);
      const instruction = avant.slice(Math.max(avant.lastIndexOf("import"), avant.lastIndexOf("export")));
      if (/^(?:import|export)\s+type\s/.test(instruction)) continue;
      trouves.push(m[2]);
    } else {
      trouves.push(m[4]);
    }
  }
  return trouves;
}

const normaliser = (chemin) => {
  const sortie = [];
  for (const part of chemin.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") sortie.pop();
    else sortie.push(part);
  }
  return sortie.join("/");
};
const sansExtension = (c) => c.replace(/\.(?:[cm]?[jt]sx?)$/, "");

/**
 * Une suite sur base (`*.db.spec.ts`) du paquet cible-t-elle ce fichier ? Lu dans les sources,
 * jamais mesuré. Chemins relatifs au paquet. `specs` : `[{ chemin, source }]` ; `alias` : les
 * `compilerOptions.paths` du `tsconfig.json` du paquet, `[{ motif: "@x/*", cibles: ["src/x/*"] }]`
 * (vide si illisible : seuls les imports relatifs comptent) ; `existe(chemin)` dit si un fichier
 * existe. Le fichier est ciblé par un import de lui-même, de son dossier s'il porte un `index.*`
 * et qu'aucun fichier frère `<dossier>.ts` n'existe, ou du module du dossier (`<dossier>/<dossier>.module`, convention Nest) ou du `<dossier>.module` voisin.
 */
export function suiteSurBaseCible(fichier, specs, alias, existe) {
  const dossier = fichier.split("/").slice(0, -1).join("/");
  const cible = sansExtension(fichier);
  const frere = ["ts", "tsx"].some((e) => existe(`${dossier}.${e}`));
  const index = ["ts", "tsx", "js", "mjs"].some((e) => existe(`${dossier}/index.${e}`));
  const resoudre = (spec, chemin) => {
    if (spec.startsWith(".")) {
      return [normaliser(`${chemin.split("/").slice(0, -1).join("/")}/${spec}`)];
    }
    return alias.flatMap(({ motif, cibles }) => {
      const etoile = motif.indexOf("*");
      const [avant, apres] = etoile === -1 ? [motif, null] : [motif.slice(0, etoile), motif.slice(etoile + 1)];
      if (etoile === -1 ? spec !== motif : !spec.startsWith(avant) || !spec.endsWith(apres)) return [];
      const capture = etoile === -1 ? "" : spec.slice(avant.length, spec.length - apres.length);
      return cibles.map((c) => normaliser(c.replace("*", capture)));
    });
  };
  return specs.some(({ chemin, source }) =>
    importsDe(source).some((spec) =>
      resoudre(spec, chemin).some((r) => {
        const sans = sansExtension(r);
        return (
          sans === cible ||
          (sans === dossier && index && !frere) ||
          sans === `${dossier}.module` ||
          sans === `${dossier}/${dossier.split("/").at(-1)}.module`
        );
      }),
    ),
  );
}

/**
 * Ce contre quoi le diff se lit. `fusion` (l'arbre de la fusion recalculée d'une PR de mise à
 * jour) gagne. Sinon, base `origin/develop` : la base. `origin/develop` illisible : la base,
 * avec une note. HEAD contient `origin/develop` et la base non (réception de develop dont la
 * forme n'est pas celle d'une mise à jour) : le merge-base de develop et de HEAD, pour que le
 * code que develop apporte ne soit pas remesuré. Sinon la base. Le critère est le contenu, jamais
 * le nom de la branche. Rend `{ reference, sorte, note }`, `sorte` valant `fusion`, `develop`
 * ou `base`.
 */
export function referenceDuDiff({ base, mergeBase, mergeBaseDevelop, fusion, developLisible, headContientDevelop, baseContientDevelop }) {
  if (fusion) return { reference: fusion, sorte: "fusion", note: null };
  if (base === BASE_DEFAUT) return { reference: mergeBase, sorte: "base", note: null };
  if (!developLisible) {
    return { reference: mergeBase, sorte: "base", note: `${BASE_DEFAUT} illisible : diff lu contre ${base}, sans repli` };
  }
  if (headContientDevelop && !baseContientDevelop) {
    return { reference: mergeBaseDevelop, sorte: "develop", note: null };
  }
  return { reference: mergeBase, sorte: "base", note: null };
}

/**
 * Les `compilerOptions.paths` d'un `tsconfig.json` (JSON avec commentaires et virgules finales),
 * `[{ motif, cibles }]` relatifs au paquet (`baseUrl` compris). Texte illisible : `[]`, seuls les
 * imports relatifs comptent. Les commentaires et les virgules ne se cherchent jamais dans une
 *  chaîne : un chemin à étoile puis barre n'ouvre pas un commentaire.
 */
export function aliasDeTsconfig(texte) {
  try {
    const opts = JSON.parse(retirerCommentairesEtVirgules(texte)).compilerOptions ?? {};
    const racine = (opts.baseUrl ?? ".").replace(/^\.\/?/, "").replace(/\/$/, "");
    return Object.entries(opts.paths ?? {}).map(([motif, cibles]) => ({
      motif,
      cibles: cibles.map((c) => `${racine ? `${racine}/` : ""}${c.replace(/^\.\//, "")}`),
    }));
  } catch {
    return [];
  }
}

/** JSONC → JSON en un seul parcours (linéaire) : ni commentaire ni virgule finale hors d'une chaîne. */
function retirerCommentairesEtVirgules(texte) {
  let sortie = "";
  for (let i = 0; i < texte.length; ) {
    const c = texte[i];
    if (c === '"') {
      let j = i + 1;
      while (j < texte.length && texte[j] !== '"') j += texte[j] === "\\" ? 2 : 1;
      sortie += texte.slice(i, j + 1);
      i = j + 1;
    } else if (c === "/" && texte[i + 1] === "/") {
      while (i < texte.length && texte[i] !== "\n" && texte[i] !== "\r") i++;
    } else if (c === "/" && texte[i + 1] === "*") {
      const fin = texte.indexOf("*/", i + 2);
      i = fin === -1 ? texte.length : fin + 2;
    } else if (c === ",") {
      let j = i + 1;
      while (j < texte.length && " \t\r\n".includes(texte[j])) j++;
      if (texte[j] !== "}" && texte[j] !== "]") sortie += c;
      i++;
    } else {
      sortie += c;
      i++;
    }
  }
  return sortie;
}
