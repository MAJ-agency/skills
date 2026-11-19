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

const NOM = /^test\(\s*(?:"((?:[^"\\\n]|\\["\\'`])*)"|'((?:[^'\\\n]|\\["\\'`])*)'|`((?:[^`\\$\n]|\\["\\'`]|\$(?!\{))*)`)\s*,/gm;

/** Les noms des tests du fichier que la lecture reconnaît, dans l'ordre, doublons compris. */
export function nomsDesTests(source) {
  return [...source.matchAll(NOM)].map((m) => (m[1] ?? m[2] ?? m[3]).replace(/\\(.)/g, "$1"));
}

/** Le motif qui répond à ces noms, et à eux seuls : ancré, chaque caractère lu à la lettre. */
export function motif(noms) {
  return `^(?:${noms.map((n) => n.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|")})$`;
}

/**
 * Les travaux d'un banc : `{ banc, args, noms, sorte }`, `args` étant ce qui suit `node --test` et ses rapporteurs.
 * Au plus `taille` noms lus : le banc entier (`entier`). Au-delà : une `tranche` par paquet de `taille` noms distincts, puis le
 * `reste`, qui saute tous les noms lus.
 */
export function travaux(banc, noms, taille) {
  if (!Number.isInteger(taille) || taille < 1) throw new Error(`travaux : taille ${taille} : attendu un entier ≥ 1`);
  if (noms.length <= taille) return [{ banc, args: [banc], noms, sorte: "entier" }];
  // Un nom porté par deux tests répond deux fois au même motif : il va, avec tous ses doublons, dans une seule tranche.
  const distincts = [...new Set(noms)];
  const liste = [];
  for (let i = 0; i < distincts.length; i += taille) {
    const paquet = distincts.slice(i, i + taille);
    const avecDoublons = noms.filter((n) => paquet.includes(n));
    liste.push({ banc, args: [`--test-name-pattern=${motif(paquet)}`, banc], noms: avecDoublons, sorte: "tranche" });
  }
  liste.push({ banc, args: [`--test-skip-pattern=${motif(noms)}`, banc], noms, sorte: "reste" });
  return liste;
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
