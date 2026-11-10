/**
 * Grammaire des identifiants (`docs/methode/nomenclature.md`, `ADR_ALL_ARC-1`), en un seul endroit :
 * tous les scripts de `scripts/docs/`, `scripts/verify/`, `scripts/agent/` et `scripts/chaine/`
 * l'importent d'ici, aucun n'écrit la grammaire de son côté.
 *
 *   <TYPE>_<CTX>_<TRI>-<n>         RULE_ALL_LIC-3 · SPEC_FNSMR_PAY-3 · ADR_ALL_ARC-11
 *   <TYPE>_<CTX>_<TRI>-<n>.<NN>    SPEC_FNSMR_PAY-3.02   (un ticket : sa spec, puis l'index)
 *
 *   TYPE  l'un des six : RULE, SPEC, ADR, DSG, DOC, REQ
 *   CTX   le contexte, `ALL` toujours écrit : [A-Z][A-Z0-9]*
 *   TRI   le sujet, 2 à 4 lettres majuscules
 *   n     la séquence, unique par type, contexte et trigramme ; un identifiant existant garde ses
 *         zéros de tête (`RULE_FNSMR_LIC-05`), et `05` se compte comme 5
 *   NN    l'index d'un ticket dans sa spec, deux chiffres
 *
 *   fichiers  RULE_<CTX>_<TRI>-<n>.md (sans slug) · SPEC_…-<slug>.spec.md, .map.md ·
 *             issues/SPEC_…-<slug>.<NN>.issue.md · ADR_…-<slug>.md, DSG_…, DOC_…, REQ_…
 *   branche   l'identifiant en minuscules, tirets bas et point devenus tirets : `spec-all-soc-1-03`
 *
 * L'ancienne forme (`SOC-1`, `ALL-FOF-12.03`) n'est lue nulle part ici : `migrer-tickets.mjs` seul
 * la connaît, pour la convertir.
 */

/** Les six types de la nomenclature. */
export const TYPES = ['RULE', 'SPEC', 'ADR', 'DSG', 'DOC', 'REQ'];
/** Contexte : `ALL`, `FNSMR`. */
export const CONTEXTE = '[A-Z][A-Z0-9]*';
/** Trigramme du sujet : `LIC`, `ARC`, `PLA`. */
export const TRIGRAMME = '[A-Z]{2,4}';

const SUITE = `${CONTEXTE}_${TRIGRAMME}-\\d+`;
/** Identifiant de n'importe quel type : `ADR_ALL_ARC-11`. */
export const IDENTIFIANT = `(?:${TYPES.join('|')})_${SUITE}`;
/** Identifiant de spec : `SPEC_ALL_SOC-1`. */
export const SPEC = `SPEC_${SUITE}`;
/** Identifiant de ticket : `SPEC_ALL_SOC-1.03`. */
export const TICKET = `${SPEC}\\.\\d{2}`;
/** Identifiant de règle : `RULE_ALL_LIC-3`, `RULE_FNSMR_LIC-05`. */
export const REGLE = `RULE_${SUITE}`;
/** Identifiant de demande : `REQ_ALL_LIC-7`. */
export const DEMANDE = `REQ_${SUITE}`;

const SLUG = '[a-z0-9-]+';
const IDENTIFIANT_RE = new RegExp(`^(${TYPES.join('|')})_(${CONTEXTE})_(${TRIGRAMME})-(\\d+)(?:\\.(\\d{2}))?$`);
const majuscules = (id) => String(id ?? '').toUpperCase();

/**
 * `RULE_FNSMR_LIC-05` → `{ type: 'RULE', contexte: 'FNSMR', trigramme: 'LIC', n: 5 }` ;
 * `SPEC_ALL_SOC-1.03` → `{ type: 'SPEC', contexte: 'ALL', trigramme: 'SOC', n: 1, index: '03' }`.
 * Seule une spec porte un index. Tout le reste (`LIC-3`, `SOC-1`, `SPEC_SOC-1`) → `null`.
 */
export function lireIdentifiant(id) {
  const m = IDENTIFIANT_RE.exec(majuscules(id));
  if (!m || (m[5] !== undefined && m[1] !== 'SPEC')) return null;
  const lu = { type: m[1], contexte: m[2], trigramme: m[3], n: Number(m[4]) };
  if (m[5] !== undefined) lu.index = m[5];
  return lu;
}

/** `SPEC_ALL_SOC-1.03` → `{ spec: 'SPEC_ALL_SOC-1', index: '03' }`, sinon `null`. */
export function lireTicket(id) {
  const lu = lireIdentifiant(id);
  if (!lu || lu.index === undefined) return null;
  return { spec: majuscules(id).slice(0, -3), index: lu.index };
}

/** `SPEC_ALL_SOC-1` → vrai ; un ticket, une règle ou une ancienne forme → faux. */
export function estSpec(id) {
  const lu = lireIdentifiant(id);
  return lu?.type === 'SPEC' && lu.index === undefined;
}

/** `ALL` → `all` : le dossier d'un contexte s'écrit en minuscules. */
export const dossierDuContexte = (contexte) => String(contexte).toLowerCase();

/**
 * Identifiant en tête d'un nom de fichier, quel que soit le type, suivi du slug ou de l'extension :
 * `ADR_ALL_ARC-1-identifiants.md` → `ADR_ALL_ARC-1`, `RULE_ALL_LIC-3.md` → `RULE_ALL_LIC-3`,
 * `SPEC_ALL_SOC-1-socle.03.issue.md` → `SPEC_ALL_SOC-1` (la spec du ticket). Sinon `null`.
 */
export function identifiantDuFichier(nomDeFichier) {
  return new RegExp(`^(${IDENTIFIANT})(?=[-.])`).exec(nomDeFichier ?? '')?.[1] ?? null;
}

/** Nom de fichier d'un ticket : `SPEC_ALL_SOC-1-socle.03.issue.md` → `SPEC_ALL_SOC-1.03`, sinon `null`. */
export function identifiantDuTicket(nomDeFichier) {
  const m = new RegExp(`^(${SPEC})-${SLUG}\\.(\\d{2})\\.issue\\.md$`).exec(nomDeFichier ?? '');
  return m ? `${m[1]}.${m[2]}` : null;
}

/** Nom de fichier d'une spec : `SPEC_ALL_SOC-1-socle.spec.md` → `SPEC_ALL_SOC-1`, sinon `null`. */
export function identifiantDeLaSpec(nomDeFichier) {
  return new RegExp(`^(${SPEC})-${SLUG}\\.spec\\.md$`).exec(nomDeFichier ?? '')?.[1] ?? null;
}

/** Spec portée par un nom de fichier de ticket : `SPEC_ALL_SOC-1-socle.03.issue.md` → `SPEC_ALL_SOC-1`. */
export function specDuTicket(nomDeFichier) {
  return identifiantDuTicket(nomDeFichier)?.slice(0, -3) ?? null;
}

/** Nom de fichier d'une règle, sans slug : `RULE_ALL_LIC-3.md` → `RULE_ALL_LIC-3`, sinon `null`. */
export function identifiantDeLaRegle(nomDeFichier) {
  return new RegExp(`^(${REGLE})\\.md$`).exec(nomDeFichier ?? '')?.[1] ?? null;
}

/** Nom de fichier d'une demande : `REQ_ALL_LIC-7-licence-famille.md` → `REQ_ALL_LIC-7`, sinon `null`. */
export function identifiantDeLaDemande(nomDeFichier) {
  return new RegExp(`^(${DEMANDE})-${SLUG}\\.md$`).exec(nomDeFichier ?? '')?.[1] ?? null;
}

/** `SPEC_ALL_SOC-1.03` → `spec-all-soc-1-03`, tel qu'il apparaît dans un nom de branche. */
export const slug = (id) => String(id).replace(/[_.]/g, '-').toLowerCase();

const SLUG_DE_TICKET = new RegExp(`(?:^|/)spec-([a-z][a-z0-9]*)-([a-z]{2,4})-(\\d+)-(\\d{2})(?:-|$)`);

/**
 * Ticket porté par une branche de travail, l'inverse de `slug` : `feat/spec-all-soc-1-03-couche`
 * → `SPEC_ALL_SOC-1.03`. Branche de sujet, sans ticket ou détachée (`HEAD`) → `null`.
 */
export function identifiantDeBranche(branche) {
  const b = branche ?? '';
  const m = SLUG_DE_TICKET.exec(b);
  if (!m || b.startsWith('sujet/')) return null;
  return `SPEC_${m[1].toUpperCase()}_${m[2].toUpperCase()}-${m[3]}.${m[4]}`;
}

/**
 * Un texte devient un motif littéral : ses caractères spéciaux d'expression régulière sont échappés.
 * Tout motif construit depuis un identifiant reçu (argument de commande, nom de branche) passe par
 * ici, même quand la grammaire l'a déjà validé : une fonction appelée sans validation ne construit
 * jamais un motif plus large que son argument.
 */
export const litteral = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** La branche porte-t-elle le slug de cet identifiant (`feat/spec-all-soc-1-03-x` pour `SPEC_ALL_SOC-1.03`) ? */
export function branchePorte(branche, id) {
  return new RegExp(`(^|[/-])${litteral(slug(id))}(-|$)`).test(branche ?? '');
}

/**
 * Le texte cite-t-il cet identifiant, bordé ? `SPEC_ALL_SOC-1.01` n'est pas cité par
 * `SPEC_ALL_SOC-1.010`, ni la spec `SPEC_ALL_SOC-1` par son ticket `SPEC_ALL_SOC-1.03` ; un point de
 * fin de phrase après l'identifiant ne l'empêche pas d'être cité.
 */
export function texteCite(texte, id) {
  return new RegExp(`(?<![\\w.-])${litteral(majuscules(id))}(?!\\w|\\.\\d)`, 'i').test(texte ?? '');
}

/** Motif « identifiant de ticket dans un texte libre », bordé. */
export const TICKET_DANS_TEXTE = new RegExp(`\\b${TICKET}\\b`, 'g');

/** Tickets cités dans un texte libre, par leur identifiant complet, dans l'ordre et sans doublon. */
export function ticketsCites(texte) {
  return [...new Set((texte ?? '').match(TICKET_DANS_TEXTE) ?? [])];
}

/**
 * Identifiants cités dans un texte libre, tous types, tickets compris, sans doublon :
 * `SPEC_ALL_SOC-1.06` y est un ticket, jamais la spec `SPEC_ALL_SOC-1`.
 */
export function identifiantsCites(texte) {
  const motif = new RegExp(`\\b(?:${TICKET}|${IDENTIFIANT})\\b`, 'g');
  return [...new Set((texte ?? '').match(motif) ?? [])];
}

/**
 * Ticket d'une PR : celui que son titre cite (`feat(api): couche (SPEC_ALL_SOC-1.03)`), sinon celui
 * que sa branche porte. `null` quand ni l'un ni l'autre n'en nomme.
 */
export function ticketDeLaPr(titre, branche) {
  return ticketsCites(titre)[0] ?? identifiantDeBranche(branche);
}

/** Motif des fichiers de ticket d'une spec donnée, dans un chemin : `.../SPEC_ALL_SOC-1-<slug>.<NN>.issue.md`. */
export const fichiersDeLaSpec = (spec) => new RegExp(`/${litteral(spec)}-${SLUG}\\.\\d{2}\\.issue\\.md$`);

/** Motif du fichier d'un ticket donné, dans un chemin, archive comprise. */
export function fichierDuTicket(id) {
  const t = lireTicket(id);
  return t ? new RegExp(`/${litteral(t.spec)}-${SLUG}\\.${litteral(t.index)}\\.issue\\.md$`) : null;
}

/** Un ticket rangé dans `issues/archive/` est sorti du chemin des gates et de la réservation. */
export const estArchive = (chemin) => /\/issues\/archive\//.test(chemin);
