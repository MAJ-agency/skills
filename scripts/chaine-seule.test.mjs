// Ticket 91 : un socle posé en « chaîne seule » (`socle-monorepo` sans aucun service, puis `socle-chaine-de-production`)
// passe son propre gate. Ce que l'essai réel a trouvé et que ce banc tient, hors du lint des scripts posés
// (`dossiers-poses.test.mjs`) : un seul nom pour la liste de l'admin, aucun lien de la méthode posée par la racine vers
// une brique qu'un dépôt sans service n'a pas, et les skills qui disent, à leur premier `pnpm check`, ce qui se gèle et
// ce qui se génère.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { test } from 'node:test';
import { RACINE } from './pose-du-socle.mjs';

const MONOREPO = 'skills/monorepo/socle-monorepo';
const CHAINE = 'skills/chaine/socle-chaine-de-production';
const lire = (chemin) => readFileSync(join(RACINE, chemin), 'utf8');
const fichiers = (d) =>
  readdirSync(join(RACINE, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiers(`${d}/${e.name}`) : [`${d}/${e.name}`]));

test('la liste de l’admin a un seul nom, docs/agents/chaine-admin.md : posée sous ce nom, et aucun skill ni gabarit ne nomme docs/agents/admin.md', () => {
  assert.match(lire(`${CHAINE}/SKILL.md`), /`references\/admin\.md` → `docs\/agents\/chaine-admin\.md`/);
  const autres = [...fichiers('skills'), 'README.md']
    .filter((f) => /\.(md|mjs|sh|json|yml)$/.test(f))
    .flatMap((f) => lire(f).split('\n').flatMap((l, i) => (/docs\/agents\/admin\.md/.test(l) ? [`${f}:${i + 1}`] : [])));
  assert.deepEqual(autres, [], 'docs/agents/admin.md nommé : la liste de l’admin est docs/agents/chaine-admin.md');
  // La case des checks exigés dit la règle vide, que le capitaine refuse de lire « sans CI » (`RÉGLAGE DU DÉPÔT`).
  assert.match(lire(`${CHAINE}/references/admin.md`), /\*\*jamais une règle sans check\*\* : une règle « Require status checks to pass » qui n'en exige aucun [^;]+; le capitaine le dit dès sa première lecture \(`RÉGLAGE DU DÉPÔT`, sa boucle s'arrête\)/);
  // Le geste dit est d'ajouter les checks, jamais de retirer la règle : sans aucun check exigé, rien n'entre non plus
  // (`attendre_ci` ne voit aucun check exigé apparaître, « CI non déclenchée »), et le capitaine ne le dit pas encore.
  assert.match(lire(`${CHAINE}/references/admin.md`), /: y ajouter les checks, jamais retirer la règle \(sans aucun check exigé, rien n'entre non plus/);
});

test('les liens de la méthode posée par socle-monorepo résolvent dans un dépôt sans service', () => {
  // Ce que la racine pose, à sa place de projet (TABLE-RACINE.md) : seul ce qu'un dépôt sans service est sûr d'avoir.
  const poses = new Set();
  const poser = (source, vers) => {
    for (const f of fichiers(`${MONOREPO}/references/${source}`)) poses.add(normalize(`${vers}/${f.slice(`${MONOREPO}/references/${source}/`.length).replace(/^gitignore$/, '.gitignore')}`));
  };
  poser('racine', '.');
  poser('methode', 'docs/methode');
  poser('agents', 'docs/agents');
  poser('sources', 'docs/sources');
  for (const f of ['ADR_ALL_ARC-1-identifiants-types-et-contextes.md', 'ADR_ALL_ARC-4-langue-des-identifiants-de-code.md']) poses.add(`docs/adr/${f}`);
  const existe = (c) => poses.has(c) || [...poses].some((p) => p.startsWith(`${c.replace(/\/$/, '')}/`));
  const casses = [];
  for (const f of readdirSync(join(RACINE, MONOREPO, 'references/methode'))) {
    let bloc = false;
    lire(`${MONOREPO}/references/methode/${f}`).split('\n').forEach((l, i) => {
      if (/^\s*(```|~~~)/.test(l)) bloc = !bloc;
      if (bloc) return;
      for (const m of l.matchAll(/\]\(([^)\s#]+)(#[^)]*)?\)/g)) {
        if (/^[a-z]+:/.test(m[1])) continue;
        const cible = normalize(join('docs/methode', m[1]));
        if (!existe(cible)) casses.push(`docs/methode/${f}:${i + 1} → ${m[1]}`);
      }
    });
  }
  assert.deepEqual(casses, [], 'un lien de la méthode vers une brique que le dépôt peut ne pas avoir : citer l’identifiant ou le fichier, sans lien');
  assert.ok(poses.size > 20 && statSync(join(RACINE, MONOREPO, 'references/methode')).isDirectory());
});

test('au premier pnpm check, les skills disent ce qui se gèle (et seulement cela) et le registre des coûts qui se génère', () => {
  const monorepo = lire(`${MONOREPO}/SKILL.md`);
  for (const ref of ['scripts/verify/preuves.mjs', 'scripts/verify/tests-creux.mjs', 'docs/agents/gabarits/exemple.jour-metier.spec.ts', 'docs/agents/gabarits/exemple.property.spec.ts'])
    assert.ok(monorepo.includes(`\`${ref}\``), `socle-monorepo, étape 7 : ${ref}`);
  assert.match(monorepo, /Celles-là, et elles seules, se gèlent à cet allumage : chaque ligne `<fichier>:<ligne> — <nature> « <référence> » introuvable` du gate devient l'entrée `"<fichier>:<ligne>:<référence>"` du tableau `references` de `scripts\/verify\/references-agent-dette\.json`/);
  const chaine = lire(`${CHAINE}/SKILL.md`);
  assert.match(chaine, /Puis générer chaque index de la liste par sa `commande` : `node scripts\/docs\/couts\.mjs` écrit le registre des coûts, `docs\/agents\/couts\.md`/);
  assert.match(chaine, /les sept sections de `apps\/api\/CLAUDE\.md` que citent les critères S1, S2, S4, S8, S9 et S10 de `docs\/agents\/criteres-revue\.md`, et `scripts\/db\/demarrer-local\.sh` dans `docs\/agents\/pieges\.md`\. Celles-là, et elles seules, se gèlent/);
  // Les sept sections citées sont bien celles des critères S1, S2, S4, S8, S9 et S10 du gabarit, et elles seules.
  const criteres = lire('skills/chaine/revue-adversariale/references/criteres-socle.md');
  const sections = [...criteres.matchAll(/^(S\d+) .*?apps\/api\/CLAUDE\.md((?: § « [^»]+ »,?)+)/gm)].map((m) => [m[1], [...m[2].matchAll(/« ([^»]+) »/g)].length]);
  assert.deepEqual(sections, [['S1', 2], ['S2', 1], ['S4', 1], ['S8', 1], ['S9', 1], ['S10', 1]]);
});

test('le bloc socle:poses-du-plugin renvoie à la note qui l’introduit, sans numéro de version : un main qui bouge ne rend pas ce renvoi faux', () => {
  const avecVersion = [...fichiers('skills'), 'README.md']
    .filter((f) => /\.(md|mjs|sh|json|yml)$/.test(f))
    .flatMap((f) => lire(f).split('\n').flatMap((l, i) => (/poses-du-plugin/.test(l) && /\b\d+\.\d+\.\d+\b/.test(l) ? [`${f}:${i + 1}`] : [])));
  assert.deepEqual(avecVersion, [], 'une ligne qui renvoie au bloc socle:poses-du-plugin porte un numéro de version : dire « la note qui l’introduit »');
  assert.match(lire(`${MONOREPO}/references/racine/eslint.config.mjs`), /\(NOTES-DE-VERSION\.md du plugin, la note qui l'introduit\)/);
  assert.match(lire(`${CHAINE}/SKILL.md`), /un projet posé sans ce bloc l'ajoute \(`NOTES-DE-VERSION\.md`, la note qui l'introduit\)/);
  // La note qui l'introduit existe : une note de version dont « Ce qui change » nomme le bloc.
  const notes = lire('NOTES-DE-VERSION.md').split(/^## /m).slice(1);
  assert.ok(notes.some((n) => /^### Ce qui change\n[\s\S]*?socle:poses-du-plugin[\s\S]*?^### Ce qu'un projet fait/m.test(n)), 'aucune note de version n’introduit le bloc socle:poses-du-plugin');
});
