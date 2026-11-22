// Banc du lot 5b (relecture indépendante) : les gardes des fichiers sensibles du capitaine, en régime 8 (A-74, A-76).
// `passer.sh` et `sujet.sh fusionner` renvoient une PR dont le diff propre touche un chemin sensible que la ligne
// `Sensibles:` de son ticket ne couvre pas, ou qui en touche un sans ticket ; une PR de mise à jour d'un sujet ne touche
// un chemin sensible que s'il est en conflit et couvert par un ticket du sujet. Au premier contrôle (A-105), avant toute
// mise à jour et toute CI. La garde elle-même (`chemins-sensibles.mjs --garde`) : copies du ticket, deux tickets. Aucun
// réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);
const { ecrireDistribution } = await import(pathToFileURL(scriptDe("fusionner", "decision-relecteur.mjs")).href);
const { ecrireVerdict } = await import(pathToFileURL(scriptDe("fusionner", "verdict.mjs")).href);

const PASSER = scriptDe("fusionner", "passer.sh");
const SUJET = scriptDe("sujet", "sujet.sh");
const GARDE = scriptDe("revue-adversariale", "chemins-sensibles.mjs");
const CONTRAT = { cheminsSensibles: ["scripts/agent/**", "docs/agents/"], relecture: { depuis: "2026-11-17T09:00:00Z" } };
const valide = (sha) => [
  ecrireDistribution({ tour: 1, sommet: sha, sessions: ["session_rel1"] }),
  `${ecrireVerdict({ sommet: sha, tour: 1, verdict: "validé", bloquants: 0, session: "session_rel1", securite: "lancée" })}\n\n- constats`,
];
const dernier = (r) => r.stdout.trim().split("\n").at(-1);
const fusions = (d) => d.journal().filter((e) => e.methode === "PUT" && /\/merge$/.test(e.route));
const TICKET = (n) => `docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.0${n}.issue.md`;
const ticket = (n, ligne) => `# SPEC_ALL_DEMO-1.0${n} — x\n\nStatus: ready-for-agent\n${ligne}\n\n## Le besoin\n\nx\n`;
const ACCORD = (chemins) => `Sensibles: ${chemins} — accord de la MOA, 2026-11-17`;

// Le jouet, le contrat et les tickets (`{ n: ligne }`) sur develop.
function monter(tickets = {}) {
  const d = depotJouet();
  d.ecrire(".claude/chaine.json", `${JSON.stringify(CONTRAT, null, 2)}\n`);
  for (const [n, ligne] of Object.entries(tickets)) d.ecrire(TICKET(n), ticket(n, ligne));
  d.commit("chore: contrat et tickets");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  return d;
}
function versDevelop(d, { fichiers, tete = "feat/spec-all-demo-1-01-x", titre = "feat(agent): x" }) {
  const sha = d.branche(tete, "origin/develop", fichiers);
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 30, title: titre, head: tete, base: "develop", labels: ["à-fusionner"], commentaires: valide(sha) }],
  });
  return sha;
}
const passer = (d) => d.lancer(PASSER, "30");

test("régime 8, passer.sh : un chemin sensible que la ligne `Sensibles:` du ticket couvre entre ; un autre est renvoyé, avant toute CI", () => {
  const d = monter({ 1: ACCORD("`scripts/agent/**`") });
  versDevelop(d, { fichiers: { "scripts/agent/x.mjs": "export {};\n" } });
  const r = passer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const non = monter({ 1: ACCORD("`scripts/agent/**`") });
  versDevelop(non, { fichiers: { "scripts/agent/x.mjs": "export {};\n", "docs/agents/regles.md": "r\n" } });
  const r2 = passer(non);
  assert.equal(r2.status, 4, r2.stdout + r2.stderr);
  assert.match(dernier(r2), /chemin sensible hors de la ligne `Sensibles:` de son ticket SPEC_ALL_DEMO-1\.01 \(docs\/agents\/regles\.md\)/);
  assert.doesNotMatch(r2.stdout, /mise à jour poussée/);
  assert.deepEqual(fusions(non), []);
});

test("régime 8, passer.sh : une PR sans ticket qui touche un chemin sensible est renvoyée ; sans chemin sensible, aucun ticket n'est demandé", () => {
  const d = monter();
  versDevelop(d, { fichiers: { "scripts/agent/x.mjs": "export {};\n" }, tete: "feat/x" });
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /PR sans ticket qui touche un chemin sensible \(scripts\/agent\/x\.mjs\)/);
  assert.match(dernier(r), /l'écrire au conducteur \(le chemin, pourquoi, ce qui y change\) : il obtient l'accord du produit et le note sur un ticket \(A-75\), puis la PR repart de la branche de ce ticket$/, "le geste de l'auteur");
  const doc = monter();
  versDevelop(doc, { fichiers: { "docs/a.md": "a\n" }, tete: "feat/x", titre: "docs(a): a" });
  assert.equal(passer(doc).status, 0);
});

test("régime 8, sujet.sh fusionner : la ligne se lit sur le sujet, jamais sur la branche ; non couverte, la sous-PR est renvoyée", () => {
  const monterSujet = (ligne) => {
    const d = monter();
    d.branche("sujet/lot", "origin/develop", { [TICKET(1)]: ticket(1, ligne) });
    const sha = d.branche("feat/spec-all-demo-1-01-x", "origin/sujet/lot", { "scripts/agent/x.mjs": "export {};\n", [TICKET(1)]: ticket(1, ACCORD("`scripts/**`")) });
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({
      exiges: ["qualite"],
      checks: { "*": { qualite: "SUCCESS" } },
      pulls: [{ number: 80, title: "feat(agent): x", head: "feat/spec-all-demo-1-01-x", base: "sujet/lot", labels: ["à-fusionner"], commentaires: valide(sha) }],
    });
    return d;
  };
  const non = monterSujet("Sensibles: —");
  const r = non.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /^#80 chemin sensible hors de la ligne `Sensibles:`/);
  const oui = monterSujet(ACCORD("scripts/agent/x.mjs"));
  const r2 = oui.lancer(SUJET, "fusionner", "80");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
});

test("régime 8, sujet.sh fusionner : une PR de mise à jour ne touche un chemin sensible qu'en conflit et couvert par un ticket du sujet", () => {
  const monterMaj = ({ ligne, retouche = false, parSpec = false }) => {
    const d = monter();
    // `parSpec` : le sujet est déclaré par la spec du ticket, pas par le ticket ; une spec citée vaut tous ses tickets.
    const declaration = parSpec ? { "docs/features/demo/all/SPEC_ALL_DEMO-1-demo.spec.md": "# SPEC_ALL_DEMO-1\n\nSujet: sujet/lot\n" } : {};
    d.branche("sujet/lot", "origin/develop", { [TICKET(2)]: ticket(2, parSpec ? ligne : `Sujet: sujet/lot\n${ligne}`), ...declaration, "scripts/agent/x.mjs": "sujet\n" });
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
    return d;
  };
  const oui = monterMaj({ ligne: ACCORD("`scripts/agent/**`") });
  const r = oui.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#81 fusionnée dans sujet\/lot par avance rapide/);
  const nonCouvert = monterMaj({ ligne: "Sensibles: —" });
  const r2 = nonCouvert.lancer(SUJET, "fusionner", "81");
  assert.equal(r2.status, 4, r2.stdout + r2.stderr);
  assert.match(dernier(r2), /^#81 chemin sensible hors de la ligne `Sensibles:` de son ticket SPEC_ALL_DEMO-1\.02 \(scripts\/agent\/x\.mjs\)/);
  const horsConflit = monterMaj({ ligne: ACCORD("`scripts/agent/**`"), retouche: true });
  const r3 = horsConflit.lancer(SUJET, "fusionner", "81");
  assert.equal(r3.status, 4, r3.stdout + r3.stderr);
  assert.match(dernier(r3), /^#81 PR de mise à jour : chemin sensible hors des fichiers en conflit \(scripts\/agent\/y\.mjs\)/);
  const parSpec = monterMaj({ ligne: ACCORD("`scripts/agent/**`"), parSpec: true });
  const r4 = parSpec.lancer(SUJET, "fusionner", "81");
  assert.equal(r4.status, 0, `le ticket d'une spec que le sujet déclare couvre le conflit : ${r4.stdout}${r4.stderr}`);
});

test("garde : chaque copie du ticket doit couvrir le chemin ; avec deux tickets, l'un suffit ; une ligne illisible et un ticket introuvable se disent", () => {
  const d = monter({ 1: ACCORD("`scripts/agent/**`"), 2: ACCORD("docs/agents/regles.md") });
  // La copie large d'abord (sujet/a), l'étroite ensuite (sujet/b) : l'ordre des refs ne fait pas l'accord.
  d.branche("sujet/a", "origin/develop", { [TICKET(1)]: ticket(1, ACCORD("`scripts/agent/**`")), "docs/a.md": "a\n" });
  d.branche("sujet/b", "origin/develop", { [TICKET(1)]: ticket(1, ACCORD("`scripts/agent/x.mjs`")), "docs/b.md": "b\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  const garde = (fichiers, titre, branche) => spawnSync(process.execPath, [GARDE, "--garde", "--base", "develop", "--titre", titre, "--branche", branche], { cwd: d.travail, env: d.env, input: fichiers, encoding: "utf8" });
  const x = garde("scripts/agent/x.mjs\n", "feat: x", "feat/spec-all-demo-1-01-x");
  assert.equal(x.status, 0, x.stdout + x.stderr);
  const y = garde("scripts/agent/y.mjs\n", "feat: x", "feat/spec-all-demo-1-01-x");
  assert.equal(y.status, 20, "la copie de sujet/b ne couvre pas y.mjs");
  assert.match(y.stdout, /hors de la ligne `Sensibles:` de son ticket SPEC_ALL_DEMO-1\.01 \(scripts\/agent\/y\.mjs\)/);
  const deux = garde("scripts/agent/x.mjs\ndocs/agents/regles.md\n", "feat(demo): SPEC_ALL_DEMO-1.02 x", "feat/spec-all-demo-1-01-x");
  assert.equal(deux.status, 0, deux.stdout + deux.stderr);
  const introuvable = garde("scripts/agent/x.mjs\n", "feat: x", "feat/spec-all-demo-1-09-x");
  assert.equal(introuvable.status, 20);
  assert.match(introuvable.stdout, /ticket SPEC_ALL_DEMO-1\.09 introuvable sur les origin\/sujet\/\* et sur origin\/develop.* ; l'écrire au conducteur : le ticket entre d'abord sur son sujet \(ou sur develop\), avec l'accord sur sa ligne \(A-75\)$/m);
  const usage = spawnSync(process.execPath, [GARDE, "--garde", "--base", "develop"], { cwd: d.travail, env: d.env, input: "", encoding: "utf8" });
  assert.equal(usage.status, 2);
  const mal = monter({ 1: "Sensibles: scripts/agent/** — accord de la MOA" });
  const r = spawnSync(process.execPath, [GARDE, "--garde", "--base", "develop", "--titre", "feat: x", "--branche", "feat/spec-all-demo-1-01-x"], { cwd: mal.travail, env: mal.env, input: "scripts/agent/x.mjs\n", encoding: "utf8" });
  assert.equal(r.status, 20);
  assert.match(r.stdout, /ligne `Sensibles:` du ticket SPEC_ALL_DEMO-1\.01 illisible .* : l'écrire au conducteur, qui la corrige par une PR de documentation vers le sujet \(A-75\) ; la session ne l'écrit jamais elle-même$/m);
});

test("garde : sans la grammaire des identifiants, la lecture est illisible (21), jamais « PR sans ticket »", () => {
  const d = monter({ 1: ACCORD("`scripts/agent/**`") });
  // Les trois scripts posés à plat, sans `scripts/docs/identifiants.mjs` à côté ni au-dessus.
  const plat = join(d.racine, "plat");
  mkdirSync(plat);
  for (const [skill, nom] of [["revue-adversariale", "chemins-sensibles.mjs"], ["fusionner", "revue-exigee.mjs"], ["fusionner", "double-relecture.mjs"]])
    writeFileSync(join(plat, nom), readFileSync(scriptDe(skill, nom), "utf8"));
  const r = spawnSync(process.execPath, [join(plat, "chemins-sensibles.mjs"), "--garde", "--base", "develop", "--titre", "feat: x", "--branche", "feat/spec-all-demo-1-01-x"], { cwd: d.travail, env: d.env, input: "scripts/agent/x.mjs\n", encoding: "utf8" });
  assert.equal(r.status, 21, r.stdout + r.stderr);
  assert.match(r.stdout, /lecture illisible : scripts\/docs\/identifiants\.mjs introuvable/);
});

test("garde : vers un sujet, les chemins sensibles sont ceux du contrat du sujet et de develop ; un chemin que seul le sujet déclare sensible est jugé (contre-relecture de la PR 149)", () => {
  const d = monter({ 1: ACCORD("`scripts/agent/**`") });
  // Le sujet ajoute à son contrat un chemin sensible que develop n'a pas.
  d.branche("sujet/lot", "origin/develop", { ".claude/chaine.json": `${JSON.stringify({ ...CONTRAT, cheminsSensibles: [...CONTRAT.cheminsSensibles, "docs/lot/"] }, null, 2)}\n` });
  d.git("switch", "-q", "--detach", "origin/develop");
  const garde = (fichiers) => spawnSync(process.execPath, [GARDE, "--garde", "--base", "sujet/lot", "--titre", "docs(lot): x", "--branche", "feat/spec-all-demo-1-01-x"], { cwd: d.travail, env: d.env, input: fichiers, encoding: "utf8" });
  const r = garde("docs/lot/a.md\n");
  assert.equal(r.status, 20, r.stdout + r.stderr);
  assert.match(r.stdout, /chemin sensible hors de la ligne `Sensibles:` de son ticket SPEC_ALL_DEMO-1\.01 \(docs\/lot\/a\.md\)/);
  assert.equal(garde("scripts/agent/x.mjs\n").status, 0, "le chemin de develop, accordé");
});

test("régime 8, passer.sh : un sujet supprimé du distant ne garde pas, dans le clone du capitaine, sa copie ancienne du ticket (le fetch élague) (contre-relecture de la PR 149)", () => {
  const d = monter({ 1: ACCORD("`scripts/agent/**`") });
  // Le sujet porte une copie du ticket sans l'accord ; un autre le supprime du distant, la ref reste dans ce clone.
  d.branche("sujet/ancien", "origin/develop", { [TICKET(1)]: ticket(1, "Sensibles: —") });
  spawnSync("git", ["--git-dir", d.origine, "update-ref", "-d", "refs/heads/sujet/ancien"], { env: d.env });
  versDevelop(d, { fichiers: { "scripts/agent/x.mjs": "export {};\n" } });
  assert.ok(d.git("for-each-ref", "refs/remotes/origin/sujet/").includes("sujet/ancien"), "la ref du sujet supprimé est là avant le passage");
  const r = passer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /FUSIONNÉE/);
});
