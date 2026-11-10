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
const CHAUDS = /^Fichiers chauds\s*:\s*(.*)$/;
const LABEL = /^Label\s*:\s*(.*)$/;

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

/**
 * Motif de chemin (`**` = tout, y compris zéro dossier avant `/` ; `*` = un segment) → expression
 * régulière. `scripts/agent/regles.mjs` n'expose qu'un moteur à `*` seul : il ne lit pas les `**` de
 * `cheminsSensibles`, d'où ce moteur-ci.
 */
function regexDuMotif(motif) {
  // Un motif qui finit par `/` désigne un dossier : tout ce qu'il contient (`src/auth/` = `src/auth/**`).
  const complet = motif.endsWith('/') ? `${motif}**` : motif;
  // Un seul passage : `**/` → dossiers facultatifs, `**` → tout, `*` → un segment.
  const re = complet.replace(/\*\*\/|\*\*|\*|[.+?^${}()|[\]\\]/g, (m) => {
    if (m === '**/') return '(?:.*/)?';
    if (m === '**') return '.*';
    if (m === '*') return '[^/]*';
    return `\\${m}`;
  });
  return new RegExp(`^${re}$`);
}

/**
 * `cheminsSensibles` du contrat `.claude/chaine.json`. `texte` null : pas de contrat (projet sans
 * chaîne), aucun chemin sensible. Un contrat présent mais illisible ou mal formé lève : un gate de
 * sécurité échoue fermé, il ne cesse pas d'exiger.
 */
export function lireCheminsSensibles(texte) {
  if (texte === null) return [];
  let contrat;
  try {
    contrat = JSON.parse(texte);
  } catch (e) {
    throw new Error(`.claude/chaine.json illisible : ${e.message}`);
  }
  const liste = contrat?.cheminsSensibles ?? [];
  if (!Array.isArray(liste) || liste.some((m) => typeof m !== 'string'))
    throw new Error('.claude/chaine.json : `cheminsSensibles` doit être une liste de motifs');
  return liste;
}

/** Chemins de la ligne `Fichiers chauds:` : ceux entre accents graves, sinon la liste séparée par des virgules. */
export function cheminsChauds(valeur) {
  const entre = [...valeur.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  if (entre.length > 0) return entre;
  return valeur
    .split(',')
    .map((c) => c.replace(/\s+—.*$/, '').trim())
    .filter((c) => c && c !== '—');
}

/**
 * Motif sensible touché par un chemin chaud, ou `null`. Un chemin chaud peut lui-même être un motif
 * (`src/db/migrations/*`) : il est comparé tel quel, ses `*` compris dans `.*` du motif sensible.
 */
export function motifSensibleTouche(chemin, cheminsSensibles) {
  const c = chemin.replace(/^\.\//, '');
  return cheminsSensibles.find((motif) => regexDuMotif(motif).test(c)) ?? null;
}

/**
 * Écarts de format « prêt pour agent » ; vide si le ticket est conforme.
 * `cheminsSensibles` : le contrat de `.claude/chaine.json` ; un chemin chaud qui en touche un exige
 * la ligne `Label: architecte` (chaine-de-production.md § 3).
 */
export function ecartsFormatPret(texte, cheminsSensibles = []) {
  const lignes = texte.split('\n');
  const ecarts = [];
  const modele = chercher(lignes, MODELE);
  if (!modele || !/^(sonnet|opus|haiku)\b/.test(modele.valeur)) ecarts.push('ligne `Modèle: sonnet|opus` (avec la raison pour opus) absente');
  const chauds = chercher(lignes, CHAUDS);
  const label = chercher(lignes, LABEL);
  if (chauds && !/^architecte(\s|$)/.test(label?.valeur ?? '')) {
    for (const chemin of cheminsChauds(chauds.valeur)) {
      const motif = motifSensibleTouche(chemin, cheminsSensibles);
      if (motif) {
        ecarts.push(
          `ligne \`Label: architecte\` absente : \`Fichiers chauds\` touche \`${chemin}\`, chemin sensible (\`${motif}\`, cheminsSensibles de .claude/chaine.json)`,
        );
        break;
      }
    }
  }
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
export function controlerTicket({ nom, texte, existe, gele = false, cheminsSensibles = [] }) {
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
    for (const e of ecartsFormatPret(texte, cheminsSensibles))
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

/** Ce que les fiches de `docs/agents/` doivent porter pour que les skills de la chaîne lisent le dépôt. */
export const SECTIONS_TRACKER = ['Réserver un ticket', 'Un ticket prêt pour agent', 'Archivage'];
export const VALEURS_TRIAGE = ['en cours — <branche>', 'Fait — PR #<n>'];

/**
 * Contrôle des fiches `docs/agents/issue-tracker.md` et `triage-labels.md` : celles du skill
 * `tickets`, pas celles d'origine de `setup-matt-pocock-skills`. Rejouer ce dernier les réécrit
 * sans la réservation, l'archivage ni le ticket prêt pour agent, et rien d'autre ne le verrait :
 * les skills `chantier`, `sujet` et `fusionner` renvoient à ces sections par leur titre.
 * `issueTracker` et `triageLabels` : le texte de chaque fiche, ou null si elle manque.
 */
export function ecartsFiches({ issueTracker, triageLabels }) {
  const erreurs = [];
  const remede = 'rejouer `/maj-skills:tickets poser` (la fiche a été réécrite, sans doute par setup-matt-pocock-skills)';
  if (issueTracker === null) erreurs.push('docs/agents/issue-tracker.md absente : `/maj-skills:tickets poser`');
  else
    for (const titre of SECTIONS_TRACKER)
      if (!new RegExp(`^## ${titre}`, 'm').test(issueTracker)) erreurs.push(`docs/agents/issue-tracker.md : section « ${titre} » absente — ${remede}`);
  if (triageLabels === null) erreurs.push('docs/agents/triage-labels.md absente : `/maj-skills:tickets poser`');
  else
    for (const valeur of VALEURS_TRIAGE)
      if (!triageLabels.includes(valeur)) erreurs.push(`docs/agents/triage-labels.md : valeur « ${valeur} » absente — ${remede}`);
  return erreurs;
}
