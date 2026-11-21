// Point 3 : projet posé à 988a6c3 (ancienne chaîne sur develop, CODEOWNERS, règle cochée ou non), capitaine qui
// tourne déjà (ancien boucle.sh), PR « attend un propriétaire » et « attend un humain » dans sa file ; la PR de repose
// (scripts/chaine/* du sommet e6bd5c0) entre dans develop au milieu de la vie de la file.
// Usage : node mi-vie.mjs <racine avant> <racine après> [cochee|decochee]
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
const [AVANT, APRES] = process.argv.slice(2, 4).map((x) => resolve(x));
const MODE = process.argv[4] ?? "cochee";
const { depotJouet } = await import(join(AVANT, "skills/chaine/sujet/scripts/depot-jouet.mjs"));
const CHAINE = [
  ...["boucle.sh","file.sh","passer.sh","renvoyer.sh","refus.sh","proprietaire.sh","github.sh","identifiant.mjs","revue-exigee.mjs","migrations-ordre.mjs"].map((n) => ["fusionner", n]),
  ["revue-adversariale", "diff-revue.sh"], ["revue-de-ticket", "contexte-ticket.mjs"], ["sujet", "sujet.sh"],
];
const nouveaux = {};
for (const [skill, nom] of CHAINE) {
  const f = join(APRES, "skills/chaine", skill, "scripts", nom);
  if (existsSync(f)) nouveaux[`scripts/chaine/${nom}`] = readFileSync(f, "utf8");
}
const REVUE = "## Revue adversariale\n\nRien de bloquant.\n";
const ATTENTE = "<!-- attente-revue-capitaine -->\nGitHub a refusé la fusion : l'approbation d'un propriétaire (CODEOWNERS) manque. Le capitaine ne met plus cette PR à jour avant une nouvelle approbation.";
const d = depotJouet();
d.ecrire(".github/CODEOWNERS", "# Généré depuis .claude/chaine.json (cheminsSensibles, proprietaires) : ne pas éditer.\n/docs/ @proprietaire\n/scripts/chaine/ @proprietaire\n");
d.commit("chore: codeowners");
d.git("push", "-q", "origin", "HEAD:develop");
d.publierChaine(); // ancienne chaîne (racine avant) sur develop
d.branche("chore/repose", "origin/develop", nouveaux, "chore(chaine): repose 7.32.0");
d.branche("docs/proprio", "origin/develop", { "docs/proprio.md": "p\n" });
d.branche("docs/humain", "origin/develop", { "docs/humain.md": "h\n" });
d.branche("docs/ordinaire", "origin/develop", { "docs/ordinaire.md": "o\n" });
d.git("switch", "-q", "--detach", "origin/develop");
const pr = (number, head, autres = {}) => ({ number, title: `docs(demo): ${head.replace(/^[a-z]+\//, "")}`, head, base: "develop", labels: ["à-fusionner"], ...autres });
d.github({
  exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } },
  revueProprietaires: MODE === "cochee" ? ["develop"] : [],
  pulls: [
    pr(60, "chore/repose", { title: "chore(chaine): repose 7.32.0", body: REVUE }), // approuvée : plus de relecteur demandé
    pr(61, "docs/proprio", { relecteurs: ["proprietaire"], approbationManquante: true }),
    pr(62, "docs/humain", { commentaires: [ATTENTE], approbationManquante: true }),
    pr(63, "docs/ordinaire"),
  ],
});
const net = (s) => s.replace(/\b[0-9a-f]{7,40}\b/g, "<sha>").replace(/\d\d:\d\d/g, "hh:mm").replaceAll(d.racine, "<jouet>");
const voir = (titre, r) => console.log(`\n===== ${titre} → sortie ${r.status}\n--- stdout\n${net(r.stdout)}--- stderr\n${net(r.stderr).split("\n").filter((l) => !/empty repository/.test(l)).join("\n")}`);
const etatPR = () => d.etat().pulls.map((p) => `#${p.number} ${JSON.stringify(p.labels)}${p.merged_at ? " fusionnée" : ""} commentaires=${(p.commentaires ?? []).length}`).join("\n");
voir("ancien file.sh (avant la repose)", d.lancer(join(AVANT, "skills/chaine/fusionner/scripts/file.sh")));
// Le capitaine joue la copie d'origin/develop : il lance l'ancienne boucle (copie hors worktree, comme la veille).
d.git("fetch", "-q", "origin");
const copie = join(d.racine, "copie-capitaine");
execSync(`mkdir -p ${copie} && git archive origin/develop scripts/chaine scripts/docs/identifiants.mjs | tar -x -C ${copie}`, { cwd: d.travail, env: d.env });
const avantJ = d.journal().length;
voir("ANCIENNE boucle.sh, un seul lancement", d.lancer(join(copie, "scripts/chaine/boucle.sh")));
console.log("--- écritures GitHub\n" + net(d.journal().slice(avantJ).map((e) => `${e.methode} ${e.route}${e.champs?.body ? " :: " + e.champs.body.replace(/\n/g, "⏎").slice(0, 110) : ""}`).join("\n")));
console.log("--- PR\n" + etatPR());
d.git("fetch", "-q", "origin");
console.log("--- develop porte le nouveau passer.sh : " + (d.developDistant("scripts/chaine/passer.sh") === nouveaux["scripts/chaine/passer.sh"].trim()));
const p62 = d.etat().pulls.find((x) => x.number === 62);
console.log("--- commentaires de #62\n" + net((p62.commentaires ?? []).map((c, i) => `${i}: ${(typeof c === "string" ? c : c.body).replace(/\n/g, "⏎").slice(0, 160)}`).join("\n")));
