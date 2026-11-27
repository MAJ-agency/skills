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
//   - la trace d'illisible : première ligne `Lecture illisible — <cause>` ;
//   - la note de même contenu : `Même contenu — sommet <tête> — tour <k> <validé|refusé> au sommet <sha> — <raison>`,
//     sur une ligne, écrite quand « même contenu propre » garde le verdict ou le refus d'un tour au sommet d'avant (A-224) ;
//   - la trace d'une demande écartée : `Demande écartée — commentaire <id> modifié après sa création : redemander la
//     relecture d'un commentaire neuf, jamais modifié`, lue parmi les commentaires intacts d'un compte qui compte (A-228).
// Hors de `dernier` vivent la trace d'illisible et deux traces à règles opposées, qui ne sont pas des marques qui
// décident : elles ne changent ni la ligne qui repart à la pose d'une étiquette, ni « déjà signalé ». La note de même
// contenu, dont la forme abîmée est une lecture illisible (un verdict gardé ne disparaît pas sans bruit) ; la trace
// `Demande écartée — `, dont la forme abîmée est ignorée (elle ne fait que taire un signal déjà donné).
// Un commentaire qui porte le préfixe d'une marque sans en avoir la forme n'est jamais ignoré : c'est une
// lecture illisible, sauf la trace `Demande écartée — `, ignorée (A-228). « Plus récent » veut dire « de rang supérieur dans le tableau reçu » ; les dates ne
// servent qu'aux délais, comparées à `maintenant`, la seule source de temps.
//
// Un commentaire modifié après sa création est écarté, à trois exceptions près (A-118).
//   - Un verdict modifié ne peut qu'aggraver ou laisser, jamais adoucir. Quand le verdict le plus récent d'une
//     session pour un tour a été modifié, sa lecture pour ce tour dépend de son verdict intact le plus récent
//     pour ce tour : `refusé`, le refus tient ; `validé` ou `incomplet`, la lecture est `incomplet` ; aucun, le
//     verdict modifié reste écarté et la session est attendue.
//   - Un verdict d'un compte qui compte que rien ne rattache (`Tour:` ou `Session:` illisible), intact ou
//     modifié, plus récent que la dernière distribution du dernier tour, est une lecture illisible : un refus
//     abîmé ne disparaît pas sans bruit. Plus ancien que cette distribution, il reste écarté.
//   - Une demande `À relire` modifiée, d'un compte qui compte, reste écartée : elle ne fixe ni la décision ni les
//     destinataires des autres lignes ; ses lignes `Session:` et `Conducteur:` ne servent qu'à dire l'écart, par le geste
//     `signaler`, quand elle est plus récente que la dernière demande intacte et qu'aucune trace ne nomme encore son
//     commentaire (A-227, A-228). Un commentaire sans identifiant entier ne se signale pas : sa trace ne se relirait
//     pas, et le geste reviendrait à chaque passe.
// Les tables indexées par une clé venue de l'entrée (session, sommet) ne lisent jamais une clé héritée.
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
export const PREFIXE_NOTE = 'Même contenu — ';

const SHA = '[0-9a-f]{40}';
const ID = '[A-Za-z0-9][A-Za-z0-9_-]*';
const FORME_SHA = new RegExp(`^${SHA}$`);
const FORME_DISTRIBUTION = new RegExp(`^Relecture — tour ([1-9][0-9]*) — sommet (${SHA}) — sessions (${ID}(?:, ${ID})*)(?: \\((?:(remplace|relance) (${ID})|(complète|${MENTION_ARBITRAGE}))\\))?$`);
const FORME_DEMANDE = new RegExp(`^À relire — sommet (${SHA}) — Session: (${ID}|—) — Conducteur: (${ID}|—)$`);
const FORME_DECISION = /^Décision de plafond — \S/;
const FORME_ECART = /^Demande écartée — commentaire ([1-9][0-9]*) modifié après sa création : redemander la relecture d'un commentaire neuf, jamais modifié$/;
export const PREFIXE_ECART = 'Demande écartée — ';
const FORME_NOTE = new RegExp(`^Même contenu — sommet (${SHA}) — tour ([1-9][0-9]*) (validé|refusé) au sommet (${SHA}) — (\\S.*)$`);
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

/**
 * La note de même contenu (A-224) : le tour gardé, son sommet, son verdict, la tête pour laquelle il vaut, et la
 * raison du calcul « même contenu propre ».
 * @param {{ tete: string, tour: number, verdict: 'validé'|'refusé', sommet: string, raison: string }} n
 * @returns {string}  le corps du commentaire, sur une ligne
 * @throws {TypeError}  quand ce qu'il écrirait ne se relit pas par sa forme (une raison vide, sur deux lignes ou à
 *   blancs de bord, un sommet mal formé)
 */
export function ecrireNote(n) {
  if (n === null || typeof n !== 'object') throw new TypeError('note : un objet est attendu');
  const texte = `${PREFIXE_NOTE}sommet ${n.tete}${TIRET}tour ${n.tour} ${n.verdict} au sommet ${n.sommet}${TIRET}${n.raison}`;
  const m = FORME_NOTE.exec(texte);
  const meme = m !== null && m[1] === n.tete && Number(m[2]) === n.tour && Number.isSafeInteger(n.tour) && m[3] === n.verdict && m[4] === n.sommet && m[5] === n.raison && n.raison === String(n.raison).trim();
  if (!meme) throw new TypeError(`note hors de la forme : ${texte}`);
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
// Les traces hors de `dernier` à forme abîmée illisible : le préfixe sans la forme entre dans `presque`.
const TRACES_ILLISIBLES = [PREFIXE_TRACE, PREFIXE_NOTE];

/**
 * Les commentaires à marque d'une PR, chacun avec `{ id, rang, date }` du commentaire, dans l'ordre reçu.
 * @param {import('./verdict.mjs').Commentaire[]} commentaires  TOUS les commentaires de la PR, dans l'ordre de création
 * @param {{ tolerant?: boolean }} [options]  `tolerant` : les marques presque à la forme sont rendues dans
 *   `presque` au lieu de lever
 * @returns {{ verdicts: object[], verdictsModifies: { id, rang, date, tour: number, session: string }[], distributions: object[],
 *             demandes: { id, rang, date, sommet: string, auteur: string|null, conducteur: string|null }[],
 *             plafonds: object[], decisions: object[], arbitragesEcartes: object[], pannes: object[],
 *             illisibles: { id, rang, date, texte: string }[],
 *             notes: { id, rang, date, tete: string, tour: number, verdict: 'validé'|'refusé', sommet: string }[],
 *             demandesModifiees: { id, rang, date, auteur: string|null, conducteur: string|null, lisible: boolean }[],
 *             ecarts: { id, rang, date, commentaire: string }[],
 *             presque: { id, rang, date, prefixe: string }[],
 *             dernier: number }}
 *   `verdictsModifies` : les verdicts d'un compte qui compte, modifiés après leur création, dont `Tour:` et
 *   `Session:` se lisent encore : ils ne valent aucun verdict, mais empêchent un `validé` plus ancien de la même
 *   session de valoir à leur place (A-118) ; `presque` porte aussi, avec `verdict: true`, les verdicts que rien
 *   ne rattache, plus récents que la dernière distribution du dernier tour ; `arbitragesEcartes` : un par commentaire qui écarte au moins un bloquant ; `illisibles` : les traces,
 *   `texte` leur première ligne ; `notes` : les notes de même contenu à la forme (A-224) ; `presque` : vide hors
 *   `tolerant` ; `demandesModifiees` : les demandes `À relire` d'un compte qui compte, modifiées après leur création,
 *   `lisible` vrai quand le corps a la forme de la demande (A-227) ; `ecarts` : les traces `Demande écartée — ` à la
 *   forme, intactes, d'un compte qui compte, `commentaire` l'identifiant qu'elles nomment (A-228) ; `dernier` : le rang
 *   du plus récent commentaire à marque ou presque à la forme, traces d'illisible, notes et traces d'écart exclues, -1
 *   s'il n'y en a pas.
 * @throws {LectureIllisible}  commentaires que `retenir` ne lit pas ; et, hors `tolerant`, toute marque
 *   presque à la forme
 */
export function lireMarques(commentaires, options = {}) {
  const m = { verdicts: [], verdictsModifies: [], distributions: [], demandes: [], plafonds: [], decisions: [], arbitragesEcartes: [], pannes: [], illisibles: [], notes: [], demandesModifiees: [], ecarts: [], presque: [], dernier: -1 };
  const { retenus, ecartes } = retenir(commentaires);
  const presque = [];
  // Les verdicts d'un compte qui compte que rien ne rattache : `Tour:` ou `Session:` ne se lit pas.
  const perdus = [];
  for (const { id, rang, motif, corps } of ecartes) {
    const date = commentaires[rang].created_at;
    // Une demande modifiée : écartée, ses lignes ne servent qu'à dire l'écart (A-227).
    if (motif === 'edite' && corps.startsWith('À relire — ')) {
      const d = FORME_DEMANDE.exec(corps);
      m.demandesModifiees.push({ id, rang, date, auteur: d && d[2] !== '—' ? d[2] : null, conducteur: d && d[3] !== '—' ? d[3] : null, lisible: d !== null });
      continue;
    }
    const v = motif === 'edite' ? lireVerdict(corps) : null;
    if (v === null) continue;
    if (v.tour !== null && v.session !== null) m.verdictsModifies.push({ id, rang, date, tour: v.tour, session: v.session });
    else perdus.push({ id, rang, date, modifie: true });
  }
  for (const { id, rang, date, corps } of retenus) {
    const place = { id, rang, date };
    const v = lireVerdict(corps);
    if (v !== null) {
      // Un verdict que rien ne rattache (Tour ou Session illisible) est écarté, mais reste un commentaire à marque.
      if (v.tour !== null && v.session !== null) m.verdicts.push({ ...place, ...v });
      else perdus.push({ ...place, modifie: false });
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
    // La trace d'un écart : à la forme, elle tait le signal ; sans la forme, elle est ignorée, jamais illisible (A-228).
    if (corps.startsWith(PREFIXE_ECART)) {
      const e = FORME_ECART.exec(corps);
      if (e !== null) m.ecarts.push({ ...place, commentaire: e[1] });
      continue;
    }
    const note = FORME_NOTE.exec(corps);
    if (note !== null && Number.isSafeInteger(Number(note[2]))) {
      m.notes.push({ ...place, tete: note[1], tour: Number(note[2]), verdict: note[3], sommet: note[4] });
      continue;
    }
    const trace = TRACES_ILLISIBLES.find((t) => corps.startsWith(t));
    const marque = trace !== undefined ? { prefixe: trace, lire: () => null } : MARQUES.find((q) => corps.startsWith(q.prefixe));
    if (marque === undefined) continue;
    m.dernier = rang;
    const lu = marque.lire(corps);
    if (lu) for (const [liste, valeur] of Object.entries(lu)) m[liste].push({ ...valeur, ...place });
    else presque.push({ ...place, prefixe: marque.prefixe.trimEnd() });
  }
  // Un verdict perdu plus récent que la dernière distribution du dernier tour : illisible, jamais écarté en silence.
  const distribuee = distributionsParTour(m).at(-1)?.[1].at(-1).rang ?? Infinity;
  for (const { id, rang, date, modifie } of perdus) {
    if (rang < distribuee) continue;
    presque.push({ id, rang, date, prefixe: 'verdict', verdict: true });
    if (modifie) m.dernier = Math.max(m.dernier, rang);
  }
  presque.sort((a, b) => a.rang - b.rang);
  if (presque.length > 0 && !options.tolerant) throw new LectureIllisible(causePresque(presque[0]));
  m.presque = presque;
  return m;
}

const causePresque = ({ id, rang, prefixe, verdict = false }) =>
  `commentaire ${id ?? `de rang ${rang}`} : ${verdict ? 'verdict que rien ne rattache à un tour et à une session' : `préfixe « ${prefixe} » sans la forme de sa marque`}`;
// La valeur d'une table reçue pour une clé venue de l'entrée, jamais une clé héritée.
const propre = (table, cle) => (Object.hasOwn(table, cle) ? table[cle] : undefined);
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
    // Le verdict tel que le tour le compte. Un `refusé` lisible compte `refusé`, toujours : un refus ne compte
    // jamais moins qu'un refus. Un autre verdict se lit `incomplet` s'il est illisible, s'il a relu un autre
    // sommet, ou si la PR est sensible sans `/security-review: lancée`.
    const compter = (v) => ({ ...v, verdict: v.verdict !== 'refusé' && (v.illisible || v.sommet !== sommet || (sensible && v.securite !== 'lancée')) ? 'incomplet' : v.verdict });
    // Le dernier verdict d'une session pour ce tour, écrit après la distribution qui l'a nommée la première.
    const dernierVerdict = (session) => {
      const nommee = distributions.find((d) => d.sessions.includes(session)).rang;
      const duTour = (x) => x.tour === numero && x.session === session && x.rang > nommee && x.rang < cloture;
      const v = marques.verdicts.findLast(duTour);
      if (v === undefined) return null;
      const compte = compter(v);
      // Un verdict plus récent de la session, modifié après coup, ne peut qu'aggraver ou laisser (A-118) : le
      // refus d'avant tient ; un `validé` ou un `incomplet` d'avant se lit `incomplet`, sans rien de l'ancien.
      const modifie = marques.verdictsModifies.findLast((x) => duTour(x) && x.rang > v.rang);
      if (modifie === undefined || compte.verdict === 'refusé') return compte;
      return { ...modifie, verdict: 'incomplet', sommet: null, bloquants: null, securite: null, illisible: true, defauts: ['verdict plus récent de la session modifié après sa création'] };
    };
    const verdicts = Object.create(null);
    for (const s of sessions) {
      const v = dernierVerdict(s);
      if (v !== null) verdicts[s] = v;
    }
    // Tout `refusé` d'une session distribuée pour ce tour compte contre lui, remplacée ou non.
    const refus = [...new Set(distributions.flatMap((d) => d.sessions))].map(dernierVerdict).filter((v) => v !== null && v.verdict === 'refusé');
    const surLaTete = sommet === tete || propre(memeContenu, sommet) === true;
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
    if (t.sommet === tete || propre(memeContenu, t.sommet) === true) return t;
    if (propre(memeContenu, t.sommet) !== false) return null;
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
  const sommet = distributionsParTour(marques).map(([, ds]) => ds[0].sommet).find((s) => s !== tete && propre(memeContenu, s) === ILLISIBLE);
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

const ETATS_DE_SESSION = ['vivante', 'morte', 'plafond', 'couple'];

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
 * @property {Record<string, 'vivante'|'morte'|'plafond'|'couple'>} [sessions]  l'état des sessions, quand il est connu ;
 *   `couple` : la session tourne à un autre modèle ou un autre effort que ceux que la PR demande (A-182) : hors
 *   service comme `morte` ou `plafond`, elle est remplacée, une fois par tour, cause `couple`
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

  // La demande modifiée, avant toute règle : la trace et une ligne à qui l'a écrite, une fois par commentaire (A-228).
  const modifiee = marques.demandesModifiees.at(-1);
  const intacte = marques.demandes.at(-1)?.rang ?? -1;
  if (modifiee !== undefined && modifiee.rang > intacte && /^[1-9][0-9]*$/.test(String(modifiee.id)) && !marques.ecarts.some((e) => e.commentaire === String(modifiee.id))) {
    const texte = `PR ${numero} : demande de relecture écartée (commentaire ${modifiee.id} modifié après sa création) : en écrire une neuve, jamais modifiée`;
    const vers = ['auteur', 'conducteur'].filter((a) => modifiee[a] !== null).map((a) => ({ a, session: modifiee[a], texte }));
    const commentaire = `${PREFIXE_ECART}commentaire ${modifiee.id} modifié après sa création : redemander la relecture d'un commentaire neuf, jamais modifié`;
    return { regle: null, geste: 'signaler', commentaire, lignes: vers.length > 0 ? vers : [{ a: 'architecte', session: null, texte }] };
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
  // La note de même contenu (A-224, A-239 (1)) : le tour qui juge porte sur un autre sommet que la tête, et aucune
  // note ne porte encore cette tête et ce tour. `null` sinon.
  const aNoter = (t, mot) => (t.sommet !== tete && !marques.notes.some((x) => x.tete === tete && x.tour === t.numero) ? { tour: t.numero, sommet: t.sommet, verdict: mot } : null);
  const avecNote = (geste, note) => (note === null || geste.geste !== 'etiqueter' ? geste : { ...geste, note });

  // Règle 1 — le plafond, et là seulement : une décision attendue ; sinon trois tours comptés ou plus.
  const plafond = marques.plafonds.at(-1)?.rang ?? -1;
  if (plafond > (marques.decisions.at(-1)?.rang ?? -1)) return etiqueter(1, 'à-reprendre', `PR ${numero} : décision de plafond attendue`);
  if (lesTours.filter((t) => t.compte).length >= PLAFOND) {
    const texte = `PR ${numero} : plafond atteint au troisième tour refusé, décision attendue`;
    return { regle: 1, geste: 'plafonner', commentaire: TEXTE_PLAFOND, poser: 'à-reprendre', retirer: retirer('à-reprendre'), lignes: [ligne('auteur', REFUS), ligne('conducteur', texte), ligne('architecte', texte)] };
  }

  // Règle 2 — le dernier tour qui porte sur le contenu de la tête est validé.
  const juge = tourQuiJuge(lesTours, tete, memeContenu);
  if (juge?.etat === 'valide') {
    const note = aNoter(juge, 'validé');
    const geste = etiqueter(2, 'à-fusionner', `verdict écrit sur la PR ${numero} : validé${double}`);
    // L'étiquette déjà en place : la note seule, aucune étiquette, aucune ligne (`noter`, règle 2 seulement).
    if (note !== null && geste.geste === 'rien') return { regle: 2, geste: 'noter', note, lignes: [] };
    return avecNote(geste, note);
  }

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
    return ecartes && !porte('à-fusionner') ? distribuer(4, MENTION_ARBITRAGE) : avecNote(etiqueter(4, 'à-reprendre', REFUS), aNoter(dernier, 'refusé'));
  }

  // Règle 5 — le dernier tour porte sur le contenu de la tête et il est en cours.
  if (surLaTete && dernier.etat === 'en-cours') {
    const { numero: tour, sommet, sessions, distributions, verdicts } = dernier;
    const geste = (nom, plus) => ({ regle: 5, geste: nom, tour, sommet, sessions, ...plus });
    if (sessions.length < exiges) return geste('completer', { manque: exiges - sessions.length });
    const attendues = sessions.filter((s) => verdicts[s]?.verdict !== 'validé');
    const relance = (s) => distributions.findLast((d) => d.mention === 'relance' && d.cible === s) ?? null;
    // Hors service : morte, au plafond de contexte, ou à un autre couple que celui de la PR (A-182, point 2).
    const horsService = (s) => ['morte', 'plafond', 'couple'].includes(propre(connues, s));
    const aRelancer = attendues.find((s) => verdicts[s] !== undefined && relance(s) === null && !horsService(s));
    if (aRelancer !== undefined) return geste('reecrire', { session: aRelancer });
    // « Depuis » : la relance de la session, sinon la distribution qui l'a nommée la première dans ce tour.
    const depuis = (s) => Date.parse((relance(s) ?? distributions.find((d) => d.sessions.includes(s))).date);
    const panne = (s) => {
      if (horsService(s)) return propre(connues, s);
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
