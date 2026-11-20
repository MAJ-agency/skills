import { spawn } from "node:child_process";

// Le découpage d'un banc `node --test` en tranches (ticket 62). `node --test` joue les tests d'un même fichier l'un
// après l'autre : un banc de 116 tests (`fusionner.test.mjs`, 322 s sur 324 pour tous les bancs posés) fixe à lui
// seul la durée de `scripts/poses.test.mjs`. Jouées en tranches, chacune par son processus, ses tests tournent en
// parallèle, et la couverture prouve que chacun a tourné exactement une fois.
//
// Les noms se lisent dans la source : `test(` en début de ligne, un nom littéral (guillemets, apostrophes, ou accents
// graves sans substitution ; échappements `\\`, `\"`, `\'` et `` \` `` seuls), puis une virgule. Un nom calculé, ou
// un test écrit autrement, n'est pas lu : il tourne dans la tranche de reste, jouée avec `--test-skip-pattern` sur
// tous les noms lus. Une tranche se joue avec `--test-name-pattern` sur ses noms (Node 22 : un test qui ne répond pas
// au motif ne tourne pas, ses sous-tests non plus ; un test qui y répond tourne avec ses sous-tests).
//
// Seuls les tests de premier niveau sont comptés. Un sous-test (`t.test(…)`, `it` d'un `describe`) dont le nom égale
// un nom lu serait sauté par la tranche de reste sans être vu : un banc qui en écrit se joue entier, jamais découpé.
// Le motif des sous-tests se cherche dans `codeSeul(source)` : le texte des littéraux et des commentaires (un titre de
// commit « suite (#2) », un commentaire) n'est pas un appel. Dans le doute (`codeSeul` rend `null`), le banc se joue entier.
// Limites : ne sont reconnus que les sous-tests à nom littéral (`t.test("…"`) et `describe`, `suite`, `it` ; un
// sous-test au nom calculé (`t.test(nom, …)`), ou un `test(` global appelé dans le corps d'un test (Node 22 l'attache
// au test qui tourne), n'est pas vu. `codeSeul` est une lecture, pas un analyseur : une expression régulière après `)`
// ou `]` se lit comme une division (`if (a) /"/.test(b);`), et un `}` avant une `/` met le banc dans le doute.
// Un banc joué entier dont aucun nom n'est lu pèse 1 et a la borne minimale, quelle que soit sa taille (ticket 64).

const NOM = /^test\(\s*(?:"((?:[^"\\\n]|\\["\\'`])*)"|'((?:[^'\\\n]|\\["\\'`])*)'|`((?:[^`\\$\n]|\\["\\'`]|\$(?!\{))*)`)\s*,/gm;

/** Les noms des tests du fichier que la lecture reconnaît, dans l'ordre, doublons compris. */
export function nomsDesTests(source) {
  return [...source.matchAll(NOM)].map((m) => (m[1] ?? m[2] ?? m[3]).replace(/\\(.)/g, "$1"));
}

// Un sous-test : `<param>.test("…"` (un nom littéral en premier argument), ou `describe`, `suite`, `it` appelés.
const SOUS_TEST = /\b\w+\.test\s*\(\s*["'`]|\b(?:describe|suite|it)\s*\(/;

const MOTS_AVANT_REGEX = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "instanceof", "yield", "await"]);
const PONCTUATION_AVANT_REGEX = new Set(["(", "[", "{", ",", ";", ":", "?", "!", "=", "&", "|", "^", "~", "+", "-", "*", "%", "<", ">"]);
const FIN_DE_LIGNE = /[\n\r\u2028\u2029]/;
const DEBUT_DE_MOT = /[A-Za-z_$\u0080-￿]/;
const SUITE_DE_MOT = /[\w$\u0080-￿]/;

/**
 * La source de même longueur, le contenu des littéraux (chaînes, gabarits, expressions régulières) et des commentaires
 * blanchi (fins de ligne, délimiteurs et code des `${…}` gardés), ou `null` dans le doute.
 */
export function codeSeul(source) {
  const sortie = source.split("");
  const blanchir = (i) => {
    if (!FIN_DE_LIGNE.test(sortie[i])) sortie[i] = " ";
  };
  let i = 0;
  let avant = null; // le jeton significatif précédent : { sorte: "mot" | "litteral" | "ponct", valeur }
  const pile = []; // "accolade" ou "gabarit" (un `${` ouvert)
  const n = source.length;
  // Le texte d'un gabarit, à partir de i (après le ` ou après la } qui ferme un ${) ; rend false au doute.
  const texteDeGabarit = () => {
    while (i < n) {
      const c = source[i];
      if (c === "\\") { blanchir(i); if (i + 1 < n) blanchir(i + 1); i += 2; continue; }
      if (c === "`") { i++; avant = { sorte: "litteral" }; return true; }
      if (c === "$" && source[i + 1] === "{") { pile.push("gabarit"); i += 2; avant = { sorte: "ponct", valeur: "{" }; return true; }
      blanchir(i);
      i++;
    }
    return false;
  };
  while (i < n) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < n && !FIN_DE_LIGNE.test(source[i])) { blanchir(i); i++; }
      continue;
    }
    if (c === "/" && source[i + 1] === "*") {
      const fin = source.indexOf("*/", i + 2);
      if (fin < 0) return null;
      for (let k = i + 2; k < fin; k++) blanchir(k);
      i = fin + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      i++;
      let ferme = false;
      while (i < n) {
        const d = source[i];
        if (d === "\n" || d === "\r") return null; // U+2028 et U+2029 sont permis dans une chaîne
        if (d === "\\") {
          if (i + 1 < n && (source[i + 1] === "\n" || source[i + 1] === "\r")) return null;
          blanchir(i); blanchir(i + 1); i += 2; continue;
        }
        if (d === c) { ferme = true; i++; break; }
        blanchir(i); i++;
      }
      if (!ferme) return null;
      avant = { sorte: "litteral" };
      continue;
    }
    if (c === "`") {
      i++;
      if (!texteDeGabarit()) return null;
      continue;
    }
    if (c === "/") {
      let regex;
      if (avant === null) return null;
      if (avant.sorte === "litteral") regex = false;
      else if (avant.sorte === "mot") regex = MOTS_AVANT_REGEX.has(avant.valeur);
      else if (avant.valeur === ")" || avant.valeur === "]") regex = false;
      else if (PONCTUATION_AVANT_REGEX.has(avant.valeur)) regex = true;
      else return null; // `}`, `++`, `--`, `.` … : la nature de la `/` ne se lit pas
      if (!regex) { i++; avant = { sorte: "ponct", valeur: "/" }; continue; }
      i++;
      let classe = false;
      let ferme = false;
      while (i < n) {
        const d = source[i];
        if (FIN_DE_LIGNE.test(d)) return null;
        if (d === "\\") { if (i + 1 < n && FIN_DE_LIGNE.test(source[i + 1])) return null; blanchir(i); blanchir(i + 1); i += 2; continue; }
        if (classe) { if (d === "]") classe = false; blanchir(i); i++; continue; }
        if (d === "[") { classe = true; blanchir(i); i++; continue; }
        if (d === "/") { ferme = true; i++; break; }
        blanchir(i); i++;
      }
      if (!ferme) return null;
      while (i < n && SUITE_DE_MOT.test(source[i])) i++; // les drapeaux
      avant = { sorte: "litteral" };
      continue;
    }
    if (DEBUT_DE_MOT.test(c)) {
      const d = i;
      while (i < n && SUITE_DE_MOT.test(source[i])) i++;
      avant = { sorte: "mot", valeur: source.slice(d, i) };
      continue;
    }
    if (/[0-9]/.test(c)) {
      while (i < n && /[\w.]/.test(source[i])) i++;
      avant = { sorte: "litteral" };
      continue;
    }
    if ((c === "+" || c === "-") && source[i + 1] === c) { i += 2; avant = { sorte: "ponct", valeur: c + c }; continue; }
    if (c === "{") { pile.push("accolade"); i++; avant = { sorte: "ponct", valeur: "{" }; continue; }
    if (c === "}") {
      const haut = pile.pop();
      i++;
      if (haut === "gabarit") { if (!texteDeGabarit()) return null; continue; }
      avant = { sorte: "ponct", valeur: "}" };
      continue;
    }
    i++;
    avant = { sorte: "ponct", valeur: c };
  }
  if (pile.includes("gabarit")) return null;
  return sortie.join("");
}

/** Le banc écrit-il des sous-tests ? Alors il se joue entier. Dans le doute, aussi. */
export function aDesSousTests(source) {
  const code = codeSeul(source);
  return code === null || SOUS_TEST.test(code);
}

/** Le motif qui répond à ces noms, et à eux seuls : ancré, chaque caractère lu à la lettre. */
export function motif(noms) {
  return `^(?:${noms.map((n) => n.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|")})$`;
}

// Les bornes (ticket 64) : la borne d'un travail suit son poids, le plafond borne l'ensemble. Millisecondes.
export const BORNE_PAR_TEST = 60_000;
export const BORNE_MINIMALE = 300_000;
export const PLAFOND = 1_800_000;

/** La borne d'un travail de `poids` tests : jamais moins que la borne minimale. */
const borneDe = (poids) => Math.max(BORNE_MINIMALE, BORNE_PAR_TEST * poids);

/**
 * Les travaux d'un banc : `{ banc, args, noms, sorte, poids, borne }`, `args` étant ce qui suit `node --test` et ses
 * rapporteurs. Au plus `taille` noms distincts lus, ou `entier` vrai (banc à sous-tests) : le banc entier (`entier`).
 * Au-delà : une `tranche` par paquet de `taille` noms distincts, puis le `reste`, qui saute tous les noms lus.
 * `poids` : le nombre de tests de premier niveau que le travail est sûr de jouer, au moins 1. Un reste pèse les lignes
 * `test(` de la `source` moins les noms lus (sans `source`, 1) ; `borne` : voir `borneDe`.
 */
export function travaux(banc, noms, taille, { entier = false, source } = {}) {
  if (!Number.isInteger(taille) || taille < 1) throw new Error(`travaux : taille ${taille} : attendu un entier ≥ 1`);
  const travail = (args, lus, sorte, poids) => {
    const p = Math.max(1, poids);
    return { banc, args, noms: lus, sorte, poids: p, borne: borneDe(p) };
  };
  if (entier || new Set(noms).size <= taille) return [travail([banc], noms, "entier", noms.length)];
  // Un nom porté par deux tests répond deux fois au même motif : il va, avec tous ses doublons, dans une seule tranche.
  const distincts = [...new Set(noms)];
  const liste = [];
  for (let i = 0; i < distincts.length; i += taille) {
    const paquet = distincts.slice(i, i + taille);
    const avecDoublons = noms.filter((n) => paquet.includes(n));
    liste.push(travail([`--test-name-pattern=${motif(paquet)}`, banc], avecDoublons, "tranche", avecDoublons.length));
  }
  const lignes = source === undefined ? noms.length : (source.match(/^test\(/gm) ?? []).length;
  liste.push(travail([`--test-skip-pattern=${motif(noms)}`, banc], noms, "reste", lignes - noms.length));
  return liste;
}

/** Les travaux, tous bancs confondus, les plus lourds d'abord ; à poids égal, l'ordre reçu. La liste reçue ne change pas. */
export function ordre(liste) {
  return [...liste].sort((a, b) => b.poids - a.poids);
}

/** La durée si chaque travail allait jusqu'à sa borne : la somme des bornes sur `parallele`, plus la plus grande. */
export function pireCas(liste, parallele) {
  return liste.reduce((s, t) => s + t.borne, 0) / parallele + Math.max(0, ...liste.map((t) => t.borne));
}

const sec = (ms) => (ms / 1000).toFixed(1);

/** Le récit d'un travail en échec : son titre, ses lignes `✖` et `not ok`, puis les 40 dernières lignes de sa sortie. */
export function recit(r) {
  const fin = r.arrete ? "arrêté au plafond" : r.tue ? `tué à sa borne de ${r.t.borne / 1000} s` : `sortie ${r.code ?? r.signal}`;
  const lignes = r.sortie.split("\n");
  return [`── ${r.t.banc} (${r.t.sorte}, ${fin})`, ...lignes.filter((l) => /^\s*✖/.test(l) || /\bnot ok\b/.test(l)), ...lignes.slice(-40)].join("\n");
}

/** Les lignes du diagnostic : le total sur le plafond, le pire cas, puis les trois travaux joués les plus proches de leur borne. */
export function bilan(liste, resultats, { parallele, duree }) {
  const lignes = [`poses : ${liste.length} travaux, ${parallele} à la fois, ${sec(duree)} s sur un plafond de ${PLAFOND / 1000} s (${((100 * duree) / PLAFOND).toFixed(1)} %), pire cas ${sec(pireCas(liste, parallele))} s`];
  const joues = liste.map((t, i) => ({ t, ms: resultats[i]?.ms })).filter((x) => x.ms !== undefined);
  joues.sort((a, b) => b.ms / b.t.borne - a.ms / a.t.borne);
  for (const { t, ms } of joues.slice(0, 3)) lignes.push(`${t.banc} (${t.sorte}, ${t.poids} tests) : ${sec(ms)} s sur ${t.borne / 1000} s, marge ${(100 * (1 - ms / t.borne)).toFixed(1)} %`);
  return lignes;
}

/** `{ diagnostics, fautes }` : le bilan, en vert comme en rouge ; les fautes (échecs, plafond, couverture, plancher), vides si tout va bien. */
export function conclure(liste, resultats, { parallele, duree, depasse, plancher }) {
  const fautes = [];
  for (const r of resultats) if (r && r.code !== 0) fautes.push(recit(r));
  if (depasse) {
    const non = liste.length - resultats.filter(Boolean).length;
    fautes.push(`poses a atteint son plafond de ${PLAFOND / 1000} s : ${non} travaux non joués ; découper (un banc trop lourd, ou TAILLE)`);
  } else {
    fautes.push(...couverture(liste, resultats.map((r) => r.noms)));
    const joues = resultats.reduce((n, r) => n + r.noms.length, 0);
    if (joues < plancher) fautes.push(`les bancs posés ont joué ${joues} tests, plancher ${plancher} : ils ne jouent rien (NODE_TEST_CONTEXT hérité ?)`);
  }
  return { diagnostics: bilan(liste, resultats, { parallele, duree }), fautes };
}

/**
 * Joue `node <args>` dans son propre groupe de processus. Rend une promesse de `{ code, signal, tue, arrete, ms, sortie }`,
 * qui porte `arreter()`. À sa `borne` (ou à `arreter()`), le groupe entier est tué (`SIGKILL`) et la promesse se résout sur
 * `exit`, flux détruits : un petit-enfant qui tient le tube ne retient plus le travail. Sans kill, elle se résout sur `close`.
 */
export function lancer(args, { cwd, env, borne }) {
  const debut = Date.now();
  let arreter;
  const promesse = new Promise((fin) => {
    const enfant = spawn(process.execPath, args, { cwd, env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    let sortie = "";
    let tue = false;
    let arrete = false;
    let sorti = null;
    let rendu = false;
    const rendre = (code, signal) => {
      if (rendu) return;
      rendu = true;
      clearTimeout(minuterie);
      fin({ code, signal, tue, arrete, ms: Date.now() - debut, sortie: sortie.trim() });
    };
    enfant.stdout.on("data", (d) => (sortie += d));
    enfant.stderr.on("data", (d) => (sortie += d));
    const tuer = () => {
      tue = true;
      try {
        process.kill(-enfant.pid, "SIGKILL");
      } catch (e) {
        if (e.code !== "ESRCH") throw e;
      }
      enfant.stdout.destroy();
      enfant.stderr.destroy();
      if (sorti) rendre(...sorti);
    };
    const minuterie = setTimeout(tuer, borne);
    arreter = () => {
      if (rendu) return;
      arrete = true;
      tuer();
    };
    enfant.on("exit", (code, signal) => {
      sorti = [code, signal];
      if (tue) {
        enfant.stdout.destroy();
        enfant.stderr.destroy();
        rendre(code, signal);
      }
    });
    enfant.on("close", (code, signal) => rendre(code, signal));
    enfant.on("error", () => rendre(null, null));
  });
  promesse.arreter = () => arreter?.();
  return promesse;
}

const compter = (noms) => noms.reduce((m, n) => m.set(n, (m.get(n) ?? 0) + 1), new Map());

/**
 * Les fautes de couverture, `[]` s'il n'y en a pas. `executes[i]` : les noms des tests de premier niveau joués par
 * `liste[i]`. Une tranche joue chacun de ses noms autant de fois qu'elle le nomme, et rien d'autre ; le reste ne
 * rejoue aucun nom lu ; le banc entier joue chaque nom lu autant de fois qu'il est lu, et ce qu'il veut en plus.
 */
export function couverture(liste, executes) {
  const fautes = [];
  liste.forEach((t, i) => {
    const joues = compter(executes[i] ?? []);
    const attendus = compter(t.noms);
    if (t.sorte === "reste") {
      for (const n of joues.keys()) if (attendus.has(n)) fautes.push(`${t.banc} : la tranche de reste a rejoué « ${n} »`);
      return;
    }
    for (const [n, k] of attendus) {
      const vu = joues.get(n) ?? 0;
      if (vu !== k) fautes.push(`${t.banc} : « ${n} » a tourné ${vu} fois${t.sorte === "tranche" ? " dans sa tranche" : ""}, attendu ${k}`);
    }
    if (t.sorte === "tranche") for (const n of joues.keys()) if (!attendus.has(n)) fautes.push(`${t.banc} : « ${n} » a tourné dans une tranche qui ne le nomme pas`);
  });
  return fautes;
}

/**
 * Un rapporteur de `node --test`, à écrire dans un fichier `.mjs` : une ligne JSON `{ nom }` par test de premier
 * niveau joué (réussi ou en échec), le test englobant du fichier (que Node 22 rend quand rien n'a tourné) excepté.
 */
export const RAPPORTEUR = `export default async function* rapporteur(source) {
  for await (const e of source) {
    if ((e.type !== "test:pass" && e.type !== "test:fail") || e.data.nesting !== 0 || e.data.details?.type === "suite") continue;
    if (e.data.file && (e.data.name === e.data.file || e.data.file.endsWith("/" + e.data.name))) continue;
    yield JSON.stringify({ nom: e.data.name }) + "\\n";
  }
}
`;
