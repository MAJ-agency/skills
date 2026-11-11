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
