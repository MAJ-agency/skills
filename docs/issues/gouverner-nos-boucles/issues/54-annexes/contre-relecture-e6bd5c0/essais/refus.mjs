// Classement des refus de fusion : passer.sh réel sur dépôt jouet. Usage : node refus.mjs <racine du plugin>
import { spawnSync } from "node:child_process";
import { join } from "node:path";
const RACINE = process.argv[2];
const { depotJouet, script: scriptDe } = await import(join(RACINE, "skills/chaine/sujet/scripts/depot-jouet.mjs"));
const script = (n) => scriptDe("fusionner", n);
const pr = (number, head, autres = {}) => ({ number, title: `docs(demo): ${head.replace(/^[a-z]+\//, "")}`, head, base: "develop", labels: ["à-fusionner"], ...autres });
const MESSAGES = [
  ["409 tête modifiée", "gh: Head branch was modified. Review and try the merge again. (HTTP 409)"],
  ["405 base modifiée", "gh: Base branch was modified. Review and try the merge again. (HTTP 405)"],
  ["502", "gh: HTTP 502"],
  ["503 texte", "gh: Service Unavailable (HTTP 503)"],
  ["sans code", "error connecting to api.github.com"],
  ["vide", ""],
  ["403 droit", "gh: Resource not accessible by integration (HTTP 403)"],
  ["405 méthode", "gh: Squash merges are not allowed on this repository. (HTTP 405)"],
  ["405 revue approbation", "gh: At least 1 approving review is required by reviewers with write access. (HTTP 405)"],
  ["405 code owner", "gh: Waiting on code owner review from @exemple. (HTTP 405)"],
  ["405 changements demandés", "gh: Changes were requested by reviewers with write access. (HTTP 405)"],
  ["405 ruleset multi-lignes", "gh: Repository rule violations found\n\nAt least 1 approving review is required by reviewers with write access.\n (HTTP 405)"],
  ["405 revue + login chiffré", "gh: Waiting on code owner review from @equipe-502. (HTTP 405)"],
  ["405 revue, ligne [#33] dans le message", "gh: Review required\n[#33] CI non déclenchée (HTTP 405)"],
  ["422", "gh: Validation Failed (HTTP 422)"],
  ["405 not up to date + revue", "gh: Required review missing; head branch is not up to date with the base branch (HTTP 405)"],
];
for (const [nom, message] of MESSAGES) {
  const d = depotJouet();
  d.branche("feat/simple", "origin/develop", { "docs/simple.md": "s\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(33, "feat/simple", { refusFusion: message })] });
  const r = spawnSync("bash", ["-c", 'bash "$0" 33 2>&1', script("passer.sh")], { cwd: d.travail, env: d.env, encoding: "utf8" });
  const lignes = r.stdout.split("\n").filter(Boolean);
  const j = d.journal().map((e) => `${e.methode} ${e.route}${/capitaine:fin/.test(e.champs?.body ?? "") ? " (fin)" : ""}`);
  const tete = [d.git("rev-parse", "--abbrev-ref", "HEAD"), d.git("rev-parse", "HEAD") === d.git("rev-parse", "origin/develop") ? "=develop" : "≠develop", d.git("branch", "--list", "capitaine/*") || "∅", d.git("status", "--porcelain") || "propre"];
  console.log(`\n### ${nom} → sortie ${r.status}`);
  console.log(`dernière ligne : ${lignes.at(-1)}`);
  console.log(`journal : ${j.join(" | ")}`);
  console.log(`labels : ${JSON.stringify(d.etat().pulls[0].labels)} ; tête : ${tete.join(" ; ")}`);
}
