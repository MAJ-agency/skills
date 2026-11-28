// Banc du lecteur de verdict (relecture indépendante, lot 3a). Aucun dépôt jouet, aucun processus : des
// commentaires d'exemple, à la forme que l'API GitHub rend.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { ASSOCIATIONS, LectureIllisible, MARQUE_VERDICT, MOTIFS_ECARTES, PIED, corpsLu, ecrireVerdict, fichiersNommes, lireVerdict, lireVerdicts, retenir } from './verdict.mjs';

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

// Les fichiers qu'un verdict nomme (programme « périmètre figé », ticket 2, A-9, A-10).
const TABLEAU = (...lignes) => `| Gravité | Axe | Critère | Fichier et ligne | Constat | Test qui l'aurait attrapé |\n| --- | --- | --- | --- | --- | --- |\n${lignes.join('\n')}`;
const CORPS = (lignes, ecartes = []) => `${entete({ verdict: 'refusé', bloquants: 1 })}\n\nPR #4 vers \`develop\` : 2 fichiers.\n\n${TABLEAU(...lignes)}\n\nÉcartés au tri : ${ecartes.length}.\n${ecartes.join('\n')}\n\nHors du diff relu : aucun`;

test("fichiersNommes : le gabarit rempli (l'exemple de verdict.md, posé à côté ou dans le plugin) se lit sans ligne illisible", () => {
  // L'exemple de verdict.md : dans le plugin seulement ; posé à plat, le banc lit son propre gabarit.
  let exemple = null;
  try {
    exemple = /```text\n([\s\S]*?)\n```/.exec(readFileSync(new URL('../../relecture/references/verdict.md', import.meta.url), 'utf8'))[1];
  } catch {
    exemple = CORPS(['| bloquant | Ticket | `T3`, `RULE_ALL_FAC-16` | `apps/api/src/facture/total.ts:42` | Une facture sans ligne. | `total.spec.ts` |'], ['- `apps/api/src/facture/total.ts:12` : sans critère — une suggestion de nommage.']);
  }
  const lu = fichiersNommes(corpsLu(exemple));
  assert.equal(lu.illisibles, 0, JSON.stringify(lu));
  assert.ok(lu.bloquants.includes('apps/api/src/facture/total.ts'));
  assert.deepEqual(lu.faux, []);
});

test('fichiersNommes : la cellule « Fichier et ligne » et les chemins entre accents graves du constat (A-10) ; un segment qui n\'est pas un chemin est ignoré', () => {
  const lu = fichiersNommes(CORPS([
    '| bloquant | Documentation | `D4`, `CONTEXT.md` | `docs/a.md:12` | Le terme manque à `GLOSSARY.md`, voir `docs/adr/` et `CONTEXT.md:71` ; `D4`, `pnpm test`, `Périmètre — `. | aucun test |',
    '| bloquant | Ticket | `T3` | — | Le ticket ne dit pas la règle. | aucun test |',
    '| doute | Règles | `S9` | `docs/doute.md:3` | `docs/autre.md` ? | — |',
  ]));
  assert.deepEqual(lu, { bloquants: ['docs/a.md', 'GLOSSARY.md', 'docs/adr/', 'CONTEXT.md'], faux: [], illisibles: 0 });
});

test('fichiersNommes : les lignes piégées — un chemin qui porte « : », un intervalle de lignes, une cellule sans accent grave, une ligne coupée', () => {
  assert.deepEqual(fichiersNommes(CORPS(['| bloquant | R | `D1` | `docs/a:b.md:12` | x | t |'])).bloquants, ['docs/a:b.md']);
  assert.deepEqual(fichiersNommes(CORPS(['| bloquant | R | `D1` | `docs/a.md:3-7` | x | t |'])), { bloquants: ['docs/a.md'], faux: [], illisibles: 0 });
  assert.deepEqual(fichiersNommes(CORPS(['| bloquant | R | `D1` | `docs/a.md \\| b` | x \\| y | t |'])).illisibles, 1, 'une barre échappée reste dans sa cellule');
  for (const lieu of ['docs/a.md:12', '`docs/a.md`', '`docs/a.md:0`', '`docs/a.md:x`', '`:12`', 'aucun'])
    assert.equal(fichiersNommes(CORPS([`| bloquant | R | \`D1\` | ${lieu} | x | t |`])).illisibles, 1, lieu);
  assert.equal(fichiersNommes(CORPS(['| bloquant | R | `D1` | `docs/a.md:1` | x |'])).illisibles, 1, 'cinq cellules');
});

test('fichiersNommes : les écartés « faux » sous « Écartés au tri », les six motifs ; la liste finit à une ligne vide, puis à une ligne qui n\'est pas une puce', () => {
  assert.deepEqual(MOTIFS_ECARTES, ['sans critère', 'faux', 'arbitrage', 'develop', 'doublon', 'suite']);
  const ecartes = MOTIFS_ECARTES.map((m, i) => `- \`docs/${i}.md:4\` : ${m} — \`D2\`, pourquoi en une phrase`);
  assert.deepEqual(fichiersNommes(CORPS([], ecartes)), { bloquants: [], faux: ['docs/1.md'], illisibles: 0 });
  assert.deepEqual(fichiersNommes(CORPS([], ['- — : faux — une remarque sans fichier'])).faux, []);
  for (const puce of ['- `docs/f.md:4` : la définition est juste', '- `docs/f.md:4` : faux, la définition est juste', '- `docs/f.md:4` : Faux — x', '- docs/f.md:4 : faux — x', '- `docs/f.md:4` : erroné — x'])
    assert.equal(fichiersNommes(CORPS([], [puce])).illisibles, 1, puce);
  // Fin de liste : la ligne vide, puis une ligne qui n'est pas une puce ; ce qui suit n'est pas lu.
  const fin = `${TABLEAU()}\n\nÉcartés au tri : 1.\n- \`docs/f.md:4\` : faux — x\n\n- \`docs/g.md:1\` : faux — x`;
  assert.deepEqual(fichiersNommes(fin).faux, ['docs/f.md']);
  const finTexte = `Écartés au tri : 1.\n- \`docs/f.md:4\` : faux — x\nHors du diff relu : aucun\n- \`docs/g.md:1\` : pas une puce lue`;
  assert.deepEqual(fichiersNommes(finTexte), { bloquants: [], faux: ['docs/f.md'], illisibles: 0 });
  assert.deepEqual(fichiersNommes(`Écartés au tri : <n>.\n- \`<fichier>:<ligne>\` : <motif>`), { bloquants: [], faux: [], illisibles: 0 }, 'le gabarit non rempli : aucune liste lue');
});

test('fichiersNommes : lireVerdict et ecrireVerdict ne changent pas, le corps lu ou non', () => {
  const corps = CORPS(['| bloquant | R | `D1` | pas un lieu | x | t |']);
  const v = lireVerdict(corps);
  assert.equal(v.illisible, false);
  assert.equal(v.verdict, 'refusé');
});

test('fichiersNommes : les entrées piégées — fins de ligne CRLF (lues par corpsLu, comme la machine les lit), dernière ligne sans fin de ligne', () => {
  const corps = CORPS(['| bloquant | R | `D1` | `docs/a.md:12` | voir `GLOSSARY.md` | t |'], ['- `docs/f.md:4` : faux — `D2`, la définition est juste']);
  const attendu = { bloquants: ['docs/a.md', 'GLOSSARY.md'], faux: ['docs/f.md'], illisibles: 0 };
  assert.deepEqual(fichiersNommes(corpsLu(corps.replace(/\n/g, '\r\n'))), attendu);
  assert.deepEqual(fichiersNommes(corpsLu(`${corps.replace(/\n/g, '\r\n')}\r\n\r\n---\r\n${PIED}\r\n`)), attendu, 'le pied des sessions cloud, en CRLF');
  // La dernière ligne lue, sans fin de ligne : un bloquant, puis une puce.
  assert.deepEqual(fichiersNommes('| bloquant | R | `D1` | `docs/a.md:12` | x | t |'), { bloquants: ['docs/a.md'], faux: [], illisibles: 0 });
  assert.deepEqual(fichiersNommes('Écartés au tri : 1.\n- `docs/f.md:4` : faux — x'), { bloquants: [], faux: ['docs/f.md'], illisibles: 0 });
});
