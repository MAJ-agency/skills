// Banc de la décision du Relecteur (relecture indépendante, lot 3a) : les dix-sept histoires de la quatrième
// relecture de la spec, jouées sur les règles de sa sixième version, puis les cas de cette version. Aucun dépôt
// jouet, aucun processus, aucune horloge : l'instant est une entrée.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ILLISIBLE, MENTION_ARBITRAGE, TEXTE_ILLISIBLE, TEXTE_PANNE, TEXTE_PLAFOND, decider, ecrireDistribution, ecrireNote, lireDistribution, lireMarques, sommetsDesTours, tourValide, tours } from './decision-relecteur.mjs';
import { LectureIllisible, PIED, ecrireVerdict } from './verdict.mjs';

const [V1, V2, V3, V4, T, V5, T2] = ['a', 'b', 'c', 'd', 'e', 'f', '9'].map((c) => c.repeat(40));
const H = 60 * 60 * 1000;
const DEBUT = Date.UTC(2026, 10, 18, 10, 0);
const iso = (ms) => new Date(ms).toISOString();

// Un fil de commentaires : chacun une minute après le précédent, sauf `{ a: <minutes depuis le début> }`.
const fil = (...entrees) => {
  let minute = -1;
  return entrees.map((e, i) => {
    const { corps, a, edite = false, de = 'MEMBER' } = typeof e === 'string' ? { corps: e } : e;
    minute = a ?? minute + 1;
    const date = iso(DEBUT + minute * 60_000);
    return { id: 100 + i, body: corps, author_association: de, created_at: date, updated_at: edite ? iso(DEBUT + (minute + 1) * 60_000) : date };
  });
};
const D = (tour, sommet, sessions, mention = null, cible = null) => ecrireDistribution({ tour, sommet, sessions, mention, cible });
const verdict = (tour, session, mot, { sommet = V1, bloquants = mot === 'refusé' ? 1 : 0, securite = null } = {}) =>
  `${ecrireVerdict({ sommet, tour, verdict: mot, bloquants, session, securite })}\n\n- constats`;
const DEMANDE = (sommet = V1, conducteur = 'session_conducteur') => `À relire — sommet ${sommet} — Session: session_auteur — Conducteur: ${conducteur}`;
const ECARTE = 'Arbitrage — R3, src/a.ts:12 — écarté — le filtre est posé par le garde';
const MAINTENU = 'Arbitrage — R3, src/a.ts:12 — maintenu';
const DECISION = 'Décision de plafond — ticket récrit, le bloquant R3 tient';

const pr = (champs = {}) => ({
  numero: 12,
  etiquettes: ['à-relire'],
  branche: 'feat/spec-all-dem-1-01',
  commentaires: [],
  tete: V1,
  exiges: 1,
  sensible: false,
  memeContenu: {},
  maintenant: DEBUT + 30 * 60_000,
  ...champs,
});
const joue = (champs) => decider(pr(champs));
const LIGNES = (texte) => [
  { a: 'auteur', session: 'session_auteur', texte },
  { a: 'conducteur', session: 'session_conducteur', texte },
];
const RIEN_EN_PLACE = (regle) => ({ regle, geste: 'rien', raison: 'etiquette-en-place' });
const HORS_FILE = { regle: null, geste: 'rien', raison: 'hors-file' };
const comptes = (champs) => {
  const e = pr(champs);
  return tours(lireMarques(e.commentaires), e).filter((t) => t.compte).length;
};

test('H1 — nominal, validé : distribution (r6), attente (r5), `à-fusionner` et une ligne (r2), puis rien à chaque veille', () => {
  assert.deepEqual(joue({ commentaires: fil(DEMANDE()) }), { regle: 6, geste: 'distribuer', tour: 1, sommet: V1, nombre: 1, preferees: [], mention: null });
  const distribue = [DEMANDE(), D(1, V1, ['r1'])];
  assert.deepEqual(joue({ commentaires: fil(...distribue) }), { regle: 5, geste: 'rien', raison: 'attente', attendues: ['r1'], echeance: DEBUT + 60_000 + 2 * H });
  const valide = fil(...distribue, verdict(1, 'r1', 'validé'));
  assert.deepEqual(joue({ commentaires: valide }), { regle: 2, geste: 'etiqueter', poser: 'à-fusionner', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : validé') });
  // Les deux étiquettes un instant (la nouvelle posée, l'ancienne pas encore retirée) : le geste se finit.
  assert.deepEqual(joue({ commentaires: valide, etiquettes: ['à-relire', 'à-fusionner'] }).retirer, ['à-relire']);
  // La PR attend le capitaine : rien, donc aucune ligne, à chaque veille.
  assert.deepEqual(joue({ commentaires: valide, etiquettes: ['à-fusionner'] }), RIEN_EN_PLACE(2));
  assert.deepEqual(joue({ commentaires: valide, etiquettes: ['à-fusionner', 'prio:haute'], maintenant: DEBUT + 50 * H }), RIEN_EN_PLACE(2));
});

test('H2 — refusé, corrigé et poussé, validé : `à-reprendre` (r4), tour 2 aux mêmes sessions (r6), `à-fusionner` (r2) ; un tour compté', () => {
  const refuse = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé')];
  assert.deepEqual(joue({ commentaires: fil(...refuse) }), { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : refusé') });
  assert.deepEqual(joue({ commentaires: fil(...refuse), etiquettes: ['à-reprendre'] }), HORS_FILE);
  // L'auteur corrige, pousse V2 et repose `à-relire` : le tour 1 ne porte plus sur le contenu de la tête.
  const pousse = [...refuse, DEMANDE(V2)];
  assert.deepEqual(joue({ commentaires: fil(...pousse), tete: V2 }), { regle: 6, geste: 'distribuer', tour: 2, sommet: V2, nombre: 1, preferees: ['r1'], mention: null });
  const valide = fil(...pousse, D(2, V2, ['r1']), verdict(2, 'r1', 'validé', { sommet: V2 }));
  assert.equal(joue({ commentaires: valide, tete: V2 }).regle, 2);
  assert.equal(joue({ commentaires: valide, tete: V2 }).poser, 'à-fusionner');
  assert.equal(comptes({ commentaires: valide, tete: V2 }), 1);
});

test("H3 — refusé, redemandé sans pousser, ou avec un index seul, ou la base fusionnée dans la branche : `à-reprendre` à chaque demande (r4)", () => {
  const refuse = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), DEMANDE());
  assert.deepEqual(joue({ commentaires: refuse }), { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : refusé') });
  // La tête a bougé sans changer de contenu propre (index régénéré, base fusionnée) : même réponse.
  assert.equal(joue({ commentaires: refuse, tete: T, memeContenu: { [V1]: true } }).regle, 4);
  assert.equal(joue({ commentaires: refuse, tete: T, memeContenu: { [V1]: true } }).poser, 'à-reprendre');
  // Sans la réponse « même », la tête n'a pas de tour : la PR se relit.
  assert.equal(joue({ commentaires: refuse, tete: T }).regle, 6);
  assert.equal(joue({ commentaires: refuse, tete: T, memeContenu: { [V1]: false } }).regle, 6);
});

test('H4 — contestation écartée, tête inchangée : un tour neuf non compté aux mêmes sessions (r4), une seule fois, puis la règle 5 reprend la main', () => {
  const conteste = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), 'Contesté — R3, src/a.ts:12 — le garde filtre déjà', ECARTE, DEMANDE()];
  assert.deepEqual(joue({ commentaires: fil(...conteste) }), { regle: 4, geste: 'distribuer', tour: 2, sommet: V1, nombre: 1, preferees: ['r1'], mention: MENTION_ARBITRAGE });
  // À la veille suivante, avant le nouveau verdict : la reprise ne se rejoue pas (le défaut BQ2 de la quatrième relecture).
  const repris = [...conteste, D(2, V1, ['r1'], MENTION_ARBITRAGE)];
  assert.deepEqual(joue({ commentaires: fil(...repris) }), { regle: 5, geste: 'rien', raison: 'attente', attendues: ['r1'], echeance: DEBUT + 6 * 60_000 + 2 * H });
  // La session de la reprise est morte : la règle 5 est atteinte, elle la remplace.
  assert.deepEqual(joue({ commentaires: fil(...repris), sessions: { r1: 'morte' } }), { regle: 5, geste: 'remplacer', tour: 2, sommet: V1, sessions: ['r1'], session: 'r1', cause: 'morte' });
  assert.equal(joue({ commentaires: fil(...repris, verdict(2, 'r1', 'validé')) }).poser, 'à-fusionner');
  // Refusée de nouveau : l'arbitrage n'est plus « plus récent que le dernier verdict du tour », et la reprise ne compte pas.
  const encore = fil(...repris, verdict(2, 'r1', 'refusé'));
  assert.deepEqual(joue({ commentaires: encore }), { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : refusé') });
  assert.equal(comptes({ commentaires: encore }), 1);
});

test('H5 — contestation maintenue : `à-reprendre` (r4) ; après correction, tour 2 ordinaire (r6) ; un tour compté', () => {
  const maintenu = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), MAINTENU, DEMANDE()];
  assert.deepEqual(joue({ commentaires: fil(...maintenu) }), { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : refusé') });
  assert.deepEqual(joue({ commentaires: fil(...maintenu, DEMANDE(V2)), tete: V2 }), { regle: 6, geste: 'distribuer', tour: 2, sommet: V2, nombre: 1, preferees: ['r1'], mention: null });
  assert.equal(comptes({ commentaires: fil(...maintenu, DEMANDE(V2)), tete: V2 }), 1);
});

test('H6 — un bloquant écarté, un autre corrigé et poussé : tour 2 ordinaire (r6), compté comme un autre', () => {
  const pousse = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé', { bloquants: 2 }), ECARTE, DEMANDE(V2)];
  assert.deepEqual(joue({ commentaires: fil(...pousse), tete: V2 }), { regle: 6, geste: 'distribuer', tour: 2, sommet: V2, nombre: 1, preferees: ['r1'], mention: null });
  const refuse = fil(...pousse, D(2, V2, ['r1']), verdict(2, 'r1', 'refusé', { sommet: V2 }));
  assert.equal(comptes({ commentaires: refuse, tete: V2 }), 2);
});

test("H7 — deux verdicts exigés, R1 a rendu, pas R2 : attente (r5), puis R2 remplacée, le verdict de R1 reste ; R1 a refusé : `à-reprendre` sans attendre", () => {
  const double = { exiges: 2 };
  const un = [DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'validé')];
  assert.deepEqual(joue({ ...double, commentaires: fil(...un) }), { regle: 5, geste: 'rien', raison: 'attente', attendues: ['r2'], echeance: DEBUT + 60_000 + 2 * H });
  assert.deepEqual(joue({ ...double, commentaires: fil(...un), maintenant: DEBUT + 60_000 + 2 * H + 1 }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1', 'r2'], session: 'r2', cause: 'muette' });
  const remplace = [...un, { corps: D(1, V1, ['r1', 'r3'], 'remplace', 'r2'), a: 125 }];
  assert.deepEqual(joue({ ...double, commentaires: fil(...remplace), maintenant: DEBUT + 130 * 60_000 }), { regle: 5, geste: 'rien', raison: 'attente', attendues: ['r3'], echeance: DEBUT + 125 * 60_000 + 2 * H });
  // Le verdict tardif de la session remplacée est ignoré ; celui de la remplaçante valide le tour avec celui de R1.
  assert.equal(joue({ ...double, commentaires: fil(...remplace, verdict(1, 'r2', 'validé')), maintenant: DEBUT + 130 * 60_000 }).raison, 'attente');
  assert.deepEqual(joue({ ...double, commentaires: fil(...remplace, verdict(1, 'r3', 'validé')), maintenant: DEBUT + 130 * 60_000 }), {
    regle: 2,
    geste: 'etiqueter',
    poser: 'à-fusionner',
    retirer: ['à-relire'],
    lignes: LIGNES('verdict écrit sur la PR 12 : validé, double'),
  });
  // Un refus suffit : le tour est refusé dès qu'un de ses verdicts l'est, sans attendre R2.
  const refus = joue({ ...double, commentaires: fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'refusé')) });
  assert.deepEqual([refus.regle, refus.poser, refus.lignes[0].texte], [4, 'à-reprendre', 'verdict écrit sur la PR 12 : refusé, double']);
  // Deux verdicts validés de la même session ne font pas deux sessions.
  assert.equal(joue({ ...double, commentaires: fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'validé'), verdict(1, 'r1', 'validé')) }).raison, 'attente');
});

test("H8 — relecture plus longue que `relecture.delai` : un remplacement par tour, puis `Relecture en panne` une fois, puis rien ; le verdict tardif de la remplaçante compte", () => {
  const distribue = [DEMANDE(), D(1, V1, ['r1'])];
  const limite = DEBUT + 60_000 + 2 * H;
  assert.equal(joue({ commentaires: fil(...distribue), maintenant: limite }).raison, 'attente', "à l'échéance exacte, la session n'est pas encore muette");
  assert.deepEqual(joue({ commentaires: fil(...distribue), maintenant: limite + 1 }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1', cause: 'muette' });
  assert.equal(joue({ commentaires: fil(...distribue), maintenant: DEBUT + 32 * 60_000, delaiMs: 30 * 60_000 }).geste, 'remplacer', '`relecture.delai` est une entrée');
  const remplace = [...distribue, { corps: D(1, V1, ['r2'], 'remplace', 'r1'), a: 125 }];
  const seconde = DEBUT + 125 * 60_000 + 2 * H;
  assert.equal(joue({ commentaires: fil(...remplace), maintenant: seconde }).raison, 'attente', "l'horloge de la remplaçante part de son remplacement");
  assert.deepEqual(joue({ commentaires: fil(...remplace), maintenant: seconde + 1 }), {
    regle: 5,
    geste: 'panne',
    tour: 1,
    sommet: V1,
    sessions: ['r2'],
    commentaire: TEXTE_PANNE,
    lignes: [
      { a: 'architecte', session: null, texte: 'PR 12 : relecture en panne' },
      { a: 'auteur', session: 'session_auteur', texte: 'PR 12 : relecture en panne' },
      { a: 'conducteur', session: 'session_conducteur', texte: 'PR 12 : relecture en panne' },
    ],
  });
  const signale = [...remplace, { corps: TEXTE_PANNE, a: 250 }];
  assert.deepEqual(joue({ commentaires: fil(...signale), maintenant: seconde + 9 * H }), { regle: 5, geste: 'rien', raison: 'panne-signalee' });
  assert.equal(joue({ commentaires: fil(...signale, verdict(1, 'r1', 'validé')), maintenant: seconde + 9 * H }).raison, 'panne-signalee', 'le verdict de la session remplacée reste ignoré');
  assert.equal(joue({ commentaires: fil(...signale, verdict(1, 'r2', 'validé')), maintenant: seconde + 9 * H }).poser, 'à-fusionner');
});

test("H9 — l'auteur pousse pendant le tour 1 : le tour est abandonné, tour 2 aux mêmes sessions (r6) ; le refus tardif du tour 1 ne le rouvre pas et ne compte pas", () => {
  const pousse = [DEMANDE(), D(1, V1, ['r1']), DEMANDE(V2)];
  assert.deepEqual(joue({ commentaires: fil(...pousse), tete: V2 }), { regle: 6, geste: 'distribuer', tour: 2, sommet: V2, nombre: 1, preferees: ['r1'], mention: null });
  const e = pr({ commentaires: fil(...pousse), tete: V2 });
  assert.equal(tours(lireMarques(e.commentaires), e)[0].etat, 'abandonne');
  const tardif = fil(...pousse, D(2, V2, ['r1']), verdict(1, 'r1', 'refusé'));
  assert.equal(joue({ commentaires: tardif, tete: V2 }).raison, 'attente');
  assert.equal(comptes({ commentaires: tardif, tete: V2 }), 0);
  const refuse = fil(...pousse, D(2, V2, ['r1']), verdict(1, 'r1', 'refusé'), verdict(2, 'r1', 'refusé', { sommet: V2 }));
  assert.equal(joue({ commentaires: refuse, tete: V2 }).poser, 'à-reprendre');
  assert.equal(comptes({ commentaires: refuse, tete: V2 }), 1);
});

test("H10 — étiquette effacée par une écriture croisée : la PR n'est plus dans la file du Relecteur, la fonction ne rend rien", () => {
  const valide = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'));
  for (const etiquettes of [[], ['prio:haute'], ['à-reprendre'], ['fusion-bloquée'], ['à-reprendre', 'fusion-bloquée']]) assert.deepEqual(joue({ commentaires: valide, etiquettes }), HORS_FILE, etiquettes.join(','));
});

test("H11 — trois refus : le plafond tombe au troisième refus (r1), puis `à-reprendre` tant qu'il n'y a pas de décision, même après une poussée (r1) ; après la décision le compte repart de zéro", () => {
  const troisRefus = [
    DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'),
    DEMANDE(V2), D(2, V2, ['r1']), verdict(2, 'r1', 'refusé', { sommet: V2 }),
    DEMANDE(V3), D(3, V3, ['r1']), verdict(3, 'r1', 'refusé', { sommet: V3 }),
  ];
  assert.equal(joue({ commentaires: fil(...troisRefus.slice(0, 6)), tete: V2 }).geste, 'etiqueter', 'deux refus : sous le plafond');
  assert.deepEqual(joue({ commentaires: fil(...troisRefus), tete: V3 }), {
    regle: 1,
    geste: 'plafonner',
    commentaire: TEXTE_PLAFOND,
    poser: 'à-reprendre',
    retirer: ['à-relire'],
    lignes: [
      { a: 'auteur', session: 'session_auteur', texte: 'verdict écrit sur la PR 12 : refusé' },
      { a: 'conducteur', session: 'session_conducteur', texte: 'PR 12 : plafond atteint au troisième tour refusé, décision attendue' },
      { a: 'architecte', session: null, texte: 'PR 12 : plafond atteint au troisième tour refusé, décision attendue' },
    ],
  });
  const plafond = [...troisRefus, TEXTE_PLAFOND];
  assert.deepEqual(joue({ commentaires: fil(...plafond), tete: V3, etiquettes: ['à-reprendre'] }), HORS_FILE);
  // L'auteur corrige une quatrième fois et redemande : rien n'est distribué avant la décision.
  assert.deepEqual(joue({ commentaires: fil(...plafond, DEMANDE(V4)), tete: V4 }), { regle: 1, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-relire'], lignes: LIGNES('PR 12 : décision de plafond attendue') });
  // Après la décision : tête changée, un tour ordinaire, et le compte repart de zéro.
  const decide = [...plafond, DECISION, DEMANDE(V4)];
  assert.deepEqual(joue({ commentaires: fil(...decide), tete: V4 }), { regle: 6, geste: 'distribuer', tour: 4, sommet: V4, nombre: 1, preferees: ['r1'], mention: null });
  const quatrieme = fil(...decide, D(4, V4, ['r1']), verdict(4, 'r1', 'refusé', { sommet: V4 }));
  assert.equal(comptes({ commentaires: quatrieme, tete: V4 }), 1);
  assert.equal(joue({ commentaires: quatrieme, tete: V4 }).geste, 'etiqueter');
  // Après la décision, tête inchangée : le tour 3 n'est plus compté ; sans bloquant écarté, `à-reprendre` ; avec, une reprise non comptée.
  assert.deepEqual([joue({ commentaires: fil(...plafond, DECISION, DEMANDE(V3)), tete: V3 }).regle, joue({ commentaires: fil(...plafond, DECISION, DEMANDE(V3)), tete: V3 }).geste], [4, 'etiqueter']);
  const ecarte = fil(...plafond, `${DECISION}\n${ECARTE}`, DEMANDE(V3));
  assert.deepEqual(joue({ commentaires: ecarte, tete: V3 }), { regle: 4, geste: 'distribuer', tour: 4, sommet: V3, nombre: 1, preferees: ['r1'], mention: MENTION_ARBITRAGE });
  // Un second plafond après une décision : le plus récent des deux commentaires fait foi.
  assert.equal(joue({ commentaires: fil(...plafond, DECISION, TEXTE_PLAFOND, DEMANDE(V4)), tete: V4 }).regle, 1);
});

test("H12 — Relecteur relancé à neuf, session orpheline : la file se reprend sur les seuls commentaires, le verdict de l'orpheline est ignoré", () => {
  // La session créée n'a été nommée par aucune distribution : son verdict ne fait pas un tour.
  const orpheline = fil(DEMANDE(), verdict(1, 'orpheline', 'validé'));
  assert.deepEqual(joue({ commentaires: orpheline }), { regle: 6, geste: 'distribuer', tour: 1, sommet: V1, nombre: 1, preferees: [], mention: null });
  // Relancé en plein tour : la distribution nomme r1, l'orpheline a rendu un verdict au même numéro.
  const enCours = fil(DEMANDE(), verdict(1, 'orpheline', 'validé'), D(1, V1, ['r1']));
  assert.deepEqual(joue({ commentaires: enCours }), { regle: 5, geste: 'rien', raison: 'attente', attendues: ['r1'], echeance: DEBUT + 2 * 60_000 + 2 * H });
  assert.equal(joue({ commentaires: fil(DEMANDE(), verdict(1, 'orpheline', 'refusé'), D(1, V1, ['r1'])) }).raison, 'attente');
  assert.equal(joue({ commentaires: fil(DEMANDE(), verdict(1, 'orpheline', 'validé'), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')) }).poser, 'à-fusionner');
});

test("H13 — un axe « non exécuté » : le verdict `incomplet` laisse le tour en cours, la session est relancée une fois (r5), le tour ne compte pas", () => {
  const incomplet = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'incomplet')];
  assert.deepEqual(joue({ commentaires: fil(...incomplet) }), { regle: 5, geste: 'reecrire', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1' });
  assert.equal(comptes({ commentaires: fil(...incomplet) }), 0);
  // La relance est tracée : elle ne se rejoue pas, et la session est attendue depuis elle.
  const relance = [...incomplet, { corps: D(1, V1, ['r1'], 'relance', 'r1'), a: 60 }];
  assert.deepEqual(joue({ commentaires: fil(...relance), maintenant: DEBUT + 90 * 60_000 }), { regle: 5, geste: 'rien', raison: 'attente', attendues: ['r1'], echeance: DEBUT + 60 * 60_000 + 2 * H });
  assert.equal(joue({ commentaires: fil(...relance, verdict(1, 'r1', 'validé')), maintenant: DEBUT + 90 * 60_000 }).poser, 'à-fusionner');
  // Incomplet une seconde fois : la session est en panne, elle est remplacée (une fois par tour).
  assert.deepEqual(joue({ commentaires: fil(...relance, verdict(1, 'r1', 'incomplet')), maintenant: DEBUT + 90 * 60_000 }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1', cause: 'incomplet-deux-fois' });
  // Une session morte ne se relance pas.
  assert.equal(joue({ commentaires: fil(...incomplet), sessions: { r1: 'plafond' } }).geste, 'remplacer');
});

test("H14 — règle montée à haute après un tour validé à un verdict : le tour redevient en cours ; le Relecteur repose lui-même `à-relire` (r3, cause c), puis ajoute une session (r5), sans détour par l'auteur", () => {
  const valide = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'));
  assert.deepEqual(joue({ commentaires: valide, etiquettes: ['à-fusionner'] }), RIEN_EN_PLACE(2));
  assert.equal(tourValide({ ...pr({ commentaires: valide }), exiges: 2 }), null, 'le capitaine, qui refait le calcul, ne voit plus de tour validé');
  assert.deepEqual(joue({ commentaires: valide, etiquettes: ['à-fusionner'], exiges: 2 }), {
    regle: 3,
    geste: 'etiqueter',
    poser: 'à-relire',
    retirer: ['à-fusionner'],
    lignes: LIGNES('PR 12 : une seconde relecture est exigée : règle passée à haute'),
  });
  // Au passage suivant, sur le même fil : l'auteur n'a rien écrit, la règle 5 ajoute la session.
  assert.deepEqual(joue({ commentaires: valide, exiges: 2 }), { regle: 5, geste: 'completer', tour: 1, sommet: V1, sessions: ['r1'], manque: 1 });
  const complete = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'), D(1, V1, ['r1', 'r2'], 'complète'), verdict(1, 'r2', 'validé'));
  assert.deepEqual(joue({ commentaires: complete, exiges: 2 }).lignes, LIGNES('verdict écrit sur la PR 12 : validé, double'));
  // Le nombre écrit dans la distribution n'est qu'une information : c'est `exiges` qui juge.
  assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'validé')), exiges: 1 }).poser, 'à-fusionner');
});

test('H15 — renvoi du capitaine pour un contrôle instable : `fusion-bloquée` seule, rien ; `à-relire` reposée sans changement, `à-fusionner` (r2)', () => {
  const valide = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'), 'à-fusionner retiré par le capitaine : contrôle rouge : bancs', DEMANDE());
  assert.deepEqual(joue({ commentaires: valide, etiquettes: ['fusion-bloquée'] }), HORS_FILE);
  assert.deepEqual(joue({ commentaires: valide }), { regle: 2, geste: 'etiqueter', poser: 'à-fusionner', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : validé') });
  assert.deepEqual(joue({ commentaires: valide, etiquettes: ['à-relire', 'fusion-bloquée'] }).retirer, ['à-relire', 'fusion-bloquée']);
});

test("H16 — sous-PR mise à jour par le capitaine : « même contenu propre » rendu vrai, la PR garde son verdict (r2, rien) ; rendu faux ou absent, `à-reprendre` (r3)", () => {
  const valide = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'), `Passage du capitaine \`cap-1\` depuis 10:04 UTC, tour 2\n<!-- capitaine:passage cap-1 -->\n\n---\n${PIED}`);
  const mise = { commentaires: valide, etiquettes: ['à-fusionner'], tete: T };
  assert.deepEqual(joue({ ...mise, memeContenu: { [V1]: true } }), { regle: 2, geste: 'noter', note: { tour: 1, sommet: V1, verdict: 'validé' }, lignes: [] });
  assert.equal(tourValide(pr({ ...mise, memeContenu: { [V1]: true } })).numero, 1, 'le capitaine juge par la même définition');
  for (const memeContenu of [{}, { [V1]: false }, { [V1]: 'même' }, { [V1]: 1 }]) {
    assert.equal(joue({ ...mise, memeContenu }).regle, 3, JSON.stringify(memeContenu));
    assert.equal(tourValide(pr({ ...mise, memeContenu })), null);
  }
  assert.deepEqual(sommetsDesTours(valide), [V1]);
});

test("H17 — PR écrite en régime 7 dont la base passe en 8 : `à-fusionner` sans verdict, `à-reprendre` (r3) ; sans commentaire `À relire`, la ligne n'a pas de destinataire", () => {
  assert.deepEqual(joue({ etiquettes: ['à-fusionner'], commentaires: fil('## Revue de ticket\n\naucun écart') }), {
    regle: 3,
    geste: 'etiqueter',
    poser: 'à-reprendre',
    retirer: ['à-fusionner'],
    lignes: [
      { a: 'auteur', session: null, texte: 'PR 12 : le contenu a changé depuis le verdict : redemander la relecture' },
      { a: 'conducteur', session: null, texte: 'PR 12 : le contenu a changé depuis le verdict : redemander la relecture' },
    ],
  });
  // `Session: —` et `Conducteur: —` (une PR écrite par une personne) : pas de destinataire non plus.
  const sans = joue({ etiquettes: ['à-fusionner'], commentaires: fil(`À relire — sommet ${V1} — Session: — — Conducteur: —`) });
  assert.deepEqual(sans.lignes.map((l) => l.session), [null, null]);
});

// --- Sixième version -------------------------------------------------------------------------------------------

test("A-110 — la règle 3 se décide par cause : contenu changé (a), refus tardif renvoyé à la règle 4, ou au plafond de la règle 1 (b), tour en cours sans changement ni refus, trois lignes selon le fait (c)", () => {
  const AF = ['à-fusionner'];
  const CHANGE = LIGNES('PR 12 : le contenu a changé depuis le verdict : redemander la relecture');
  const valide = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')];
  // (a) Le contenu propre a changé depuis le verdict : `à-reprendre`, la ligne du contenu changé.
  assert.deepEqual(joue({ commentaires: fil(...valide), etiquettes: AF, tete: T }), { regle: 3, geste: 'etiqueter', poser: 'à-reprendre', retirer: AF, lignes: CHANGE });
  assert.deepEqual(joue({ commentaires: fil(...valide), etiquettes: AF, tete: T, exiges: 2, sensible: true }).lignes, CHANGE, 'le contenu changé passe avant toute autre cause');
  // (a) aussi quand la tête n'a aucun tour : `à-fusionner` posée sans relecture.
  assert.deepEqual(joue({ commentaires: fil(DEMANDE()), etiquettes: AF }), { regle: 3, geste: 'etiqueter', poser: 'à-reprendre', retirer: AF, lignes: CHANGE });
  // (b) Un `refusé` arrivé après la validation : la règle 3 ne décide rien elle-même, la suite est celle de tout tour refusé
  // (règle 4) : `à-fusionner` retirée, `à-reprendre`, la ligne du refus, pas celle du contenu changé.
  const tardif = fil(...valide, verdict(1, 'r1', 'refusé'));
  assert.deepEqual(joue({ commentaires: tardif, etiquettes: AF }), { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: AF, lignes: LIGNES('verdict écrit sur la PR 12 : refusé') });
  assert.deepEqual(joue({ commentaires: tardif, etiquettes: AF, tete: T, memeContenu: { [V1]: true } }).lignes, LIGNES('verdict écrit sur la PR 12 : refusé'), 'la tête a bougé sans changer de contenu : toujours le refus');
  const tardifDouble = fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'validé'), verdict(1, 'r2', 'validé'), verdict(1, 'r2', 'refusé'));
  assert.deepEqual(joue({ commentaires: tardifDouble, etiquettes: AF, exiges: 2 }).lignes, LIGNES('verdict écrit sur la PR 12 : refusé, double'));
  // (b) Le refus tardif est le troisième tour compté : c'est le plafond, décidé au seul endroit qui le décide (règle 1), et
  // aucun quatrième tour ne part, même si l'auteur pousse ensuite.
  const troisieme = [
    DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'),
    DEMANDE(V2), D(2, V2, ['r1']), verdict(2, 'r1', 'refusé', { sommet: V2 }),
    DEMANDE(V3), D(3, V3, ['r1']), verdict(3, 'r1', 'validé', { sommet: V3 }), verdict(3, 'r1', 'refusé', { sommet: V3 }),
  ];
  assert.deepEqual(joue({ commentaires: fil(...troisieme), etiquettes: AF, tete: V3 }), {
    regle: 1,
    geste: 'plafonner',
    commentaire: TEXTE_PLAFOND,
    poser: 'à-reprendre',
    retirer: AF,
    lignes: [
      { a: 'auteur', session: 'session_auteur', texte: 'verdict écrit sur la PR 12 : refusé' },
      { a: 'conducteur', session: 'session_conducteur', texte: 'PR 12 : plafond atteint au troisième tour refusé, décision attendue' },
      { a: 'architecte', session: null, texte: 'PR 12 : plafond atteint au troisième tour refusé, décision attendue' },
    ],
  });
  const pousse = joue({ commentaires: fil(...troisieme, TEXTE_PLAFOND, DEMANDE(V4)), tete: V4 });
  assert.deepEqual([pousse.regle, pousse.geste, pousse.poser], [1, 'etiqueter', 'à-reprendre'], 'après le plafond, une poussée ne fait pas partir un quatrième tour');
  // (b) Un arbitrage écarté sur une PR encore `à-fusionner` : `à-reprendre` d'abord ; la reprise non comptée attend la demande de l'auteur.
  const arbitre = fil(...valide, verdict(1, 'r1', 'refusé'), ECARTE);
  assert.deepEqual(joue({ commentaires: arbitre, etiquettes: AF }), { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: AF, lignes: LIGNES('verdict écrit sur la PR 12 : refusé') });
  assert.deepEqual(joue({ commentaires: arbitre }), { regle: 4, geste: 'distribuer', tour: 2, sommet: V1, nombre: 1, preferees: ['r1'], mention: MENTION_ARBITRAGE });
  // (c), première ligne. Double relecture devenue exigée : le Relecteur pose lui-même `à-relire`, et dit la vraie cause.
  const exigee = { regle: 3, geste: 'etiqueter', poser: 'à-relire', retirer: AF, lignes: LIGNES('PR 12 : une seconde relecture est exigée : règle passée à haute') };
  assert.deepEqual(joue({ commentaires: fil(...valide), etiquettes: AF, exiges: 2 }), exigee);
  assert.deepEqual(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'validé')), etiquettes: AF, exiges: 2 }), exigee, 'la seconde session est nommée mais n\'a rien rendu');
  // (c), deuxième ligne. Un verdict du tour se lit `incomplet` : chemin devenu sensible, ou dernier verdict de la session illisible.
  const incomplete = { regle: 3, geste: 'etiqueter', poser: 'à-relire', retirer: AF, lignes: LIGNES('PR 12 : relecture incomplète') };
  assert.deepEqual(joue({ commentaires: fil(...valide), etiquettes: AF, sensible: true }), incomplete);
  assert.deepEqual(joue({ commentaires: fil(...valide, verdict(1, 'r1', 'incomplet')), etiquettes: AF }), incomplete);
  assert.deepEqual(joue({ commentaires: fil(...valide, verdict(1, 'r1', 'validé').replace('Verdict: validé', 'Verdict: ok')), etiquettes: AF }), incomplete);
  assert.deepEqual(joue({ commentaires: fil(...valide), etiquettes: AF, exiges: 2, sensible: true }), incomplete, 'les deux causes à la fois : la relecture incomplète se dit d\'abord');
  // (c), troisième ligne. Le tour n'a jamais été validé : l'étiquette a été posée par un autre que le Relecteur.
  const jamais = { regle: 3, geste: 'etiqueter', poser: 'à-relire', retirer: AF, lignes: LIGNES('PR 12 : étiquette `à-fusionner` posée sans relecture validée') };
  assert.deepEqual(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1'])), etiquettes: AF }), jamais, 'aucun verdict');
  assert.deepEqual(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'incomplet')), etiquettes: AF }), jamais, "un seul verdict, `incomplet` : jamais validé se dit avant incomplet");
  assert.deepEqual(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1', 'r2'])), etiquettes: AF, exiges: 2 }), jamais, 'deux exigés, aucun verdict : pas « règle passée à haute »');
  assert.deepEqual(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'orpheline', 'validé'), verdict(1, 'r1', 'validé', { sommet: V2 })), etiquettes: AF }), jamais, "le `validé` d'une session non nommée, ou sur un autre sommet, n'a jamais validé le tour");
  // (c), la suite : `à-relire` posée, la règle 5 relance ou complète au passage suivant, sans rien de l'auteur.
  assert.deepEqual(joue({ commentaires: fil(...valide), sensible: true }), { regle: 5, geste: 'reecrire', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1' });
  assert.equal(joue({ commentaires: fil(...valide), exiges: 2 }).geste, 'completer');
  // Les deux étiquettes un instant (`à-relire` posée, `à-fusionner` pas encore retirée) : le geste se finit.
  assert.deepEqual(joue({ commentaires: fil(...valide), etiquettes: ['à-relire', 'à-fusionner'], exiges: 2 }), exigee);
  // Le capitaine, lui, ne voit de tour validé dans aucun de ces cas.
  for (const champs of [{ tete: T }, { commentaires: tardif }, { exiges: 2 }, { sensible: true }]) assert.equal(tourValide(pr({ commentaires: fil(...valide), ...champs })), null, JSON.stringify(Object.keys(champs)));
});

test("A-107 — sur un chemin sensible, un verdict sans la ligne « /security-review: lancée » se lit `incomplet`, pour le Relecteur comme pour le capitaine", () => {
  const avec = (securite, mot = 'validé') => fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', mot, { securite }));
  for (const securite of [null, 'non requise']) {
    assert.equal(joue({ sensible: true, commentaires: avec(securite) }).geste, 'reecrire', String(securite));
    assert.equal(tourValide(pr({ sensible: true, commentaires: avec(securite) })), null, String(securite));
    assert.deepEqual(joue({ sensible: true, commentaires: avec(securite), etiquettes: ['à-fusionner'] }), { regle: 3, geste: 'etiqueter', poser: 'à-relire', retirer: ['à-fusionner'], lignes: LIGNES('PR 12 : relecture incomplète') }, String(securite));
    assert.equal(joue({ sensible: false, commentaires: avec(securite) }).poser, 'à-fusionner', 'hors chemin sensible, la ligne n\'est pas exigée');
    assert.equal(joue({ sensible: true, commentaires: avec(securite, 'refusé') }).poser, 'à-reprendre', 'un refus sans la ligne reste un refus (ticket 66)');
  }
  assert.equal(joue({ sensible: true, commentaires: avec('lancée') }).poser, 'à-fusionner');
  assert.equal(tourValide(pr({ sensible: true, commentaires: avec('lancée') })).numero, 1);
  assert.equal(joue({ sensible: true, commentaires: avec('lancée', 'refusé') }).poser, 'à-reprendre');
});

test("A-85, A-108 — seuls les commentaires à marque comptent : le commentaire de passage d'un capitaine, un commentaire édité, celui d'un compte sans droit sont ignorés", () => {
  const passage = (texte, edite) => ({ corps: `${texte}\n<!-- capitaine:passage cap-1 -->`, edite });
  const base = [DEMANDE(), passage('Passage du capitaine `cap-1` depuis 10:01 UTC', false), D(1, V1, ['r1']), passage('Passage du capitaine `cap-1` terminé à 10:03 UTC.', true)];
  assert.equal(joue({ commentaires: fil(...base) }).raison, 'attente');
  const m = lireMarques(fil(...base, verdict(1, 'r1', 'validé')));
  assert.deepEqual([m.demandes.length, m.distributions.length, m.verdicts.length, m.plafonds.length, m.decisions.length, m.arbitragesEcartes.length, m.pannes.length], [1, 1, 1, 0, 0, 0, 0]);
  // Un verdict édité, ou d'un compte sans droit, ne valide rien ; une distribution, un plafond, un arbitrage non plus.
  for (const hors of [{ edite: true }, { de: 'NONE' }, { de: 'CONTRIBUTOR' }]) {
    assert.equal(joue({ commentaires: fil(...base, { corps: verdict(1, 'r1', 'validé'), ...hors }) }).raison, 'attente', JSON.stringify(hors));
    assert.equal(joue({ commentaires: fil(DEMANDE(), { corps: D(1, V1, ['r1']), ...hors }) }).regle, 6, JSON.stringify(hors));
    assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'), { corps: TEXTE_PLAFOND, ...hors }) }).regle, 2, JSON.stringify(hors));
    assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), { corps: ECARTE, ...hors }) }).geste, 'etiqueter', JSON.stringify(hors));
  }
  // Les formes voisines ne sont pas des marques.
  for (const voisin of [
    `Relecture - tour 1 - sommet ${V1} - sessions r1`,
    `Relecture — tour 1 — sommet ${V1.slice(0, 7)} — sessions r1`,
    `Relecture — tour 0 — sommet ${V1} — sessions r1`,
    `Relecture — tour 1 — sommet ${V1} — sessions`,
    `Relecture — tour 1 — sommet ${V1} — sessions r1 (remplace)`,
    `Relecture — tour 1 — sommet ${V1} — sessions r1 (autre)`,
    `> Relecture — tour 1 — sommet ${V1} — sessions r1`,
    `Relecture — tour 1 — sommet ${V1} — sessions r1\nmerci`,
  ])
    assert.equal(lireDistribution(voisin), null, voisin);
  assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), `> ${ECARTE}`, `Contesté — R3 — x\n${ECARTE}`, MAINTENU) }).geste, 'etiqueter', "un arbitrage cité, glissé dans une contestation, ou maintenu n'écarte rien");
  assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'), 'Plafond : décision attendue', '> Plafond — décision attendue', 'Au sujet du plafond — décision attendue') }).regle, 2, 'sans le préfixe en tête, ce ne sont pas des marques');
});

// --- La relecture adversariale du ticket (A-115), et les entrées illisibles (A-113) ---------------------------

test("A-115 — le plafond tient dès trois tours comptés, que la tête ait changé ou non : aucun quatrième tour sans décision", () => {
  const refus = (k, v) => [DEMANDE(v), D(k, v, ['r1']), verdict(k, 'r1', 'refusé', { sommet: v })];
  const trois = [...refus(1, V1), ...refus(2, V2), ...refus(3, V3)];
  const PLAFONNE = {
    regle: 1,
    geste: 'plafonner',
    commentaire: TEXTE_PLAFOND,
    poser: 'à-reprendre',
    retirer: ['à-relire'],
    lignes: [
      { a: 'auteur', session: 'session_auteur', texte: 'verdict écrit sur la PR 12 : refusé' },
      { a: 'conducteur', session: 'session_conducteur', texte: 'PR 12 : plafond atteint au troisième tour refusé, décision attendue' },
      { a: 'architecte', session: null, texte: 'PR 12 : plafond atteint au troisième tour refusé, décision attendue' },
    ],
  };
  // L'auteur pousse V4 et redemande avant le réveil du Relecteur : le plafond, pas un tour 4.
  assert.deepEqual(joue({ commentaires: fil(...trois, DEMANDE(V4)), tete: V4 }), PLAFONNE);
  assert.deepEqual(joue({ commentaires: fil(...trois), tete: V3 }), PLAFONNE, 'tête inchangée : le même geste');
  // Quatre tours comptés (un fil d'avant cette règle) : toujours le plafond. « Trois ou plus », pas « trois ».
  const quatre = [...trois, ...refus(4, V4)];
  assert.equal(comptes({ commentaires: fil(...quatre, DEMANDE(V5)), tete: V5 }), 4);
  assert.deepEqual(joue({ commentaires: fil(...quatre, DEMANDE(V5)), tete: V5 }), PLAFONNE);
  assert.equal(joue({ commentaires: fil(...quatre), tete: V4 }).geste, 'plafonner');
  // Deux tours comptés : la tête changée se redistribue.
  assert.equal(joue({ commentaires: fil(...trois.slice(0, 6), DEMANDE(V3)), tete: V3 }).regle, 6);
  // Une décision de plafond d'un compte sans droit, ou éditée, ne lève rien ; une vraie remet le compte à zéro.
  for (const hors of [{ de: 'NONE' }, { edite: true }]) {
    assert.equal(joue({ commentaires: fil(...trois, TEXTE_PLAFOND, { corps: DECISION, ...hors }, DEMANDE(V4)), tete: V4 }).regle, 1, JSON.stringify(hors));
    assert.equal(joue({ commentaires: fil(...trois, { corps: DECISION, ...hors }, DEMANDE(V4)), tete: V4 }).geste, 'plafonner', JSON.stringify(hors));
  }
  assert.equal(joue({ commentaires: fil(...trois, TEXTE_PLAFOND, DECISION, DEMANDE(V4)), tete: V4 }).regle, 6);
});

test("A-115 — un arbitrage se compare au refus qu'il vise : la reprise part quand chaque refus du tour est écarté, quel que soit l'ordre des autres verdicts", () => {
  const double = { exiges: 2 };
  const REPRISE = { regle: 4, geste: 'distribuer', tour: 2, sommet: V1, nombre: 2, preferees: ['r1', 'r2'], mention: MENTION_ARBITRAGE };
  // r1 refuse, l'arbitre écarte, r2 valide APRÈS l'arbitrage : la reprise part (elle ne partait jamais).
  const apres = [DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'refusé'), 'Contesté — R3, src/a.ts:12 — x', ECARTE, verdict(1, 'r2', 'validé'), DEMANDE()];
  assert.deepEqual(joue({ ...double, commentaires: fil(...apres) }), REPRISE);
  assert.deepEqual(joue({ ...double, commentaires: fil(...apres, DEMANDE(), DEMANDE()) }), REPRISE);
  // Témoin : r2 valide AVANT l'arbitrage.
  assert.deepEqual(joue({ ...double, commentaires: fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'refusé'), verdict(1, 'r2', 'validé'), ECARTE, DEMANDE()) }), REPRISE);
  // Deux refus, un seul visé par l'arbitrage : le second tient, `à-reprendre`.
  const deux = fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'refusé'), ECARTE, verdict(1, 'r2', 'refusé'), DEMANDE());
  assert.deepEqual([joue({ ...double, commentaires: deux }).regle, joue({ ...double, commentaires: deux }).poser], [4, 'à-reprendre']);
  assert.deepEqual(joue({ ...double, commentaires: fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'refusé'), verdict(1, 'r2', 'refusé'), ECARTE, DEMANDE()) }), REPRISE, 'les deux refus sont écartés');
  // La reprise distribuée, plus rien ne boucle ; et le tour au refus écarté reste un tour compté.
  assert.equal(joue({ ...double, commentaires: fil(...apres, D(2, V1, ['r1', 'r2'], MENTION_ARBITRAGE)) }).raison, 'attente');
  assert.equal(comptes({ ...double, commentaires: fil(...apres) }), 1);
});

test("A-115 — c'est le dernier tour qui porte sur le contenu de la tête qui juge : une validation plus ancienne du même contenu ne l'emporte pas", () => {
  const valide = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')];
  const meme = { tete: T, memeContenu: { [V1]: true } };
  // Tour 1 validé sur V1 ; tour 2 distribué puis refusé sur T, de même contenu propre que V1.
  const refuse = fil(...valide, DEMANDE(T), D(2, T, ['r1']), verdict(2, 'r1', 'refusé', { sommet: T }));
  assert.deepEqual(joue({ ...meme, commentaires: refuse }), { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : refusé') });
  assert.equal(tourValide(pr({ ...meme, commentaires: refuse })), null, 'le capitaine non plus');
  assert.deepEqual([joue({ ...meme, commentaires: refuse, etiquettes: ['à-fusionner'] }).regle, joue({ ...meme, commentaires: refuse, etiquettes: ['à-fusionner'] }).poser], [4, 'à-reprendre']);
  // Le tour 2 est encore en cours : il juge déjà, la validation du tour 1 ne vaut plus pour cette tête.
  const enCours = fil(...valide, DEMANDE(T), D(2, T, ['r1']));
  assert.equal(joue({ ...meme, commentaires: enCours }).raison, 'attente');
  assert.equal(tourValide(pr({ ...meme, commentaires: enCours })), null);
  assert.deepEqual([joue({ ...meme, commentaires: enCours, etiquettes: ['à-fusionner'] }).regle, joue({ ...meme, commentaires: enCours, etiquettes: ['à-fusionner'] }).poser], [3, 'à-relire']);
  // Le tour 2 validé : c'est lui que le capitaine reçoit.
  const revalide = fil(...valide, DEMANDE(T), D(2, T, ['r1']), verdict(2, 'r1', 'validé', { sommet: T }));
  assert.equal(tourValide(pr({ ...meme, commentaires: revalide })).numero, 2);
  // Un tour plus récent sur un AUTRE contenu ne retire rien à la validation du contenu de la tête.
  assert.equal(tourValide(pr({ commentaires: fil(...valide, D(2, V2, ['r1']), verdict(2, 'r1', 'refusé', { sommet: V2 })), memeContenu: { [V2]: false } })).numero, 1);
});

test("A-115 — la panne a toujours un destinataire : l'architecte et l'auteur, et le conducteur quand il existe", () => {
  const tard = DEBUT + 20 * H;
  const enPanne = (...debut) => [...debut, D(1, V1, ['r1']), { corps: D(1, V1, ['r2'], 'remplace', 'r1'), a: 125 }];
  assert.deepEqual(joue({ commentaires: fil(...enPanne(DEMANDE(V1, '—'))), maintenant: tard }).lignes, [
    { a: 'architecte', session: null, texte: 'PR 12 : relecture en panne' },
    { a: 'auteur', session: 'session_auteur', texte: 'PR 12 : relecture en panne' },
  ]);
  // `à-relire` posée à la main, aucune demande : l'architecte est prévenu quand même.
  assert.deepEqual(joue({ commentaires: fil(...enPanne()), maintenant: tard }).lignes, [
    { a: 'architecte', session: null, texte: 'PR 12 : relecture en panne' },
    { a: 'auteur', session: null, texte: 'PR 12 : relecture en panne' },
  ]);
  // Une « Relecture en panne » d'un compte sans droit, ou éditée, ne signale rien : la panne se réécrit.
  for (const hors of [{ de: 'NONE' }, { edite: true }]) assert.equal(joue({ commentaires: fil(...enPanne(DEMANDE()), { corps: TEXTE_PANNE, a: 250, ...hors }), maintenant: tard }).geste, 'panne', JSON.stringify(hors));
  assert.equal(joue({ commentaires: fil(...enPanne(DEMANDE()), { corps: TEXTE_PANNE, a: 250 }), maintenant: tard }).raison, 'panne-signalee');
});

test("A-115 — une marque presque à la forme n'est jamais ignorée : une ligne tracée, l'architecte prévenu, puis rien tant que la trace est la plus récente", () => {
  const ILL = (cause) => ({ regle: null, geste: 'illisible', commentaire: `${TEXTE_ILLISIBLE}${cause}`, lignes: [{ a: 'architecte', session: null, texte: `PR 12 : lecture illisible : ${cause}` }] });
  // Une distribution suivie d'un pied altéré, d'un autre pied, d'une ligne, d'un point : le geste ne se rejoue plus à chaque réveil.
  for (const suffixe of ['\n\n---\n_Generated with [Claude Code](https://claude.ai/code)_', '\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)', '\nmerci', '.']) {
    const presque = fil(DEMANDE(), D(1, V1, ['r1']) + suffixe);
    assert.deepEqual(joue({ commentaires: presque }), ILL('commentaire 101 : préfixe « Relecture — » sans la forme de sa marque'), JSON.stringify(suffixe));
    assert.throws(() => lireMarques(presque), LectureIllisible, JSON.stringify(suffixe));
    assert.throws(() => tourValide(pr({ commentaires: presque })), LectureIllisible);
    assert.deepEqual(sommetsDesTours(presque), [], "l'appelant peut encore demander les sommets, puis la décision");
  }
  // Une relance, une panne, un plafond, une demande, une décision, un arbitrage, une trace presque à la forme.
  const base = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'incomplet')];
  for (const [corps, prefixe] of [
    [`${D(1, V1, ['r1'], 'relance', 'r1')}\nmerci`, 'Relecture —'],
    [`${TEXTE_PANNE}.`, TEXTE_PANNE],
    [`${TEXTE_PLAFOND} ?`, 'Plafond —'],
    [`À relire — sommet ${V1.slice(0, 7)} — Session: session_auteur — Conducteur: —`, 'À relire —'],
    ['Décision de plafond', 'Décision de plafond'],
    ['Arbitrage — R3 — écarté', 'Arbitrage —'],
    [`${ECARTE}\net voici pourquoi`, 'Arbitrage —'],
    ['Lecture illisible', 'Lecture illisible'],
  ]) {
    assert.deepEqual(joue({ commentaires: fil(...base, corps) }), ILL(`commentaire 103 : préfixe « ${prefixe} » sans la forme de sa marque`), corps);
    assert.throws(() => lireMarques(fil(...base, corps)), LectureIllisible, corps);
  }
  // La trace écrite, plus rien ; un commentaire sans marque ne la périme pas, une marque nouvelle si.
  const presque = [...base, `${TEXTE_PANNE}.`];
  const trace = `${TEXTE_ILLISIBLE}commentaire 103 : préfixe « ${TEXTE_PANNE} » sans la forme de sa marque`;
  const SIGNALE = { regle: null, geste: 'rien', raison: 'illisible-signale' };
  assert.deepEqual(joue({ commentaires: fil(...presque, trace) }), SIGNALE);
  assert.deepEqual(joue({ commentaires: fil(...presque, trace, 'relu, merci', 'Passage du capitaine `cap-1`\n<!-- capitaine:passage cap-1 -->') }), SIGNALE);
  assert.equal(joue({ commentaires: fil(...presque, trace, DEMANDE()) }).geste, 'illisible', "une demande nouvelle, la marque fautive est toujours là : l'architecte est prévenu de nouveau");
  for (const hors of [{ de: 'NONE' }, { edite: true }]) assert.equal(joue({ commentaires: fil(...presque, { corps: trace, ...hors }) }).geste, 'illisible', JSON.stringify(hors));
  // La marque fautive éditée (donc écartée) : la lecture redevient lisible, la suite reprend.
  assert.equal(joue({ commentaires: fil(...base, { corps: `${TEXTE_PANNE}.`, edite: true }, trace) }).geste, 'reecrire');
});

test("A-116 — une clé qui manque à la table pour un tour plus récent n'est ni « même » ni « différent » : aucune validation", () => {
  const valide = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')];
  // Tour 1 validé sur V1 ; tour 2 distribué et refusé sur T ; la tête est T2, de même contenu propre que V1.
  const refuse = fil(...valide, DEMANDE(T), D(2, T, ['r1']), verdict(2, 'r1', 'refusé', { sommet: T }), DEMANDE(T2));
  const sur = (memeContenu, plus = {}) => ({ commentaires: refuse, tete: T2, memeContenu, ...plus });
  // La clé de T manque (ou n'est pas un booléen) : le tour 1 ne valide rien, la tête se relit.
  for (const table of [{ [V1]: true }, { [V1]: true, [T]: undefined }, { [V1]: true, [T]: null }, { [V1]: true, [T]: 'faux' }, { [V1]: true, [T]: 0 }]) {
    assert.deepEqual(joue(sur(table)), { regle: 6, geste: 'distribuer', tour: 3, sommet: T2, nombre: 1, preferees: ['r1'], mention: null }, JSON.stringify(table));
    assert.equal(tourValide(pr(sur(table))), null, JSON.stringify(table));
    assert.deepEqual([joue(sur(table, { etiquettes: ['à-fusionner'] })).regle, joue(sur(table, { etiquettes: ['à-fusionner'] })).poser], [3, 'à-reprendre'], JSON.stringify(table));
  }
  // Les trois réponses lues : « différent », le tour 1 juge ; « même », le tour 2 juge et refuse ; « illisible », rien.
  assert.equal(joue(sur({ [V1]: true, [T]: false })).poser, 'à-fusionner');
  assert.equal(tourValide(pr(sur({ [V1]: true, [T]: false }))).numero, 1);
  assert.deepEqual([joue(sur({ [V1]: true, [T]: true })).regle, joue(sur({ [V1]: true, [T]: true })).poser], [4, 'à-reprendre']);
  assert.equal(tourValide(pr(sur({ [V1]: true, [T]: true }))), null);
  assert.equal(joue(sur({ [V1]: true, [T]: ILLISIBLE })).geste, 'illisible');
  // Une clé qui manque pour un tour plus ANCIEN que celui qui juge ne retire rien : elle vaut « différent ».
  const ancien = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), DEMANDE(T), D(2, T, ['r1']), verdict(2, 'r1', 'validé', { sommet: T }));
  assert.equal(tourValide(pr({ commentaires: ancien, tete: T })).numero, 2);
  // Le sommet de la tête elle-même n'a pas besoin de clé.
  assert.equal(tourValide(pr({ commentaires: fil(...valide, DEMANDE(T2), D(2, T2, ['r1']), verdict(2, 'r1', 'validé', { sommet: T2 })), tete: T2, memeContenu: { [V1]: false } })).numero, 2);
});

test("A-116 — une trace se reconnaît à sa première ligne, ne vaut « déjà signalé » que pour la cause qu'elle dit, et se périme ; un arbitrage maintenu admet une raison", () => {
  const SIGNALE = { regle: null, geste: 'rien', raison: 'illisible-signale' };
  const valide = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')];
  // Une distribution puis sa trace, chacune suivie d'un pied altéré, d'un point, d'une ligne : la trace est reconnue, plus rien ne boucle.
  for (const suffixe of ['\n\n---\n_Generated with [Claude Code](https://claude.ai/code)_', '.', '\nmerci']) {
    const presque = [DEMANDE(), D(1, V1, ['r1']) + suffixe];
    const geste = joue({ commentaires: fil(...presque) });
    assert.equal(geste.geste, 'illisible', JSON.stringify(suffixe));
    assert.deepEqual(joue({ commentaires: fil(...presque, geste.commentaire + suffixe) }), SIGNALE, JSON.stringify(suffixe));
    assert.deepEqual(joue({ commentaires: fil(...presque, geste.commentaire + suffixe, 'relu, merci') }), SIGNALE, JSON.stringify(suffixe));
  }
  // Une trace ancienne ne masque pas une cause nouvelle : l'épisode clos (marque fautive éditée), puis un calcul illisible.
  const clos = fil(...valide, { corps: `${TEXTE_PANNE} ?`, edite: true }, `${TEXTE_ILLISIBLE}commentaire 103 : préfixe « ${TEXTE_PANNE} » sans la forme de sa marque`);
  assert.deepEqual(joue({ commentaires: clos, etiquettes: ['à-fusionner'] }), RIEN_EN_PLACE(2), "l'épisode est clos, l'état est sain");
  const DOUBLE = '« double relecture exigée » illisible';
  assert.deepEqual(joue({ commentaires: clos, etiquettes: ['à-fusionner'], exiges: ILLISIBLE }), { regle: null, geste: 'illisible', commentaire: `${TEXTE_ILLISIBLE}${DOUBLE}`, lignes: [{ a: 'architecte', session: null, texte: `PR 12 : lecture illisible : ${DOUBLE}` }] });
  assert.equal(joue({ commentaires: clos, etiquettes: ['à-fusionner'], tete: T, memeContenu: { [V1]: ILLISIBLE } }).geste, 'illisible');
  assert.throws(() => tourValide(pr({ commentaires: clos, exiges: ILLISIBLE })), LectureIllisible);
  // La cause nouvelle tracée à son tour : rien ; puis l'autre cause : de nouveau.
  const trace = fil(...valide, `${TEXTE_ILLISIBLE}${DOUBLE}`);
  assert.deepEqual(joue({ commentaires: trace, exiges: ILLISIBLE }), SIGNALE);
  assert.equal(joue({ commentaires: trace, tete: T, memeContenu: { [V1]: ILLISIBLE } }).geste, 'illisible', 'la trace dit une autre cause');
  // Un signalement se périme : la même cause qui revient après `delaiMs`, sans marque nouvelle, se signale de nouveau.
  const TRACE_DOUBLE = { corps: `${TEXTE_ILLISIBLE}${DOUBLE}`, a: 10 };
  const revient = { commentaires: fil(...valide, TRACE_DOUBLE), etiquettes: ['à-fusionner'], exiges: ILLISIBLE };
  const ecrite = DEBUT + 10 * 60_000;
  assert.deepEqual(joue({ ...revient, exiges: 1 }), RIEN_EN_PLACE(2), "l'épisode clos, le calcul relu : sain");
  assert.deepEqual(joue({ ...revient, maintenant: ecrite + 20 * 60_000 }), SIGNALE, 'trente minutes après le début : déjà signalé');
  assert.deepEqual(joue({ ...revient, maintenant: ecrite + 2 * H }), SIGNALE, "à l'échéance exacte : encore signalé");
  assert.equal(joue({ ...revient, maintenant: ecrite + 2 * H + 1 }).geste, 'illisible', 'une milliseconde après : de nouveau');
  assert.deepEqual(joue({ ...revient, maintenant: DEBUT + 5 * H }), { regle: null, geste: 'illisible', commentaire: `${TEXTE_ILLISIBLE}${DOUBLE}`, lignes: [{ a: 'architecte', session: null, texte: `PR 12 : lecture illisible : ${DOUBLE}` }] });
  assert.equal(joue({ ...revient, maintenant: ecrite + 31 * 60_000, delaiMs: 30 * 60_000 }).geste, 'illisible', '`delaiMs` est le délai du signalement aussi');
  // La trace récrite : de nouveau « déjà signalé », pour un délai.
  const recrite = { ...revient, commentaires: fil(...valide, TRACE_DOUBLE, { corps: `${TEXTE_ILLISIBLE}${DOUBLE}`, a: 300 }) };
  assert.deepEqual(joue({ ...recrite, maintenant: DEBUT + 5 * H + 60_000 }), SIGNALE);
  assert.equal(joue({ ...recrite, maintenant: DEBUT + 8 * H }).geste, 'illisible');
  assert.throws(() => tourValide(pr({ ...revient, maintenant: DEBUT + 5 * H })), LectureIllisible, 'le capitaine, lui, ne valide à aucun moment');
  // Un arbitrage maintenu, avec ou sans raison, est un arbitrage : il n'arrête rien et n'écarte rien.
  const refuse = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé')];
  for (const maintenu of [MAINTENU, `${MAINTENU} — le filtre manque bien`, `${MAINTENU} — le bloquant n'est pas — écarté — pour autant`, `${MAINTENU}\n${MAINTENU} — et celui-ci aussi`]) {
    assert.deepEqual([joue({ commentaires: fil(...refuse, maintenu, DEMANDE()) }).regle, joue({ commentaires: fil(...refuse, maintenu, DEMANDE()) }).poser], [4, 'à-reprendre'], maintenu);
    assert.equal(lireMarques(fil(...refuse, maintenu)).arbitragesEcartes.length, 0, maintenu);
  }
  assert.equal(joue({ commentaires: fil(...refuse, `${MAINTENU} — a\n${ECARTE}`, DEMANDE()) }).geste, 'distribuer', 'un maintenu et un écarté dans le même commentaire');
  // Toujours illisibles : un écarté sans sa raison, un maintenu au tiret final sans raison, un arbitrage sans lieu.
  for (const faux of ['Arbitrage — R3 — écarté', `${MAINTENU} — `, 'Arbitrage — maintenu', 'Arbitrage —   — maintenu', "Arbitrage — je ne suis pas d'accord"]) assert.equal(joue({ commentaires: fil(...refuse, faux) }).geste, 'illisible', faux);
});

test("A-113 — « même contenu propre » ou « double relecture exigée » illisible : ni distribution ni validation, une ligne tracée, l'architecte prévenu, puis rien", () => {
  const ILL = (cause) => ({ regle: null, geste: 'illisible', commentaire: `${TEXTE_ILLISIBLE}${cause}`, lignes: [{ a: 'architecte', session: null, texte: `PR 12 : lecture illisible : ${cause}` }] });
  const valide = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')];
  const MEME = `« même contenu propre » illisible pour le sommet ${V1}`;
  const DOUBLE = '« double relecture exigée » illisible';
  const illisible = { tete: T, memeContenu: { [V1]: ILLISIBLE } };
  // Le calcul du lot 3b a échoué : pas de tour 2 distribué sur T, pas d'`à-reprendre` non plus sur une PR `à-fusionner`.
  assert.deepEqual(joue({ ...illisible, commentaires: fil(...valide, DEMANDE(T)) }), ILL(MEME));
  assert.deepEqual(joue({ ...illisible, commentaires: fil(...valide), etiquettes: ['à-fusionner'] }), ILL(MEME));
  assert.throws(() => tourValide(pr({ ...illisible, commentaires: fil(...valide) })), LectureIllisible);
  // Le calcul du lot 3c a échoué : rien n'est distribué ni validé, même sur un tour validé à un verdict.
  assert.deepEqual(joue({ exiges: ILLISIBLE, commentaires: fil(DEMANDE()) }), ILL(DOUBLE));
  assert.deepEqual(joue({ exiges: ILLISIBLE, commentaires: fil(...valide) }), ILL(DOUBLE));
  assert.throws(() => tourValide(pr({ exiges: ILLISIBLE, commentaires: fil(...valide) })), LectureIllisible);
  // La trace écrite : rien, tant qu'elle est le plus récent des commentaires à marque ; puis de nouveau.
  const SIGNALE = { regle: null, geste: 'rien', raison: 'illisible-signale' };
  assert.deepEqual(joue({ ...illisible, commentaires: fil(...valide, DEMANDE(T), `${TEXTE_ILLISIBLE}${MEME}`) }), SIGNALE);
  assert.deepEqual(joue({ exiges: ILLISIBLE, commentaires: fil(...valide, `${TEXTE_ILLISIBLE}${DOUBLE}`, 'relu, merci') }), SIGNALE);
  assert.deepEqual(joue({ ...illisible, commentaires: fil(...valide, `${TEXTE_ILLISIBLE}${MEME}`, DEMANDE(T)) }), ILL(MEME));
  // Le calcul relu : la trace n'empêche rien.
  assert.equal(joue({ tete: T, memeContenu: { [V1]: true }, commentaires: fil(...valide, `${TEXTE_ILLISIBLE}${MEME}`) }).poser, 'à-fusionner');
  assert.equal(joue({ tete: T, memeContenu: { [V1]: false }, commentaires: fil(...valide, `${TEXTE_ILLISIBLE}${MEME}`) }).regle, 6);
  // Le sommet de la tête elle-même n'a pas besoin de réponse ; hors file, rien n'est lu.
  assert.equal(joue({ memeContenu: { [V1]: ILLISIBLE }, commentaires: fil(...valide) }).poser, 'à-fusionner');
  assert.deepEqual(joue({ exiges: ILLISIBLE, etiquettes: ['à-reprendre'], commentaires: fil(...valide) }), HORS_FILE);
});

test("A-115 — renvoi du capitaine en cours, refus d'une session remplacée, étiquette décomposée, verdict écrit avant sa distribution, demande d'un compte sans droit", () => {
  const valide = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')];
  // `à-fusionner` et `fusion-bloquée` ensemble : le capitaine renvoie, le Relecteur ne défait pas son renvoi.
  const RENVOI = { regle: null, geste: 'rien', raison: 'renvoi-du-capitaine' };
  assert.deepEqual(joue({ commentaires: fil(...valide, 'à-fusionner retiré par le capitaine : contrôle rouge'), etiquettes: ['à-fusionner', 'fusion-bloquée'] }), RENVOI);
  assert.deepEqual(joue({ commentaires: fil(DEMANDE()), etiquettes: ['à-fusionner', 'fusion-bloquée', 'à-reprendre'] }), RENVOI);
  assert.equal(joue({ commentaires: fil(...valide), etiquettes: ['à-relire', 'à-fusionner', 'fusion-bloquée'] }).regle, 2, "l'auteur a reposé `à-relire` : la PR est de nouveau au Relecteur");
  // Un `refusé` rendu par une session ensuite remplacée compte ; son `validé`, lui, reste ignoré (H7, H8).
  const remplacee = fil(DEMANDE(), D(1, V1, ['r1']), { corps: verdict(1, 'r1', 'refusé'), a: 124 }, { corps: D(1, V1, ['r2'], 'remplace', 'r1'), a: 125 }, verdict(1, 'r2', 'validé'));
  assert.deepEqual([joue({ commentaires: remplacee, maintenant: DEBUT + 130 * 60_000 }).regle, joue({ commentaires: remplacee, maintenant: DEBUT + 130 * 60_000 }).poser], [4, 'à-reprendre']);
  assert.equal(tourValide(pr({ commentaires: remplacee })), null);
  assert.equal(comptes({ commentaires: remplacee }), 1);
  const tardif = fil(DEMANDE(), D(1, V1, ['r1']), { corps: D(1, V1, ['r2'], 'remplace', 'r1'), a: 125 }, verdict(1, 'r2', 'validé'), verdict(1, 'r1', 'refusé'));
  assert.equal(tourValide(pr({ commentaires: tardif })), null, 'le refus de la remplacée, rendu après son remplacement, compte aussi');
  // Les étiquettes se comparent en NFC.
  assert.equal(joue({ commentaires: fil(...valide), etiquettes: ['à-relire'.normalize('NFD')] }).poser, 'à-fusionner');
  assert.deepEqual(joue({ commentaires: fil(...valide), etiquettes: ['à-fusionner'.normalize('NFD')] }), RIEN_EN_PLACE(2));
  // Un verdict écrit avant la distribution qui nomme sa session ne compte pas.
  const avant = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), DEMANDE(V2), verdict(2, 'r1', 'validé', { sommet: V2 }), D(2, V2, ['r1']));
  assert.equal(joue({ commentaires: avant, tete: V2 }).raison, 'attente');
  assert.equal(tourValide(pr({ commentaires: avant, tete: V2 })), null);
  assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r2', 'validé'), D(1, V1, ['r1', 'r2'], 'complète'), verdict(1, 'r1', 'validé')), exiges: 2 }).raison, 'attente', 'la session complétée avait écrit avant d\'être nommée');
  // Une demande `À relire` d'un compte sans droit, ou éditée, ne donne pas ses destinataires.
  for (const hors of [{ de: 'NONE' }, { edite: true }]) {
    const lignes = joue({ commentaires: fil({ corps: DEMANDE(), ...hors }, D(1, V1, ['r1']), verdict(1, 'r1', 'validé')) }).lignes;
    assert.deepEqual(lignes.map((l) => l.session), [null, null], JSON.stringify(hors));
  }
});

test('distribution : ce que `ecrireDistribution` écrit, `lireDistribution` le relit, pied de page des sessions cloud compris', () => {
  for (const d of [
    { tour: 1, sommet: V1, sessions: ['session_01Ab-c'], mention: null, cible: null },
    { tour: 12, sommet: V2, sessions: ['r1', 'r2'], mention: 'complète', cible: null },
    { tour: 2, sommet: V1, sessions: ['r1', 'r3'], mention: 'remplace', cible: 'r2' },
    { tour: 2, sommet: V1, sessions: ['r1'], mention: 'relance', cible: 'r1' },
    { tour: 3, sommet: V1, sessions: ['r1'], mention: MENTION_ARBITRAGE, cible: null },
  ]) {
    assert.deepEqual(lireDistribution(ecrireDistribution(d)), d);
    assert.equal(lireMarques(fil(`${ecrireDistribution(d)}\n\n---\n${PIED}`)).distributions.length, 1);
  }
  assert.equal(D(2, V1, ['r1'], MENTION_ARBITRAGE), `Relecture — tour 2 — sommet ${V1} — sessions r1 (après arbitrage, non compté)`);
  assert.throws(() => D(1, 'abc', ['r1']), TypeError);
  assert.throws(() => D(1, V1, []), TypeError);
});

test("l'instant est une entrée : la fonction ne lit aucune horloge, et chaque délai se joue avec une heure posée", () => {
  const VraieDate = globalThis.Date;
  const vraie = VraieDate.now;
  VraieDate.now = () => {
    throw new Error("la fonction a lu l'horloge");
  };
  globalThis.Date = class extends VraieDate {
    constructor(...args) {
      if (args.length === 0) throw new Error("la fonction a lu l'horloge");
      super(...args);
    }
  };
  try {
    const commentaires = fil(DEMANDE(), D(1, V1, ['r1']));
    assert.equal(joue({ commentaires, maintenant: Date.UTC(2026, 10, 18, 12, 1) }).raison, 'attente');
    assert.equal(joue({ commentaires, maintenant: Date.UTC(2026, 10, 18, 12, 1) + 1 }).geste, 'remplacer');
    assert.equal(joue({ commentaires, maintenant: Date.UTC(2031, 0, 1) }).geste, 'remplacer');
  } finally {
    globalThis.Date = VraieDate;
    VraieDate.now = vraie;
  }
  assert.equal(typeof Date.now(), 'number', "l'horloge du banc est rendue");
  // Un nombre de millisecondes, rien d'autre : une chaîne, même ISO, est une erreur.
  for (const maintenant of [undefined, null, 'tout à l\'heure', '2026-11-18T12:01:00.000Z', '2026-11-18', '1795003260000', NaN, Infinity, new Date(DEBUT)]) assert.throws(() => joue({ maintenant }), /maintenant/, String(maintenant));
  assert.equal(typeof joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1'])) }).echeance, 'number', "l'échéance est rendue en millisecondes");
});

test("les règles sont ordonnées : pour chaque couple de voisines, un état où les deux s'appliqueraient rend la première", () => {
  const troisRefus = [
    DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'),
    DEMANDE(V2), D(2, V2, ['r1']), verdict(2, 'r1', 'refusé', { sommet: V2 }),
    DEMANDE(V3), D(3, V3, ['r1']), verdict(3, 'r1', 'refusé', { sommet: V3 }),
  ];
  // 1 avant 2 : au plafond, un verdict validé tardif n'ouvre pas la PR.
  const tardif = fil(...troisRefus, TEXTE_PLAFOND, verdict(3, 'r1', 'validé', { sommet: V3 }), DEMANDE(V3));
  assert.deepEqual([joue({ commentaires: tardif, tete: V3 }).regle, joue({ commentaires: tardif, tete: V3 }).poser], [1, 'à-reprendre']);
  // 1 avant 3 : la ligne est celle du plafond.
  assert.equal(joue({ commentaires: fil(...troisRefus, TEXTE_PLAFOND), tete: V3, etiquettes: ['à-fusionner'] }).regle, 1);
  // 2 avant 3 : `à-fusionner` sur un tour validé pour ce contenu ne devient pas `à-reprendre`.
  assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')), etiquettes: ['à-fusionner'] }).regle, 2);
  // 2 avant 3, encore : le tour validé pour ce contenu n'est pas le dernier ; la règle 3 ne lit que le dernier tour, la règle 2 les lit tous.
  assert.deepEqual(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'), D(2, V2, ['r1'])), etiquettes: ['à-fusionner'], memeContenu: { [V2]: false } }), RIEN_EN_PLACE(2));
  // 1 avant 3 et 4 : un troisième refus tardif sur une PR `à-fusionner`, c'est le plafond, et lui seul.
  const refusTardif = joue({ commentaires: fil(...troisRefus), tete: V3, etiquettes: ['à-fusionner'] });
  assert.deepEqual([refusTardif.regle, refusTardif.geste, refusTardif.retirer], [1, 'plafonner', ['à-fusionner']]);
  // 3 et 4 ne se recouvrent pas : sur un tour refusé, la règle 3 renvoie à la règle 4.
  const deuxRefus = joue({ commentaires: fil(...troisRefus.slice(0, 6)), tete: V2, etiquettes: ['à-fusionner'] });
  assert.deepEqual([deuxRefus.regle, deuxRefus.geste, deuxRefus.poser], [4, 'etiqueter', 'à-reprendre']);
  // 3 avant 5 : `à-fusionner` sur un tour en cours, `à-relire` d'abord ; la règle 5 ne joue qu'au passage suivant.
  const enCours = joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1'])), etiquettes: ['à-fusionner'], maintenant: DEBUT + 9 * H });
  assert.deepEqual([enCours.regle, enCours.geste, enCours.poser], [3, 'etiqueter', 'à-relire']);
  // 3 avant 6 : `à-fusionner` sans tour, `à-reprendre`, rien n'est distribué.
  const sansTour = joue({ commentaires: fil(DEMANDE()), etiquettes: ['à-fusionner'] });
  assert.deepEqual([sansTour.regle, sansTour.geste, sansTour.poser], [3, 'etiqueter', 'à-reprendre']);
  // 4 avant 5 : un refus et une session encore attendue, le tour est refusé, pas en cours.
  assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'refusé')), exiges: 2, maintenant: DEBUT + 9 * H }).regle, 4);
  // 5 avant 6 : un tour en cours sur le contenu de la tête ne se redistribue pas.
  assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1'])), tete: T, memeContenu: { [V1]: true } }).regle, 5);
  // 1 avant 4 : le plafond avant la reprise après arbitrage.
  assert.deepEqual([joue({ commentaires: fil(...troisRefus, ECARTE), tete: V3 }).regle, joue({ commentaires: fil(...troisRefus, ECARTE), tete: V3 }).geste], [1, 'plafonner']);
  // 1 avant 6 : trois tours comptés, la tête a changé, rien ne se distribue.
  assert.equal(joue({ commentaires: fil(...troisRefus, DEMANDE(V4)), tete: V4 }).geste, 'plafonner');
  // Dans la règle 5 : compléter, puis relancer, puis remplacer.
  const incomplet = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'incomplet')];
  assert.equal(joue({ commentaires: fil(...incomplet), exiges: 2 }).geste, 'completer');
  const deux = fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r2', 'incomplet'));
  assert.deepEqual([joue({ commentaires: deux, exiges: 2, maintenant: DEBUT + 9 * H }).geste, joue({ commentaires: deux, exiges: 2, maintenant: DEBUT + 9 * H }).session], ['reecrire', 'r2']);
});

test("la file : une livraison de sujet n'est regardée que si elle porte `à-relire`", () => {
  for (const branche of ['sujet/socle', 'livraison/socle-2026-11-18']) {
    assert.deepEqual(joue({ branche, etiquettes: ['à-fusionner'] }), { regle: null, geste: 'rien', raison: 'livraison' }, branche);
    assert.equal(joue({ branche, etiquettes: ['à-relire'] }).regle, 6, branche);
    assert.equal(joue({ branche, etiquettes: ['à-relire', 'à-fusionner'] }).regle, 3, branche);
  }
  assert.equal(joue({ branche: 'feat/sujet/x', etiquettes: ['à-fusionner'] }).regle, 3);
});

test("ticket 66 — un refus ne compte jamais moins qu'un refus : sans « lancée » sur un chemin sensible, ou sur un autre sommet, un `refusé` lisible rend `à-reprendre` et compte au plafond", () => {
  const base = [DEMANDE(), D(1, V1, ['r1'])];
  const refus = (options) => fil(...base, verdict(1, 'r1', 'refusé', options));
  for (const [nom, champs] of [
    ['sensible, sans la ligne', { sensible: true, commentaires: refus({}) }],
    ['sensible, « non requise »', { sensible: true, commentaires: refus({ securite: 'non requise' }) }],
    ['un autre sommet', { commentaires: refus({ sommet: V2 }) }],
    ['sensible, un autre sommet, sans la ligne', { sensible: true, commentaires: refus({ sommet: V2 }) }],
  ]) {
    assert.deepEqual(joue(champs), { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : refusé') }, nom);
    assert.equal(comptes(champs), 1, `${nom} : le tour refusé compte au plafond`);
    assert.equal(tourValide(pr(champs)), null, `${nom} : jamais validé`);
  }
  // Ce qui ne change pas : un `validé` ou un `incomplet` sans « lancée », ou sur un autre sommet, se lit `incomplet`.
  assert.equal(joue({ sensible: true, commentaires: fil(...base, verdict(1, 'r1', 'validé')) }).geste, 'reecrire');
  assert.equal(joue({ commentaires: fil(...base, verdict(1, 'r1', 'validé', { sommet: V2 })) }).geste, 'reecrire');
  // Un verdict illisible n'est pas un refus lisible : il reste `incomplet`, même s'il porte « refusé ».
  assert.equal(joue({ commentaires: fil(...base, verdict(1, 'r1', 'refusé').replace('Bloquants: 1', 'Bloquants: 0')) }).geste, 'reecrire');
});

test("verdicts d'un tour : le dernier de chaque session nommée ; un verdict sur un autre sommet, ou illisible, se lit `incomplet`", () => {
  const base = [DEMANDE(), D(1, V1, ['r1'])];
  assert.equal(joue({ commentaires: fil(...base, verdict(1, 'r1', 'validé'), verdict(1, 'r1', 'refusé')) }).poser, 'à-reprendre', 'le dernier verdict fait foi');
  assert.equal(joue({ commentaires: fil(...base, verdict(1, 'r1', 'refusé'), verdict(1, 'r1', 'validé')) }).poser, 'à-fusionner');
  assert.equal(joue({ commentaires: fil(...base, verdict(2, 'r1', 'validé')) }).raison, 'attente', "un verdict d'un autre tour");
  assert.equal(joue({ commentaires: fil(...base, verdict(1, 'r1', 'validé', { sommet: V2 })) }).geste, 'reecrire', "un verdict sur un autre sommet que celui du tour");
  assert.equal(joue({ commentaires: fil(...base, verdict(1, 'r1', 'validé'), verdict(1, 'r1', 'validé').replace('Bloquants: 0', 'Bloquants: 2')) }).geste, 'reecrire', 'un dernier verdict illisible ne laisse pas valoir le précédent');
  assert.equal(tourValide(pr({ commentaires: fil(...base, verdict(1, 'r1', 'validé').replace('Verdict: validé', 'Verdict: ok')) })), null, 'un verdict illisible ne vaut jamais « validé »');
  // Une distribution du même numéro sur un autre sommet n'entre pas dans le tour.
  assert.equal(joue({ commentaires: fil(...base, D(1, V2, ['r9']), verdict(1, 'r9', 'validé', { sommet: V2 })) }).raison, 'attente');
});

test("entrées fausses : des commentaires illisibles lèvent LectureIllisible, une entrée mal formée lève TypeError ; jamais un geste", () => {
  for (const commentaires of [null, 'x', { message: 'Bad credentials' }, [{ body: 'x' }]]) {
    assert.throws(() => joue({ commentaires }), LectureIllisible);
    assert.throws(() => tourValide(pr({ commentaires })), LectureIllisible);
    assert.throws(() => sommetsDesTours(commentaires), LectureIllisible);
  }
  for (const champs of [{ tete: 'abc' }, { tete: V1.toUpperCase() }, { exiges: 0 }, { exiges: '2' }, { sensible: 'non' }, { memeContenu: null }, { exiges: 'illisibles' }, { numero: 0 }, { etiquettes: 'à-relire' }, { etiquettes: [1] }, { branche: '' }, { delaiMs: 0 }, { delaiMs: Infinity }])
    assert.throws(() => joue(champs), TypeError, JSON.stringify(champs));
  // Hors file, les commentaires ne sont pas lus : rien, sans erreur.
  assert.deepEqual(joue({ etiquettes: [], commentaires: [] }), HORS_FILE);
});

// --- A-118 : ajouté par la session du ticket 58, sur décision de l'architecte après la livraison -------------

test("A-118 — un verdict modifié ne peut qu'aggraver ou laisser, jamais adoucir : le refus d'avant tient, le validé d'avant se lit `incomplet`", () => {
  const base = [DEMANDE(), D(1, V1, ['r1'])];
  const modifie = (tour, session, mot, options) => ({ corps: verdict(tour, session, mot, options), edite: true });
  const RELANCE = { regle: 5, geste: 'reecrire', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1' };
  const REPRENDRE = { regle: 4, geste: 'etiqueter', poser: 'à-reprendre', retirer: ['à-relire'], lignes: LIGNES('verdict écrit sur la PR 12 : refusé') };
  const lecture = (commentaires, champs = {}) => {
    const e = pr({ commentaires, ...champs });
    return tours(lireMarques(e.commentaires), e).at(-1);
  };

  // Un `validé` intact, puis un verdict modifié de la même session : `incomplet`, le validé ne reparaît pas.
  for (const mot of ['refusé', 'validé', 'incomplet']) {
    const fil1 = fil(...base, verdict(1, 'r1', 'validé'), modifie(1, 'r1', mot));
    assert.deepEqual(joue({ commentaires: fil1 }), RELANCE, mot);
    assert.equal(tourValide(pr({ commentaires: fil1 })), null, mot);
    assert.deepEqual(joue({ commentaires: fil1, etiquettes: ['à-fusionner'] }), { regle: 3, geste: 'etiqueter', poser: 'à-relire', retirer: ['à-fusionner'], lignes: LIGNES('PR 12 : relecture incomplète') }, mot);
  }
  // Cette lecture ne garde rien de l'ancien verdict : ni sommet, ni bloquants, ni ligne de sécurité.
  const lue = lecture(fil(...base, verdict(1, 'r1', 'validé', { securite: 'lancée' }), modifie(1, 'r1', 'refusé')), { sensible: true }).verdicts.r1;
  assert.deepEqual([lue.verdict, lue.sommet, lue.bloquants, lue.securite, lue.illisible, lue.rang], ['incomplet', null, null, null, true, 3]);
  // Un `incomplet` intact, puis un verdict modifié : `incomplet`.
  assert.deepEqual(joue({ commentaires: fil(...base, verdict(1, 'r1', 'incomplet'), modifie(1, 'r1', 'validé')) }), RELANCE);

  // Un `refusé` intact, puis un verdict modifié de la même session : le refus tient, quel que soit le mot modifié.
  for (const mot of ['refusé', 'validé', 'incomplet']) {
    const fil2 = fil(...base, verdict(1, 'r1', 'refusé'), modifie(1, 'r1', mot));
    assert.deepEqual(joue({ commentaires: fil2 }), REPRENDRE, mot);
    assert.equal(lecture(fil2).etat, 'refuse', mot);
    assert.equal(comptes({ commentaires: fil2 }), 1, mot);
    assert.equal(tourValide(pr({ commentaires: fil2 })), null, mot);
  }
  // Le refus tient encore quand la session est relancée, puis remplacée, et que la remplaçante valide.
  const remplacee = fil(...base, verdict(1, 'r1', 'refusé'), modifie(1, 'r1', 'refusé'), D(1, V1, ['r1'], 'relance', 'r1'), { corps: D(1, V1, ['r2'], 'remplace', 'r1'), a: 200 }, verdict(1, 'r2', 'validé'));
  assert.deepEqual(joue({ commentaires: remplacee, maintenant: DEBUT + 4 * H }), REPRENDRE);
  assert.equal(tourValide(pr({ commentaires: remplacee })), null);
  assert.equal(comptes({ commentaires: remplacee }), 1);
  // … quand la session était déjà remplacée au moment où son refus est modifié ;
  const dejaRemplacee = fil(...base, verdict(1, 'r1', 'refusé'), D(1, V1, ['r2'], 'remplace', 'r1'), modifie(1, 'r1', 'validé'), verdict(1, 'r2', 'validé'));
  assert.deepEqual(joue({ commentaires: dejaRemplacee }), REPRENDRE);
  assert.equal(tourValide(pr({ commentaires: dejaRemplacee })), null);
  // … quand deux sessions sont nommées pour un seul verdict exigé, et à deux verdicts exigés.
  const deux = fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'refusé'), modifie(1, 'r1', 'refusé'), verdict(1, 'r2', 'validé'));
  assert.deepEqual(joue({ commentaires: deux }), REPRENDRE);
  assert.equal(tourValide(pr({ commentaires: deux })), null);
  assert.deepEqual(joue({ commentaires: deux, exiges: 2 }).lignes, LIGNES('verdict écrit sur la PR 12 : refusé, double'));
  assert.equal(tourValide(pr({ commentaires: deux, exiges: 2 })), null);
  // Un troisième refus suivi d'un verdict modifié : le plafond, pas une relance.
  const refus = (k, v) => [DEMANDE(v), D(k, v, ['r1']), verdict(k, 'r1', 'refusé', { sommet: v })];
  const troisieme = joue({ commentaires: fil(...refus(1, V1), ...refus(2, V2), ...refus(3, V3), modifie(3, 'r1', 'validé', { sommet: V3 })), tete: V3 });
  assert.deepEqual([troisieme.regle, troisieme.geste], [1, 'plafonner']);
  // Un arbitrage écarté vise le refus qui tient, pas le verdict modifié qui le suit.
  assert.equal(joue({ commentaires: fil(...base, verdict(1, 'r1', 'refusé'), ECARTE, modifie(1, 'r1', 'validé'), DEMANDE()) }).geste, 'distribuer');

  // Un ancien verdict modifié, puis un verdict plus récent intact : le plus récent juge.
  assert.equal(joue({ commentaires: fil(...base, modifie(1, 'r1', 'refusé'), verdict(1, 'r1', 'validé')) }).poser, 'à-fusionner');
  assert.equal(joue({ commentaires: fil(...base, modifie(1, 'r1', 'validé'), verdict(1, 'r1', 'refusé')) }).poser, 'à-reprendre');
  assert.equal(joue({ commentaires: fil(...base, verdict(1, 'r1', 'validé'), modifie(1, 'r1', 'refusé'), verdict(1, 'r1', 'validé')) }).poser, 'à-fusionner');
  // La relance tracée, la session rend un verdict neuf : la suite reprend.
  const relance = [...base, verdict(1, 'r1', 'validé'), modifie(1, 'r1', 'refusé'), D(1, V1, ['r1'], 'relance', 'r1')];
  assert.equal(joue({ commentaires: fil(...relance) }).raison, 'attente');
  assert.equal(joue({ commentaires: fil(...relance, verdict(1, 'r1', 'refusé')) }).poser, 'à-reprendre');
  // Seul le verdict modifié d'un compte qui compte, pour cette session et ce tour, retire quelque chose.
  const valide = [...base, verdict(1, 'r1', 'validé')];
  assert.equal(joue({ commentaires: fil(...valide, { ...modifie(1, 'r1', 'refusé'), de: 'NONE' }) }).poser, 'à-fusionner', "un compte sans droit n'annule pas un verdict");
  assert.equal(joue({ commentaires: fil(...valide, modifie(1, 'r2', 'refusé')) }).poser, 'à-fusionner', "le verdict modifié d'une autre session");
  assert.equal(joue({ commentaires: fil(...valide, modifie(2, 'r1', 'refusé')) }).poser, 'à-fusionner', "le verdict modifié d'un autre tour");
  // À deux verdicts exigés : la session au validé suivi d'un verdict modifié ne compte plus, l'autre reste.
  const double = fil(DEMANDE(), D(1, V1, ['r1', 'r2']), verdict(1, 'r1', 'validé'), verdict(1, 'r2', 'validé'), modifie(1, 'r2', 'refusé'));
  assert.deepEqual(joue({ commentaires: double, exiges: 2 }), { regle: 5, geste: 'reecrire', tour: 1, sommet: V1, sessions: ['r1', 'r2'], session: 'r2' });
  // Un verdict modifié sans verdict antérieur de la session reste écarté, la session est attendue (A-85, A-108).
  assert.equal(joue({ commentaires: fil(...base, modifie(1, 'r1', 'validé')) }).raison, 'attente');
  assert.equal(joue({ commentaires: fil(...base, modifie(1, 'r1', 'refusé')) }).raison, 'attente');
});

test("A-118 — un verdict que rien ne rattache, plus récent que la dernière distribution du dernier tour, est une lecture illisible ; plus ancien, il reste écarté", () => {
  const base = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')];
  const perdu = verdict(1, 'r1', 'refusé').replace('Session: r1', 'Session: la mienne');
  const CAUSE = 'commentaire 103 : verdict que rien ne rattache à un tour et à une session';
  const ILL = { regle: null, geste: 'illisible', commentaire: `${TEXTE_ILLISIBLE}${CAUSE}`, lignes: [{ a: 'architecte', session: null, texte: `PR 12 : lecture illisible : ${CAUSE}` }] };
  // Un refus abîmé (modifié, sa session ne se lit plus) après un validé intact : jamais `à-fusionner` en silence.
  for (const corps of [{ corps: perdu, edite: true }, perdu, verdict(1, 'r1', 'refusé').replace('Tour: 1', 'Tour: un'), '<!-- relecture:verdict -->']) {
    assert.deepEqual(joue({ commentaires: fil(...base, corps) }), ILL, JSON.stringify(corps));
    assert.deepEqual(joue({ commentaires: fil(...base, corps), etiquettes: ['à-fusionner'] }), ILL, JSON.stringify(corps));
    assert.throws(() => tourValide(pr({ commentaires: fil(...base, corps) })), LectureIllisible, JSON.stringify(corps));
    assert.throws(() => lireMarques(fil(...base, corps)), LectureIllisible, JSON.stringify(corps));
    assert.deepEqual(sommetsDesTours(fil(...base, corps)), [V1]);
  }
  // Tracé, il ne se rejoue pas ; il se périme comme les autres.
  const trace = fil(...base, { corps: perdu, edite: true }, `${TEXTE_ILLISIBLE}${CAUSE}`);
  assert.deepEqual(joue({ commentaires: trace }), { regle: null, geste: 'rien', raison: 'illisible-signale' });
  assert.deepEqual(joue({ commentaires: trace, maintenant: DEBUT + 9 * H }), ILL);
  // Le premier fautif est nommé, marque presque à la forme ou verdict perdu, par rang.
  assert.equal(joue({ commentaires: fil(...base, { corps: perdu, edite: true }, `${TEXTE_PANNE}.`) }).commentaire, `${TEXTE_ILLISIBLE}${CAUSE}`);
  assert.equal(joue({ commentaires: fil(...base, `${TEXTE_PANNE}.`, { corps: perdu, edite: true }) }).commentaire, `${TEXTE_ILLISIBLE}commentaire 103 : préfixe « ${TEXTE_PANNE} » sans la forme de sa marque`);
  // Plus ancien que la dernière distribution du dernier tour : écarté, comme avant.
  assert.equal(joue({ commentaires: fil(DEMANDE(), { corps: perdu, edite: true }, perdu, D(1, V1, ['r1']), verdict(1, 'r1', 'validé')) }).poser, 'à-fusionner');
  assert.equal(joue({ commentaires: fil(...base, perdu, D(1, V1, ['r1'], 'relance', 'r1')) }).poser, 'à-fusionner', 'une distribution du tour, plus récente, le laisse derrière elle');
  assert.equal(joue({ commentaires: fil(...base, perdu, DEMANDE(V2), D(2, V2, ['r1'])), tete: V2 }).raison, 'attente', 'un tour neuf aussi');
  assert.equal(joue({ commentaires: fil(DEMANDE(), perdu) }).regle, 6, 'sans aucune distribution, rien à protéger');
  // D'un compte sans droit, il ne compte pour rien.
  for (const hors of [{ de: 'NONE' }, { de: 'NONE', edite: true }]) assert.equal(joue({ commentaires: fil(...base, { corps: perdu, ...hors }) }).poser, 'à-fusionner', JSON.stringify(hors));
});

test("A-118 — une clé venue de l'entrée n'est jamais lue sur un prototype : session nommée `constructor`, table héritée", () => {
  for (const nom of ['constructor', 'toString', 'valueOf', 'hasOwnProperty']) {
    const distribue = fil(DEMANDE(), D(1, V1, [nom]));
    assert.deepEqual(joue({ commentaires: distribue }), { regle: 5, geste: 'rien', raison: 'attente', attendues: [nom], echeance: DEBUT + 60_000 + 2 * H }, nom);
    assert.equal(joue({ commentaires: distribue, sessions: {} }).raison, 'attente', nom);
    assert.equal(tourValide(pr({ commentaires: distribue })), null, nom);
    assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, [nom]), verdict(1, nom, 'validé')) }).poser, 'à-fusionner', nom);
  }
  const valide = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'));
  // « Même contenu propre » hérité : ni « même », ni « illisible ».
  assert.equal(joue({ commentaires: valide, tete: T, memeContenu: Object.create({ [V1]: true }) }).regle, 6);
  assert.equal(tourValide(pr({ commentaires: valide, tete: T, memeContenu: Object.create({ [V1]: true }) })), null);
  assert.equal(joue({ commentaires: valide, tete: T, memeContenu: Object.create({ [V1]: ILLISIBLE }) }).regle, 6);
  const deuxTours = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'), D(2, T, ['r1']), verdict(2, 'r1', 'refusé', { sommet: T }));
  assert.equal(tourValide(pr({ commentaires: deuxTours, tete: T2, memeContenu: Object.assign(Object.create({ [T]: false }), { [V1]: true }) })), null, 'une réponse héritée pour un tour plus récent est une clé qui manque');
  // L'état hérité d'une session n'est pas un état connu.
  assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1'])), sessions: Object.create({ r1: 'morte' }) }).raison, 'attente');
});

// --- Suite du ticket 66 (ticket 68) : A-182, point 2 -------------------------------------------------------------------

test("A-182 (2) — une session à un autre couple que la PR (`couple`) est remplacée, cause `couple`, jamais relancée ; une fois par tour, puis la panne", () => {
  const distribue = [DEMANDE(), D(1, V1, ['r1'])];
  assert.deepEqual(joue({ commentaires: fil(...distribue), sessions: { r1: 'couple' } }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1', cause: 'couple' });
  // Un `incomplet` à relancer, mais la session est à l'ancien couple : remplacée, pas relancée.
  const incomplet = [...distribue, verdict(1, 'r1', 'incomplet')];
  assert.equal(joue({ commentaires: fil(...incomplet) }).geste, 'reecrire');
  assert.deepEqual(joue({ commentaires: fil(...incomplet), sessions: { r1: 'couple' } }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1', cause: 'couple' });
  // Une PR devenue double : la session ajoutée d'abord (`completer`), puis l'ancienne au mauvais couple remplacée.
  assert.equal(joue({ commentaires: fil(...distribue), exiges: 2, sessions: { r1: 'couple' } }).geste, 'completer');
  assert.deepEqual(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), D(1, V1, ['r1', 'r2'], 'complète')), exiges: 2, sessions: { r1: 'couple', r2: 'vivante' } }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1', 'r2'], session: 'r1', cause: 'couple' });
  // Déjà remplacée une fois dans ce tour : la remplaçante à un autre couple, c'est la panne.
  const remplace = [...distribue, D(1, V1, ['r2'], 'remplace', 'r1')];
  assert.equal(joue({ commentaires: fil(...remplace), sessions: { r2: 'couple' } }).geste, 'panne');
  // `vivante` reste vivante, et un mot hors des quatre reste refusé.
  assert.equal(joue({ commentaires: fil(...distribue), sessions: { r1: 'vivante' } }).raison, 'attente');
  assert.throws(() => joue({ commentaires: fil(...distribue), sessions: { r1: 'autre-couple' } }), TypeError);
});

// --- Ticket 94 : « même contenu propre » qui garde un verdict ou un refus se dit sur la PR (A-224, A-239 (1)) ------------

const NOTE = (tete, tour, mot, sommet, raison = 'de V à T : 1 fusion(s) de origin/develop, 0 commit(s) d\'index générés') => ecrireNote({ tete, tour, verdict: mot, sommet, raison });

test("ticket 94 — un refus gardé (#17) : `etiqueter` (r4) porte la note du tour, une fois par tête et par tour ; une tête égale au sommet n'en porte pas", () => {
  const refuse = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), DEMANDE(T)];
  const meme = { tete: T, memeContenu: { [V1]: true } };
  assert.deepEqual(joue({ ...meme, commentaires: fil(...refuse) }), {
    regle: 4,
    geste: 'etiqueter',
    poser: 'à-reprendre',
    retirer: ['à-relire'],
    lignes: LIGNES('verdict écrit sur la PR 12 : refusé'),
    note: { tour: 1, sommet: V1, verdict: 'refusé' },
  });
  // La note de cette tête et de ce tour au fil : l'étiquette seule, sans seconde note.
  const note = joue({ ...meme, commentaires: fil(...refuse, NOTE(T, 1, 'refusé', V1)) });
  assert.deepEqual([note.regle, note.geste, note.poser, Object.hasOwn(note, 'note')], [4, 'etiqueter', 'à-reprendre', false]);
  // La note d'une autre tête, ou d'un autre tour, ne compte pas pour celle-ci.
  assert.deepEqual(joue({ ...meme, commentaires: fil(...refuse, NOTE(T2, 1, 'refusé', V1)) }).note, { tour: 1, sommet: V1, verdict: 'refusé' });
  assert.deepEqual(joue({ ...meme, commentaires: fil(...refuse, NOTE(T, 2, 'refusé', V1)) }).note, { tour: 1, sommet: V1, verdict: 'refusé' });
  // Une tête égale au sommet du tour : ni note, ni `noter`.
  const surLeSommet = joue({ commentaires: fil(...refuse.slice(0, 3), DEMANDE()) });
  assert.deepEqual([surLeSommet.regle, surLeSommet.geste, Object.hasOwn(surLeSommet, 'note')], [4, 'etiqueter', false]);
  const valide = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'));
  assert.deepEqual(joue({ commentaires: valide, etiquettes: ['à-fusionner'] }), RIEN_EN_PLACE(2));
  assert.equal(Object.hasOwn(joue({ commentaires: valide }), 'note'), false);
});

test("ticket 94 — un verdict gardé : `etiqueter` (r2) porte la note ; l'étiquette en place, `noter` (r2) au lieu de rien, puis rien une fois la note écrite", () => {
  const valide = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé'), DEMANDE(T)];
  const meme = { tete: T, memeContenu: { [V1]: true } };
  assert.deepEqual(joue({ ...meme, commentaires: fil(...valide) }), {
    regle: 2,
    geste: 'etiqueter',
    poser: 'à-fusionner',
    retirer: ['à-relire'],
    lignes: LIGNES('verdict écrit sur la PR 12 : validé'),
    note: { tour: 1, sommet: V1, verdict: 'validé' },
  });
  assert.deepEqual(joue({ ...meme, commentaires: fil(...valide), etiquettes: ['à-fusionner'] }), { regle: 2, geste: 'noter', note: { tour: 1, sommet: V1, verdict: 'validé' }, lignes: [] });
  assert.deepEqual(joue({ ...meme, commentaires: fil(...valide, NOTE(T, 1, 'validé', V1)), etiquettes: ['à-fusionner'] }), RIEN_EN_PLACE(2));
  const ecrite = joue({ ...meme, commentaires: fil(...valide, NOTE(T, 1, 'validé', V1)) });
  assert.deepEqual([ecrite.geste, Object.hasOwn(ecrite, 'note')], ['etiqueter', false]);
});

test("ticket 94 — la reprise non comptée de la règle 4 (`distribuer`) n'a pas de note : un tour neuf suit, sur la tête", () => {
  const conteste = fil(DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'refusé'), ECARTE, DEMANDE(T));
  assert.deepEqual(joue({ commentaires: conteste, tete: T, memeContenu: { [V1]: true } }), { regle: 4, geste: 'distribuer', tour: 2, sommet: T, nombre: 1, preferees: ['r1'], mention: MENTION_ARBITRAGE });
});

test("ticket 94 — la note est une trace hors de `dernier` : à la forme, elle ne change ni `dernier` ni `tourValide` ; presque à la forme, c'est une lecture illisible", () => {
  const valide = [DEMANDE(), D(1, V1, ['r1']), verdict(1, 'r1', 'validé')];
  const note = NOTE(T, 1, 'validé', V1);
  const sans = lireMarques(fil(...valide));
  const avec = lireMarques(fil(...valide, note));
  assert.equal(avec.dernier, sans.dernier, 'la note n\'entre pas dans `dernier`');
  assert.deepEqual(avec.notes.map(({ rang, tete, tour, verdict: mot, sommet }) => [rang, tete, tour, mot, sommet]), [[3, T, 1, 'validé', V1]]);
  assert.deepEqual(avec.presque, []);
  const meme = { tete: T, memeContenu: { [V1]: true } };
  assert.equal(tourValide(pr({ ...meme, commentaires: fil(...valide, note) })).numero, tourValide(pr({ ...meme, commentaires: fil(...valide) })).numero);
  // Presque à la forme : tronquée, ou sur deux lignes.
  for (const abimee of [`Même contenu — sommet ${T} — tour 1 validé`, `${note}\nune seconde ligne`, `Même contenu — sommet ${T.toUpperCase()} — tour 1 validé au sommet ${V1} — raison`]) {
    const g = joue({ ...meme, commentaires: fil(...valide, abimee), etiquettes: ['à-fusionner'] });
    assert.equal(g.geste, 'illisible', abimee);
    assert.match(g.commentaire, /préfixe « Même contenu — » sans la forme de sa marque/);
    assert.throws(() => tourValide(pr({ ...meme, commentaires: fil(...valide, abimee) })), LectureIllisible, abimee);
  }
});

test('ticket 94 — `ecrireNote` compose la note et la relit par sa forme : une raison vide, sur deux lignes, ou un sommet mal formé lèvent TypeError', () => {
  assert.equal(NOTE(T, 1, 'refusé', V1, 'de V à T : 0 fusion(s)'), `Même contenu — sommet ${T} — tour 1 refusé au sommet ${V1} — de V à T : 0 fusion(s)`);
  for (const raison of ['', '   ', 'une\ndeux', ' bord']) assert.throws(() => NOTE(T, 1, 'refusé', V1, raison), TypeError, JSON.stringify(raison));
  assert.throws(() => NOTE(T, 1, 'refusé', 'abc'), TypeError);
  assert.throws(() => NOTE(T.toUpperCase(), 1, 'refusé', V1), TypeError);
  assert.throws(() => NOTE(T, 0, 'refusé', V1), TypeError);
  assert.throws(() => NOTE(T, 1, 'incomplet', V1), TypeError);
});
