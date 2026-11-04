/**
 * Règles pures du tableau d'avancement : lues par `avancement.mjs` et `vagues.mjs`, testées par
 * `avancement.test.mjs`. Rien n'est lu ici : on reçoit les tickets et les PR.
 */
import { SPEC, TICKET, identifiantDuTicket, slug } from './identifiants.mjs';

/** Ligne d'en-tête, sous ses trois formes : `X:`, `**X:**`, `- X:`. */
const enTete = (nom) => new RegExp(`^(?:- )?\\**${nom}\\**\\s*:\\**\\s*(.*)$`, 'i');

function lire(texte, nom) {
  const motif = enTete(nom);
  for (const l of texte.split('\n')) {
    const m = motif.exec(l);
    if (m) return m[1].trim();
  }
  return null;
}

export { identifiantDuTicket as identifiant, slug };

/** État d'un ticket d'après sa ligne `Status:`. */
export function etat(status) {
  if (!status) return 'inconnu';
  if (/^(fait|resolved|done)\b/i.test(status)) return 'fait';
  if (/^wontfix\b/i.test(status)) return 'abandonné';
  if (/^(en cours|claimed)\b/i.test(status)) return 'en cours';
  if (/^ready-for-agent\b/.test(status)) return 'prêt (agent)';
  if (/^ready-for-human\b/.test(status)) return 'humain';
  if (/^needs-(triage|info)\b/.test(status)) return 'à trier';
  return 'inconnu';
}

/** Tickets cités par `Blocked by:` : identifiants complets, ou numéros courts en tête de ligne. */
export function bloquants(valeur, id) {
  if (!valeur) return [];
  const cites = new Set(valeur.match(new RegExp(`\\b${TICKET}\\b`, 'g')) ?? []);
  const tete = /^\.?\d{2}(?:\s*,\s*\.?\d{2})*(?![\w.])/.exec(valeur);
  if (tete && id) {
    const spec = id.replace(/\.\d{2}$/, '');
    for (const n of tete[0].split(',')) cites.add(`${spec}.${n.trim().replace(/^\./, '')}`);
  }
  return [...cites];
}

/** Ticket lu : `{ id, titre, status, etat, blockedBy, modele }`. */
export function lireTicket(nom, texte) {
  const id = identifiantDuTicket(nom.split('/').pop());
  const titre =
    /^# (.+)$/m
      .exec(texte)?.[1]
      .replace(new RegExp(`^(?:${SPEC}\\.\\d{2}\\s+—|\\d{2}\\s*:)\\s+`), '')
      .trim() ?? '';
  const status = lire(texte, 'Status');
  return {
    id,
    titre,
    status,
    etat: etat(status),
    blockedBy: bloquants(lire(texte, 'Blocked by'), id),
    modele: lire(texte, 'Modèle'),
  };
}

/**
 * PR d'un ticket parmi les PR (ouvertes et fusionnées) : titre qui porte l'identifiant, ou branche
 * qui porte son slug. La plus récente d'abord.
 */
export function prDuTicket(id, prs) {
  const s = new RegExp(`(^|[/-])${slug(id)}(-|$)`);
  const t = new RegExp(`(?<![\\w.-])${id.replace('.', '\\.')}(?![\\w.])`, 'i');
  return prs.filter((p) => t.test(p.titre) || s.test(p.branche)).sort((a, b) => b.numero - a.numero)[0] ?? null;
}

/**
 * Agrège tickets × PR. `prs` : `[{ numero, titre, branche, etat: 'ouverte'|'brouillon'|'fusionnée',
 * labels, ci }]`, ou `null` si les PR n'ont pas pu être lues (sans `gh`).
 */
export function avancement(tickets, prs) {
  const parId = new Map(tickets.map((t) => [t.id, t]));
  const lignes = tickets
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((t) => {
      const pr = prs ? prDuTicket(t.id, prs) : null;
      const enAttente = t.blockedBy.filter((b) => parId.has(b) && parId.get(b).etat !== 'fait');
      return { ...t, pr, attend: t.etat === 'fait' || t.etat === 'abandonné' ? [] : enAttente };
    });
  const comptes = lignes.filter((l) => l.etat !== 'abandonné');
  const faits = comptes.filter((l) => l.etat === 'fait').length;
  const pourcentage = comptes.length ? Math.round((100 * faits) / comptes.length) : 0;
  const ouverts = lignes.filter((l) => !['fait', 'abandonné'].includes(l.etat));
  return {
    total: comptes.length,
    faits,
    pourcentage,
    prVerifiees: prs !== null,
    enCours: ouverts.filter((l) => l.etat === 'en cours' || (l.pr && l.pr.etat !== 'fusionnée')).map((l) => l.id),
    aLancer: ouverts.filter((l) => l.etat === 'prêt (agent)' && !l.pr && l.attend.length === 0).map((l) => l.id),
    bloques: ouverts.filter((l) => l.attend.length > 0).map((l) => ({ id: l.id, par: l.attend })),
    humains: ouverts.filter((l) => l.etat === 'humain' || l.etat === 'à trier').map((l) => ({ id: l.id, status: l.status })),
    lignes,
  };
}

const cellule = (s) => String(s ?? '—').replace(/\|/g, '\\|');

/** Sortie Markdown : en-tête, tableau, puis prochaines actions. */
export function enMarkdown(nom, a) {
  const pr = (l) => {
    if (!l.pr) return a.prVerifiees ? '—' : 'non vérifiée';
    return `#${l.pr.numero} (${l.pr.etat})`;
  };
  const out = [
    `# Avancement — ${nom}`,
    '',
    `**${a.pourcentage} %** : ${a.faits} ticket(s) fait(s) sur ${a.total} (abandonnés exclus).${a.prVerifiees ? '' : ' PR non vérifiées (gh indisponible).'}`,
    '',
    '| Ticket | Objet | Status | PR | CI | Labels |',
    '| ------ | ----- | ------ | -- | -- | ------ |',
    ...a.lignes.map(
      (l) => `| ${l.id} | ${cellule(l.titre)} | ${cellule(l.status)} | ${pr(l)} | ${cellule(l.pr?.ci)} | ${cellule(l.pr?.labels?.join(', ') || null)} |`,
    ),
    '',
    `- **En cours :** ${a.enCours.join(', ') || '—'}`,
    `- **À lancer maintenant :** ${a.aLancer.join(', ') || '—'}`,
    `- **Bloqués :** ${a.bloques.map((b) => `${b.id} (attend ${b.par.join(', ')})`).join(' ; ') || '—'}`,
    `- **À un humain :** ${a.humains.map((h) => `${h.id} (${h.status})`).join(' ; ') || '—'}`,
  ];
  return `${out.join('\n')}\n`;
}
