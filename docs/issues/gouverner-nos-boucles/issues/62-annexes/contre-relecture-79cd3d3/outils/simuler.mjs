// Pour chaque banc posé : les noms réels de premier niveau (faux node:test), et le plan des tranches simulé avec les
// mêmes expressions régulières que Node : chaque test réel tourne-t-il exactement une fois ?
import { readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
const [CLONE, TMP] = process.argv.slice(2);
const { aDesSousTests, nomsDesTests, travaux } = await import(join(CLONE, "scripts/tranches.mjs"));
const dossiers = ["skills/chaine/fusionner/scripts", "skills/chaine/sujet/scripts", "skills/chaine/revue-adversariale/scripts", "skills/chaine/revue-de-ticket/scripts"];
const bancs = dossiers.flatMap((d) => readdirSync(join(CLONE, d)).filter((n) => n.endsWith(".test.mjs")).map((n) => join(d, n)));
bancs.push("skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs");
let reels = 0, fautes = 0;
for (const b of bancs) {
  const f = join(TMP, "noms.jsonl"); rmSync(f, { force: true });
  const r = spawnSync(process.execPath, ["--import", "<dossier du contre-relecteur>/bin/stub/register.mjs", join(CLONE, b)], { env: { ...process.env, NOMS_SORTIE: f }, encoding: "utf8", timeout: 60000 });
  const vrais = existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  const s = readFileSync(join(CLONE, b), "utf8");
  const plan = travaux(b, nomsDesTests(s), 10, { entier: aDesSousTests(s) });
  const vus = new Map();
  for (const t of plan) {
    const a = t.args[0];
    const nomme = a.startsWith("--test-name-pattern=") ? new RegExp(a.slice(20)) : null;
    const saute = a.startsWith("--test-skip-pattern=") ? new RegExp(a.slice(20)) : null;
    for (const n of vrais) {
      const joue = nomme ? nomme.test(n) : saute ? !saute.test(n) : true;
      if (joue) vus.set(n, (vus.get(n) ?? 0) + 1);
    }
  }
  const compte = vrais.reduce((m, n) => m.set(n, (m.get(n) ?? 0) + 1), new Map());
  const ecarts = [...compte].filter(([n, k]) => (vus.get(n) ?? 0) !== k);
  reels += vrais.length; fautes += ecarts.length;
  console.log(`${b.split("/").pop()} réels=${vrais.length} lus=${nomsDesTests(s).length} travaux=${plan.length} écarts=${ecarts.length} (sortie ${r.status}${r.stderr ? " : " + r.stderr.split("\n")[0].slice(0, 80) : ""})`);
  for (const [n, k] of ecarts) console.log(`   « ${n} » ${k} réel(s), ${vus.get(n) ?? 0} joué(s)`);
}
console.log(`total réels ${reels}, écarts ${fautes}`);
