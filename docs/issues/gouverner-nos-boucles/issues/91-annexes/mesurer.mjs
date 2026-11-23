// Mesure, sans assertion, chaque cas de durée de `regles.test.mjs` (plugin 8.3.0) : la durée de mur, en ms.
// Usage : node mesurer.mjs <regles.mjs>
import { pathToFileURL } from 'node:url';
const R = await import(pathToFileURL(process.argv[2]).href);
const { decisionCommande, LECTURE_7_9 } = R;
const CTX = { brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' };
const F = 'git push --force origin feat/x';
const ms = (f) => { const t = process.hrtime.bigint(); f(); return Number(process.hrtime.bigint() - t) / 1e6; };
const lignes = [];
const noter = (nom, v, borne) => lignes.push(`${nom}\t${v.toFixed(1)} ms\tborne ${borne} ms`);
noter('A heredocs 30000', ms(() => decisionCommande('cat <<EOF\n'.repeat(30000) + F, CTX)), 5000);
for (const [nom, forme, n] of [['B continuees', (k) => 'echo ' + '"$a" \\\n'.repeat(k) + `; ${F}`, 800], ['B nus', (k) => 'echo ' + '$a '.repeat(k), 2200]]) {
  ms(() => decisionCommande(forme(n / 10), CTX));
  noter(`${nom} n`, ms(() => decisionCommande(forme(n), CTX)), '-');
  noter(`${nom} 3n`, ms(() => decisionCommande(forme(3 * n), CTX)), 2000);
}
noter('C cube', ms(() => decisionCommande("echo '" + '<<A '.repeat(10) + "'" + '\n'.repeat(19900) + 'echo ok', CTX)), 2000);
noter('D 62000', ms(() => decisionCommande('git commit -m x '.repeat(62000) + '; npm install x', CTX)), 2000);
const PIRES = [['gh pr close 1 -', 'd', '!'], ['git commit -', 'n', '!'], ['git commit -m x -', 'nN', '!'], ['GIT commit -', 'n', '.'], ['git push -', 'f', '!'], ['', '`', ''], ['x=', '`', ''], ['echo ', '`a`', ''], ['', 'git push ', ''], ['', '$(a)', ')'], ['echo ', '9', '']];
const pire = ([a, m, p], n) => a + m.repeat(Math.ceil(n / m.length)).slice(0, n - a.length - p.length) + p;
for (const c of PIRES) {
  noter(`E ${JSON.stringify(c)} 20000`, ms(() => decisionCommande(pire(c, 20000), CTX)), 10000);
  noter(`E ${JSON.stringify(c)} 20001`, ms(() => decisionCommande(pire(c, 20001), CTX)), 1000);
}
noter('F 99995 chiffres', ms(() => LECTURE_7_9.decisionCommande('echo ' + '9'.repeat(99995), CTX)), 1000);
console.log(lignes.join('\n'));
