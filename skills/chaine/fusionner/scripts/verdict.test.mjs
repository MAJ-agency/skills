// Banc du lecteur de verdict (relecture indépendante, lot 3a). Aucun dépôt jouet, aucun processus : des
// commentaires d'exemple, à la forme que l'API GitHub rend.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ASSOCIATIONS, LectureIllisible, MARQUE_VERDICT, PIED, corpsLu, ecrireVerdict, lireVerdict, lireVerdicts, retenir } from './verdict.mjs';

const V = 'a'.repeat(40);
const CLOUD = `\n\n---\n${PIED}`;
const heure = (minutes) => new Date(Date.UTC(2026, 10, 18, 10, minutes)).toISOString();
const dit = (body, { de = 'MEMBER', edite = false, a = 0, id = 1 } = {}) => ({
  id,
  body,
  author_association: de,
  created_at: heure(a),
  updated_at: edite ? heure(a + 5) : heure(a),
});
const entete = (champs = {}) => ecrireVerdict({ sommet: V, tour: 1, verdict: 'validé', bloquants: 0, session: 'session_r1', ...champs });
const lu = (body, options) => lireVerdicts([dit(body, options)]);

test('verdict : la forme fixe se lit, avec ou sans constats, avec ou sans la ligne /security-review', () => {
  const attendu = { sommet: V, tour: 1, verdict: 'validé', bloquants: 0, session: 'session_r1', securite: null, illisible: false, defauts: [] };
  assert.deepEqual(lu(entete()).verdicts, [{ id: 1, rang: 0, date: heure(0), ...attendu }]);
  assert.deepEqual(lu(entete({ securite: 'lancée' })).verdicts[0].securite, 'lancée');
  assert.deepEqual(lu(entete({ securite: 'non requise' })).verdicts[0].securite, 'non requise');
  const refus = `${entete({ verdict: 'refusé', bloquants: 2 })}\n\n- bloquant — R3 — src/a.ts:12 — le tenant n'est pas filtré — test : « refuse un autre tenant »\n- doute — D2 — README.md:4 — phrase ambiguë`;
  assert.deepEqual(lu(refus).verdicts[0], { id: 1, rang: 0, date: heure(0), ...attendu, verdict: 'refusé', bloquants: 2 });
  assert.equal(lu(entete({ verdict: 'incomplet', bloquants: 1 })).verdicts[0].verdict, 'incomplet', 'un axe non exécuté : ni validé, ni refusé');
  assert.equal(MARQUE_VERDICT, '<!-- relecture:verdict -->');
});

test('verdict : le pied de page des sessions cloud, les fins de ligne \\r\\n, les blancs de bord et la forme décomposée des accents sont tolérés', () => {
  assert.equal(lu(`${entete()}${CLOUD}`).verdicts[0].verdict, 'validé');
  assert.equal(lu(`\n${entete()}\n\n- doute — D1 — a.md:1 — x${CLOUD}\n`).verdicts[0].verdict, 'validé');
  assert.equal(lu(`${entete()}${CLOUD}`.replace(/\n/g, '\r\n')).verdicts[0].verdict, 'validé');
  assert.equal(lu(entete().normalize('NFD')).verdicts[0].verdict, 'validé');
  assert.equal(corpsLu(`  Relecture en panne${CLOUD}\n`), 'Relecture en panne');
  assert.equal(corpsLu(`x\n\n---\n_Generated with [Claude Code](https://claude.ai/code)_`).endsWith('code)_'), true, 'un pied altéré reste dans le corps');
});

test("verdict : un commentaire qui n'est pas à la marque n'est pas un verdict", () => {
  for (const corps of [
    'relu, merci',
    `Verdict: validé\nSommet relu: ${V}`,
    entete().replace(`${MARQUE_VERDICT}\n`, ''),
    `> ${entete()}`,
    `Voici mon verdict :\n${entete()}`,
    entete().replace(MARQUE_VERDICT, '<!-- relecture:verdict-->'),
    // Le commentaire de passage d'un capitaine : une autre marque, au milieu du corps.
    `Passage du capitaine \`cap-1\` depuis 10:02 UTC : un autre capitaine saute cette PR jusqu'à la fin du passage.\n<!-- capitaine:passage cap-1 -->${CLOUD}`,
  ]) {
    assert.equal(lireVerdict(corpsLu(corps)), null, corps);
    assert.deepEqual(lu(corps), { verdicts: [], ecartes: [] }, corps);
  }
});

test("verdict : celui d'un compte sans droit, ou modifié après sa création, est écarté", () => {
  for (const de of ASSOCIATIONS) assert.equal(lu(entete(), { de }).verdicts.length, 1, de);
  for (const de of ['NONE', 'CONTRIBUTOR', 'FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR', 'MANNEQUIN'])
    assert.deepEqual(lu(entete(), { de }), { verdicts: [], ecartes: [{ id: 1, rang: 0, motif: 'auteur' }] }, de);
  assert.deepEqual(lu(entete(), { edite: true }), { verdicts: [], ecartes: [{ id: 1, rang: 0, motif: 'edite' }] });
  // Le commentaire de passage que le capitaine réédite à chaque tour : ni verdict, ni verdict écarté.
  assert.deepEqual(lu('Passage du capitaine `cap-1` terminé à 10:40 UTC.\n<!-- capitaine:passage cap-1 -->\n<!-- capitaine:fin -->', { edite: true }), { verdicts: [], ecartes: [] });
});

test("verdict illisible : à la marque, forme fausse, il se lit `incomplet` quand Tour et Session se lisent, jamais « validé » ; sinon il est écarté", () => {
  const faux = [
    [entete().replace(V, V.slice(0, 7)), /Sommet relu/],
    [entete().replace(V, V.toUpperCase()), /Sommet relu/],
    [entete().replace('Verdict: validé', 'Verdict: ok'), /Verdict/],
    [entete().replace('Verdict: validé', 'Verdict: Validé'), /Verdict/],
    [entete().replace('Verdict: validé', 'Verdict: validé.'), /Verdict/],
    [entete().replace('Bloquants: 0', 'Bloquants: aucun'), /Bloquants/],
    [entete().replace('Bloquants: 0', 'Bloquants: 2'), /validé avec des bloquants/],
    [entete({ verdict: 'incomplet' }).replace('Verdict: incomplet', 'Verdict: refusé'), /refusé sans bloquant/],
    [entete().replace('\nBloquants: 0', ''), /en-tête/],
    [entete().replace(`Sommet relu: ${V}\nTour: 1`, `Tour: 1\nSommet relu: ${V}`), /en-tête/],
    [`${entete()}\n/security-review: lancée (chemins : a.ts)`, /security-review/],
    [`${entete()}\n- bloquant — R1 — a.ts:1 — collé à l'en-tête`, /en-tête/],
    [entete().replace('Verdict: validé', 'Verdict:  validé'), /Verdict/],
  ];
  for (const [corps, motif] of faux) {
    const { verdicts, ecartes } = lu(corps);
    assert.deepEqual(ecartes, [], corps);
    assert.equal(verdicts.length, 1, corps);
    assert.equal(verdicts[0].verdict, 'incomplet', corps);
    assert.equal(verdicts[0].illisible, true, corps);
    assert.equal(verdicts[0].tour, 1);
    assert.equal(verdicts[0].session, 'session_r1');
    assert.ok(verdicts[0].defauts.some((d) => motif.test(d)), `${corps}\n→ ${verdicts[0].defauts.join(' | ')}`);
  }
  for (const corps of [
    MARQUE_VERDICT,
    `${MARQUE_VERDICT}\nvalidé`,
    entete().replace('Tour: 1', 'Tour: 0'),
    entete().replace('Tour: 1', 'Tour: un'),
    entete().replace('Session: session_r1', 'Session: la mienne'),
    entete().replace('\nSession: session_r1', ''),
  ]) {
    const { verdicts, ecartes } = lu(corps);
    assert.deepEqual(verdicts, [], corps);
    assert.equal(ecartes.length, 1, corps);
    assert.equal(ecartes[0].motif, 'illisible', corps);
  }
});

test("verdict : des commentaires illisibles lèvent LectureIllisible, ils ne valent jamais un état", () => {
  const bon = dit(entete());
  const sans = (champ) => Object.fromEntries(Object.entries(bon).filter(([c]) => c !== champ));
  for (const entree of [null, undefined, 'x', { message: 'Bad credentials' }, [null], ['x'], [sans('body')], [sans('created_at')], [sans('updated_at')], [sans('author_association')], [{ ...bon, created_at: 'hier' }]])
    assert.throws(() => lireVerdicts(entree), LectureIllisible, JSON.stringify(entree));
  assert.throws(() => retenir([dit('b', { a: 5 }), dit('a', { a: 1 })]), /ordre de création/);
  assert.deepEqual(lireVerdicts([]), { verdicts: [], ecartes: [] });
  assert.equal(retenir([dit('a'), dit('b')]).retenus.length, 2, 'deux commentaires de la même seconde : ordre reçu');
});

test("verdict : ecrireVerdict rend ce que lireVerdict relit, et refuse d'écrire hors de la forme", () => {
  for (const champs of [{}, { verdict: 'refusé', bloquants: 3, tour: 12, securite: 'lancée' }, { verdict: 'incomplet', bloquants: 0, securite: 'non requise' }]) {
    const { defauts, illisible, ...relu } = lireVerdict(entete(champs));
    assert.deepEqual(relu, { sommet: V, tour: 1, verdict: 'validé', bloquants: 0, session: 'session_r1', securite: null, ...champs });
    assert.equal(illisible, false);
  }
  for (const champs of [{ sommet: 'abc' }, { tour: 0 }, { verdict: 'ok' }, { bloquants: 1 }, { session: 'a b' }, { securite: 'oui' }]) assert.throws(() => entete(champs), TypeError, JSON.stringify(champs));
});
