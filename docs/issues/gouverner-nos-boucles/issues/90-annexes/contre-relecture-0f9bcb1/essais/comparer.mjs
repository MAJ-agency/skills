// Compare, banc par banc, les tests joués posés (jsonl du jouet) et dans le plugin (jsonl du plugin).
import { readFileSync } from 'node:fs';
const lire = (f) => readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const [pose, plugin] = process.argv.slice(2).map(lire);
const nomBanc = (f) => f.split('/').pop();
const grouper = (xs) => { const m = new Map(); for (const x of xs) { const k = nomBanc(x.file ?? '?'); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; };
const P = grouper(pose), Q = grouper(plugin);
const bancs = [...new Set([...P.keys(), ...Q.keys()])].sort();
let total = [0, 0];
for (const b of bancs) {
  const p = P.get(b) ?? [], q = Q.get(b) ?? [];
  total[0] += p.length; total[1] += q.length;
  const sk = (xs) => xs.filter((x) => x.skip).length, td = (xs) => xs.filter((x) => x.todo).length, ko = (xs) => xs.filter((x) => !x.ok).length;
  const np = new Set(p.map((x) => `${x.nesting}:${x.name}`)), nq = new Set(q.map((x) => `${x.nesting}:${x.name}`));
  const seulsPose = [...np].filter((n) => !nq.has(n)), seulsPlugin = [...nq].filter((n) => !np.has(n));
  const marque = p.length !== q.length || seulsPose.length || seulsPlugin.length || sk(p) !== sk(q) ? '  <<' : '';
  console.log(`${b.padEnd(36)} posé ${String(p.length).padStart(3)} (saut ${sk(p)}, todo ${td(p)}, ko ${ko(p)})  plugin ${String(q.length).padStart(3)} (saut ${sk(q)}, todo ${td(q)}, ko ${ko(q)})${marque}`);
  for (const n of seulsPose) console.log(`    posé seul : ${n}`);
  for (const n of seulsPlugin) console.log(`    plugin seul : ${n}`);
}
console.log(`total posé ${total[0]}, plugin ${total[1]}, bancs ${bancs.length} ; niveaux posés : ${[...new Set(pose.map((x) => x.nesting))]}`);
