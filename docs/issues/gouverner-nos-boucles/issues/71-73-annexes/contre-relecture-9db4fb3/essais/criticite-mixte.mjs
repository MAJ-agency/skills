// La criticité d'une règle citée, quand l'index et l'en-tête de son fichier ne disent pas la même chose : le calcul
// « double relecture exigée » (doubleRelecture de double-relecture.mjs) sur les cas mixtes que le gate juge (C19).
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { doubleRelecture, Illisible } = await import(pathToFileURL(join(racine, 'skills/chaine/fusionner/scripts/double-relecture.mjs')).href);
const lecteur = (refs) => {
  const arbres = new Map(); const commits = new Map();
  const arbre = (c) => arbres.get(c);
  return {
    verifier(nom) { const ref = nom.replace(/^refs\/remotes\//, ''); if (!(ref in refs)) throw new Illisible(`référence ${ref} introuvable`); if (!commits.has(refs[ref])) commits.set(refs[ref], `${commits.size}`.padStart(40, 'c')); arbres.set(commits.get(refs[ref]), refs[ref]); return commits.get(refs[ref]); },
    baseDeFusion() { return this.verifier('d'.repeat(40)); },
    sujets: () => [],
    chemins: (c) => Object.keys(arbre(c)),
    lister: (c, p) => Object.keys(arbre(c)).filter((x) => x === p || x.startsWith(p)),
    lire: (c, chemins) => new Map(chemins.map((x) => [x, arbre(c)[x]])),
  };
};
const R = 'docs/metier/regles/all/RULE_ALL_SOC-1.md';
const T = 'docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.01.issue.md';
const regle = (niveau, statut) => `---\nid: RULE_ALL_SOC-1\nvalidation:\n  status: ${statut}\n  date: 2026-11-16\ncriticality:\n  level: ${niveau}\n---\n# Règle\n`;
const index = (niveau, statut) => JSON.stringify({ schema: '3', rules: [{ key: 'RULE_ALL_SOC-1', context: 'all', id: 'SOC-1', title: 't', validation: { status: statut }, realisation: { status: 'to-build', levels: [], proofCount: 0, inherited: false }, code: [], proofs: [], criticality: { level: niveau, origin: 'declared' } }] });
const ticket = '# x\n\nStatus: ready-for-agent\nType: task\nRègles: RULE_ALL_SOC-1\nBlocked by: —\n\n## Le besoin\n\nx\n';
for (const [nom, enTete, idx] of [
  ['index haute rejetée, en-tête moyenne en vigueur (le cas « rejetee » du banc du gate)', regle('medium', 'validated'), index('high', 'rejected')],
  ['index moyenne en vigueur, en-tête haute rejetée', regle('high', 'rejected'), index('medium', 'validated')],
  ['index haute en vigueur, en-tête moyenne en vigueur (le cas « enVigueur » du banc du gate)', regle('medium', 'validated'), index('high', 'validated')],
]) {
  const arbre = { [R]: enTete, 'anchorpost/anchorpost.json': idx, [T]: ticket, 'docs/a.md': 'a\n' };
  const tete = 'a'.repeat(40);
  const r = doubleRelecture({ fichiers: ['docs/a.md'], base: 'develop', tete, tickets: ['SPEC_ALL_SOC-1.01'], lecteur: lecteur({ 'origin/develop': arbre, [tete]: arbre, ['d'.repeat(40)]: arbre }) });
  console.log(`${nom} : calcul « ${r.reponse} »${r.causes?.length ? ` (${r.causes.map((c) => `${c.sujet} · ${c.motif}`).join(', ')})` : ''}`);
}
