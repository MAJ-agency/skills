// Ticket 91 : une règle « Require status checks to pass » qui n'exige aucun check sur develop (un ruleset, ou l'ancienne
// protection de branche) n'est pas un dépôt « sans CI ». Lue [], elle faisait dire toute PR « prête (sans CI) », la
// boucle la mettait de côté (« CI non déclenchée ») et elle n'entrait jamais : vu deux fois à l'essai réel du régime 8,
// au bout d'une heure ou plus. `checks_exiges` le dit dès la première lecture, comme un réglage du dépôt à faire par un
// admin (sortie 6, RÉGLAGE DU DÉPÔT) ; `file.sh` sort en 6, la boucle s'arrête (ARRÊT), `passer.sh` sort en 3 sur la
// même raison. Un dépôt sans aucune règle de checks reste « sans CI » : rien n'y entre non plus (`attendre_ci` ne voit
// aucun check exigé apparaître), un ticket de suite ; d'où le geste dit : ajouter les checks, jamais retirer la règle.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const GITHUB = script("fusionner", "github.sh");
const fonction = (d, corps) =>
  spawnSync("bash", ["-c", `source ${GITHUB}; ${corps}`], { cwd: d.travail, env: d.env, encoding: "utf8" });
const REGLAGE = /^RÉGLAGE DU DÉPÔT : la branche develop \(ruleset 42\) porte une règle « Require status checks to pass » \(required_status_checks\) qui n'exige aucun check ; toute PR vers develop s'y lirait « prête \(sans CI\) » et n'entrerait jamais\. À un admin : y ajouter les checks exigés de la CI \(qualite, test-db, zizmor : docs\/agents\/chaine-admin\.md, « Protection de develop »\) ; puis relancer le capitaine\.$/m;
const pr = (number, head) => ({ number, title: `docs(demo): ${head.slice(5)}`, head, base: "develop", labels: ["à-fusionner"] });

test("checks_exiges : une règle de checks exigés vide sur develop sort en 6, RÉGLAGE DU DÉPÔT nommant la branche, la règle et le geste, rien sur la sortie standard ; sans règle, [] ; une règle qui exige, sa liste", () => {
  const d = depotJouet();
  d.github({ regleVide: true });
  let r = fonction(d, "checks_exiges");
  assert.equal(r.status, 6, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, REGLAGE);
  d.github({ regleVide: true, protectionClassique: true });
  r = fonction(d, "checks_exiges");
  assert.equal(r.status, 6, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /^RÉGLAGE DU DÉPÔT : la protection de branche de develop \(Settings → Branches\) porte une règle « Require status checks to pass » \(required_status_checks\) qui n'exige aucun check ;/m);
  d.github({ regleVide: false, protectionClassique: false, exiges: [] });
  r = fonction(d, "checks_exiges");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "[]", "aucune règle de checks : sans CI");
  assert.doesNotMatch(r.stderr, /RÉGLAGE/);
  d.github({ protectionClassique: true, exiges: [] });
  r = fonction(d, "checks_exiges");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "[]", "protection sans checks exigés (404) : sans CI");
  d.github({ protectionClassique: false, exiges: ["qualite"] });
  assert.equal(fonction(d, "checks_exiges").stdout.trim(), '["qualite"]');
});

test("file.sh puis boucle.sh : une règle de checks exigés vide est dite à la première lecture et arrête la boucle, jamais une PR « prête (sans CI) » mise de côté", () => {
  const d = depotJouet();
  d.publierChaine();
  d.branche("feat/v", "origin/develop", { "docs/v.md": "v\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ regleVide: true, checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(70, "feat/v")] });
  const f = d.lancer(script("fusionner", "file.sh"));
  assert.equal(f.status, 6, f.stdout + f.stderr);
  assert.equal(f.stdout, "", "rien sur la sortie standard");
  assert.match(f.stderr, REGLAGE);
  const b = d.lancer(script("fusionner", "boucle.sh"));
  assert.equal(b.status, 6, b.stdout + b.stderr);
  assert.match(b.stdout, /^ARRÊT : réglage du dépôt \(file\.sh, sortie 6, motif ci-dessus\) : un admin le fait, puis le capitaine relance$/m);
  assert.match(b.stderr, REGLAGE);
  assert.doesNotMatch(b.stdout, /sans CI|CI non déclenchée|FILE VIDE|DÉBUT/);
  assert.deepEqual(d.journal().filter((e) => e.methode !== "GET"), [], "rien n'est écrit sur GitHub");
});

test("passer.sh : une règle de checks exigés vide n'est jamais « CI non déclenchée » : sortie 3 sur le réglage du dépôt, ni fusion ni label", () => {
  const d = depotJouet();
  d.branche("feat/v", "origin/develop", { "docs/v.md": "v\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ regleVide: true, checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(71, "feat/v")] });
  const r = d.lancer(script("fusionner", "passer.sh"), "71");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /^\[#71\] réglage du dépôt \(motif ci-dessus\) : une règle de checks exigés vide sur develop ; la PR n'entre pas tant qu'un admin ne l'a pas faite$/m);
  assert.doesNotMatch(r.stdout, /CI non déclenchée/);
  assert.match(r.stderr, REGLAGE);
  assert.deepEqual(d.journal().filter((e) => /^(PUT|DELETE)$/.test(e.methode) && /merge|labels/.test(e.route)), [], "ni fusion ni label retiré");
});
