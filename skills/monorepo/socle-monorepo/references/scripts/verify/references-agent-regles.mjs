/**
 * Règles pures du gate `references-agent` : lues par `references-agent.mjs`,
 * testées par `references-agent.test.mjs`. Aucune lecture de fichier ici : on reçoit le texte
 * d'un fichier lu par les agents (CLAUDE.md, règles, skills, commandes, docs/agents) et des
 * fonctions qui disent ce qui existe.
 *
 * Quatre natures de référence : chemin, commande, skill qualifiée, section. Heuristiques
 * prudentes : un faux rouge coûte plus qu'un faux vert, donc un motif douteux est ignoré.
 */

/** Lignes hors blocs de code délimités (```), avec leur numéro (1-based). */
function lignesHorsBlocs(texte, avecBlocs = false) {
  const sortie = [];
  let dansBloc = false;
  texte.split('\n').forEach((contenu, i) => {
    if (/^\s*(```|~~~)/.test(contenu)) dansBloc = !dansBloc;
    else if (avecBlocs) sortie.push({ ligne: i + 1, contenu, dansBloc });
    else if (!dansBloc) sortie.push({ ligne: i + 1, contenu, dansBloc });
  });
  return sortie;
}

/** Codes inline d'une ligne. */
const codes = (contenu) => [...contenu.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);

/** Un code inline qui est un chemin du dépôt à vérifier (sinon : ignoré). */
export function estChemin(code, racines) {
  if (!code.includes('/')) return false;
  // Premier segment inconnu à la racine (`src/`, `shared/`, `all/`) : chemin relatif à un
  // sous-arbre, ambigu, ignoré.
  if (!racines.has(code.split('/')[0])) return false;
  if (/\s/.test(code)) return false;
  if (/^(http|<|\$|~|\{|\*|\/|\.\/|\.\.\/|@|#)/.test(code)) return false;
  if (/<[^>]*>|\*\*|\*\.|[*{}()[\]|:=,]/.test(code)) return false;
  return /\/$/.test(code) || /\.[A-Za-z0-9]+$/.test(code);
}

/** `/nom` : commande (skill, commande projet ou intégrée). */
const COMMANDE_SEULE = /^\/([a-z][a-z0-9-]*)$/;
const COMMANDE_PROSE = /(?:^|[\s(«])\/([a-z][a-z0-9-]{3,})(?![\w/.-])/g;

/**
 * `plugin:skill`. Seuls les préfixes de plugin de skills (`*-skills`, `superpowers`) sont lus :
 * `prio:haute`, `medical:read` sont des étiquettes et des permissions. `skillExiste` reçoit le nom
 * qualifié entier (`maj-skills:tickets`) : les plugins installés sont listés dans
 * `references-agent-integrees.json`.
 */
const SKILL_QUALIFIEE = /^((?:[a-z][a-z0-9]*-)*skills|superpowers):([a-z][a-z0-9-]*)$/;

const norm = (s) => s.replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Titres Markdown d'un texte, normalisés. */
export function titres(texte) {
  return lignesHorsBlocs(texte)
    .map((l) => /^#{1,6}\s+(.+?)\s*#*$/.exec(l.contenu))
    .filter(Boolean)
    .map((m) => norm(m[1]));
}

/**
 * Première colonne des lignes de table « Où sont les règles détaillées » de CLAUDE.md :
 * les intitulés des anciennes sections y sont listés, en bloc.
 */
export function intitulesTable(claudeMd) {
  const lignes = claudeMd.split('\n');
  const debut = lignes.findIndex((l) => /^##\s+Où sont les règles détaillées/.test(l));
  if (debut < 0) return [];
  const sortie = [];
  for (const l of lignes.slice(debut + 1)) {
    if (/^##\s/.test(l)) break;
    const m = /^\|\s*([^|]+?)\s*\|/.exec(l);
    if (m && !/^[-\s]+$/.test(m[1])) {
      for (const item of m[1].split(/,\s+(?![^(]*\))/)) sortie.push(norm(item));
    }
  }
  return sortie;
}

/** Références de section : « § « Titre » » (guillemets) ou « § Titre » (nu, initiale majuscule). */
function sectionsCitees(contenu) {
  const refs = [];
  for (const m of contenu.matchAll(/(?:§|paragraphe)\s*[«"“]\s*([^»"”]+?)\s*[»"”]/g)) {
    refs.push({ ref: m[1], index: m.index });
  }
  for (const m of contenu.matchAll(/§\s*([A-ZÀ-Ý][^.,;:()`«»"\n|]*)/g)) {
    if (/^[«"“]/.test(m[0].replace(/^§\s*/, ''))) continue;
    // Plus de trois mots : phrase qui suit le §, pas un intitulé — doute, ignorée.
    if (m[1].trim().split(/\s+/).length > 3) continue;
    refs.push({ ref: m[1].trim(), index: m.index });
  }
  return refs;
}

/**
 * Une section citée vise CLAUDE.md / `.claude/rules/` (ou le fichier qui la cite) sauf si un autre
 * document est nommé avant elle sur la ligne (fichier `.md`, ADR, spec, identifiant de ticket) :
 * doute → ignorée.
 */
function viseClaudeMd(contenu, index) {
  const avant = contenu.slice(0, index);
  const segment = avant
    .slice(avant.lastIndexOf('§') + 1)
    .replace(/[«"“][^»"”]*[»"”]/g, '')
    .slice(-40);
  if (/CLAUDE\.md/.test(segment)) return true;
  return !/(\.md|\.mjs|\.ts|ADR|spec|\b[A-Z]{2,}(?:-[A-Z]{2,})*-\d+|PRD|ticket|skill)/i.test(segment);
}

/**
 * Références cassées d'un fichier.
 * @param {object} p
 * @param {string} p.texte contenu du fichier
 * @param {string} p.dossier dossier du fichier, relatif à la racine (un chemin se résout aussi depuis là)
 * @param {(chemin: string) => boolean} p.existeChemin chemin relatif à la racine présent dans l'arbre
 * @param {(nom: string) => boolean} p.commandeExiste skill, commande projet ou intégrée
 * @param {(nom: string) => boolean} p.skillExiste skill du dépôt (`.claude/skills/<nom>`)
 * @param {Set<string>} p.racines entrées de premier niveau de l'arbre (`apps`, `docs`, `.claude`…)
 * @param {{titres: string[], table: string[]}} p.sections titres de CLAUDE.md et des règles, table des règles
 * @returns {{ligne: number, nature: string, reference: string}[]}
 */
export function referencesCassees({
  texte,
  dossier,
  existeChemin,
  commandeExiste,
  skillExiste,
  sections,
  racines,
}) {
  const cassees = [];
  const vus = new Set();
  const ajouter = (ligne, nature, reference) => {
    const cle = `${ligne}:${nature}:${reference}`;
    if (vus.has(cle)) return;
    vus.add(cle);
    cassees.push({ ligne, nature, reference });
  };
  // Un fichier cite aussi ses propres sections.
  const titresDuFichier = titres(texte);
  const sectionExiste = (ref) => {
    const n = norm(ref);
    // Un titre qualifié (« Titre : suite », « Titre (précision) ») répond à « Titre » ; une suite
    // après virgule (« Pagination, Filtering… ») est un autre intitulé.
    const repond = (t) => t === n || (t.startsWith(n) && /^\s*[:(—-]/.test(t.slice(n.length)));
    return (
      !/[a-zà-ÿ]/.test(n) ||
      sections.titres.some(repond) ||
      sections.table.some(repond) ||
      titresDuFichier.some(repond)
    );
  };

  const toutes = lignesHorsBlocs(texte, true);
  for (const [i, { ligne, contenu, dansBloc }] of toutes.entries()) {
    // Une section citée se lit aussi dans un bloc (gabarit de prompt) ; chemins et commandes non.
    if (!dansBloc) lireCodes(ligne, contenu);
    // Une citation coupée en fin de ligne (« § « Titre\n suite ») se lit sur deux lignes.
    const suite = toutes[i + 1]?.ligne === ligne + 1 ? toutes[i + 1].contenu.trim() : '';
    const lu = suite ? `${contenu} ${suite}` : contenu;
    for (const { ref, index } of sectionsCitees(lu)) {
      if (index >= contenu.length) continue;
      if (viseClaudeMd(lu, index) && !sectionExiste(ref)) ajouter(ligne, 'section', ref);
    }
  }
  return cassees;

  function lireCodes(ligne, contenu) {
    for (const code of codes(contenu)) {
      if (estChemin(code, racines)) {
        const nu = code.replace(/#.*$/, '');
        if (!existeChemin(nu) && !existeChemin(`${dossier}/${nu}`.replace(/^\//, ''))) {
          ajouter(ligne, 'chemin', code);
        }
        continue;
      }
      const cmd = COMMANDE_SEULE.exec(code);
      if (cmd) {
        if (!commandeExiste(cmd[1])) ajouter(ligne, 'commande', code);
        continue;
      }
      const q = SKILL_QUALIFIEE.exec(code);
      if (q && !skillExiste(code)) ajouter(ligne, 'skill qualifiée', code);
    }

    const prose = contenu.replace(/`[^`\n]*`/g, 'X');
    for (const m of prose.matchAll(COMMANDE_PROSE)) {
      if (!commandeExiste(m[1])) ajouter(ligne, 'commande', `/${m[1]}`);
    }
  }
}

/** Clé de gel d'une référence cassée : `fichier:ligne:référence`. */
export const cleDette = (fichier, c) => `${fichier}:${c.ligne}:${c.reference}`;
