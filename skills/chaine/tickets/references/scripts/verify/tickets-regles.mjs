/**
 * Règles pures du gate `tickets` : lues par `tickets.mjs`, testées par `tickets.test.mjs`.
 * Aucune lecture de fichier ici : on reçoit le texte d'un ticket.
 *
 * Vocabulaire de `Status:` : `docs/agents/triage-labels.md`. Format « prêt pour agent » :
 * `docs/agents/chaine-de-production.md` § 3. Tout changement passe d'abord par ces fichiers.
 */
import { TICKET, identifiantDeLaSpec, identifiantDuTicket, estArchive, lireIdentifiant, litteral, dossierDuContexte, REGLE } from '../docs/identifiants.mjs';

export { identifiantDuTicket as identifiant, estArchive };

/** Ligne d'en-tête, sous ses trois formes : `X:`, `**X:**`, `- X:`. */
const enTete = (nom) => new RegExp(`^(?:- )?\\**${nom}\\**\\s*:\\**\\s*(.*)$`, 'i');

const STATUS = enTete('Status');
const BLOCKED_BY = enTete('Blocked by');
const TYPE = enTete('Type');
const REGLES = enTete('Règles');

/** Vocabulaire fermé de `Type:` (docs/agents/issue-tracker.md). */
export const TYPES = ['task', 'défaut', 'grilling', 'research'];
// Un commentaire de gabarit (`Type: task # task | défaut | …`) peut suivre la valeur.
const TYPE_VALIDE = new RegExp(`^(${TYPES.join('|')})(?:\\s+#.*)?$`);
export const typeValide = (valeur) => TYPE_VALIDE.test(valeur);
export const typeDe = (valeur) => TYPE_VALIDE.exec(valeur)?.[1] ?? null;

/** Les lignes d'en-tête : celles d'avant la première section `## `. Le corps n'est pas lu comme en-tête. */
function tete(lignes) {
  const fin = lignes.findIndex((l) => /^## /.test(l));
  return fin === -1 ? lignes : lignes.slice(0, fin);
}

/**
 * Les identifiants d'une ligne `Règles:`, séparés par des virgules ou des espaces, entre accents
 * graves ou non ; rien d'autre sur la ligne. Rend `{ cites, malformes }` : `malformes` sont les
 * morceaux qui ne sont pas un identifiant de règle (`LIC-3`, `SPEC_ALL_SOC-1`, `voir`).
 */
const REGLE_SEULE = new RegExp(`^${REGLE}$`);

export function reglesCitees(valeur) {
  const cites = [];
  const malformes = [];
  for (const morceau of valeur.split(/[\s,]+/).filter(Boolean)) {
    const nu = /^`([^`]+)`$/.exec(morceau)?.[1] ?? morceau;
    if (REGLE_SEULE.test(nu)) cites.push(nu);
    else malformes.push(morceau);
  }
  return { cites: [...new Set(cites)], malformes };
}

/** Ligne de tableau markdown → cellules, `\|` compris dans une cellule. */
function cellules(ligne) {
  const t = ligne.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  return t.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

/** Fichier de test : `*.test.*`, `*.spec.*`, `*.e2e-spec.*` de code (une spec `*.spec.md` n'en est pas un). */
export const FICHIER_DE_TEST = /\.(?:test|spec|e2e-spec)\.[cm]?[jt]sx?$/;

/**
 * Ce qu'une cellule cite, dans l'ordre : un `fichier` entre accents graves, un titre entre « et » (rogné)
 * ou entre guillemets droits. Un « placé après le dernier » ne peut ouvrir aucun titre, mais `[^»]+` le
 * rescannerait jusqu'à la fin à chaque départ (quadratique sur une suite de «) : on les neutralise pour
 * la recherche, sans changer une position, et le texte rendu vient de la cellule d'origine.
 */
export function elementsCites(cellule) {
  const dernier = cellule.lastIndexOf('»');
  const cherche = cellule.slice(0, dernier + 1) + cellule.slice(dernier + 1).replaceAll('«', '‹');
  return [...cherche.matchAll(/`([^`]+)`|«([^»]+)»|"([^"]+)"/g)].map((m) => {
    const brut = cellule.slice(m.index + 1, m.index + m[0].length - 1);
    return { fichier: m[1] !== undefined, texte: m[2] === undefined ? brut : brut.trim() };
  });
}

/**
 * Tests nommés par la colonne « Preuve » de `## Surfaces` : un fichier de test entre accents graves,
 * suivi de ses titres entre « » ou "" : `a.test.ts` « refuse X », « refuse Y ». Un autre texte entre
 * accents graves (un chemin de code cité à côté) n'est pas un titre.
 * Rend `{ tests: [{ fichier, titre }], ecarts }` ; `ecarts` dit ce qui empêche de lire la preuve.
 */
export function testsNommes(lignes) {
  const corps = sections(lignes).get('Surfaces');
  if (!corps) return { tests: [], ecarts: ['section `## Surfaces` absente'] };
  const table = corps.filter((l) => l.trim().startsWith('|'));
  const colonne = table.length > 0 ? cellules(table[0]).findIndex((c) => /^preuves?$/i.test(c)) : -1;
  if (colonne === -1) return { tests: [], ecarts: ['`## Surfaces` sans tableau à colonne « Preuve »'] };
  const tests = [];
  const ecarts = [];
  for (const ligne of table.slice(1)) {
    const cellule = cellules(ligne)[colonne] ?? '';
    if (/^:?-+:?$/.test(cellule)) continue;
    let fichier = null;
    let titres = 0;
    for (const e of elementsCites(cellule)) {
      if (e.fichier && FICHIER_DE_TEST.test(e.texte)) {
        if (fichier && titres === 0) ecarts.push(`la preuve nomme \`${fichier}\` sans titre de test`);
        fichier = e.texte;
        titres = 0;
      } else if (fichier && !e.fichier) {
        tests.push({ fichier, titre: e.texte });
        titres++;
      }
    }
    if (fichier && titres === 0) ecarts.push(`la preuve nomme \`${fichier}\` sans titre de test`);
  }
  if (tests.length === 0 && ecarts.length === 0) ecarts.push('aucun test nommé dans la colonne « Preuve » de `## Surfaces` (`fichier.test.ts` « titre »)');
  return { tests, ecarts };
}

// Appel de test ou de bloc : `it(`, `test.skip(`, `xit(`, `describe.each(t)(`, `it.skip.each([…])(`.
const APPEL = /\b(x?it|x?test|x?describe|fit|fdescribe|suite)((?:\.\w+)*)(?:\([^()]*\))?\s*\(/;
const desactive = (ligne) => {
  const m = APPEL.exec(ligne);
  if (!m) return false;
  // node:test : `test('x', { skip: true }, …)`, `{ todo: … }`.
  return m[1].startsWith('x') || /\.(skip|todo)\b/.test(m[2]) || optionDesactivee(ligne.slice(m.index));
};
/**
 * `{ skip: … }` ou `{ todo: … }` : un `skip` ou `todo` suivi de `:`, juste après un `{` ou une `,` d'un
 * objet encore ouvert (aucun `}` depuis son `{`). Un seul passage sur la ligne : l'expression
 * régulière qui disait la même chose (`\{\s*(?:[^}]*,\s*)?(?:skip|todo)\s*:`) est quadratique.
 */
export function optionDesactivee(texte) {
  let ouvert = false;
  let precedent = '';
  for (const [jeton] of texte.matchAll(/(?:skip|todo)\s*:|\S/g)) {
    if (jeton.length > 1) {
      if (ouvert && (precedent === '{' || precedent === ',')) return true;
      precedent = ':';
      continue;
    }
    if (jeton === '{') ouvert = true;
    else if (jeton === '}') ouvert = false;
    precedent = jeton;
  }
  return false;
}
const indentation = (l) => /^\s*/.exec(l)[0].replace(/\t/g, '  ').length;

/**
 * État d'un test dans le texte d'un fichier : `'actif'`, `'désactivé'` ou `'absent'`. Le titre est
 * cherché littéralement comme chaîne entière (`'titre'`, `"titre"`, `` `titre` ``) en premier argument
 * d'un appel `it`/`test`/`describe` ; il est désactivé si cet appel ou un bloc qui l'englobe porte
 * `.skip`, `.todo`, un `x` (`xit`, `xdescribe`) ou l'option `{ skip }` / `{ todo }` de node:test.
 *
 * Limite assumée : analyse ligne à ligne, sans parseur. L'appel et son titre tiennent sur une ligne ;
 * les blocs englobants se lisent par l'indentation (en remontant, chaque ligne moins indentée que la
 * précédente retenue ouvre un bloc qui englobe le test) : un fichier formaté (Prettier) suffit, un
 * fichier à indentation fantaisiste peut tromper la détection. Une ligne commentée n'est pas un test.
 * Plusieurs occurrences du titre : un seul `'actif'` suffit.
 */
export function etatDuTest(texte, titre) {
  const lignes = texte.split('\n');
  const t = litteral(titre);
  const motif = new RegExp(`${APPEL.source}\\s*(?:'${t}'|"${t}"|\`${t}\`)`);
  let etat = 'absent';
  for (let i = 0; i < lignes.length; i++) {
    if (/^\s*(?:\/\/|\/?\*)/.test(lignes[i]) || !motif.test(lignes[i])) continue;
    let coupe = desactive(lignes[i]);
    let niveau = indentation(lignes[i]);
    for (let j = i - 1; j >= 0 && niveau > 0 && !coupe; j--) {
      if (lignes[j].trim() === '' || indentation(lignes[j]) >= niveau) continue;
      niveau = indentation(lignes[j]);
      coupe = desactive(lignes[j]);
    }
    if (!coupe) return 'actif';
    etat = 'désactivé';
  }
  return etat;
}
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
    // Une fin de ligne CRLF laisse un `\r` que `.` ne prend pas : sans ce retrait, la ligne serait absente.
    const m = motif.exec(lignes[i].replace(/\r$/, ''));
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
 * Tickets cités par une ligne `Blocked by:`. Un identifiant complet (`SPEC_ALL_SOC-1.01`) partout dans la
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

/** Valeurs par défaut des plafonds (A-9, P-3) : les mêmes que `chantier/scripts/plafonds.mjs`. */
const PLAFONDS_PAR_DEFAUT = { contexteFille: 300000, coutFille: 20, contextePilote: 400000, renvoisParPR: 3 };

/**
 * `plafonds` du contrat `.claude/chaine.json`. `texte` null : pas de contrat, aucun plafond contrôlé
 * (`null`). Contrat sans la clé : les valeurs par défaut. Clé mal formée, comme un contrat illisible :
 * lève (le gate échoue fermé).
 */
export function lirePlafonds(texte) {
  if (texte === null) return null;
  let contrat;
  try {
    contrat = JSON.parse(texte);
  } catch (e) {
    throw new Error(`.claude/chaine.json illisible : ${e.message}`);
  }
  const p = contrat?.plafonds;
  if (p === undefined) return { ...PLAFONDS_PAR_DEFAUT };
  if (typeof p !== 'object' || p === null || Array.isArray(p))
    throw new Error('.claude/chaine.json : `plafonds` doit être un objet');
  for (const [cle, v] of Object.entries(p)) {
    if (!(cle in PLAFONDS_PAR_DEFAUT)) throw new Error(`.claude/chaine.json : plafonds.${cle} inconnu`);
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0)
      throw new Error(`.claude/chaine.json : plafonds.${cle} doit être un nombre strictement positif`);
  }
  return { ...PLAFONDS_PAR_DEFAUT, ...p };
}

const cellulesDe = (ligne) => ligne.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const NON_RELEVE = /^$|^—$|^à relever$|^\{\{.*\}\}$/i;

/** Lignes de données d'un tableau de section (entête et séparateur ôtés) : { ligne, cellules }. */
function lignesDeTableau(lignes, corps) {
  const lus = (corps ?? []).filter((l) => l.trim().startsWith('|')).slice(2);
  return lus.map((l) => ({ ligne: lignes.indexOf(l) + 1, cellules: cellulesDe(l) }));
}

/** `174 k` → 174000, `121 835` → 121835, `726 k (compactée)` → 726000 ; autre forme → null. */
export function contexteEnTokens(texte) {
  const m = /^(\d[\d\s]*?)\s*(k)?\s*(?:\(.*\))?$/i.exec(texte.trim());
  if (!m) return null;
  return Number(m[1].replace(/\s/g, '')) * (m[2] ? 1000 : 1);
}

/** Coût `2,20` ou `2.20` → nombre ; autre forme → null (la lecture de `couts.mjs`, `montant`). */
const coutEnDollars = (texte) => {
  const t = texte.trim().replace(/\s/g, '').replace(',', '.');
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : null;
};

/**
 * Plafonds de `## Coût` : une ligne dont le rôle est jugé (`fille`, `conducteur`, `architecte`) qui
 * atteint son plafond (l'égalité compte) exige une ligne dans `## Dépassements` pour la même session.
 * Tout autre rôle n'est pas jugé ; une cellule « Contexte max » vide, `—`, `à relever` ou au gabarit
 * non plus ; toute autre forme illisible sur un rôle jugé est une erreur de la carte.
 */
function plafondsDeLaCarte({ nom, lignes, corps, plafonds }) {
  const erreurs = [];
  const couvertes = new Set(
    lignesDeTableau(lignes, corps.get('Dépassements'))
      .map((r) => r.cellules[0] ?? '')
      .filter((s) => !NON_RELEVE.test(s)),
  );
  for (const { ligne, cellules } of lignesDeTableau(lignes, corps.get('Coût'))) {
    const [role = '', ticket = '', session = '', , contexte = '', cout = ''] = cellules;
    const r = role.toLowerCase();
    const fille = r === 'fille';
    if (!fille && r !== 'conducteur' && r !== 'architecte') continue;
    const mesures = [];
    if (!NON_RELEVE.test(contexte)) {
      const tokens = contexteEnTokens(contexte);
      if (tokens === null) {
        erreurs.push({ ligne, message: `carte ${nom} : \`## Coût\`, ligne ${role}/${ticket} : « Contexte max » « ${contexte} » illisible (attendu un entier, avec ou sans espaces, ou suivi de \`k\` : \`174 k\`)` });
        continue;
      }
      const plafond = fille ? plafonds.contexteFille : plafonds.contextePilote;
      if (tokens >= plafond) mesures.push(`contexte ${tokens} tokens ≥ plafond ${plafond}`);
    }
    let dollars = null;
    if (fille && !NON_RELEVE.test(cout)) {
      dollars = coutEnDollars(cout);
      if (dollars === null) {
        erreurs.push({ ligne, message: `carte ${nom} : \`## Coût\`, ligne ${role}/${ticket} : « Coût $ » « ${cout} » illisible (attendu un montant : \`2,20\`)` });
        continue;
      }
    }
    if (dollars !== null && dollars >= plafonds.coutFille) mesures.push(`coût ${dollars} $ ≥ plafond ${plafonds.coutFille} $`);
    if (mesures.length === 0 || (session && couvertes.has(session))) continue;
    erreurs.push({
      ligne,
      message: `carte ${nom} : \`## Coût\`, session ${session || '(sans identifiant)'} (${role}) : ${mesures.join(' ; ')}, sans ligne dans \`## Dépassements\` pour cette session (décision du produit : découper, relancer ou accepter par écrit)`,
    });
  }
  return erreurs;
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
 * la ligne `Label: contre-revue` (chaine-de-production.md § 3). L'ancienne valeur `architecte` a le même
 * effet et reste acceptée sur tout ticket ; les messages ne nomment que `contre-revue`.
 */
export function ecartsFormatPret(texte, cheminsSensibles = []) {
  const lignes = texte.split('\n');
  const ecarts = [];
  const modele = chercher(lignes, MODELE);
  if (!modele || !/^(sonnet|opus|haiku)\b/.test(modele.valeur)) ecarts.push('ligne `Modèle: sonnet|opus` (avec la raison pour opus) absente');
  const chauds = chercher(lignes, CHAUDS);
  const label = chercher(lignes, LABEL);
  if (chauds && !/^(contre-revue|architecte)(\s|$)/.test(label?.valeur ?? '')) {
    for (const chemin of cheminsChauds(chauds.valeur)) {
      const motif = motifSensibleTouche(chemin, cheminsSensibles);
      if (motif) {
        ecarts.push(
          `ligne \`Label: contre-revue\` absente : \`Fichiers chauds\` touche \`${chemin}\`, chemin sensible (\`${motif}\`, cheminsSensibles de .claude/chaine.json)`,
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
 * Écarts de la ligne `Règles:` d'un ticket. Absente : rien à vérifier. Présente, elle cite au moins une
 * règle, chacune bien formée, existante (`regleExiste(id)`) et du contexte du ticket ou de `ALL`.
 * `contexte` : celui de l'identifiant du ticket, `null` s'il est illisible (seul `ALL` est alors sûr).
 */
export function ecartsRegles(valeur, { contexte, regleExiste }) {
  const { cites, malformes } = reglesCitees(valeur);
  const ecarts = malformes.map(
    (m) => `Règles cite « ${m} », qui n'est pas un identifiant de règle complet (\`RULE_<CTX>_<TRI>-<n>\`, \`RULE_ALL_LIC-3\`) ; rien d'autre sur la ligne`,
  );
  if (cites.length === 0 && malformes.length === 0) ecarts.push('ligne `Règles:` vide : citer au moins une règle, ou retirer la ligne');
  for (const id of cites) {
    const ctx = lireIdentifiant(id).contexte;
    if (ctx !== 'ALL' && ctx !== contexte)
      ecarts.push(
        contexte
          ? `Règles cite ${id}, du contexte ${ctx} : un ticket du contexte ${contexte} ne cite que des règles de ${contexte === 'ALL' ? 'ALL' : `${contexte} ou de ALL`}`
          : `Règles cite ${id}, du contexte ${ctx} : le nom du ticket ne porte pas d'identifiant lisible, seules les règles de ALL sont acceptées`,
      );
    else if (!regleExiste(id)) ecarts.push(`Règles cite ${id}, absente du registre (docs/metier/regles/${dossierDuContexte(ctx)}/${id}.md)`);
  }
  return ecarts;
}

/**
 * Écarts d'un défaut `Fait` : chaque test nommé par la colonne « Preuve » de `## Surfaces` existe et
 * est actif (`testExiste(fichier, titre) → 'actif' | 'désactivé' | 'absent'`). La promesse de `ANC-11` :
 * un défaut est résolu par des tests nommés, un test désactivé ne prouve rien (refus, pas alerte).
 */
export function ecartsDefautFait(lignes, testExiste) {
  const { tests, ecarts } = testsNommes(lignes);
  const vus = new Set();
  for (const { fichier, titre } of tests) {
    const cle = `${fichier}\0${titre}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    const etat = testExiste(fichier, titre);
    if (etat === 'absent') ecarts.push(`le test « ${titre} » est introuvable dans \`${fichier}\``);
    else if (etat === 'désactivé') ecarts.push(`le test « ${titre} » de \`${fichier}\` est désactivé (skip, todo, x) : il ne prouve pas la correction`);
  }
  return ecarts;
}

/**
 * Contrôle d'un ticket. `existe(id)` dit si un ticket du dépôt porte cet identifiant ;
 * `gele` : ticket prêt d'avant l'allumage, dispensé du format (dette) ; `typeGele` : ticket d'avant le
 * gate de `Type:`, dispensé de la ligne absente (dette `types`) ; `regleExiste(id)` : la règle a son
 * fichier dans le registre de son contexte ; `testExiste(fichier, titre)` : état d'un test du dépôt.
 */
export function controlerTicket({
  nom,
  texte,
  existe,
  gele = false,
  typeGele = false,
  cheminsSensibles = [],
  regleExiste = () => false,
  testExiste = () => 'absent',
}) {
  const lignes = texte.split('\n');
  const id = identifiantDuTicket(nom);
  const erreurs = [];
  const status = chercher(lignes, STATUS);
  if (!status) erreurs.push({ ligne: 1, message: `ligne \`Status:\` absente (attendu : ${VOCABULAIRE.join(', ')})` });
  else if (!statusValide(status.valeur))
    erreurs.push({ ligne: status.ligne, message: `Status « ${status.valeur} » hors vocabulaire (attendu : ${VOCABULAIRE.join(', ')})` });
  const type = chercher(tete(lignes), TYPE);
  if (!type) {
    if (!typeGele) erreurs.push({ ligne: 1, message: `ligne \`Type:\` absente (attendu : ${TYPES.join(', ')})` });
  } else if (!typeValide(type.valeur))
    erreurs.push({ ligne: type.ligne, message: `Type « ${type.valeur} » hors vocabulaire (attendu : ${TYPES.join(', ')})` });
  const regles = chercher(tete(lignes), REGLES);
  if (regles) {
    const contexte = id ? lireIdentifiant(id).contexte : null;
    for (const e of ecartsRegles(regles.valeur, { contexte, regleExiste })) erreurs.push({ ligne: regles.ligne, message: e });
  }
  if (typeDe(type?.valeur ?? '') === 'défaut' && /^Fait — PR #\d+/.test(status?.valeur ?? '')) {
    for (const e of ecartsDefautFait(lignes, testExiste)) erreurs.push({ ligne: type.ligne, message: `défaut Fait : ${e}` });
  }
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
  return { status: status?.valeur ?? null, type: type?.valeur ?? null, pret, erreurs };
}

export const PHASES = ['1-grilling', '2-decoupage', '3-specs-en-fusion', '4-vague-<k>', '5-livraison', '6-nettoyage', 'fini'];

const PHASE = /^Phase\s*:\s*(.*)$/;
const ARCHITECTE = /^Architecte\s*:\s*(.*)$/;
const RESPONSABLE = /^Responsable\s*:\s*(.*)$/;
const CONDUCTEUR = /^Conducteur\s*:\s*(.*)$/;
const MIGRATIONS = /^Migrations\s*:\s*(.*)$/;
const phaseValide = (v) => /^(1-grilling|2-decoupage|3-specs-en-fusion|4-vague-[1-9]\d*|5-livraison|6-nettoyage|fini)(\s|$)/.test(v);

/**
 * Contrôle de la fiche d'une carte de chantier (`*.map.md` portant une ligne `Sujet:`). Une carte
 * sans ligne `Sujet:` n'est pas une carte de chantier : ignorée (`carte: false`).
 * La fiche nomme `Responsable:` (une personne, jamais un identifiant de session) et `Conducteur:` (la
 * session qui mène le chantier) ; `Architecte:` (la session du programme) est facultative.
 * `ficheGelee` : carte d'avant ces deux lignes, gelée dans la clé `fiches` de la dette ; pour elle
 * l'ancienne règle vaut seule, `Architecte:` non vide, et ses dépassements ne sont pas jugés.
 * `plafonds` : ceux du contrat (`lirePlafonds`) ; null, aucun plafond contrôlé.
 */
export function controlerCarte({ nom, texte, ficheGelee = false, plafonds = null }) {
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
  if (ficheGelee) {
    const architecte = chercher(lignes, ARCHITECTE);
    if (!architecte || architecte.valeur === '')
      erreurs.push({ ligne: architecte?.ligne ?? 1, message: `carte ${nom} : \`Architecte:\` absent ou vide (carte gelée dans la dette \`fiches\`)` });
  } else {
    const responsable = chercher(lignes, RESPONSABLE);
    if (!responsable || responsable.valeur === '')
      erreurs.push({ ligne: responsable?.ligne ?? 1, message: `carte ${nom} : \`Responsable:\` absent ou vide (la personne qui répond du chantier)` });
    else if (/^session_/.test(responsable.valeur))
      erreurs.push({ ligne: responsable.ligne, message: `carte ${nom} : \`Responsable:\` « ${responsable.valeur} » : un identifiant de session ; attendu une personne` });
    const conducteur = chercher(lignes, CONDUCTEUR);
    if (!conducteur || conducteur.valeur === '')
      erreurs.push({ ligne: conducteur?.ligne ?? 1, message: `carte ${nom} : \`Conducteur:\` absent ou vide (la session qui mène le chantier)` });
  }
  const m = phase && /^(?:4-vague-([1-9]\d*)|5-livraison|6-nettoyage|fini)/.exec(phase.valeur);
  if (m && !corps.has('Coût')) erreurs.push({ ligne: phase.ligne, message: `carte ${nom} : section \`## Coût\` absente (obligatoire dès 4-vague-1)` });
  // Plafonds : pas de contrat (`plafonds` null) ou carte gelée d'avant les rôles, rien n'est jugé.
  if (plafonds && !ficheGelee && corps.has('Coût')) erreurs.push(...plafondsDeLaCarte({ nom, lignes, corps, plafonds }));
  if (phase && /^fini(\s|$)/.test(phase.valeur)) {
    const retro = corps.get('Rétro');
    if (!retro || retro.length === 0) erreurs.push({ ligne: phase.ligne, message: `carte ${nom} : section \`## Rétro\` absente ou vide (obligatoire à \`fini\`)` });
  }
  const migrations = chercher(lignes, MIGRATIONS);
  if (migrations && !formeMigrations(migrations.valeur))
    erreurs.push({
      ligne: migrations.ligne,
      message: `carte ${nom} : \`Migrations:\` « ${migrations.valeur} » : attendu des horodatages de 12 chiffres (AAAAMMJJHHMM) séparés par des virgules, ou « — »`,
    });
  return { carte: true, erreurs };
}

/** La fiche porte les deux lignes nouvelles, non vides : une carte gelée dans la dette `fiches` en sort. */
export function ficheNommeResponsableEtConducteur(texte) {
  const lignes = texte.split('\n');
  return [RESPONSABLE, CONDUCTEUR].every((motif) => (chercher(lignes, motif)?.valeur ?? '') !== '');
}

const formeMigrations = (v) => v === '—' || v === '' || v.split(',').every((h) => /^\d{12}$/.test(h.trim()));

/** Horodatages de migration réservés par une carte (ligne `Migrations:`) ; aucun si « — » ou ligne absente. */
export function migrationsReservees(texte) {
  const m = chercher(texte.split('\n'), MIGRATIONS);
  if (!m || !formeMigrations(m.valeur)) return [];
  return m.valeur === '—' || m.valeur === '' ? [] : m.valeur.split(',').map((h) => h.trim());
}

/**
 * Deux cartes ouvertes (phase autre que `fini`) ne réservent jamais le même horodatage de migration :
 * le migrateur refuse une migration plus ancienne que la dernière jouée, et deux chantiers sur le même
 * horodatage se découvrent à la livraison du second.
 */
export function reservationsEnDouble(cartes) {
  const par = new Map();
  for (const { chemin, texte } of cartes) {
    const phase = chercher(texte.split('\n'), PHASE);
    if (phase && /^fini(\s|$)/.test(phase.valeur)) continue;
    for (const h of new Set(migrationsReservees(texte))) par.set(h, [...(par.get(h) ?? []), chemin]);
  }
  return [...par]
    .filter(([, c]) => c.length > 1)
    .map(
      ([h, c]) =>
        `horodatage de migration ${h} réservé par plusieurs cartes ouvertes (${c.join(', ')}) : une carte prend le suivant libre, après la dernière migration de develop et les réservations des autres cartes`,
    );
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
