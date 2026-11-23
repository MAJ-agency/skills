// Sonde de relecture du ticket 91 : un dépôt SANS aucune règle de checks exigés (ni ruleset, ni protection : 404),
// une PR dont la CI est verte. Que font file.sh et passer.sh ? Lancer depuis la racine du plugin patché :
//   PLUGIN=$PWD node --test <ce fichier>
import { test } from "node:test";
import { join } from "node:path";
const P = process.env.PLUGIN;
const { depotJouet, script } = await import(join(P, "skills/chaine/sujet/scripts/depot-jouet.mjs"));
const pr = (number, head) => ({ number, title: `docs(demo): ${head.slice(5)}`, head, base: "develop", labels: ["à-fusionner"] });
test("sonde : aucune règle de checks, CI verte", () => {
  const d = depotJouet();
  d.publierChaine();
  d.branche("feat/v", "origin/develop", { "docs/v.md": "v\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: [], checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(71, "feat/v")] });
  const f = d.lancer(script("fusionner", "file.sh"));
  console.log("# file.sh sortie", f.status, JSON.stringify(f.stdout.trim()), JSON.stringify(f.stderr.trim().slice(0, 200)));
  const t0 = Date.now();
  const r = d.lancer(script("fusionner", "passer.sh"), "71");
  console.log("# passer.sh sortie", r.status, `${Math.round((Date.now() - t0) / 1000)} s`, JSON.stringify(r.stdout.trim().split("\n").slice(-2)));
  console.log("# fusion PUT :", d.journal().filter((e) => e.methode === "PUT" && /merge/.test(e.route)).length);
});
