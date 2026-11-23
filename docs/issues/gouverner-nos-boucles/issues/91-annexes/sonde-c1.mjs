// Sonde de la retouche B1 du ticket 91 : les mesures du cas « ticket 33, contre-relecture C1 » de regles.test.mjs,
// en millisecondes et en étalons, sur un regles.mjs donné. Usage : node sonde-c1.mjs <regles.mjs> [passes]
import { pathToFileURL } from 'node:url';
const { decisionCommande } = await import(pathToFileURL(process.argv[2]).href);
const passes = Number(process.argv[3] ?? 3);
const CTX = { brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' };
const F = 'git push --force origin feat/x';
const ETALON = `-${'a'.repeat(16_000)}!`;
const duree = (f) => { const d = process.hrtime.bigint(); const r = f(); return { r, ms: Number(process.hrtime.bigint() - d) / 1e6 }; };
const etalon = () => duree(() => /^-[a-z]*a[a-z]*$/.test(ETALON)).ms;
const enEtalons = (f) => { const a = etalon(); const { r, ms } = duree(f); const e = Math.max(a, etalon()); return { r, ms, etalons: ms / e }; };
const continuees = (n) => 'echo ' + '"$a" \\\n'.repeat(n) + `; ${F}`;
const nus = (n) => 'echo ' + '$a '.repeat(n);
for (let p = 0; p < passes; p++) for (const [nom, forme, n] of [['continuees', continuees, 800], ['nus', nus, 2200]]) {
  enEtalons(() => decisionCommande(forme(n / 10), CTX));
  const petit = enEtalons(() => decisionCommande(forme(n), CTX));
  const grand = enEtalons(() => decisionCommande(forme(3 * n), CTX));
  console.log(`${nom} petit ${petit.ms.toFixed(1)} ms ${petit.etalons.toFixed(3)} ét. ; grand ${grand.ms.toFixed(1)} ms ${grand.etalons.toFixed(3)} ét. ; rapport ${(grand.etalons / petit.etalons).toFixed(2)}`);
}
