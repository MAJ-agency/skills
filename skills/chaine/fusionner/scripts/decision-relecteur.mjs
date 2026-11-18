// =============================================================================
// La décision du Relecteur (relecture indépendante, lot 3a) : une fonction pure.
//
// Pour l'état d'une PR (ses étiquettes, tous ses commentaires, sa tête, le nombre de verdicts exigés, le fait
// que son diff touche un chemin sensible, « même contenu propre » par sommet de tour, l'instant), `decider`
// rend un seul geste, ou « rien » : la première des six règles qui s'applique. `tourValide` est la règle 2,
// pour le capitaine, par les mêmes définitions.
//
// Les marques lues dans les commentaires (le corps entier est la forme, à l'octet près, sauf mention) :
//   - le verdict d'une session de relecture (verdict.mjs) ;
//   - la distribution : `Relecture — tour <k> — sommet <sha> — sessions <s1>, <s2>`, suivie ou non de
//     ` (remplace <id>)`, ` (complète)`, ` (après arbitrage, non compté)`, ` (relance <id>)` ;
//   - la demande de l'auteur : `À relire — sommet <sha> — Session: <id ou —> — Conducteur: <id ou —>` ;
//   - `Plafond — décision attendue` ; `Relecture en panne` ;
//   - la décision de plafond : première ligne `Décision de plafond — <texte>` ;
//   - l'arbitrage : chaque ligne non vide est `Arbitrage — <lieu> — maintenu[ — <raison>]` ou
//     `Arbitrage — <lieu> — écarté — <raison>` ;
//   - la trace d'illisible : première ligne `Lecture illisible — <cause>`.
// Un commentaire qui porte le préfixe d'une marque sans en avoir la forme n'est jamais ignoré : c'est une
// lecture illisible. « Plus récent » veut dire « de rang supérieur dans le tableau reçu » ; les dates ne
// servent qu'aux délais, comparées à `maintenant`, la seule source de temps.
//
// Module pur : aucun point d'entrée, aucune horloge, aucun import hors verdict.mjs.
// =============================================================================

import { LectureIllisible, lireVerdict, retenir } from './verdict.mjs';

export const ETIQUETTES = ['à-relire', 'à-reprendre', 'à-fusionner', 'fusion-bloquée']; // « les quatre »
export const DELAI_MS = 2 * 60 * 60 * 1000; // `relecture.delai` par défaut : deux heures
export const PLAFOND = 3; // trois tours comptés
export const TEXTE_PLAFOND = 'Plafond — décision attendue';
export const TEXTE_PANNE = 'Relecture en panne';
export const TEXTE_ILLISIBLE = 'Lecture illisible — ';
export const MENTION_ARBITRAGE = 'après arbitrage, non compté';
export const ILLISIBLE = 'illisible'; // la valeur d'un calcul qui n'a pas pu être lu

const SHA = '[0-9a-f]{40}';
const ID = '[A-Za-z0-9][A-Za-z0-9_-]*';
const FORME_SHA = new RegExp(`^${SHA}$`);
const FORME_DISTRIBUTION = new RegExp(`^Relecture — tour ([1-9][0-9]*) — sommet (${SHA}) — sessions (${ID}(?:, ${ID})*)(?: \\((?:(remplace|relance) (${ID})|(complète|${MENTION_ARBITRAGE}))\\))?$`);
const FORME_DEMANDE = new RegExp(`^À relire — sommet (${SHA}) — Session: (${ID}|—) — Conducteur: (${ID}|—)$`);
const FORME_DECISION = /^Décision de plafond — \S/;
const TIRET = ' — ';

/**
 * @typedef {object} Distribution
 * @property {number} tour
 * @property {string} sommet
 * @property {string[]} sessions                      sans doublon, dans l'ordre écrit
 * @property {null|'remplace'|'relance'|'complète'|'après arbitrage, non compté'} mention
 * @property {string|null} cible                      l'identifiant de `(remplace …)` ou de `(relance …)`, sinon `null`
 *
 * @param {string} corps  déjà passé par `corpsLu`
 * @returns {Distribution|null}  `null` pour toute forme voisine
 */
export function lireDistribution(corps) {
  const m = FORME_DISTRIBUTION.exec(String(corps));
  if (m === null || !Number.isSafeInteger(Number(m[1]))) return null;
  return { tour: Number(m[1]), sommet: m[2], sessions: [...new Set(m[3].split(', '))], mention: m[4] ?? m[6] ?? null, cible: m[5] ?? null };
}

/**
 * @param {{ tour: number, sommet: string, sessions: string[], mention?: Distribution['mention'], cible?: string|null }} d
 * @returns {string}  le corps du commentaire, sur une ligne
 * @throws {TypeError}  quand ce qu'il écrirait ne se relit pas par `lireDistribution`
 */
export function ecrireDistribution(d) {
  if (d === null || typeof d !== 'object' || !Array.isArray(d.sessions)) throw new TypeError('distribution : un objet et ses sessions sont attendus');
  const mention = d.mention ?? null;
  const cible = d.cible ?? null;
  const suite = mention === null ? '' : ` (${cible === null ? mention : `${mention} ${cible}`})`;
  const texte = `Relecture${TIRET}tour ${d.tour}${TIRET}sommet ${d.sommet}${TIRET}sessions ${d.sessions.join(', ')}${suite}`;
  const relu = lireDistribution(texte);
  const meme = relu !== null && relu.tour === d.tour && relu.sommet === d.sommet && relu.mention === mention && relu.cible === cible && relu.sessions.length === d.sessions.length && relu.sessions.every((s, i) => s === d.sessions[i]);
  if (!meme) throw new TypeError(`distribution hors de la forme : ${texte}`);
  return texte;
}

// Une ligne d'arbitrage, lue par ses segments : `'maintenu'`, `'écarté'`, ou `null` quand elle n'en a pas la
// forme. Le mot qui décide est le premier segment `maintenu` ou `écarté` après le lieu.
function lireArbitrage(ligne) {
  const segments = ligne.split(TIRET);
  if (segments[0] !== 'Arbitrage' || segments.length < 3 || segments[1].trim() === '') return null;
  const i = segments.findIndex((s, k) => k >= 2 && (s === 'maintenu' || s === 'écarté'));
  if (i === -1) return null;
  const raison = segments.slice(i + 1);
  if (raison.length === 0) return segments[i] === 'maintenu' ? 'maintenu' : null;
  return raison.join(TIRET).trim() === '' ? null : segments[i];
}
const lignesPleines = (corps) => corps.split('\n').filter((l) => l.trim() !== '');
const ecarte = (corps) => lignesPleines(corps).some((l) => lireArbitrage(l) === 'écarté');

// Les marques à préfixe, dans l'ordre où elles se cherchent. `lire` rend la liste où le commentaire entre et ce
// qu'il y ajoute, ou `null` : le préfixe sans la forme.
const MARQUES = [
  { prefixe: 'Relecture — ', lire: (corps) => { const d = lireDistribution(corps); return d && { distributions: d }; } },
  { prefixe: TEXTE_PANNE, lire: (corps) => (corps === TEXTE_PANNE ? { pannes: {} } : null) },
  {
    prefixe: 'À relire — ',
    lire: (corps) => {
      const m = FORME_DEMANDE.exec(corps);
      return m && { demandes: { sommet: m[1], auteur: m[2] === '—' ? null : m[2], conducteur: m[3] === '—' ? null : m[3] } };
    },
  },
  { prefixe: 'Plafond — ', lire: (corps) => (corps === TEXTE_PLAFOND ? { plafonds: {} } : null) },
  { prefixe: 'Décision de plafond', lire: (corps) => (FORME_DECISION.test(corps.split('\n')[0]) ? { decisions: {}, ...(ecarte(corps) ? { arbitragesEcartes: {} } : {}) } : null) },
  { prefixe: 'Arbitrage — ', lire: (corps) => (lignesPleines(corps).every((l) => lireArbitrage(l) !== null) ? (ecarte(corps) ? { arbitragesEcartes: {} } : {}) : null) },
];
const PREFIXE_TRACE = 'Lecture illisible';

/**
 * Les commentaires à marque d'une PR, chacun avec `{ id, rang, date }` du commentaire, dans l'ordre reçu.
 * @param {import('./verdict.mjs').Commentaire[]} commentaires  TOUS les commentaires de la PR, dans l'ordre de création
 * @param {{ tolerant?: boolean }} [options]  `tolerant` : les marques presque à la forme sont rendues dans
 *   `presque` au lieu de lever
 * @returns {{ verdicts: object[], distributions: object[],
 *             demandes: { id, rang, date, sommet: string, auteur: string|null, conducteur: string|null }[],
 *             plafonds: object[], decisions: object[], arbitragesEcartes: object[], pannes: object[],
 *             illisibles: { id, rang, date, texte: string }[], presque: { id, rang, date, prefixe: string }[],
 *             dernier: number }}
 *   `arbitragesEcartes` : un par commentaire qui écarte au moins un bloquant ; `illisibles` : les traces,
 *   `texte` leur première ligne ; `presque` : vide hors `tolerant` ; `dernier` : le rang du plus récent
 *   commentaire à marque ou presque à la forme, traces d'illisible exclues, -1 s'il n'y en a pas.
 * @throws {LectureIllisible}  commentaires que `retenir` ne lit pas ; et, hors `tolerant`, toute marque
 *   presque à la forme
 */
export function lireMarques(commentaires, options = {}) {
  const m = { verdicts: [], distributions: [], demandes: [], plafonds: [], decisions: [], arbitragesEcartes: [], pannes: [], illisibles: [], presque: [], dernier: -1 };
  for (const { id, rang, date, corps } of retenir(commentaires).retenus) {
    const place = { id, rang, date };
    const v = lireVerdict(corps);
    if (v !== null) {
      // Un verdict que rien ne rattache (Tour ou Session illisible) est écarté, mais reste un commentaire à marque.
      if (v.tour !== null && v.session !== null) m.verdicts.push({ ...place, ...v });
      m.dernier = rang;
      continue;
    }
    if (corps.startsWith(PREFIXE_TRACE)) {
      const texte = corps.split('\n')[0];
      if (texte.startsWith(TEXTE_ILLISIBLE) && texte.length > TEXTE_ILLISIBLE.length) {
        m.illisibles.push({ ...place, texte });
        continue;
      }
    }
    const marque = corps.startsWith(PREFIXE_TRACE) ? { prefixe: PREFIXE_TRACE, lire: () => null } : MARQUES.find((q) => corps.startsWith(q.prefixe));
    if (marque === undefined) continue;
    m.dernier = rang;
    const lu = marque.lire(corps);
    if (lu) for (const [liste, valeur] of Object.entries(lu)) m[liste].push({ ...valeur, ...place });
    else if (options.tolerant) m.presque.push({ ...place, prefixe: marque.prefixe.trimEnd() });
    else throw new LectureIllisible(causePresque({ ...place, prefixe: marque.prefixe.trimEnd() }));
  }
  return m;
}

const causePresque = ({ id, rang, prefixe }) => `commentaire ${id ?? `de rang ${rang}`} : préfixe « ${prefixe} » sans la forme de sa marque`;
const CAUSE_DOUBLE = '« double relecture exigée » illisible';
const causeMeme = (sommet) => `« même contenu propre » illisible pour le sommet ${sommet}`;

// Les numéros de tour et, pour chacun, ses distributions : la première du numéro fixe le sommet, une
// distribution du même numéro sur un autre sommet n'entre pas dans le tour.
function distributionsParTour(marques) {
  const parTour = new Map();
  for (const d of marques.distributions) {
    if (!parTour.has(d.tour)) parTour.set(d.tour, []);
    if (parTour.get(d.tour).length === 0 || parTour.get(d.tour)[0].sommet === d.sommet) parTour.get(d.tour).push(d);
  }
  return [...parTour.entries()].sort(([a], [b]) => a - b);
}

/**
 * Les sommets des tours distribués, sans doublon : ceux dont l'appelant calcule « même contenu propre » avec
 * le sommet jugé. Lecture tolérante : une marque presque à la forme ne l'empêche pas, `decider` la dira.
 * @param {import('./verdict.mjs').Commentaire[]} commentaires
 * @returns {string[]}
 * @throws {LectureIllisible}  commentaires que `retenir` ne lit pas
 */
export function sommetsDesTours(commentaires) {
  return [...new Set(distributionsParTour(lireMarques(commentaires, { tolerant: true })).map(([, ds]) => ds[0].sommet))];
}

/**
 * @typedef {object} Tour
 * @property {number} numero
 * @property {string} sommet
 * @property {string[]} sessions                      celles de sa dernière distribution
 * @property {object[]} distributions                 celles du tour, dans l'ordre
 * @property {Record<string, object>} verdicts        par session nommée : son dernier verdict, `verdict` tel que le tour le compte
 * @property {object[]} refus                         les verdicts `refusé` qui comptent contre le tour, sessions remplacées comprises
 * @property {'refuse'|'valide'|'en-cours'|'abandonne'} etat
 * @property {boolean} surLaTete
 * @property {boolean} nonCompte
 * @property {boolean} compte
 *
 * @param {ReturnType<typeof lireMarques>} marques
 * @param {{ tete: string, exiges: number, sensible: boolean, memeContenu?: Record<string, boolean|'illisible'> }} contexte
 * @returns {Tour[]}  par numéro croissant
 */
export function tours(marques, contexte) {
  const { tete, exiges, sensible, memeContenu = {} } = contexte;
  const decision = marques.decisions.at(-1)?.rang ?? -1;
  return distributionsParTour(marques).map(([numero, distributions]) => {
    const sommet = distributions[0].sommet;
    const sessions = distributions.at(-1).sessions;
    // Le tour se clôt à la première distribution d'un tour de numéro supérieur : abandonné reste abandonné.
    const cloture = Math.min(...marques.distributions.filter((d) => d.tour > numero).map((d) => d.rang), Infinity);
    // Le verdict tel que le tour le compte : `incomplet` s'il est illisible, s'il a relu un autre sommet, ou si
    // la PR est sensible sans `/security-review: lancée`.
    const compter = (v) => ({ ...v, verdict: v.illisible || v.sommet !== sommet || (sensible && v.securite !== 'lancée') ? 'incomplet' : v.verdict });
    // Le dernier verdict d'une session pour ce tour, écrit après la distribution qui l'a nommée la première.
    const dernierVerdict = (session) => {
      const nommee = distributions.find((d) => d.sessions.includes(session)).rang;
      const v = marques.verdicts.findLast((x) => x.tour === numero && x.session === session && x.rang > nommee && x.rang < cloture);
      return v === undefined ? null : compter(v);
    };
    const verdicts = {};
    for (const s of sessions) {
      const v = dernierVerdict(s);
      if (v !== null) verdicts[s] = v;
    }
    // Tout `refusé` d'une session distribuée pour ce tour compte contre lui, remplacée ou non.
    const refus = [...new Set(distributions.flatMap((d) => d.sessions))].map(dernierVerdict).filter((v) => v !== null && v.verdict === 'refusé');
    const surLaTete = sommet === tete || memeContenu[sommet] === true;
    const valides = sessions.filter((s) => verdicts[s]?.verdict === 'validé').length;
    const etat = refus.length > 0 ? 'refuse' : valides >= exiges ? 'valide' : surLaTete ? 'en-cours' : 'abandonne';
    const nonCompte = distributions.some((d) => d.mention === MENTION_ARBITRAGE);
    return { numero, sommet, sessions, distributions, verdicts, refus, etat, surLaTete, nonCompte, compte: etat === 'refuse' && !nonCompte && distributions[0].rang > decision };
  });
}

// Le tour qui juge la tête : le dernier qui porte sur son contenu. `null` quand aucun n'y porte, ou quand un
// tour plus récent n'a pas de réponse booléenne dans la table : une lecture manquante, personne ne juge.
function tourQuiJuge(lesTours, tete, memeContenu) {
  for (const t of [...lesTours].reverse()) {
    if (t.sommet === tete || memeContenu[t.sommet] === true) return t;
    if (memeContenu[t.sommet] !== false) return null;
  }
  return null;
}

const refuser = (nom, attendu) => {
  throw new TypeError(`${nom} : ${attendu}`);
};
const estObjet = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// La forme de ce que les deux calculs partagent : la tête, le nombre exigé, le chemin sensible, la table.
function verifierContexte(e) {
  if (!estObjet(e)) refuser('entrée', 'un objet est attendu');
  if (typeof e.tete !== 'string' || !FORME_SHA.test(e.tete)) refuser('tete', '40 caractères hexadécimaux, en minuscules');
  if (e.exiges !== ILLISIBLE && !(Number.isSafeInteger(e.exiges) && e.exiges >= 1)) refuser('exiges', `un entier, 1 ou plus, ou « ${ILLISIBLE} »`);
  if (typeof e.sensible !== 'boolean') refuser('sensible', 'un booléen');
  if (e.memeContenu !== undefined && !estObjet(e.memeContenu)) refuser('memeContenu', 'une table par sommet');
}

// La première cause d'illisible d'un calcul reçu, ou `null`.
function causeDesCalculs(marques, { tete, exiges, memeContenu = {} }) {
  if (exiges === ILLISIBLE) return CAUSE_DOUBLE;
  const sommet = distributionsParTour(marques).map(([, ds]) => ds[0].sommet).find((s) => s !== tete && memeContenu[s] === ILLISIBLE);
  return sommet === undefined ? null : causeMeme(sommet);
}

/**
 * La règle 2, pour le Relecteur comme pour le capitaine : le dernier tour qui porte sur le contenu de `tete`,
 * s'il est `valide` ; sinon `null`. `null` aussi quand un tour plus récent n'a pas de réponse booléenne dans
 * `memeContenu`.
 * @param {{ commentaires: import('./verdict.mjs').Commentaire[], tete: string, exiges: number|'illisible', sensible: boolean,
 *           memeContenu?: Record<string, boolean|'illisible'> }} entree
 * @returns {Tour|null}
 * @throws {LectureIllisible}  commentaires illisibles, marque presque à la forme, `exiges` ou « même contenu
 *   propre » illisible : jamais « validé »
 * @throws {TypeError}  toute autre entrée hors de sa forme
 */
export function tourValide(entree) {
  verifierContexte(entree);
  const marques = lireMarques(entree.commentaires);
  const cause = causeDesCalculs(marques, entree);
  if (cause !== null) throw new LectureIllisible(cause);
  const juge = tourQuiJuge(tours(marques, entree), entree.tete, entree.memeContenu ?? {});
  return juge !== null && juge.etat === 'valide' ? juge : null;
}

const ETATS_DE_SESSION = ['vivante', 'morte', 'plafond'];

/**
 * @typedef {object} EtatPR
 * @property {number} numero                          le numéro de la PR
 * @property {string[]} etiquettes                    les noms de ses étiquettes, toutes ; comparés en NFC
 * @property {string} branche                         sa branche de tête
 * @property {import('./verdict.mjs').Commentaire[]} commentaires  TOUS, toutes pages lues, dans l'ordre de création
 * @property {string} tete                            son sommet (40 caractères hexadécimaux, en minuscules)
 * @property {number|'illisible'} exiges              « double relecture exigée » : 1, ou 2 (entier, 1 ou plus)
 * @property {boolean} sensible                       son diff propre touche un chemin sensible
 * @property {Record<string, boolean|'illisible'>} [memeContenu]  une clé par sommet que `sommetsDesTours` rend, sans exception
 * @property {number} maintenant                      l'instant, en millisecondes depuis l'époque (un nombre fini)
 * @property {number} [delaiMs]                       `relecture.delai` en millisecondes ; `DELAI_MS` par défaut
 * @property {Record<string, 'vivante'|'morte'|'plafond'>} [sessions]  l'état des sessions, quand il est connu
 *
 * @param {EtatPR} etat
 * @returns {object}  un seul geste : la première règle qui s'applique
 * @throws {LectureIllisible}  commentaires que `retenir` ne lit pas
 * @throws {TypeError}  toute autre entrée hors de sa forme
 */
export function decider(etat) {
  verifierContexte(etat);
  const { numero, branche, tete, exiges, maintenant, delaiMs = DELAI_MS, sessions: connues = {} } = etat;
  const memeContenu = etat.memeContenu ?? {};
  if (!(Number.isSafeInteger(numero) && numero >= 1)) refuser('numero', 'un entier, 1 ou plus');
  if (!Array.isArray(etat.etiquettes) || etat.etiquettes.some((e) => typeof e !== 'string')) refuser('etiquettes', 'un tableau de noms');
  if (typeof branche !== 'string' || branche === '') refuser('branche', 'un nom de branche');
  if (typeof maintenant !== 'number' || !Number.isFinite(maintenant)) refuser('maintenant', 'un nombre fini de millisecondes depuis l\'époque');
  if (typeof delaiMs !== 'number' || !Number.isFinite(delaiMs) || delaiMs <= 0) refuser('delaiMs', 'un nombre fini de millisecondes, plus de zéro');
  if (!estObjet(connues) || Object.values(connues).some((s) => !ETATS_DE_SESSION.includes(s))) refuser('sessions', `par session : ${ETATS_DE_SESSION.join(', ')}`);

  // La file : hors d'elle, les commentaires ne sont pas lus.
  const etiquettes = etat.etiquettes.map((e) => e.normalize('NFC'));
  const porte = (nom) => etiquettes.includes(nom);
  const rien = (regle, raison, plus = {}) => ({ regle, geste: 'rien', raison, ...plus });
  if (!porte('à-relire')) {
    if (!porte('à-fusionner')) return rien(null, 'hors-file');
    if (/^(?:sujet|livraison)\//.test(branche)) return rien(null, 'livraison');
    if (porte('fusion-bloquée')) return rien(null, 'renvoi-du-capitaine');
  }

  const marques = lireMarques(etat.commentaires, { tolerant: true });

  // L'illisible, avant toute règle : ni distribution, ni validation, ni changement d'étiquette.
  const cause = marques.presque.length > 0 ? causePresque(marques.presque[0]) : causeDesCalculs(marques, etat);
  if (cause !== null) {
    const commentaire = `${TEXTE_ILLISIBLE}${cause}`;
    const signale = marques.illisibles.some((t) => t.rang > marques.dernier && t.texte.startsWith(commentaire) && maintenant - Date.parse(t.date) <= delaiMs);
    if (signale) return rien(null, 'illisible-signale');
    return { regle: null, geste: 'illisible', commentaire, lignes: [{ a: 'architecte', session: null, texte: `PR ${numero} : lecture illisible : ${cause}` }] };
  }

  const lesTours = tours(marques, etat);
  const dernier = lesTours.at(-1) ?? null;
  const demande = marques.demandes.at(-1) ?? { auteur: null, conducteur: null };
  const ligne = (a, texte) => ({ a, session: a === 'architecte' ? null : demande[a], texte });
  const auxDeux = (texte) => [ligne('auteur', texte), ligne('conducteur', texte)];
  const double = exiges >= 2 ? ', double' : '';
  const retirer = (poser) => ETIQUETTES.filter((e) => e !== poser && porte(e));
  const etiqueter = (regle, poser, texte) => (porte(poser) && retirer(poser).length === 0 ? rien(regle, 'etiquette-en-place') : { regle, geste: 'etiqueter', poser, retirer: retirer(poser), lignes: auxDeux(texte) });
  const distribuer = (regle, mention) => ({ regle, geste: 'distribuer', tour: (dernier?.numero ?? 0) + 1, sommet: tete, nombre: exiges, preferees: dernier?.sessions ?? [], mention });
  const REFUS = `verdict écrit sur la PR ${numero} : refusé${double}`;

  // Règle 1 — le plafond, et là seulement : une décision attendue ; sinon trois tours comptés ou plus.
  const plafond = marques.plafonds.at(-1)?.rang ?? -1;
  if (plafond > (marques.decisions.at(-1)?.rang ?? -1)) return etiqueter(1, 'à-reprendre', `PR ${numero} : décision de plafond attendue`);
  if (lesTours.filter((t) => t.compte).length >= PLAFOND) {
    const texte = `PR ${numero} : plafond atteint au troisième tour refusé, décision attendue`;
    return { regle: 1, geste: 'plafonner', commentaire: TEXTE_PLAFOND, poser: 'à-reprendre', retirer: retirer('à-reprendre'), lignes: [ligne('auteur', REFUS), ligne('conducteur', texte), ligne('architecte', texte)] };
  }

  // Règle 2 — le dernier tour qui porte sur le contenu de la tête est validé.
  if (tourQuiJuge(lesTours, tete, memeContenu)?.etat === 'valide') return etiqueter(2, 'à-fusionner', `verdict écrit sur la PR ${numero} : validé${double}`);

  const surLaTete = dernier !== null && dernier.surLaTete;

  // Règle 3 — `à-fusionner` sans tour validé pour le contenu de la tête : par cause. Sur un tour refusé, elle
  // ne rend rien : la suite est celle de la règle 4.
  if (porte('à-fusionner')) {
    if (!surLaTete) return etiqueter(3, 'à-reprendre', `PR ${numero} : le contenu a changé depuis le verdict : redemander la relecture`);
    if (dernier.etat === 'en-cours') {
      const jamaisValide = !marques.verdicts.some((v) => v.tour === dernier.numero && dernier.sessions.includes(v.session) && v.verdict === 'validé' && v.sommet === dernier.sommet);
      const incomplet = Object.values(dernier.verdicts).some((v) => v.verdict === 'incomplet');
      const fait = jamaisValide ? 'étiquette `à-fusionner` posée sans relecture validée' : incomplet ? 'relecture incomplète' : 'une seconde relecture est exigée : règle passée à haute';
      return etiqueter(3, 'à-relire', `PR ${numero} : ${fait}`);
    }
  }

  // Règle 4 — le dernier tour porte sur le contenu de la tête et il est refusé : la reprise non comptée quand
  // chaque refus a un bloquant écarté plus récent que lui, et que la PR ne porte plus `à-fusionner`.
  if (surLaTete && dernier.etat === 'refuse') {
    const ecartes = dernier.refus.every((r) => marques.arbitragesEcartes.some((a) => a.rang > r.rang));
    return ecartes && !porte('à-fusionner') ? distribuer(4, MENTION_ARBITRAGE) : etiqueter(4, 'à-reprendre', REFUS);
  }

  // Règle 5 — le dernier tour porte sur le contenu de la tête et il est en cours.
  if (surLaTete && dernier.etat === 'en-cours') {
    const { numero: tour, sommet, sessions, distributions, verdicts } = dernier;
    const geste = (nom, plus) => ({ regle: 5, geste: nom, tour, sommet, sessions, ...plus });
    if (sessions.length < exiges) return geste('completer', { manque: exiges - sessions.length });
    const attendues = sessions.filter((s) => verdicts[s]?.verdict !== 'validé');
    const relance = (s) => distributions.findLast((d) => d.mention === 'relance' && d.cible === s) ?? null;
    const horsService = (s) => connues[s] === 'morte' || connues[s] === 'plafond';
    const aRelancer = attendues.find((s) => verdicts[s] !== undefined && relance(s) === null && !horsService(s));
    if (aRelancer !== undefined) return geste('reecrire', { session: aRelancer });
    // « Depuis » : la relance de la session, sinon la distribution qui l'a nommée la première dans ce tour.
    const depuis = (s) => Date.parse((relance(s) ?? distributions.find((d) => d.sessions.includes(s))).date);
    const panne = (s) => {
      if (horsService(s)) return connues[s];
      if (verdicts[s] !== undefined && verdicts[s].rang > relance(s).rang) return 'incomplet-deux-fois';
      return maintenant - depuis(s) > delaiMs ? 'muette' : null;
    };
    const enPanne = attendues.find((s) => panne(s) !== null);
    if (enPanne === undefined) return rien(5, 'attente', { attendues, echeance: Math.min(...attendues.map(depuis)) + delaiMs });
    if (!distributions.some((d) => d.mention === 'remplace')) return geste('remplacer', { session: enPanne, cause: panne(enPanne) });
    if (marques.pannes.some((p) => p.rang > distributions.at(-1).rang)) return rien(5, 'panne-signalee');
    const texte = `PR ${numero} : relecture en panne`;
    return geste('panne', { commentaire: TEXTE_PANNE, lignes: [ligne('architecte', texte), ligne('auteur', texte), ...(demande.conducteur === null ? [] : [ligne('conducteur', texte)])] });
  }

  // Règle 6 — la tête n'a pas de tour : un tour neuf.
  return distribuer(6, null);
}
