/**
 * Identifiants de la convention des tickets (skill `tickets`), en un seul endroit : tous les scripts
 * de `scripts/docs/` et `scripts/verify/` les importent d'ici.
 *
 *   spec    <PRÉFIXE>-<n>            PRÉFIXE = un ou plusieurs segments majuscules : `SOC`, `ALL-FOF`
 *   ticket  <PRÉFIXE>-<n>.<NN>       NN sur deux chiffres, index dans la spec
 *   fichier <PRÉFIXE>-<n>-<slug>.spec.md · issues/<PRÉFIXE>-<n>-<slug>.<NN>.issue.md
 *
 * `n` est unique par préfixe, tous dossiers confondus, sans zéro de tête (`ARC-1` du socle).
 */

/** Préfixe d'un identifiant : `SOC`, `ALL-FOF`, `FFSA-LIC`. */
export const PREFIXE = '[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*';
/** Identifiant de spec : `SOC-1`, `ALL-FOF-12`. */
export const SPEC = `${PREFIXE}-\\d+`;
/** Identifiant de ticket : `SOC-1.03`. */
export const TICKET = `${SPEC}\\.\\d{2}`;

const SPEC_RE = new RegExp(`^(${SPEC})$`);
const TICKET_RE = new RegExp(`^(${SPEC})\\.(\\d{2})$`);

/** `SOC-1.03` → `{ spec: 'SOC-1', index: '03' }`, sinon `null`. */
export function lireTicket(id) {
  const m = TICKET_RE.exec((id ?? '').toUpperCase());
  return m ? { spec: m[1], index: m[2] } : null;
}

/** `SOC-1` → vrai. */
export const estSpec = (id) => SPEC_RE.test((id ?? '').toUpperCase());

/** `SOC-1` → `{ prefixe: 'SOC', n: 1 }`. */
export function lireSpec(id) {
  const m = new RegExp(`^(${PREFIXE})-(\\d+)$`).exec((id ?? '').toUpperCase());
  return m ? { prefixe: m[1], n: Number(m[2]) } : null;
}

/** Nom de fichier d'un ticket : `SOC-1-socle.03.issue.md` → `SOC-1.03`, sinon `null`. */
export function identifiantDuTicket(nomDeFichier) {
  const m = new RegExp(`^(${SPEC})-[a-z0-9-]+\\.(\\d{2})\\.issue\\.md$`).exec(nomDeFichier);
  return m ? `${m[1]}.${m[2]}` : null;
}

/** Nom de fichier d'une spec : `SOC-1-socle.spec.md` → `SOC-1`, sinon `null`. */
export function identifiantDeLaSpec(nomDeFichier) {
  const m = new RegExp(`^(${SPEC})-[a-z0-9-]+\\.spec\\.md$`).exec(nomDeFichier);
  return m ? m[1] : null;
}

/** Identifiant de spec porté par un nom de fichier de ticket : `SOC-1-socle.03.issue.md` → `SOC-1`. */
export function specDuTicket(nomDeFichier) {
  return identifiantDuTicket(nomDeFichier)?.replace(/\.\d{2}$/, '') ?? null;
}

/** `SOC-1.03` → `soc-1-03`, tel qu'il apparaît dans un nom de branche. */
export const slug = (id) => id.replace('.', '-').toLowerCase();

/** Motif « identifiant de ticket dans un texte libre », bordé. */
export const TICKET_DANS_TEXTE = new RegExp(`\\b${TICKET}\\b`, 'g');

/** Motif d'un fichier de ticket d'une spec donnée, dans un chemin : `.../SOC-1-<slug>.<NN>.issue.md`. */
export const fichiersDeLaSpec = (spec) => new RegExp(`/${spec}-[a-z0-9-]+\\.\\d{2}\\.issue\\.md$`);

/** Un ticket rangé dans `issues/archive/` est sorti du chemin des gates et de la réservation. */
export const estArchive = (chemin) => /\/issues\/archive\//.test(chemin);
