// Banc de `lot.sh` (fusion par lots, la partie qui n'écrit rien sur GitHub) sur le dépôt jouet, en régime 8 : la
// composition prend les PR « prête » dans l'ordre de la file, laisse hors du lot ce qui passe une à une (sans verdict,
// chemin sensible, migrations, conflit avec le lot, régime 7, passage d'un autre capitaine), empile le reste en objets
// git locaux ; la vérification refuse un sommet changé ou un develop qui a bougé ; la bisection coupe dans l'ordre ;
// `strict` lit la protection de develop. Aucun réseau, aucune écriture sur le faux GitHub.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);
const { ecrireDistribution } = await import(pathToFileURL(scriptDe("fusionner", "decision-relecteur.mjs")).href);
const { ecrireVerdict } = await import(pathToFileURL(scriptDe("fusionner", "verdict.mjs")).href);

const LOT = scriptDe("fusionner", "lot.sh");
const CONTRAT = { cheminsSensibles: ["scripts/agent/**"], migrations: "db/migrations/", relecture: { depuis: "2026-11-17T09:00:00Z" } };
const valide = (sha) => [
  ecrireDistribution({ tour: 1, sommet: sha, sessions: ["session_rel1"] }),
  `${ecrireVerdict({ sommet: sha, tour: 1, verdict: "validé", bloquants: 0, session: "session_rel1", securite: null })}\n\n- constats`,
];

function monter() {
  const d = depotJouet();
  d.ecrire(".claude/chaine.json", `${JSON.stringify(CONTRAT, null, 2)}\n`);
  d.commit("chore: contrat");
  d.publierChaine();
  for (const nom of ["decision-relecteur.mjs", "verdict.mjs", "double-relecture.mjs", "meme-contenu.sh"]) {
    d.ecrire(`scripts/chaine/${nom}`, readFileSync(scriptDe("fusionner", nom), "utf8"));
  }
  d.ecrire("scripts/chaine/chemins-sensibles.mjs", readFileSync(scriptDe("revue-adversariale", "chemins-sensibles.mjs"), "utf8"));
  d.commit("chore(chaine): calculs");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  return d;
}
// Des PR vers develop : { n, fichiers, verdict (défaut true), plus } ; CI verte partout, sauf `enCours`.
function file(d, specs, { enCours = [], autres = {} } = {}) {
  const pulls = [];
  const sommets = {};
  for (const { n, fichiers, verdict = true, plus = {} } of specs) {
    const sha = d.branche(`feat/pr-${n}`, "origin/develop", fichiers, `docs(pr): pr ${n}`);
    sommets[n] = sha;
    pulls.push({ number: n, title: `docs(pr): pr ${n}`, head: `feat/pr-${n}`, base: "develop", labels: ["à-fusionner"], commentaires: verdict ? valide(sha) : [], ...plus });
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  const checks = { "*": { qualite: "SUCCESS" } };
  for (const n of enCours) checks[`#${n}`] = { qualite: "IN_PROGRESS" };
  d.github({ exiges: ["qualite"], checks, pulls, ...autres });
  return sommets;
}
const lignes = (r) => r.stdout.trim().split("\n").filter(Boolean);
const ecritures = (d) => d.journal().filter((e) => e.methode && e.methode !== "GET");
const manifeste = (d, r) => {
  const f = join(d.racine, `manifeste-${Math.random().toString(36).slice(2)}`);
  writeFileSync(f, r.stdout);
  return f;
};

test("lot.sh composer : prend les PR prêtes dans l'ordre de la file, laisse hors du lot ce qui passe une à une, empile le reste sans rien écrire", () => {
  const d = monter();
  const branches = d.git("ls-remote", "--heads", "origin");
  const s = file(
    d,
    [
      { n: 30, fichiers: { "docs/a.md": "a\n" } },
      { n: 31, fichiers: { "docs/sans.md": "sans\n" }, verdict: false },
      { n: 32, fichiers: { "scripts/agent/x.sh": "echo x\n" } },
      { n: 33, fichiers: { "docs/a.md": "autre a\n" } },
      { n: 34, fichiers: { "db/migrations/20261128_x.sql": "select 1;\n" } },
      { n: 35, fichiers: { "docs/b.md": "b\n" } },
      { n: 36, fichiers: { "docs/c.md": "c\n" } },
      { n: 37, fichiers: { "docs/d.md": "d\n" } },
      { n: 38, fichiers: { "docs/e.md": "e\n" } },
    ],
    { enCours: [38] },
  );
  const avant = ecritures(d).length;
  const r = d.lancer(LOT, "composer", "--taille", "3");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const base = d.git("rev-parse", "origin/develop");
  const l = lignes(r);
  assert.equal(l[0], `base ${base}`);
  assert.deepEqual(l.slice(1).map((x) => x.split(" ")[1]), ["30", "35", "36"], r.stdout);
  for (const x of l.slice(1)) {
    const [, n, sommet, commit, arbre] = x.split(" ");
    assert.equal(sommet, s[n]);
    assert.equal(d.git("rev-parse", `${commit}^{tree}`), arbre);
    assert.equal(d.git("rev-parse", `${commit}^2`), sommet, "second parent : le sommet de la PR");
  }
  const sommetDuLot = l.at(-1).split(" ")[3];
  assert.deepEqual(d.git("rev-list", "--first-parent", `${base}..${sommetDuLot}`).split("\n").length, 3);
  const arbreDuLot = d.git("ls-tree", "-r", "--name-only", sommetDuLot).split("\n");
  for (const f of ["docs/a.md", "docs/b.md", "docs/c.md"]) assert.ok(arbreDuLot.includes(f), f);
  for (const f of ["docs/sans.md", "scripts/agent/x.sh", "db/migrations/20261128_x.sql", "docs/d.md"]) assert.ok(!arbreDuLot.includes(f), f);
  assert.equal(d.git("show", `${sommetDuLot}:docs/a.md`), "a", "le a de #30, pas celui de #33");
  assert.match(r.stderr, /^\[#31\] hors du lot : éligibilité, sortie 4/m);
  assert.match(r.stderr, /^\[#32\] hors du lot : chemin sensible \(scripts\/agent\/x\.sh\), passée une à une$/m);
  assert.match(r.stderr, /^\[#33\] hors du lot : en conflit avec le lot déjà empilé$/m);
  assert.match(r.stderr, /^\[#34\] hors du lot : touche les migrations \(db\/migrations\/\), passée une à une$/m);
  assert.doesNotMatch(r.stderr, /#37|#38/, "37 n'est pas lue (lot plein), 38 n'est pas prête");
  // Rien d'écrit : ni sur GitHub, ni sur origin, ni dans le worktree.
  assert.equal(ecritures(d).length, avant, JSON.stringify(ecritures(d)));
  assert.equal(d.git("ls-remote", "--heads", "origin").split("\n").filter((x) => !/feat\/pr-/.test(x)).join("\n"), branches);
  assert.equal(d.git("rev-parse", "HEAD"), d.git("rev-parse", "origin/develop"));
  assert.equal(d.git("status", "--porcelain"), "");
});

test("lot.sh composer --prs : ces PR dans cet ordre, aux mêmes contrôles ; une PR pas prête reste hors du lot", () => {
  const d = monter();
  file(d, [{ n: 30, fichiers: { "docs/a.md": "a\n" } }, { n: 35, fichiers: { "docs/b.md": "b\n" } }, { n: 36, fichiers: { "docs/c.md": "c\n" } }, { n: 38, fichiers: { "docs/e.md": "e\n" } }], { enCours: [38] });
  const r = d.lancer(LOT, "composer", "--taille", "9", "--prs", "36,38,30");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(lignes(r).slice(1).map((x) => x.split(" ")[1]), ["36", "30"]);
  assert.match(r.stderr, /^\[#38\] hors du lot : pas « prête » dans la file \(CI en cours\)$/m);
});

test("lot.sh composer : moins de deux PR empilables, sortie 1 et rien sur la sortie standard ; régime 7 et passage d'un autre capitaine hors du lot", () => {
  const d = monter();
  const horloge = Number(d.env.PASSAGE_HORLOGE_BANC);
  file(d, [
    { n: 30, fichiers: { "docs/a.md": "a\n" } },
    { n: 31, fichiers: { "docs/b.md": "b\n" }, plus: { created_at: "2026-11-17T08:00:00Z" } },
    { n: 32, fichiers: { "docs/c.md": "c\n" } },
  ]);
  // #32 : un autre capitaine y pose son verrou, daté de maintenant.
  const etat = d.etat();
  const p32 = etat.pulls.find((p) => p.number === 32);
  p32.commentaires.push(`Passage du capitaine \`autre\` <!-- capitaine:passage autre ${horloge} -->`);
  d.github(etat);
  const r = d.lancer(LOT, "composer", "--taille", "4");
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /^\[#31\] hors du lot : régime 7, passée une à une$/m);
  assert.match(r.stderr, /^\[#32\] hors du lot : en passage chez un autre capitaine \(autre /m);
  assert.match(r.stderr, /^lot impossible : 1 PR empilable\(s\) sur 2 au moins, la file passe une à une$/m);
});

test("lot.sh composer : sans --taille, ou CAPITAINE_ID absent, sortie 64 sans aucune lecture", () => {
  const d = monter();
  let r = d.lancer(LOT, "composer");
  assert.equal(r.status, 64);
  assert.match(r.stderr, /la taille par défaut est une décision du produit/);
  delete d.env.CAPITAINE_ID;
  r = d.lancer(LOT, "composer", "--taille", "2");
  assert.equal(r.status, 64);
  assert.equal(d.journal().length, 0);
});

test("lot.sh verifier : sans écart, sortie 0 ; un push sur une PR du lot ou un develop qui bouge, sortie 1 et l'écart nommé", () => {
  const d = monter();
  file(d, [{ n: 30, fichiers: { "docs/a.md": "a\n" } }, { n: 35, fichiers: { "docs/b.md": "b\n" } }, { n: 36, fichiers: { "docs/c.md": "c\n" } }, { n: 37, fichiers: { "docs/d.md": "d\n" } }]);
  const f = manifeste(d, d.lancer(LOT, "composer", "--taille", "4"));
  let r = d.lancer(LOT, "verifier", f);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  d.branche("feat/pr-35", "origin/feat/pr-35", { "docs/b.md": "b bis\n" });
  d.branche("develop", "origin/develop", { "docs/z.md": "z\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  const etat = d.etat();
  etat.pulls.find((p) => p.number === 30).labels = ["à-fusionner", "fusion-bloquée"];
  etat.pulls.find((p) => p.number === 36).base = "sujet/x";
  etat.pulls.find((p) => p.number === 37).labels = [];
  d.github(etat);
  r = d.lancer(LOT, "verifier", f);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /^\[base\] develop a bougé depuis la composition/m);
  assert.match(r.stdout, /^\[#30\] label fusion-bloquée$/m);
  assert.match(r.stdout, /^\[#36\] base sujet\/x, pas develop$/m);
  assert.match(r.stdout, /^\[#37\] sans le label à-fusionner$/m);
  assert.match(r.stdout, /^\[#35\] sommet changé depuis l'empilement /m);
});

test("lot.sh verifier et moities : un manifeste mal formé sort en 64", () => {
  const d = monter();
  const f = join(d.racine, "faux-manifeste");
  writeFileSync(f, "base abc\npr 30 x y z\n");
  assert.equal(d.lancer(LOT, "verifier", f).status, 64);
  assert.equal(d.lancer(LOT, "moities", f).status, 64);
  assert.equal(d.lancer(LOT, "verifier", join(d.racine, "absent")).status, 64);
});

test("lot.sh moities : coupe dans l'ordre, la première moitié a la PR de plus ; un lot d'une PR ne se coupe pas", () => {
  const d = monter();
  const sha = "a".repeat(40);
  const f = join(d.racine, "m");
  const ecrire = (ns) => writeFileSync(f, `base ${sha}\n${ns.map((n) => `pr ${n} ${sha} ${sha} ${sha}`).join("\n")}\n`);
  ecrire([30, 35, 36]);
  let r = d.lancer(LOT, "moities", f);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(lignes(r), ["30,35", "36"]);
  ecrire([30, 35, 36, 40]);
  assert.deepEqual(lignes(d.lancer(LOT, "moities", f)), ["30,35", "36,40"]);
  ecrire([30]);
  r = d.lancer(LOT, "moities", f);
  assert.equal(r.status, 64);
  assert.match(r.stderr, /un lot d'une PR ne se coupe pas/);
});

test("lot.sh strict : lit la politique du ruleset et de l'ancienne protection de develop", () => {
  const d = monter();
  d.github({ exiges: ["qualite"] });
  assert.equal(d.lancer(LOT, "strict").stdout, "strict\n");
  d.github({ politiqueStricte: false });
  assert.equal(d.lancer(LOT, "strict").stdout, "non-strict\n");
  d.github({ protectionClassique: true, classique: ["qualite"], politiqueStricte: true });
  assert.equal(d.lancer(LOT, "strict").stdout, "strict\n");
  d.github({ pannes: [{ route: "^rules/branches/develop$", fois: 1 }] });
  assert.equal(d.lancer(LOT, "strict").status, 5);
});

test("lot.sh composer : un contrat de develop illisible arrête la composition (sortie 6), la garde des migrations n'échoue jamais ouverte", () => {
  const d = monter();
  d.ecrire(".claude/chaine.json", "{ pas du json");
  d.commit("chore: contrat cassé");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  file(d, [{ n: 30, fichiers: { "docs/a.md": "a\n" } }, { n: 35, fichiers: { "docs/b.md": "b\n" } }]);
  const r = d.lancer(LOT, "composer", "--taille", "2");
  assert.equal(r.status, 6, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /contrat illisible/);
});
