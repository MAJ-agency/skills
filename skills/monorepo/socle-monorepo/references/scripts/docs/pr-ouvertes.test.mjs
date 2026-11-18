import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lirePrOuvertes, prDeBranche } from './pr-ouvertes.mjs';

/** Un `gh` factice : répond selon l'URL de l'appel, comme la sortie `--jq` en TSV. */
const faux = (reponses, appels = []) => (args) => {
  appels.push(args);
  const url = args.find((a) => a.startsWith('repos/'));
  for (const [motif, sortie] of reponses) {
    if (url.includes(motif)) {
      if (sortie instanceof Error) throw sortie;
      return sortie;
    }
  }
  throw new Error(`appel inattendu : ${url}`);
};

test('lirePrOuvertes : les PR ouvertes et leurs fichiers, toutes pages lues ; gh absent ou en échec à un appel : verifiees faux, jamais une liste partielle', () => {
  const appels = [];
  const gh = faux(
    [
      ['pulls/7/files', 'added\tdocs/a/issues/X-1-x.01.issue.md\t\nrenamed\tdocs/b.md\tdocs/avant.md\n'],
      ['pulls/9/files', 'removed\tdocs/c.md\t\n'],
      ['pulls?state=open', '7\tfeat/a\ttrue\tfeat: a\t(x)\n9\tfix/b\tfalse\tfix: b\n'],
    ],
    appels,
  );
  const r = lirePrOuvertes({ gh });
  assert.equal(r.verifiees, true);
  assert.deepEqual(r.prs, [
    {
      numero: 7,
      tete: 'feat/a',
      brouillon: true,
      titre: 'feat: a\t(x)',
      fichiers: [
        { chemin: 'docs/a/issues/X-1-x.01.issue.md', ancien: '', statut: 'added' },
        { chemin: 'docs/b.md', ancien: 'docs/avant.md', statut: 'renamed' },
      ],
    },
    { numero: 9, tete: 'fix/b', brouillon: false, titre: 'fix: b', fichiers: [{ chemin: 'docs/c.md', ancien: '', statut: 'removed' }] },
  ]);
  assert.ok(appels.every((a) => a.includes('--paginate')), 'toutes les pages');

  assert.deepEqual(lirePrOuvertes({ gh: faux([['pulls?state=open', '7\tfeat/a\tfalse\tt\n']]) , fichiers: false }).prs[0].fichiers, []);

  // un appel de fichiers qui échoue : pas de liste partielle
  const partiel = faux([
    ['pulls/7/files', 'added\tdocs/x.md\t\n'],
    ['pulls/9/files', new Error('403')],
    ['pulls?state=open', '7\ta\tfalse\tt\n9\tb\tfalse\tu\n'],
  ]);
  assert.deepEqual(lirePrOuvertes({ gh: partiel }), { verifiees: false });
  // gh absent
  assert.deepEqual(lirePrOuvertes({ gh: () => { throw new Error('ENOENT'); } }), { verifiees: false });
});

test('prDeBranche : ouverte, fermée, aucune ; gh en échec : null ; tête qui diffère de la PR fermée : aucune', () => {
  const avec = (sortie) => faux([['state=all', sortie]]);
  assert.equal(prDeBranche('feat/x', { gh: avec('') }), 'aucune');
  assert.equal(prDeBranche('feat/x', { gh: avec('closed\taaa\nopen\tbbb\n') }), 'ouverte');
  assert.equal(prDeBranche('feat/x', { gh: avec('closed\taaa\nclosed\tbbb\n') }), 'fermee');
  assert.equal(prDeBranche('feat/x', { gh: avec('closed\taaa\n'), tete: 'aaa' }), 'fermee');
  assert.equal(prDeBranche('feat/x', { gh: avec('closed\taaa\n'), tete: 'ccc' }), 'aucune');
  assert.equal(prDeBranche('feat/x', { gh: avec(new Error('x')) }), null);
  const appels = [];
  prDeBranche('feat/a b', { gh: faux([['state=all', '']], appels) });
  assert.ok(appels[0].some((a) => a.includes('head={owner}:feat%2Fa%20b')));
});
