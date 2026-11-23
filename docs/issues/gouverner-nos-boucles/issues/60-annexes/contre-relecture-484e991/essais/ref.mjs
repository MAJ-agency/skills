// Référence de comparaison : un découpage d'en-tête écrit pour l'essai et la bibliothèque `yaml` 2.9.1, comparés au
// lecteur du module (`enTeteDeRegle`). À jouer hors du dépôt : copier ce dossier dans un dossier privé,
// y lancer `npm install yaml@2.9.1`, puis `MODULE=<chemin de double-relecture.mjs> node essais/<script>.mjs …`.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
if (!process.env.MODULE) throw new Error('MODULE : le chemin du double-relecture.mjs à comparer');
export const { enTeteDeRegle, Illisible } = await import(pathToFileURL(resolve(process.env.MODULE)).href);
const NIVEAUX = ['low', 'medium', 'high'];
const HORS = ['rejected', 'obsolete'];
const rang = (n) => (n === null ? -1 : NIVEAUX.indexOf(n));

/**
 * Découpage d'en-tête écrit pour cet essai : la première ligne est `---` (espaces ou tabulations finales admises),
 * l'en-tête va jusqu'à la ligne `---` suivante ; les fins de ligne `\r\n` sont ramenées à `\n`. Sans cela : `null`.
 */
export function decoupe(texte) {
  const lignes = texte.replace(/\r\n/g, '\n').split('\n');
  const barre = (ligne) => /^---[ \t]*$/.test(ligne);
  if (!barre(lignes[0] ?? '')) return null;
  for (let i = 1; i < lignes.length; i++) if (barre(lignes[i])) return lignes.slice(1, i).join('\n');
  return null;
}

/** Ce que `yaml` 2.9.1 lit de l'en-tête : `{ niveau, code, statut, enVigueur, brut }`, ou `{ erreur }`, `{ sansEnTete }`, `{ invalide }`. */
export function bibliotheque(texte) {
  const enTete = decoupe(texte);
  if (enTete === null) return { sansEnTete: true };
  let d;
  try { d = parse(enTete, { logLevel: 'error' }); } catch (e) { return { erreur: e.message.split('\n')[0] }; }
  if (d === null || d === undefined) return { niveau: null, code: [], statut: undefined, enVigueur: true, brut: d };
  if (typeof d !== 'object' || Array.isArray(d)) return { invalide: 'racine', brut: d };
  const r = { brut: { criticality: d.criticality, code: d.code, validation: d.validation } };
  if (!('criticality' in d)) r.niveau = null;
  else {
    const c = d.criticality;
    const n = typeof c === 'string' ? c : c && typeof c === 'object' && !Array.isArray(c) ? c.level : undefined;
    if (NIVEAUX.includes(n)) r.niveau = n; else r.niveauInvalide = true;
  }
  if (!('code' in d)) r.code = [];
  else if (Array.isArray(d.code) && d.code.every((p) => typeof p === 'string')) r.code = d.code;
  else r.codeInvalide = true;
  const v = d.validation;
  r.statut = v && typeof v === 'object' ? v.status : undefined;
  r.enVigueur = !HORS.includes(r.statut);
  return r;
}

const estTexte = (v) => typeof v === 'string';
const clesDans = (o, permises) => Object.keys(o).every((k) => permises.includes(k));
/**
 * Les trois clés lues satisfont-elles un schéma strict ? Écrit d'après le gabarit public `regle.md` du plugin, pas d'après
 * un autre code : `criticality` nue ou `{ level, by, reason }`, `validation` `{ status, date, by, reason }` au statut du
 * vocabulaire, `code` liste de textes ; toute autre clé sous `criticality` ou `validation` le rend invalide.
 */
function schemaValide(b) {
  const c = b.criticality, v = b.validation, k = b.code;
  const okC = c === undefined || NIVEAUX.includes(c) || (c && typeof c === 'object' && !Array.isArray(c) && clesDans(c, ['level', 'by', 'reason']) && NIVEAUX.includes(c.level) && (c.by === undefined || estTexte(c.by)) && (c.reason === undefined || estTexte(c.reason)));
  const okV = v === undefined || (v && typeof v === 'object' && !Array.isArray(v) && clesDans(v, ['status', 'date', 'by', 'reason']) && ['candidate', 'validated', 'rejected', 'obsolete'].includes(v.status) && ['date', 'by', 'reason'].every((x) => v[x] === undefined || estTexte(v[x])));
  const okK = k === undefined || (Array.isArray(k) && k.every(estTexte));
  return okC && okV && okK;
}

/** Ce que le module a lu et refusé depuis le début du processus. */
export const compteurs = { lus: 0, refus: 0 };

/**
 * Classe un fichier de règle : `null` quand le module refuse ou lit comme la bibliothèque, sinon `{ classe, module, lib }`.
 *   S-B, N-B   le module lit un niveau plus bas que la bibliothèque (S : en-tête valide pour le schéma strict ; N : non)
 *   S-D, N-D   le module rend « hors vigueur » une règle que la bibliothèque ne lit ni `rejected` ni `obsolete`
 *   S-E, N-E   la bibliothèque lit un chemin de `code` que le module n'a pas
 *   X1, X2     le module lit ce que la bibliothèque refuse (erreur de YAML ; racine qui n'est pas un mappage)
 *   V          le module lit un niveau ou des chemins où la bibliothèque lit autre chose
 *   Y          un écart sans danger (le module lit plus haut, « en vigueur » de plus, un chemin de plus)
 *   X3         même lecture que la bibliothèque ; seul le schéma strict refuserait le fichier
 *   Z          la bibliothèque ne trouve pas d'en-tête, le module en lit un
 */
export function classer(texte) {
  let m;
  try { m = enTeteDeRegle(texte); } catch (e) { if (!(e instanceof Illisible)) return { classe: 'PLANTAGE', module: String(e), lib: null }; compteurs.refus++; return null; }
  compteurs.lus++;
  const l = bibliotheque(texte);
  const d = (classe) => ({ classe, module: m, lib: l });
  const sur = m.niveau === 'high' && m.enVigueur ? '-module-haut' : '';
  if (l.sansEnTete) return d('Z-sans-en-tete-pour-la-bibliotheque');
  if (l.erreur) return d(`X1-erreur-yaml${sur}`);
  if (l.invalide) return d(`X2-racine${sur}`);
  const valide = l.brut === null || l.brut === undefined || schemaValide(l.brut);
  const p = valide ? 'S' : 'N';
  // Lu plus bas, « hors vigueur » à tort, un chemin de `code` que le module n'a pas : les trois dangers.
  if (!l.niveauInvalide && rang(l.niveau) > rang(m.niveau)) return d(`${p}-B-niveau-plus-bas${l.niveau === 'high' ? '-que-haut' : ''}`);
  if (!m.enVigueur && l.enVigueur) return d(`${p}-D-hors-vigueur-a-tort`);
  if (!l.codeInvalide && l.code.some((x) => !m.code.includes(x))) return d(`${p}-E-code-manquant`);
  // Le module lit un niveau ou des chemins là où la bibliothèque lit autre chose qu'un niveau ou qu'une liste de textes.
  if (l.niveauInvalide) return d(`V-niveau-que-yaml-ne-lit-pas${sur}`);
  if (l.codeInvalide) return d('V-code-que-yaml-ne-lit-pas');
  // Aucun danger : reste-t-il un écart (le module lit plus haut, un chemin de plus, « en vigueur » de plus) ?
  if (m.niveau !== (l.niveau ?? null) || m.enVigueur !== l.enVigueur || JSON.stringify(m.code) !== JSON.stringify(l.code)) return d('Y-ecart-sans-danger');
  // Même lecture que la bibliothèque ; seul un schéma strict (clé inconnue, `status` absent) refuserait le fichier.
  if (!valide) return d('X3-meme-lecture-hors-schema-strict');
  return null;
}
