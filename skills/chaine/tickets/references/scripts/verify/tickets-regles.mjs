/**
 * Règles pures du gate `tickets` : lues par `tickets.mjs`, testées par `tickets.test.mjs`.
 * Aucune lecture de fichier ici : on reçoit le texte d'un ticket.
 *
 * Vocabulaire de `Status:` : `docs/agents/triage-labels.md`. Format « prêt pour agent » :
 * `docs/agents/chaine-de-production.md` § 3. Tout changement passe d'abord par ces fichiers.
 */
import { TICKET, identifiantDeLaSpec, identifiantDuTicket, estArchive } from '../docs/identifiants.mjs';

export { identifiantDuTicket as identifiant, estArchive };

/** Ligne d'en-tête, sous ses trois formes : `X:`, `**X:**`, `- X:`. */
const enTete = (nom) => new RegExp(`^(?:- )?\\**${nom}\\**\\s*:\\**\\s*(.*)$`, 'i');

const STATUS = enTete('Status');
const BLOCKED_BY = enTete('Blocked by');
const SUJET = /^Sujet\s*:\s*(.*)$/;
const MODELE = /^Modèle\s*:\s*(.*)$/;

export const VOCABULAIRE = ['needs-triage', 'needs-info', 'ready-for-agent', 'ready-for-human', 'wontfix', 'en cours — <branche>', 'Fait — PR #<n>'];

export const SECTIONS_PRET = ['Où', 'Décisions', 'Surfaces', 'Vérification'];

/**
 * Identifiants de spec portés par plus d'une spec `*.spec.md`, ou par des tickets `*.NN.issue.md`
 * de noms différents. Reçoit des chemins `docs/**` suivis par git ; les cartes `*.map.md` et
 * analyses `*.analyse.md` peuvent porter un autre nom que leur spec. Rend `[{ id, fichiers }]`.
 */
export function identifiantsEnDouble(chemins) {
  const parId = new Map();
  for (const chemin of chemins) {
    const nom = chemin.split('/').pop();
    const spec = identifiantDeLaSpec(nom);
    const ticket = identifiantDuTicket(nom);
    const id = spec ?? ticket?.replace(/\.\d{2}$/, '');
    if (!id) continue;
    // Un ticket se range sous son nom de spec : plusieurs tickets d'une même spec sont normaux.
    const cle = spec ? nom : nom.replace(/\.\d{2}\.issue\.md$/, '.spec.md');
    const noms = parId.get(id) ?? new Map();
    noms.set(cle, [...(noms.get(cle) ?? []), chemin]);
    parId.set(id, noms);
  }
  return [...parId]
    .filter(([, noms]) => noms.size > 1)
    .map(([id, noms]) => ({ id, fichiers: [...noms.values()].flat().sort() }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function chercher(lignes, motif) {
  for (let i = 0; i < lignes.length; i++) {
    const m = motif.exec(lignes[i]);
    if (m) return { valeur: m[1].trim(), ligne: i + 1 };
  }
  return null;
}

export function statusValide(valeur) {
  return (
    /^(needs-triage|needs-info|ready-for-agent|ready-for-human|wontfix)(\s+—\s+\S.*)?$/.test(valeur) ||
    /^en cours — \S+/.test(valeur) ||
    /^Fait — PR #\d+/.test(valeur)
  );
}

/**
 * Tickets cités par une ligne `Blocked by:`. Un identifiant complet (`SOC-1.01`) partout dans la
 * ligne ; un numéro court (`01`, `.03`) seulement en liste de tête (`01, 03 (raison)`), relatif à la
 * spec du ticket. Le texte libre qui suit n'est pas lu.
 */
export function ticketsCites(valeur, idDuTicket) {
  const cites = new Set(valeur.match(new RegExp(`\\b${TICKET}\\b`, 'g')) ?? []);
  const tete = /^\.?\d{2}(?:\s*,\s*\.?\d{2})*(?![\w.])/.exec(valeur);
  if (tete && idDuTicket) {
    const spec = idDuTicket.replace(/\.\d{2}$/, '');
    for (const n of tete[0].split(',')) cites.add(`${spec}.${n.trim().replace(/^\./, '')}`);
  }
  return [...cites];
}

/** Corps de chaque section `## Titre` (jusqu'à la suivante), sans les lignes vides. */
function sections(lignes) {
  const corps = new Map();
  let courante = null;
  for (const l of lignes) {
    const m = /^## (.+?)\s*$/.exec(l);
    if (m) {
      courante = m[1];
      corps.set(courante, []);
    } else if (courante && l.trim() !== '') corps.get(courante).push(l);
  }
  return corps;
}

/** Écarts de format « prêt pour agent » ; vide si le ticket est conforme. */
export function ecartsFormatPret(texte) {
  const lignes = texte.split('\n');
  const ecarts = [];
  const modele = chercher(lignes, MODELE);
  if (!modele || !/^(sonnet|opus|haiku)\b/.test(modele.valeur)) ecarts.push('ligne `Modèle: sonnet|opus` (avec la raison pour opus) absente');
  const corps = sections(lignes);
  for (const s of SECTIONS_PRET) {
    if (!corps.has(s)) ecarts.push(`section \`## ${s}\` absente`);
    else if (corps.get(s).length === 0) ecarts.push(`section \`## ${s}\` vide`);
  }
  return ecarts;
}

/**
 * Contrôle d'un ticket. `existe(id)` dit si un ticket du dépôt porte cet identifiant ;
 * `gele` : ticket prêt d'avant l'allumage, dispensé du format (dette).
 */
export function controlerTicket({ nom, texte, existe, gele = false }) {
  const lignes = texte.split('\n');
  const id = identifiantDuTicket(nom);
  const erreurs = [];
  const status = chercher(lignes, STATUS);
  if (!status) erreurs.push({ ligne: 1, message: `ligne \`Status:\` absente (attendu : ${VOCABULAIRE.join(', ')})` });
  else if (!statusValide(status.valeur))
    erreurs.push({ ligne: status.ligne, message: `Status « ${status.valeur} » hors vocabulaire (attendu : ${VOCABULAIRE.join(', ')})` });
  const bloque = chercher(lignes, BLOCKED_BY);
  if (bloque) {
    for (const cite of ticketsCites(bloque.valeur, id)) {
      if (!existe(cite)) erreurs.push({ ligne: bloque.ligne, message: `Blocked by cite ${cite}, qui n'existe pas` });
    }
  }
  const sujet = chercher(lignes, SUJET);
  if (sujet && !/^sujet\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\s|$)/.test(sujet.valeur))
    erreurs.push({ ligne: sujet.ligne, message: `Sujet « ${sujet.valeur} » : attendu \`sujet/<nom-en-kebab>\`` });
  const pret = status?.valeur === 'ready-for-agent';
  if (pret && !gele) {
    for (const e of ecartsFormatPret(texte))
      erreurs.push({ ligne: status.ligne, message: `ready-for-agent : ${e} (docs/agents/chaine-de-production.md § 3)` });
  }
  return { status: status?.valeur ?? null, pret, erreurs };
}

export const PHASES = ['1-grilling', '2-decoupage', '3-specs-en-fusion', '4-vague-<k>', '5-livraison', '6-nettoyage', 'fini'];

const PHASE = /^Phase\s*:\s*(.*)$/;
const ARCHITECTE = /^Architecte\s*:\s*(.*)$/;
const phaseValide = (v) => /^(1-grilling|2-decoupage|3-specs-en-fusion|4-vague-[1-9]\d*|5-livraison|6-nettoyage|fini)(\s|$)/.test(v);

/**
 * Contrôle de la fiche d'une carte de chantier (`*.map.md` portant une ligne `Sujet:`). Une carte
 * sans ligne `Sujet:` n'est pas une carte de chantier : ignorée (`carte: false`).
 */
export function controlerCarte({ nom, texte }) {
  const lignes = texte.split('\n');
  const sujet = chercher(lignes, SUJET);
  if (!sujet) return { carte: false, erreurs: [] };
  const erreurs = [];
  const corps = sections(lignes);
  if (!/^sujet\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sujet.valeur))
    erreurs.push({ ligne: sujet.ligne, message: `carte ${nom} : Sujet « ${sujet.valeur} » : attendu \`sujet/<nom-en-kebab>\`` });
  if (!corps.has('Fiche')) erreurs.push({ ligne: 1, message: `carte ${nom} : section \`## Fiche\` absente` });
  const phase = chercher(lignes, PHASE);
  if (!phase || !phaseValide(phase.valeur))
    erreurs.push({
      ligne: phase?.ligne ?? 1,
      message: `carte ${nom} : \`Phase:\` ${phase ? `« ${phase.valeur} » hors vocabulaire` : 'absente'} (attendu : ${PHASES.join(', ')})`,
    });
  const architecte = chercher(lignes, ARCHITECTE);
  if (!architecte || architecte.valeur === '') erreurs.push({ ligne: architecte?.ligne ?? 1, message: `carte ${nom} : \`Architecte:\` absent ou vide` });
  const m = phase && /^(?:4-vague-([1-9]\d*)|5-livraison|6-nettoyage|fini)/.exec(phase.valeur);
  if (m && !corps.has('Coût')) erreurs.push({ ligne: phase.ligne, message: `carte ${nom} : section \`## Coût\` absente (obligatoire dès 4-vague-1)` });
  if (phase && /^fini(\s|$)/.test(phase.valeur)) {
    const retro = corps.get('Rétro');
    if (!retro || retro.length === 0) erreurs.push({ ligne: phase.ligne, message: `carte ${nom} : section \`## Rétro\` absente ou vide (obligatoire à \`fini\`)` });
  }
  return { carte: true, erreurs };
}
