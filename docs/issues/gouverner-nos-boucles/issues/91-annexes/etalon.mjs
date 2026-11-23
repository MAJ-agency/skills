// L'étalon proposé et le rapport de chaque pire cas à 20 000 caractères, mesurés dans le même passage.
// Usage : node etalon.mjs <regles.mjs> [N]
import { pathToFileURL } from 'node:url';
const { decisionCommande } = await import(pathToFileURL(process.argv[2]).href);
const N = Number(process.argv[3] ?? 9000);
const CTX = { brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' };
const ETALON = `-${'a'.repeat(N)}!`;
const ms = (f) => { const t = process.hrtime.bigint(); f(); return Number(process.hrtime.bigint() - t) / 1e6; };
const etalon = () => ms(() => /^-[a-z]*a[a-z]*$/.test(ETALON));
const PIRES = [['gh pr close 1 -', 'd', '!'], ['git commit -', 'n', '!'], ['git commit -m x -', 'nN', '!'], ['GIT commit -', 'n', '.'], ['git push -', 'f', '!'], ['', '`', ''], ['x=', '`', ''], ['echo ', '`a`', ''], ['', 'git push ', ''], ['', '$(a)', ')'], ['echo ', '9', '']];
const pire = ([a, m, p], n) => a + m.repeat(Math.ceil(n / m.length)).slice(0, n - a.length - p.length) + p;
let max = 0;
for (const c of PIRES) {
  const avant = etalon();
  const d = ms(() => decisionCommande(pire(c, 20000), CTX));
  const apres = etalon();
  const r = d / Math.max(avant, apres);
  max = Math.max(max, r);
  console.log(`${JSON.stringify(c).padEnd(36)} ${d.toFixed(0).padStart(6)} ms  étalon ${avant.toFixed(0)}/${apres.toFixed(0)} ms  ${r.toFixed(2)} étalons`);
}
console.log(`pire rapport : ${max.toFixed(2)} étalons`);
