// Banc des suites du lot 5 chez le capitaine (contre-relecture de la PR 149, A-192 ; ticket 78) : une PR de fourche est
// sautée sans renvoi par `passer.sh`, `sujet.sh fusionner` et `sujet.sh relancer`, dans les deux régimes, avant tout fetch
// de sa tête, et une sous-PR de fourche ne tient pas son sujet dans `boucle.sh`, quelle que soit sa CI (`file.sh` la lit
// « fourche » ; la sortie 7 de la garde, lue par `fourche_sautee`, en défense) (A-201) ;
// une PR de mise à jour d'un sujet ne joue qu'une revue du capitaine au premier contrôle ; une PR de mise à jour d'un
// sujet qu'aucun ticket ne déclare reçoit un motif qui dit son geste. Le dépôt jouet et le faux GitHub. Aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);
const { ecrireDistribution } = await import(pathToFileURL(scriptDe("fusionner", "decision-relecteur.mjs")).href);
const { ecrireVerdict } = await import(pathToFileURL(scriptDe("fusionner", "verdict.mjs")).href);

const PASSER = scriptDe("fusionner", "passer.sh");
const BOUCLE = scriptDe("fusionner", "boucle.sh");
const SUJET = scriptDe("sujet", "sujet.sh");
const FAUX = scriptDe("sujet", "faux-gh.mjs");
const REGIME8 = { cheminsSensibles: ["scripts/agent/**"], relecture: { depuis: "2026-11-17T09:00:00Z" } };
const REGIME7 = { cheminsSensibles: ["scripts/agent/**"] };
const valide = (sha) => [
  ecrireDistribution({ tour: 1, sommet: sha, sessions: ["session_rel1"] }),
  `${ecrireVerdict({ sommet: sha, tour: 1, verdict: "validé", bloquants: 0, session: "session_rel1", securite: "lancée" })}\n\n- constats`,
];
const dernier = (r) => r.stdout.trim().split("\n").at(-1);
const TICKET = "docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.02.issue.md";
const ticket = (lignes) => `# SPEC_ALL_DEMO-1.02 — x\n\nStatus: ready-for-agent\n${lignes}\n\n## Le besoin\n\nx\n`;

function monter(contrat = REGIME8) {
  const d = depotJouet();
  d.ecrire(".claude/chaine.json", `${JSON.stringify(contrat, null, 2)}\n`);
  d.commit("chore: contrat");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  return d;
}

// Un `git` du PATH qui note chaque fetch et chaque push, puis joue le vrai : une fourche est sautée avant tout fetch.
function espionReseau(d) {
  const reseau = join(d.racine, "reseau.log");
  const vrai = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim();
  writeFileSync(join(d.racine, "bin/git"), `#!/bin/sh\ncase "$1" in fetch|push) echo "$*" >> ${JSON.stringify(reseau)} ;; esac\nexec ${vrai} "$@"\n`);
  chmodSync(join(d.racine, "bin/git"), 0o755);
  return () => (existsSync(reseau) ? readFileSync(reseau, "utf8") : "");
}

// Un `gh` qui rend la PR `n` avec `head.repo` nul, comme GitHub pour une fourche supprimée, puis répond comme le faux.
function sansDepot(d, n) {
  writeFileSync(join(d.racine, "sans-depot.mjs"), 'let t = "";\nprocess.stdin.on("data", (c) => (t += c)).on("end", () => {\n  const p = JSON.parse(t);\n  p.head.repo = null;\n  process.stdout.write(`${JSON.stringify(p)}\\n`);\n});\n');
  Object.assign(d.env, { BANC_FAUX_GH: FAUX, BANC_SANS_DEPOT: join(d.racine, "sans-depot.mjs") });
  writeFileSync(join(d.racine, "bin/gh"), `#!/bin/sh\ncase "$*" in *"-X "*) ;; *pulls/${n}) node "$BANC_FAUX_GH" "$@" | node "$BANC_SANS_DEPOT"; exit 0 ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n`);
}

// Un `gh` qui rend la liste des PR ouvertes avec `head.repo` nul pour la PR `n` (une fourche supprimée, vue par file.sh).
function sansDepotDansLaListe(d, n) {
  writeFileSync(join(d.racine, "liste-sans-depot.mjs"), `let t = "";\nprocess.stdin.on("data", (c) => (t += c)).on("end", () => {\n  const l = JSON.parse(t);\n  for (const p of l) if (p.number === ${n}) p.head.repo = null;\n  process.stdout.write(\`\${JSON.stringify(l)}\\n\`);\n});\n`);
  Object.assign(d.env, { BANC_FAUX_GH: FAUX, BANC_LISTE_SANS_DEPOT: join(d.racine, "liste-sans-depot.mjs") });
  writeFileSync(join(d.racine, "bin/gh"), `#!/bin/sh\ncase "$*" in *"-X "*) ;; *"/pulls?state=open"*) node "$BANC_FAUX_GH" "$@" | node "$BANC_LISTE_SANS_DEPOT"; exit 0 ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n`);
}

test("passer.sh : une PR de fourche dont la branche porte le nom d'une branche d'origin est sautée sans renvoi (7), dans les deux régimes : rien de lu sur sa tête, rien de poussé, rien d'écrit (A-192, point 2)", () => {
  for (const contrat of [REGIME8, REGIME7]) {
    const d = monter(contrat);
    // `feat/a` existe sur origin ; la PR vient d'une fourche dont la branche porte le même nom.
    const sha = d.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
    d.branche("develop", "origin/develop", { "docs/b.md": "b\n" });
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({
      exiges: ["qualite"],
      checks: { "*": { qualite: "SUCCESS" } },
      pulls: [{ number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], fourche: "autre/jouet", commentaires: valide(sha) }],
    });
    const reseau = espionReseau(d);
    const r = d.lancer(PASSER, "30");
    assert.equal(r.status, 7, `${JSON.stringify(contrat)} : ${r.stdout}${r.stderr}`);
    assert.equal(reseau(), "", "aucun fetch avant la garde");
    assert.match(dernier(r), /PR de fourche \(autre\/jouet\) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi$/);
    assert.equal(d.git("rev-parse", "origin/feat/a"), sha, "la branche d'origin du même nom n'a pas bougé");
    assert.deepEqual(d.journal(), [], "aucune écriture : ni verrou du passage, ni renvoi, ni fusion");
  }
  // Une tête dont le dépôt a été supprimé (`head.repo` nul) : sautée de même.
  const s = monter();
  const sha = s.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
  s.git("switch", "-q", "--detach", "origin/develop");
  s.github({ pulls: [{ number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], commentaires: valide(sha) }] });
  // Un gh qui rend la PR 30 avec `head.repo` nul, comme GitHub pour une fourche supprimée, puis répond comme le faux.
  writeFileSync(join(s.racine, "sans-depot.mjs"), 'let t = "";\nprocess.stdin.on("data", (c) => (t += c)).on("end", () => {\n  const p = JSON.parse(t);\n  p.head.repo = null;\n  process.stdout.write(`${JSON.stringify(p)}\\n`);\n});\n');
  Object.assign(s.env, { BANC_FAUX_GH: FAUX, BANC_SANS_DEPOT: join(s.racine, "sans-depot.mjs") });
  writeFileSync(join(s.racine, "bin/gh"), '#!/bin/sh\ncase "$*" in *"-X "*) ;; *pulls/30*) node "$BANC_FAUX_GH" "$@" | node "$BANC_SANS_DEPOT"; exit 0 ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  const r = s.lancer(PASSER, "30");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(dernier(r), /PR de fourche \(dépôt supprimé\)/);
});

test("sujet.sh fusionner : une sous-PR de fourche est sautée sans renvoi (7), dans les deux régimes, avant tout fetch de sa tête ; une tête sans dépôt aussi (A-192, point 2)", () => {
  for (const [contrat, supprimee] of [[REGIME8, false], [REGIME7, false], [REGIME8, true]]) {
    const d = monter(contrat);
    d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
    const sha = d.branche("feat/a", "origin/sujet/lot", { "docs/a.md": "a\n" });
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({
      exiges: ["qualite"],
      checks: { "*": { qualite: "SUCCESS" } },
      pulls: [{ number: 80, title: "docs(a): a", head: "feat/a", base: "sujet/lot", labels: ["à-fusionner"], ...(supprimee ? {} : { fourche: "autre/jouet" }), commentaires: valide(sha) }],
    });
    if (supprimee) sansDepot(d, 80);
    const reseau = espionReseau(d);
    const r = d.lancer(SUJET, "fusionner", "80");
    const cas = `${JSON.stringify(contrat)}${supprimee ? ", dépôt supprimé" : ""}`;
    assert.equal(r.status, 7, `${cas} : ${r.stdout}${r.stderr}`);
    assert.equal(reseau(), "", `${cas} : aucun fetch avant la garde`);
    assert.match(dernier(r), new RegExp(`^#80 : PR de fourche \\(${supprimee ? "dépôt supprimé" : "autre\\/jouet"}\\) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi$`), cas);
    assert.deepEqual(d.journal(), [], cas);
  }
});

test("sujet.sh relancer : une sous-PR de fourche « prête (sans CI) » est sautée sans renvoi (7), dans les deux régimes, avant tout fetch : la branche d'origin du même nom n'est ni fusionnée ni poussée (A-192, point 2)", () => {
  for (const [contrat, supprimee] of [[REGIME8, false], [REGIME7, false], [REGIME7, true]]) {
    const d = monter(contrat);
    d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
    // La fourche copie `feat/a` d'origin, au même sommet ; le sujet avance : la sous-PR est en retard sur lui.
    const sha = d.branche("feat/a", "origin/sujet/lot", { "docs/a.md": "a\n" });
    d.branche("sujet/lot", "origin/sujet/lot", { "docs/lot2.md": "lot2\n" });
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({ checks: {}, pulls: [{ number: 80, title: "docs(a): a", head: "feat/a", base: "sujet/lot", labels: ["à-fusionner"], ...(supprimee ? {} : { fourche: "autre/jouet" }), commentaires: [] }] });
    // Une tête sans dépôt (fourche supprimée) : sautée de même.
    if (supprimee) sansDepot(d, 80);
    const reseau = espionReseau(d);
    const r = d.lancer(SUJET, "relancer", "80");
    assert.equal(r.status, 7, `${JSON.stringify(contrat)} : ${r.stdout}${r.stderr}`);
    assert.match(dernier(r), new RegExp(`^#80 : PR de fourche \\(${supprimee ? "dépôt supprimé" : "autre\\/jouet"}\\) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi$`));
    assert.equal(reseau(), "", "aucun fetch ni push");
    assert.equal(d.git("ls-remote", "origin", "refs/heads/feat/a").split("\t")[0], sha, "la branche d'origin du même nom n'a pas bougé");
    assert.deepEqual(d.journal(), []);
  }
});

// Une PR de mise à jour de `sujet/lot` (81), validée sur son sommet : la fusion de develop résout un conflit sur
// `scripts/agent/x.mjs`. `lignes` : l'en-tête du ticket .02 sur le sujet (sa ligne `Sujet:` comprise) ; `retouche` : un
// commit après la fusion, qui touche `scripts/agent/y.mjs`, hors des fichiers en conflit.
function miseAJour(d, lignes, { retouche = false } = {}) {
  d.branche("sujet/lot", "origin/develop", { [TICKET]: ticket(lignes), "scripts/agent/x.mjs": "sujet\n" });
  d.branche("develop", "origin/develop", { "scripts/agent/x.mjs": "develop\n" });
  d.git("switch", "-q", "-C", "maj/lot", "origin/sujet/lot");
  spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env });
  d.ecrire("scripts/agent/x.mjs", "résolu\n");
  d.git("add", "-A");
  d.git("commit", "-q", "--no-edit");
  if (retouche) {
    d.ecrire("scripts/agent/y.mjs", "retouche\n");
    d.commit("fix(agent): retouche");
  }
  d.git("push", "-q", "origin", "HEAD:refs/heads/maj/lot");
  d.git("fetch", "-q", "origin");
  const sha = d.git("rev-parse", "HEAD");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 81, title: "chore(sujet): met lot à jour avec develop", head: "maj/lot", base: "sujet/lot", labels: ["à-fusionner"], commentaires: valide(sha) }],
  });
  return sha;
}
const ACCORD = "Sensibles: `scripts/agent/**` — accord de la MOA, 2026-11-17";

test("sujet.sh fusionner, régime 8 : une PR de mise à jour ne joue qu'une revue du capitaine au premier contrôle, puis la seconde juste avant d'avancer le sujet (la suite M1 du lot 5)", () => {
  const d = monter();
  const sha = miseAJour(d, `Sujet: sujet/lot\n${ACCORD}`);
  // Un gh qui compte les lectures des commentaires de la PR 81, puis répond comme le faux.
  Object.assign(d.env, { BANC_FAUX_GH: FAUX });
  writeFileSync(join(d.racine, "bin/gh"), '#!/bin/sh\ncase "$*" in *"-X "*) ;; *issues/81/comments*) echo lu >> "$FAUX_GH/lectures-81" ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#81 fusionnée dans sujet\/lot par avance rapide/);
  assert.equal(d.git("rev-parse", "origin/sujet/lot"), sha);
  const lectures = readFileSync(join(d.env.FAUX_GH, "lectures-81"), "utf8").trim().split("\n").length;
  // Trois lectures : la revue du premier contrôle, celle du verrou du passage (sa relecture), la revue du second
  // contrôle ; avant la suite M1, le premier contrôle jouait deux revues, quatre lectures en tout.
  assert.equal(lectures, 3, `lectures des commentaires de la PR 81 : ${lectures}`);
});

test("sujet.sh fusionner, régime 8 : le régime lu d'abord diffère de celui que la revue relit (le contrat a changé entre les deux lectures) : la revue est rejouée une fois, sur la liste de son régime, retouches comprises (la suite M1 du lot 5)", () => {
  const d = monter();
  miseAJour(d, `Sujet: sujet/lot\n${ACCORD}`, { retouche: true });
  // Un `node` qui rend « 7 » à `regime_de_la_pr`, la première lecture ; la revue, elle, lit le régime 8 du sujet.
  writeFileSync(join(d.racine, "bin/node"), `#!/bin/sh\ncase "$*" in *regimeDeLaPr*) echo 7; exit 0 ;; esac\nexec ${JSON.stringify(process.execPath)} "$@"\n`);
  chmodSync(join(d.racine, "bin/node"), 0o755);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /^#81 PR de mise à jour : chemin sensible hors des fichiers en conflit \(scripts\/agent\/y\.mjs\)/, "la retouche est jugée : la liste du régime 8");
});

test("garde du capitaine : une PR de mise à jour d'un sujet qu'aucun ticket ne déclare dit son geste, jamais celui d'une PR sans ticket (la suite M2 du lot 5)", () => {
  const d = monter();
  miseAJour(d, ACCORD);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /^#81 PR de mise à jour de sujet\/lot : aucun ticket ni aucune spec ne déclare ce sujet \(ligne `Sujet: sujet\/lot`\), et sa fusion résout un conflit sur un chemin sensible \(scripts\/agent\/x\.mjs\) : l'écrire au conducteur ; un ticket du sujet, déclaré par cette ligne, accorde le chemin sur sa ligne `Sensibles:` par une PR de documentation vers le sujet \(A-74, A-75\), puis la PR de mise à jour repasse$/);
  assert.doesNotMatch(r.stdout, /PR sans ticket/);
  // La garde seule : `--tickets` vide pour une PR de mise à jour ; sans `--tickets`, une PR sans ticket garde son motif.
  const garde = scriptDe("revue-adversariale", "chemins-sensibles.mjs");
  const conflits = join(d.racine, "conflits");
  writeFileSync(conflits, "scripts/agent/x.mjs\n");
  const lancer = (...plus) => spawnSync(process.execPath, [garde, "--garde", "--base", "sujet/lot", "--titre", "chore(sujet): met lot à jour avec develop", "--branche", "maj/lot", ...plus], { cwd: d.travail, env: d.env, input: "scripts/agent/x.mjs\n", encoding: "utf8" });
  const maj = lancer("--conflits", conflits, "--tickets", "");
  assert.equal(maj.status, 20, maj.stdout + maj.stderr);
  assert.match(maj.stdout, /^PR de mise à jour de sujet\/lot : aucun ticket ni aucune spec ne déclare ce sujet/);
  const sans = lancer();
  assert.equal(sans.status, 20, sans.stdout + sans.stderr);
  assert.match(sans.stdout, /^PR sans ticket qui touche un chemin sensible \(scripts\/agent\/x\.mjs\)/);
});

// Les calculs du régime 8 que la boucle copie d'origin/develop, à côté de ceux que `publierChaine` pose déjà.
const CALCULS = [
  ["fusionner", "decision-relecteur.mjs"],
  ["fusionner", "verdict.mjs"],
  ["fusionner", "double-relecture.mjs"],
  ["fusionner", "meme-contenu.sh"],
  ["revue-adversariale", "chemins-sensibles.mjs"],
];

test("boucle.sh : deux sous-PR d'un sujet, l'une de fourche : la fourche est sautée sans renvoi et ne tient pas son sujet, l'autre entre au même tour ; dans les deux régimes, quelle que soit la CI de la fourche (verte, absente, en cours), et la fourche que seule la garde de sujet.sh voit (fusionner, relancer) (A-201)", () => {
  // [contrat, CI de la fourche (null : aucune), garde seule]. Garde seule : la liste des PR la dit du dépôt, sa lecture
  // (`pulls/80`) sans dépôt : file.sh ne la voit pas, la sortie 7 de la garde de `sujet.sh` la nomme (`fourche_sautee`).
  const CAS = [
    [REGIME8, "SUCCESS", false], [REGIME7, "SUCCESS", false],
    [REGIME8, null, false], [REGIME7, null, false],
    [REGIME8, "IN_PROGRESS", false], [REGIME7, "IN_PROGRESS", false],
    [REGIME8, "SUCCESS", true], [REGIME7, null, true],
  ];
  for (const [contrat, ciFourche, gardeSeule] of CAS) {
    const d = monter(contrat);
    d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
    const checks = {};
    const pulls = [];
    for (const n of [80, 81]) {
      const sha = d.branche(`feat/pr-${n}`, "origin/sujet/lot", { [`docs/pr-${n}.md`]: `${n}\n` });
      const ci = n === 80 ? ciFourche : "SUCCESS";
      if (ci) checks[sha] = { qualite: ci };
      // #80 : une fourche (`autre/jouet`) dont la branche `fourche/a` n'existe pas sur origin, le cas ordinaire.
      pulls.push({ number: n, title: `docs(lot): pr ${n}`, head: n === 80 ? "fourche/a" : `feat/pr-${n}`, sha, base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n", ...(n === 80 && !gardeSeule ? { fourche: "autre/jouet" } : {}), commentaires: valide(sha) });
    }
    d.git("push", "-q", "origin", ":refs/heads/feat/pr-80");
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({ exiges: ["qualite"], checks, pulls });
    if (gardeSeule) sansDepot(d, 80);
    d.publierChaine();
    for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(scriptDe(skill, nom), "utf8"));
    d.commit("chore(chaine): calculs du régime 8");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    const cas = `${JSON.stringify(contrat)}, CI de la fourche ${ciFourche ?? "absente"}${gardeSeule ? ", vue par la garde de sujet.sh seule" : ""}`;
    const r = d.lancer(BOUCLE);
    assert.equal(r.status, 0, `${cas} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /^\[#80\] sous-PR de fourche, sautée \(aucun renvoi\) : elle ne tient pas sujet\/lot$/m, `${cas} : ${r.stdout}`);
    assert.doesNotMatch(r.stdout, /tenu par #80|^\[#81\] attend son tour|en passage chez un autre capitaine/m, cas);
    assert.match(r.stdout, /^\[#81\] FUSIONNÉE dans sujet\/lot $/m, `${cas} : ${r.stdout}`);
    assert.deepEqual(d.etat().pulls.filter((p) => p.merged_at).map((p) => p.number), [81], cas);
    assert.deepEqual(d.journal().filter((e) => /^(issues|pulls)\/80\//.test(e.route)), [], `${cas} : rien d'écrit sur la fourche`);
  }
});

test("boucle.sh : `fourche_sautee` ne lit que la DERNIÈRE ligne d'une sortie 7 de sujet.sh, et le motif entier de la garde de fourche, pour ce numéro : toute autre sortie 7 (verrou, lecture illisible, garde des chemins sensibles, une ligne après le motif, un autre numéro, un motif tronqué) tient le sujet (A-201)", () => {
  const MOTIF = (n) => `#${n} : PR de fourche (autre/jouet) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi`;
  // [sortie de `sujet.sh fusionner 80` (sortie 7), le sujet rendu ?]
  const CAS = [
    [`${MOTIF(80)}\n`, true],
    [`${MOTIF(80)}\nune ligne de plus\n`, false],
    [`${MOTIF(81)}\n`, false],
    [`${MOTIF(80).replace(" ; sautée sans renvoi", "")}\n`, false],
    ["#80 en passage chez le capitaine autre depuis 2026-11-17T12:00:00Z : sautée sans renvoi\n", false],
    ["#80 : lecture illisible : x : sautée sans renvoi, son auteur n'y peut rien (le Relecteur prévient l'architecte)\n", false],
    ["#80 : x (chemins sensibles) : sautée sans renvoi, son auteur n'y peut rien\n", false],
  ];
  for (const [sortie, rendu] of CAS) {
    const d = monter(REGIME7);
    d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
    const checks = {};
    const pulls = [];
    for (const n of [80, 81]) {
      const sha = d.branche(`feat/pr-${n}`, "origin/sujet/lot", { [`docs/pr-${n}.md`]: `${n}\n` });
      checks[sha] = { qualite: "SUCCESS" };
      pulls.push({ number: n, title: `docs(lot): pr ${n}`, head: `feat/pr-${n}`, sha, base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n", commentaires: [] });
    }
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({ exiges: ["qualite"], checks, pulls });
    // Le `sujet.sh` que la boucle copie d'origin/develop : `fusionner 80` écrit la sortie du cas et sort en 7 ; le reste
    // est joué par le vrai, posé à côté.
    writeFileSync(join(d.racine, "sortie-80.txt"), sortie);
    d.env.BANC_SORTIE_80 = join(d.racine, "sortie-80.txt");
    d.publierChaine();
    d.ecrire("scripts/chaine/sujet-vrai.sh", readFileSync(SUJET, "utf8"));
    d.ecrire("scripts/chaine/sujet.sh", '#!/usr/bin/env bash\ncase "$1:${2:-}" in fusionner:80) cat "$BANC_SORTIE_80"; exit 7 ;; esac\nexec bash "$(cd "$(dirname "$0")" && pwd)/sujet-vrai.sh" "$@"\n');
    d.commit("chore(chaine): sujet.sh du banc");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    const cas = JSON.stringify(sortie);
    const r = d.lancer(BOUCLE);
    assert.equal(r.status, 0, `${cas} : ${r.stdout}${r.stderr}`);
    if (rendu) {
      assert.match(r.stdout, /^\[#80\] sous-PR de fourche, sautée \(aucun renvoi\) : elle ne tient pas sujet\/lot$/m, `${cas} : ${r.stdout}`);
      assert.match(r.stdout, /^\[#81\] FUSIONNÉE dans sujet\/lot $/m, `${cas} : ${r.stdout}`);
    } else {
      assert.doesNotMatch(r.stdout, /sous-PR de fourche/, `${cas} : ${r.stdout}`);
      assert.match(r.stdout, /^\[sujet\/lot\] tenu par #80 \(sortie 7 de fusionner(, verrou du [0-9TZ:-]+)?\)$/m, `${cas} : ${r.stdout}`);
      assert.match(r.stdout, /^\[#81\] attend son tour : #80 passe d'abord dans sujet\/lot$/m, `${cas} : ${r.stdout}`);
    }
  }
});

test("file.sh : une sous-PR de fourche se lit « sujet/<nom> : fourche », quelle que soit sa CI (rouge comprise), une tête sans dépôt comprise : jamais dans --rouges ni --next, rien d'écrit (A-201)", () => {
  const d = monter(REGIME7);
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  const pulls = [];
  const checks = {};
  for (const [n, ci] of [[80, "FAILURE"], [81, "FAILURE"], [82, "IN_PROGRESS"], [83, null]]) {
    const sha = d.branche(`feat/pr-${n}`, "origin/sujet/lot", { [`docs/pr-${n}.md`]: `${n}\n` });
    if (ci) checks[sha] = { qualite: ci };
    // #83 : une fourche supprimée, sa tête sans dépôt dans la liste des PR (`sansDepotDansLaListe`).
    pulls.push({ number: n, title: `docs(lot): pr ${n}`, head: `feat/pr-${n}`, sha, base: "sujet/lot", labels: ["à-fusionner"], ...(n === 80 || n === 82 ? { fourche: "autre/jouet" } : {}), commentaires: [] });
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks, pulls });
  sansDepotDansLaListe(d, 83);
  const FILE = scriptDe("fusionner", "file.sh");
  const etats = Object.fromEntries(d.lancer(FILE).stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2)));
  assert.deepEqual(etats, { 80: "sujet/lot : fourche", 81: "sujet/lot : CI rouge : qualite", 82: "sujet/lot : fourche", 83: "sujet/lot : fourche" });
  assert.equal(d.lancer(FILE, "--rouges").stdout, "81\tqualite\n");
  assert.equal(d.lancer(FILE, "--next").status, 1);
  assert.deepEqual(d.journal(), [], "file.sh ne fait que lire");
});

test("sujet.sh fusionner : le régime lu d'abord est 8, la revue relit 7 (le contrat du sujet a perdu la clé `relecture` entre les deux lectures) : la revue est rejouée sur la liste du régime 7, la résolution seule, et les retouches se jugent après les checks (la suite M1 du lot 5, A-201)", () => {
  const d = monter(REGIME7);
  // La fusion de develop résout un conflit sur une documentation ; une retouche de code suit : la section de revue est
  // exigée pour la retouche, pas pour la résolution.
  d.branche("sujet/lot", "origin/develop", { "docs/x.md": "sujet\n" });
  d.branche("develop", "origin/develop", { "docs/x.md": "develop\n" });
  d.git("switch", "-q", "-C", "maj/lot", "origin/sujet/lot");
  spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env });
  d.ecrire("docs/x.md", "résolu\n");
  d.git("add", "-A");
  d.git("commit", "-q", "--no-edit");
  d.ecrire("apps/y.mjs", "retouche\n");
  d.commit("fix(apps): retouche");
  d.git("push", "-q", "origin", "HEAD:refs/heads/maj/lot");
  d.git("fetch", "-q", "origin");
  const sha = d.git("rev-parse", "HEAD");
  d.git("switch", "-q", "--detach", "origin/develop");
  // Les checks de la PR encore en cours : la revue du premier contrôle passée, la sous-PR attend la CI (5), avant que
  // `juger_retouches` ne juge la retouche ; jugée dès le premier contrôle, elle serait renvoyée (4).
  d.github({
    exiges: ["qualite"],
    checks: { [sha]: { qualite: "IN_PROGRESS" } },
    pulls: [{ number: 81, title: "chore(sujet): met lot à jour avec develop", head: "maj/lot", base: "sujet/lot", labels: ["à-fusionner"], commentaires: [] }],
  });
  // Un `node` qui rend « 8 » à `regime_de_la_pr`, la première lecture ; la revue, elle, lit le régime 7 du sujet.
  writeFileSync(join(d.racine, "bin/node"), `#!/bin/sh\ncase "$*" in *regimeDeLaPr*) echo 8; exit 0 ;; esac\nexec ${JSON.stringify(process.execPath)} "$@"\n`);
  chmodSync(join(d.racine, "bin/node"), 0o755);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(dernier(r), /^checks encore en cours sur #81 : reprise au tour suivant/);
});

// Une PR de fourche vers develop n'est jamais reciblée sur un sujet (ticket 121, A-199, A-201).
const SPEC_DEM = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md";
const CARTE_DEM = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
// Sujet `lot` (carte à la phase et au gel donnés) ; PR 92 hors fourche, 93 de fourche, 94 de fourche supprimée, toutes
// vers develop et citant le ticket SPEC_ALL_DEM-1.02.
function depotVersSujet({ contrat = REGIME7, phase = "4-vague-1", gel = "" } = {}) {
  const d = monter(contrat);
  d.ecrire(SPEC_DEM, "# SPEC_ALL_DEM-1\n\n- **Sujet :** sujet/lot\n");
  d.ecrire(CARTE_DEM, `# SPEC_ALL_DEM-1 — carte\n\nSujet: sujet/lot\n\n## Fiche\n\nPhase: ${phase}\n${gel}\n## Fog\n\n- x\n`);
  d.commit("docs: spec et carte");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  const pulls = [];
  const checks = {};
  for (const [n, fourche] of [[92, null], [93, "autre/jouet"], [94, "autre/jouet"]]) {
    const sha = d.branche(`fix/spec-all-dem-1-02-pr-${n}`, "origin/develop", { [`docs/pr-${n}.md`]: `${n}\n` });
    checks[sha] = { qualite: "SUCCESS" };
    pulls.push({ number: n, title: `fix(demo): SPEC_ALL_DEM-1.02 pr ${n}`, head: `fix/spec-all-dem-1-02-pr-${n}`, sha, base: "develop", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n", ...(fourche ? { fourche } : {}), commentaires: [] });
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks, pulls });
  sansDepotDansLaListe(d, 94);
  return d;
}
const lignesDeFile = (d) => Object.fromEntries(d.lancer(scriptDe("fusionner", "file.sh")).stdout.trim().split("\n").map((l) => l.split("	")).map((c) => [c[0], c]));

test("file.sh : une PR de fourche vers develop dont le ticket déclare un sujet se lit comme une PR directe, jamais « vers sujet/<nom> », ni gelée, ni « sujet livré » ; la même PR hors fourche suit son sujet (ticket 121)", () => {
  const ouvert = lignesDeFile(depotVersSujet());
  assert.equal(ouvert[92][1], "vers sujet/lot");
  for (const n of [93, 94]) {
    assert.equal(ouvert[n][1], "prête", `#${n} : ${ouvert[n]}`);
    assert.equal(ouvert[n][3] ?? "", "", `#${n} : 4e colonne`);
  }
  const gele = lignesDeFile(depotVersSujet({ gel: "Gel: 2026-11-13 — pause\n" }));
  assert.equal(gele[92][1], "gelée");
  for (const n of [93, 94]) assert.equal(gele[n][1], "prête", `#${n} gelé : ${gele[n]}`);
  const d = depotVersSujet({ phase: "fini" });
  const livre = lignesDeFile(d);
  assert.equal(livre[92][3], "sujet livré : lot");
  for (const n of [93, 94]) assert.equal(livre[n][3] ?? "", "", `#${n} livré : ${livre[n]}`);
  assert.deepEqual(d.journal(), [], "file.sh ne fait que lire");
});

test("boucle.sh, dans les deux régimes : une PR de fourche vers develop qui cite le ticket d'un sujet n'est pas reciblée : sa base reste develop, ni étiquette, ni commentaire, ni PATCH ; la même PR hors fourche l'est (ticket 121)", () => {
  for (const contrat of [REGIME7, REGIME8]) {
    const d = depotVersSujet({ contrat });
    d.publierChaine();
    for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(scriptDe(skill, nom), "utf8"));
    d.commit("chore(chaine): calculs du régime 8");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    const cas = JSON.stringify(contrat);
    const r = d.lancer(BOUCLE);
    assert.equal(r.status, 0, `${cas} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /^\[#92\] REGROUPÉE dans sujet\/lot/m, `${cas} : ${r.stdout}`);
    const bases = Object.fromEntries(d.etat().pulls.map((p) => [p.number, p.base]));
    assert.deepEqual([bases[92], bases[93], bases[94]], ["sujet/lot", "develop", "develop"], cas);
    for (const n of [93, 94]) assert.deepEqual(d.journal().filter((e) => new RegExp(`^(issues|pulls)/${n}/?`).test(e.route) && e.methode !== "GET"), [], `${cas} : rien d'écrit sur #${n}`);
  }
});

test("boucle.sh lit la sortie 7 de `sujet.sh regrouper` : « PR de fourche : jamais reciblée sur sujet/<x> (aucun renvoi) », jamais « SUJET EN CONFLIT ? » (ticket 121)", () => {
  const d = monter(REGIME7);
  d.ecrire(SPEC_DEM, "# SPEC_ALL_DEM-1\n\n- **Sujet :** sujet/lot\n");
  d.commit("docs: spec");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  const sha = d.branche("fix/spec-all-dem-1-02-pr-80", "origin/develop", { "docs/pr-80.md": "80\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks: { [sha]: { qualite: "SUCCESS" } }, pulls: [{ number: 80, title: "fix(demo): SPEC_ALL_DEM-1.02 pr 80", head: "fix/spec-all-dem-1-02-pr-80", sha, base: "develop", labels: ["à-fusionner"], commentaires: [] }] });
  d.publierChaine();
  d.ecrire("scripts/chaine/sujet-vrai.sh", readFileSync(SUJET, "utf8"));
  d.ecrire("scripts/chaine/sujet.sh", '#!/usr/bin/env bash\ncase "$1:${2:-}:${3:-}" in regrouper:lot:80) echo "#80 : PR de fourche (autre/jouet) : sa tête vit hors du dépôt, jamais reciblée sur un sujet"; exit 7 ;; esac\nexec bash "$(cd "$(dirname "$0")" && pwd)/sujet-vrai.sh" "$@"\n');
  d.commit("chore(chaine): sujet.sh du banc");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^\[#80\] PR de fourche : jamais reciblée sur sujet\/lot \(aucun renvoi\)$/m, r.stdout);
  assert.doesNotMatch(r.stdout, /SUJET EN CONFLIT|REGROUPÉE/, r.stdout);
});
