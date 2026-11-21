// Contre-relecture de la PR 146, second tour : le delta d1679f3..a32476a relu comme par un relecteur neuf. Jouer sur
// l'arbre de a32476a (`APRES` pointé dessus), puis sur cet arbre plus retouches-tour-2.patch. Un rouge sur a32476a est
// un constat du second tour (R<k>, numéros du rapport) ; R3 est un mineur, laissé à un ticket de suite.
// Lancer : APRES=<arbre> node --test essais-c2.test.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const APRES = process.env.APRES;
const { depotJouet, script } = await import(join(APRES, 'skills/chaine/sujet/scripts/depot-jouet.mjs'));
const RELECTEUR = join(APRES, 'skills/chaine/relecteur/scripts/relecteur.mjs');
const SKILL = readFileSync(join(APRES, 'skills/chaine/relecteur/SKILL.md'), 'utf8');
const section = (debut, fin) => SKILL.slice(SKILL.indexOf(debut), SKILL.indexOf(fin));

test('R1 — une veille arrêtée sur une sortie à « rejouer au réveil suivant » (9, 12, autre) relance la veille : sans elle, aucun réveil ne vient', () => {
  const veille = section('## La veille', '## Ne jamais');
  const arretee = veille.split('\n').find((l) => l.startsWith('- **`VEILLE ARRÊTÉE sortie <c>`**'));
  assert.ok(arretee, 'la puce de VEILLE ARRÊTÉE');
  const sorties = section('## Les sorties de `passe`, `jouer` et `distribuer`', '## Créer ou relancer les sessions');
  // Les sorties qui renvoient au réveil suivant, et qu'une passe de la veille peut rendre.
  const auReveil = sorties.split('\n').filter((l) => /^\| (9|12|autre)/.test(l) && l.includes('rejouer au réveil suivant'));
  assert.equal(auReveil.length, 3, 'les sorties 9, 12 et « autre » renvoient au réveil suivant');
  assert.match(arretee, /relancer la veille/, `la puce ne dit pas de relancer la veille : ${arretee}`);
});

test('R2 — la phrase d’A-182 dans « L’état des sessions » : le couple ne se lit que pour réemployer, jamais pour une session seulement attendue', () => {
  const etat = section("## L'état des sessions", '## Les lignes');
  assert.ok(etat.includes("sans `effort_level`, le couple n'est pas tenu pour égal, et la PR reçoit une session neuve."), 'la phrase d’A-182 est là');
  // Lue pour une PR en attente (règle 5, `rien`), « la PR reçoit une session neuve » ne peut se faire qu'en écrivant la
  // session `morte` : un remplacement par tour, puis `Relecture en panne`. Le texte doit dire que ce n'est pas le cas.
  assert.match(etat, /seulement attendue \(`rien`, raison `attente`\) ne s'écrit jamais `morte` pour son couple/, 'rien ne borne la phrase au réemploi');
});

test('R3 (mineur, ticket de suite) — une installation en échec dans une passe que GitHub fait sortir en 5 : son erreur n’arrive pas au journal de la veille', () => {
  const d = depotJouet();
  d.publierChaine();
  for (const [skill, nom] of [['fusionner', 'decision-relecteur.mjs'], ['fusionner', 'verdict.mjs'], ['fusionner', 'double-relecture.mjs'], ['fusionner', 'meme-contenu.sh'], ['revue-adversariale', 'chemins-sensibles.mjs']]) d.ecrire(`scripts/chaine/${nom}`, readFileSync(script(skill, nom), 'utf8'));
  d.ecrire('.claude/chaine.json', `${JSON.stringify({ relecture: { depuis: '2026-11-20T09:00:00Z' } })}\n`);
  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
  d.commit('chore: calculs, contrat, lockfile');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  const dossier = join(d.racine, 'relecteur');
  execFileSync('git', ['clone', '-q', d.origine, dossier], { env: d.env });
  execFileSync('sh', ['-c', 'printf \'#!/bin/sh\\ncat > /dev/null\\necho "ERR_PNPM_PASSAGERE" >&2\\nexit 1\\n\' > "$1/bin/pnpm"; chmod +x "$1/bin/pnpm"', '_', d.racine]);
  // GitHub ne répond pas à la liste des PR, une fois, dans la passe qui installe.
  d.github({ pulls: [], pannes: [{ route: '^pulls\\?', fois: 1 }] });
  const r = spawnSync(process.execPath, [RELECTEUR, 'veille', '--pause', '0', '--sondes', '2'], { cwd: dossier, env: d.env, encoding: 'utf8', timeout: 120_000 });
  assert.match(r.stdout, /^PAUSE /m);
  assert.match(`${r.stdout}\n${r.stderr}`, /ERR_PNPM_PASSAGERE/, 'l’erreur d’installation n’est écrite nulle part, et le témoin dit « echec » : elle ne se retentera pas');
});
