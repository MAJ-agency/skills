// File ordinaire + PR refusée faute de revue : vrais file.sh, passer.sh, boucle.sh sur dépôt jouet.
// Usage : node boucle.mjs <racine du plugin> [refus]
import { join } from "node:path";
const RACINE = process.argv[2];
const AVEC_REFUS = process.argv[3] === "refus";
const { depotJouet, script: scriptDe } = await import(join(RACINE, "skills/chaine/sujet/scripts/depot-jouet.mjs"));
const script = (n) => scriptDe("fusionner", n);
const REVUE = "## Revue adversariale\n\nRien de bloquant.\n";
const pr = (number, head, autres = {}) => ({ number, title: `docs(demo): ${head.replace(/^[a-z]+\//, "")}`, head, base: "develop", labels: ["à-fusionner"], ...autres });
const ATTENTE = "<!-- attente-revue-capitaine -->\nGitHub a refusé la fusion : l'approbation d'un propriétaire (CODEOWNERS) manque. Le capitaine ne met plus cette PR à jour avant une nouvelle approbation.";
const d = depotJouet();
d.ecrire("apps/api/x.ts", "export const x = 1;\n");
d.commit("feat: x");
d.git("push", "-q", "origin", "HEAD:develop");
d.branche("docs/retard", "origin/develop", { "docs/retard.md": "r\n" });
d.branche("feat/conflit", "origin/develop", { "apps/api/x.ts": "export const x = 2;\n" });
d.branche("docs/encours", "origin/develop", { "docs/encours.md": "e\n" });
d.branche("docs/bloquee", "origin/develop", { "docs/bloquee.md": "b\n" });
d.branche("docs/brouillon", "origin/develop", { "docs/brouillon.md": "b\n" });
d.branche("docs/rouge", "origin/develop", { "docs/rouge.md": "r\n" });
d.branche("docs/apres", "origin/develop", { "docs/apres.md": "a\n" });
d.branche("develop", "origin/develop", { "apps/api/x.ts": "export const x = 3;\n", "docs/autre.md": "autre\n" });
d.branche("docs/prete", "origin/develop", { "docs/prete.md": "p\n" });
if (AVEC_REFUS) d.branche("docs/revue", "origin/develop", { "docs/revue.md": "r\n" });
d.git("switch", "-q", "--detach", "origin/develop");
d.publierChaine();
const pulls = [
  pr(40, "docs/retard", { commentaires: [ATTENTE] }),
  pr(41, "docs/prete"),
  pr(42, "feat/conflit", { title: "feat(demo): conflit", body: REVUE }),
  pr(43, "docs/encours"),
  pr(44, "docs/bloquee", { labels: ["à-fusionner", "fusion-bloquée"] }),
  pr(45, "docs/brouillon", { draft: true }),
  pr(46, "docs/rouge"),
  ...(AVEC_REFUS ? [pr(47, "docs/revue", { refusFusion: "gh: At least 1 approving review is required by reviewers with write access. (HTTP 405)", commentaires: [ATTENTE] })] : []),
  pr(48, "docs/apres"),
];
d.github({ exiges: ["qualite"], checks: { "*": { "Périmètre des changements": "SUCCESS", qualite: "SUCCESS" }, "#43": { qualite: "IN_PROGRESS" }, "#46": { qualite: "FAILURE" } }, pulls });
const net = (s) => s.replace(/\b[0-9a-f]{7,40}\b/g, "<sha>").replace(/\d\d:\d\d/g, "hh:mm").replaceAll(d.racine, "<jouet>").replace(/passer\.[A-Za-z0-9]{6}/g, "passer.X").replace(/tmp\.[A-Za-z0-9]+/g, "tmp.X");
const voir = (titre, r) => console.log(`\n===== ${titre} → sortie ${r.status}\n--- stdout\n${net(r.stdout)}--- stderr\n${net(r.stderr)}`);
const etatPR = () => d.etat().pulls.map((p) => `#${p.number} ${JSON.stringify(p.labels)}${p.merged_at ? " fusionnée" : ""}${p.state && p.state !== "open" ? " " + p.state : ""} commentaires=${(p.commentaires ?? []).length}`).join("\n");
const arbre = () => `tête ${d.git("rev-parse", "--abbrev-ref", "HEAD")} ; ${d.git("rev-parse", "HEAD") === d.git("rev-parse", "origin/develop") ? "= origin/develop" : "≠ origin/develop"} ; branches capitaine/* : ${d.git("branch", "--list", "capitaine/*") || "∅"} ; status : ${d.git("status", "--porcelain") || "propre"}`;
voir("file.sh (départ)", d.lancer(script("file.sh")));
for (const tour of [1, 2, 3]) {
  const avant = d.journal().length;
  voir(`boucle.sh, lancement ${tour}`, d.lancer(script("boucle.sh")));
  console.log("--- écritures GitHub de ce lancement\n" + net(d.journal().slice(avant).map((e) => `${e.methode} ${e.route}${e.champs?.body ? " :: " + e.champs.body.replace(/\n/g, "⏎").slice(0, 150) : ""}`).join("\n")));
  console.log("--- PR\n" + etatPR());
  console.log("--- arbre du capitaine : " + arbre());
  if (!AVEC_REFUS && tour === 1) { voir("file.sh (après)", d.lancer(script("file.sh"))); break; }
}
if (AVEC_REFUS) {
  voir("file.sh (après trois lancements)", d.lancer(script("file.sh")));
  const e = d.etat();
  const p = e.pulls.find((x) => x.number === 47);
  console.log("--- commentaires de #47\n" + net((p.commentaires ?? []).map((c, i) => `${i}: ${(typeof c === "string" ? c : c.body).replace(/\n/g, "⏎")}`).join("\n")));
}
