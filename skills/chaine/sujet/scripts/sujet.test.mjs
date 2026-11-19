// `sujet.sh` sur le dépôt jouet partagé (depot-jouet.mjs) : garde-fous de `demarrer`,
// `ouvrir` sans protection de branche, `regrouper-series` et `livrer-prets`.
// GitHub est simulé par le faux `gh` du dépôt jouet ; aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { depotJouet, script } from "./depot-jouet.mjs";

const SCRIPT = script("sujet", "sujet.sh");
const SPEC = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md";
const ticket = (nn) =>
  `docs/features/demo/all/issues/SPEC_ALL_DEM-1-demo.${nn}.issue.md`;

const demarrer = (d, id) => d.lancer(SCRIPT, "demarrer", id);

// Sujet ouvert, spec et deux tickets dessus, `.02` bloqué par `.01`.
function sujetAvecTickets(blocage = "01") {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\n- **Sujet :** sujet/demo\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.ecrire(
    ticket("02"),
    `# .02\n\nStatus: ready-for-agent\nBlocked by: ${blocage}\n`,
  );
  d.commit("docs: specs");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/demo");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-02-travail", "origin/develop");
  return d;
}

test("demarrer refuse un ticket dont le Blocked by: n’est pas fait sur le sujet", () => {
  const d = sujetAvecTickets("01");
  const r = demarrer(d, "SPEC_ALL_DEM-1.02");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /bloqué par SPEC_ALL_DEM-1\.01, pas encore fait sur sujet\/demo/,
  );
});

test("demarrer accepte le ticket une fois son bloquant fait sur le sujet", () => {
  const d = sujetAvecTickets("01");
  d.git("switch", "-q", "-c", "tmp", "origin/sujet/demo");
  d.ecrire(ticket("01"), "# .01\n\nStatus: Fait — PR #1\nBlocked by: —\n");
  d.commit("feat: .01");
  d.git("push", "-q", "origin", "HEAD:sujet/demo");
  d.git("switch", "-q", "feat/spec-all-dem-1-02-travail");
  const r = demarrer(d, "SPEC_ALL_DEM-1.02");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=sujet\/demo$/m);
});

test("demarrer accepte un bloquant fait même quand son fichier dépasse le tampon d'un tube (SIGPIPE sous pipefail)", () => {
  const d = sujetAvecTickets("01");
  d.git("switch", "-q", "-c", "tmp", "origin/sujet/demo");
  d.ecrire(ticket("01"), "# .01\n\nStatus: Fait — PR #1\nBlocked by: —\n" + "x".repeat(1024 * 1024) + "\n");
  d.commit("feat: .01");
  d.git("push", "-q", "origin", "HEAD:sujet/demo");
  d.git("switch", "-q", "feat/spec-all-dem-1-02-travail");
  const r = demarrer(d, "SPEC_ALL_DEM-1.02");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=sujet\/demo$/m);
});

test("demarrer lit les identifiants complets et ignore les parenthèses", () => {
  const d = sujetAvecTickets("— (SPEC_ALL_DEM-1.01 conseillé avant)");
  assert.equal(demarrer(d, "SPEC_ALL_DEM-1.02").status, 0);
  const e = sujetAvecTickets("SPEC_ALL_DEM-1.01 (registre)");
  const r = demarrer(e, "SPEC_ALL_DEM-1.02");
  assert.equal(r.status, 4);
  assert.match(r.stdout, /bloqué par SPEC_ALL_DEM-1\.01/);
});

test("demarrer signale une ligne Blocked by: qui ne cite aucun ticket, sans refuser", () => {
  const d = sujetAvecTickets("tous les tickets du sujet");
  const r = demarrer(d, "SPEC_ALL_DEM-1.02");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /ne cite aucun ticket/);
});

test("demarrer refuse quand la spec du ticket n’est pas encore sur le sujet", () => {
  const d = depotJouet();
  // Le sujet existe depuis avant la spec, entrée ensuite dans develop seulement.
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/demo");
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/demo\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.commit("docs: specs");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail", "origin/develop");
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /spec SPEC_ALL_DEM-1 n'est pas encore sur sujet\/demo/);
  assert.match(r.stdout, /rafraichir demo/);
});

test("demarrer refuse un ticket dont la spec n’est que sur une branche de specs", () => {
  const d = depotJouet();
  d.git("switch", "-q", "-c", "docs/demo-specs");
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/demo\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.commit("docs: specs");
  d.git("push", "-q", "origin", "HEAD:refs/heads/docs/demo-specs");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail");
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /ni sur develop ni sur un sujet/);
});

// Branche de ticket partie de develop, deux commits, déjà poussée, alors que le ticket déclare un
// sujet qui a avancé ; develop a avancé aussi, et la branche l'a fusionné (commit de merge).
const TRAVAIL = "feat/spec-all-dem-1-01-travail";
function brancheParteDeDevelop() {
  const d = sujetAvecTickets("—");
  d.git("switch", "-q", "-c", "tmp", "origin/sujet/demo");
  d.ecrire("sujet.txt", "sujet\n");
  d.commit("feat: le sujet avance");
  d.git("push", "-q", "origin", "HEAD:sujet/demo");
  d.git("switch", "-q", "-c", TRAVAIL, "origin/develop");
  d.ecrire("a.txt", "a\n");
  d.commit("feat: a");
  d.git("switch", "-q", "-c", "tmp2", "origin/develop");
  d.ecrire("develop.txt", "develop\n");
  d.commit("feat: develop avance");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", TRAVAIL);
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.ecrire("b.txt", "b\n");
  d.commit("feat: b");
  d.git("push", "-q", "-u", "origin", `HEAD:refs/heads/${TRAVAIL}`);
  return d;
}

test("demarrer d'une branche poussée partie de develop : refus 4, consigne sans rebase ni push forcé, branche intacte", () => {
  const d = brancheParteDeDevelop();
  const avant = { tete: d.git("rev-parse", "HEAD"), distante: d.git("ls-remote", "--heads", "origin", TRAVAIL) };
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.doesNotMatch(r.stdout, /\brebase\b.*origin|--force|push -f|\+HEAD|reset --hard|--amend/);
  assert.match(r.stdout, /^ {2}git switch --no-track -c feat\/spec-all-dem-1-01-travail-sur-sujet origin\/sujet\/demo$/m);
  assert.match(r.stdout, /^ {2}git cherry-pick --no-merges origin\/develop\.\.feat\/spec-all-dem-1-01-travail$/m);
  assert.match(r.stdout, /^ {2}git push -u origin feat\/spec-all-dem-1-01-travail-sur-sujet$/m);
  assert.match(r.stdout, /^En conflit : résoudre, git add, git cherry-pick --continue \(ou --abort : rien n'est perdu, l'ancienne branche reste ; après --abort, feat\/spec-all-dem-1-01-travail-sur-sujet existe déjà : la reprendre par git switch feat\/spec-all-dem-1-01-travail-sur-sujet, pas par -c\)\.$/m);
  assert.equal(d.git("rev-parse", "HEAD"), avant.tete);
  assert.equal(d.git("rev-parse", "--abbrev-ref", "HEAD"), TRAVAIL);
  assert.equal(d.git("ls-remote", "--heads", "origin", TRAVAIL), avant.distante);
});

test("la consigne de demarrer, jouée telle quelle, reprend les commits sur une branche neuve partie du sujet", () => {
  const d = brancheParteDeDevelop();
  const distante = d.git("ls-remote", "--heads", "origin", TRAVAIL);
  const consigne = demarrer(d, "SPEC_ALL_DEM-1.01").stdout.split("\n").filter((l) => l.startsWith("  git "));
  assert.equal(consigne.length, 3, consigne.join("\n"));
  d.git(...consigne[0].trim().split(/\s+/).slice(1));
  assert.throws(() => d.git("rev-parse", "--abbrev-ref", "@{u}"), undefined, "la branche neuve ne suit pas le sujet");
  for (const ligne of consigne.slice(1)) d.git(...ligne.trim().split(/\s+/).slice(1));
  assert.equal(d.git("rev-parse", "--abbrev-ref", "@{u}"), `origin/${TRAVAIL}-sur-sujet`);
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=sujet\/demo$/m);
  assert.equal(d.git("log", "--format=%s", "origin/sujet/demo..HEAD"), "feat: b\nfeat: a");
  assert.equal(d.git("rev-parse", "HEAD"), d.git("rev-parse", `origin/${TRAVAIL}-sur-sujet`));
  assert.equal(d.git("ls-remote", "--heads", "origin", TRAVAIL), distante);
});

test("ouvrir crée le sujet par git push et ne tente aucun appel de protection", () => {
  const d = depotJouet();
  const r = d.lancer(SCRIPT, "ouvrir", "demo");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^sujet\/demo ouverte sur develop \([0-9a-f]+\)$/m);
  assert.doesNotMatch(r.stdout, /protég|admin/);
  assert.equal(
    d.git("ls-remote", "--heads", "origin", "sujet/demo").split("\t")[0],
    d.git("rev-parse", "origin/develop"),
  );
  assert.deepEqual(
    d.journal(),
    [],
    "aucune écriture GitHub, protection comprise",
  );
});

// File du capitaine : une série de 3 PR (SPEC_ALL_DEM-2), une pile de 2 (#5 ← #6), une série de 3 dont
// une prio:haute (SPEC_ALL_DEM-3), une série de 3 dont une hors-sujet (SPEC_ALL_DEM-4, il en reste 2).
function fileAvecSeries() {
  const d = depotJouet();
  const pr = (number, head, autres = {}) => ({
    number,
    title: `feat(demo): ${head}`,
    head,
    base: "develop",
    labels: [],
    ...autres,
  });
  d.github({
    pulls: [
      pr(1, "feat/spec-all-dem-2-01-a"),
      pr(2, "feat/spec-all-dem-2-02-b"),
      pr(3, "feat/spec-all-dem-2-03-c"),
      pr(5, "feat/racine"),
      pr(6, "feat/etage", { base: "feat/racine" }),
      pr(7, "feat/spec-all-dem-3-01-a"),
      pr(8, "feat/spec-all-dem-3-02-b", { labels: ["prio:haute"] }),
      pr(9, "feat/spec-all-dem-3-03-c"),
      pr(10, "feat/spec-all-dem-4-01-a"),
      pr(11, "feat/spec-all-dem-4-02-b"),
      pr(12, "feat/spec-all-dem-4-03-c", { labels: ["hors-sujet"] }),
    ],
  });
  return d;
}
const numeros = (liste) => liste.trim().split(" ").sort().join(" ");

test("regrouper-series --dry-run : série de 3 et pile de 2 annoncées, prio:haute et hors-sujet exclues, rien d’écrit", () => {
  const d = fileAvecSeries();
  const r = d.lancer(SCRIPT, "regrouper-series", "--dry-run");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const lignes = r.stdout.trim().split("\n");
  assert.equal(lignes.length, 2, r.stdout);
  const [, cle, nom, prs] = lignes[0].match(
    /^série « (.+) » → sujet\/(\S+) : ([#0-9 ]+) \(--dry-run/,
  );
  assert.deepEqual(
    [cle, nom, numeros(prs)],
    ["spec SPEC_ALL_DEM-2", "spec-all-dem-2", "#1 #2 #3"],
  );
  const [, cleP, nomP, prsP] = lignes[1].match(
    /^série « (.+) » → sujet\/(\S+) : ([#0-9 ]+) \(--dry-run/,
  );
  assert.deepEqual([cleP, nomP, numeros(prsP)], ["pile #5", "pile-5", "#5 #6"]);
  assert.deepEqual(d.journal(), []);
  assert.equal(
    d.git("ls-remote", "--heads", "origin", "sujet/*"),
    "",
    "aucun sujet ouvert",
  );
});

test("regrouper-series recible la série et la racine de la pile, puis s’arrête", () => {
  const d = fileAvecSeries();
  const r = d.lancer(SCRIPT, "regrouper-series");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const bases = Object.fromEntries(
    d.etat().pulls.map((p) => [p.number, p.base]),
  );
  assert.deepEqual(bases, {
    1: "sujet/spec-all-dem-2",
    2: "sujet/spec-all-dem-2",
    3: "sujet/spec-all-dem-2",
    5: "sujet/pile-5",
    6: "feat/racine",
    7: "develop",
    8: "develop",
    9: "develop",
    10: "develop",
    11: "develop",
    12: "develop",
  });
  const etiquetees = d
    .etat()
    .pulls.filter((p) => p.labels.includes("sujet-auto"))
    .map((p) => p.number);
  assert.deepEqual(etiquetees, [1, 2, 3, 5]);
  assert.match(
    d.git("ls-remote", "--heads", "origin", "sujet/*"),
    /sujet\/pile-5[\s\S]*sujet\/spec-all-dem-2/,
  );
});

// Quatre sujets sans sous-PR ouverte : prêt (tickets déclarés et faits), sujet-manuel, un ticket
// sans PR (cas #575), ni tickets déclarés ni sujet-auto.
function sujetsALivrer() {
  const d = depotJouet();
  const spec = (n, nom) => ({
    [`docs/features/demo/all/SPEC_ALL_DEM-${n}-demo.spec.md`]: `# SPEC_ALL_DEM-${n}\n\nSujet: sujet/${nom}\n`,
  });
  const tk = (n, nn, statut, sujet = "") => ({
    [`docs/features/demo/all/issues/SPEC_ALL_DEM-${n}-demo.${nn}.issue.md`]: `# .${nn}\n\nStatus: ${statut}\n${sujet ? `Sujet: sujet/${sujet}\n` : ""}`,
  });
  d.branche(
    "sujet/pret",
    "origin/develop",
    { ...spec(5, "pret"), ...tk(5, "01", "Fait — PR #60") },
    "feat(demo): pret (#60)",
  );
  d.branche(
    "sujet/manuel",
    "origin/develop",
    { ...spec(6, "manuel"), ...tk(6, "01", "Fait — PR #61") },
    "feat(demo): manuel (#61)",
  );
  d.branche(
    "sujet/inacheve",
    "origin/develop",
    // Le ticket 02 déclare le sujet ET appartient à la spec qui le déclare : compté une fois.
    {
      ...spec(7, "inacheve"),
      ...tk(7, "01", "Fait — PR #62"),
      ...tk(7, "02", "ready-for-agent", "inacheve"),
    },
    "feat(demo): inacheve (#62)",
  );
  d.branche(
    "sujet/libre",
    "origin/develop",
    { "docs/libre.md": "libre\n" },
    "fix(demo): libre (#63)",
  );
  const fermee = (number, base, labels = []) => ({
    number,
    title: `feat(demo): ${number}`,
    head: `feat/sous-${number}`,
    base,
    labels,
    state: "closed",
    merged_at: "2026-10-19T00:00:00Z",
  });
  d.github({
    pulls: [
      fermee(60, "sujet/pret"),
      fermee(61, "sujet/manuel", ["sujet-manuel"]),
      fermee(62, "sujet/inacheve"),
      fermee(63, "sujet/libre"),
    ],
  });
  d.git("switch", "-q", "--detach", "origin/develop");
  return d;
}

test("livrer-prets --dry-run : seul le sujet prêt est annoncé, rien n’est ouvert", () => {
  const d = sujetsALivrer();
  const r = d.lancer(SCRIPT, "livrer-prets", "--dry-run");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /^sujet\/pret prêt : livrerait « feat\(demo\): sujet\/pret — 1 sous-PR » \(--dry-run/m,
  );
  assert.match(r.stdout, /^sujet\/manuel prêt, mais label sujet-manuel/m);
  assert.match(
    r.stdout,
    /^sujet\/libre sans sous-PR ouverte, mais ni tickets déclarés ni sujet-auto/m,
  );
  assert.doesNotMatch(
    r.stdout,
    /inacheve/,
    "un ticket sans PR : le sujet est « en cours »",
  );
  assert.deepEqual(d.journal(), []);
  assert.match(
    d.lancer(SCRIPT, "etat").stdout,
    /^inacheve\t1\t0\t—\tSPEC_ALL_DEM-7\.02 \ten cours$/m,
  );
});

test("livrer-prets ouvre la PR du seul sujet prêt, étiquetée à-fusionner", () => {
  const d = sujetsALivrer();
  const r = d.lancer(SCRIPT, "livrer-prets");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /^PR #64 ouverte \(sujet\/pret → develop\), étiquetée à-fusionner$/m,
  );
  assert.deepEqual(
    d
      .journal()
      .map(
        (e) =>
          `${e.methode} ${e.route} ${e.champs.head ?? e.champs["labels[]"]}`,
      ),
    ["POST pulls sujet/pret", "POST issues/64/labels à-fusionner"],
  );
});

test("livrer-prets ne rouvre pas un sujet dont la livraison intermédiaire est déjà ouverte", () => {
  const d = sujetsALivrer();
  const etat = d.etat();
  etat.pulls.push({
    number: 70,
    title: "feat(demo): sujet pret — 1 sous-PR",
    head: "livraison/pret-20261109-2245",
    base: "develop",
    labels: ["fusion-bloquée"],
  });
  d.github(etat);
  const r = d.lancer(SCRIPT, "livrer-prets");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.doesNotMatch(r.stdout, /ouverte \(/, "aucune nouvelle livraison");
  assert.deepEqual(d.journal(), []);
  assert.match(d.lancer(SCRIPT, "etat").stdout, /^pret\t.*\tlivré #70$/m);
});

// Un autre contexte que ALL se lit pareil ; l'ancienne forme (SOC-1.01) n'est plus un identifiant.
test("demarrer lit un ticket d'un autre contexte, et ne lit plus l'ancienne forme", () => {
  const d = depotJouet();
  d.ecrire(
    "docs/features/socle/fnsmr/SPEC_FNSMR_SOC-1-socle.spec.md",
    "# SPEC_FNSMR_SOC-1\n\nSujet: sujet/socle\n",
  );
  d.ecrire(
    "docs/features/socle/fnsmr/issues/SPEC_FNSMR_SOC-1-socle.01.issue.md",
    "# .01\n\nStatus: ready-for-agent\n",
  );
  // Une spec restée à l'ancienne forme : aucun script ne la lit, elle ne déclare donc aucun sujet.
  d.ecrire(
    "docs/features/vieux/SOC-2-vieux.spec.md",
    "# SOC-2\n\nSujet: sujet/vieux\n",
  );
  d.commit("docs: specs");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/socle");
  d.git(
    "switch",
    "-q",
    "-c",
    "feat/spec-fnsmr-soc-1-01-travail",
    "origin/develop",
  );
  const r = demarrer(d, "SPEC_FNSMR_SOC-1.01");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=sujet\/socle$/m);
  assert.equal(
    d.lancer(SCRIPT, "de", "SPEC_FNSMR_SOC-1.01").stdout.trim(),
    "socle",
  );
  assert.equal(
    d.lancer(SCRIPT, "carte").stdout,
    "SPEC_FNSMR_SOC-1\tsocle\n",
    "la carte ne porte que des identifiants de la grammaire",
  );
  const ancien = demarrer(d, "SOC-1.01");
  assert.equal(ancien.status, 4, ancien.stdout + ancien.stderr);
  assert.match(ancien.stdout, /nom de sujet en kebab-case attendu : SOC-1\.01/);
});

// `regrouper` et `demarrer` ne rouvrent pas un sujet livré.
function sujetLivre(phase = "fini") {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\n- **Sujet :** sujet/demo\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.ecrire(
    "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md",
    `# carte\n\nSujet: sujet/demo\n\nPhase: ${phase}\n`,
  );
  d.commit("docs: specs et carte");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail", "origin/develop");
  return d;
}
const sujetsDistants = (d) => d.git("ls-remote", "--heads", "origin", "sujet/*");

test("regrouper refuse un sujet livré, sans créer de branche", () => {
  const d = sujetLivre();
  const r = d.lancer(SCRIPT, "regrouper", "demo", "5");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/demo est livré/);
  assert.equal(sujetsDistants(d), "");
});

test("demarrer d'un ticket de sujet livré part de develop, sans rouvrir le sujet", () => {
  const d = sujetLivre("6-nettoyage");
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=develop$/m);
  assert.match(r.stdout, /déjà livré/);
  assert.equal(sujetsDistants(d), "");
});

// Sans carte : le sujet est livré quand sa branche a disparu et que develop contient le commit de
// merge que la chaîne écrit vraiment (passer.sh), jamais un message forgé pour le test.
test("sujet livre : sans carte, livré par passer.sh puis branche supprimée, demarrer ne le rouvre pas", () => {
  const d = depotJouet();
  assert.equal(d.lancer(SCRIPT, "livre", "demo").status, 1, "rien : pas livré");
  d.branche("sujet/demo", "origin/develop", { "docs/x.md": "x\n" }, "docs(demo): x (#1)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [
      {
        number: 2,
        title: "docs(demo): sujet/demo — 1 sous-PR",
        head: "sujet/demo",
        base: "develop",
        labels: ["à-fusionner"],
      },
    ],
  });
  const passe = d.lancer(script("fusionner", "passer.sh"), "2");
  assert.equal(passe.status, 0, passe.stdout + passe.stderr);
  assert.equal(d.lancer(SCRIPT, "livre", "demo").status, 1, "branche encore là : pas livré");
  // GitHub supprime la branche du sujet à la fusion de sa PR finale.
  d.git("push", "-q", "origin", ":refs/heads/sujet/demo");
  assert.equal(d.lancer(SCRIPT, "livre", "demo").status, 0, "livré");
  assert.equal(d.lancer(SCRIPT, "livre", "dem").status, 1, "un préfixe n'est pas le sujet");
  d.git("switch", "-q", "-c", "feat/travail", "origin/develop");
  const r = demarrer(d, "demo");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/demo est livré dans develop : on ne le rouvre pas/);
  assert.equal(sujetsDistants(d), "", "sujet/demo pas recréé");
});

test("sujet livre : une fusion faite sur GitHub (message par défaut) compte, un autre sujet au nom plus long non", () => {
  const d = depotJouet();
  d.git("switch", "-q", "-c", "sujet/demo-2", "origin/develop");
  d.ecrire("x.md", "x\n");
  d.commit("feat: x");
  d.git("switch", "-q", "develop");
  d.git("merge", "-q", "--no-ff", "-m", "Merge pull request #3 from org/sujet/demo-2", "sujet/demo-2");
  d.git("push", "-q", "origin", "develop");
  assert.equal(d.lancer(SCRIPT, "livre", "demo-2").status, 0, "livré par l'interface de GitHub");
  assert.equal(d.lancer(SCRIPT, "livre", "demo").status, 1, "sujet/demo n'est pas sujet/demo-2");
});

// une livraison intermédiaire ne met pas la branche du sujet en jeu.
function sujetAvecCarte(phase) {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/demo\n");
  d.ecrire(
    "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md",
    `# carte\n\nSujet: sujet/demo\n\nPhase: ${phase}\n`,
  );
  d.commit("docs: spec et carte");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.branche("sujet/demo", "origin/develop", { "docs/x.md": "x\n" }, "feat(demo): x (#1)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [] });
  return d;
}
const teteDeLaPR = (d) => d.journal().find((e) => e.methode === "POST" && e.route === "pulls");

test("livrer : la carte qui n'existe que sur le sujet (phase 4) donne une livraison intermédiaire", () => {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/demo\n");
  d.commit("docs: spec");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.branche(
    "sujet/demo",
    "origin/develop",
    {
      "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md":
        "# carte\n\nSujet: sujet/demo\n\nPhase: 4-vague-2\n",
    },
    "docs(demo): carte (#1)",
  );
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [] });
  const r = d.lancer(SCRIPT, "livrer", "demo", "feat(demo): livraison intermédiaire");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(teteDeLaPR(d).champs.head, /^livraison\/demo-\d{8}-\d{4}$/);
  assert.match(d.git("ls-remote", "--heads", "origin", "sujet/demo"), /refs\/heads\/sujet\/demo/);
});

test("livrer en phase 4 : la PR part d'une branche jetable, sujet/<nom> reste", () => {
  const d = sujetAvecCarte("4-vagues");
  const r = d.lancer(SCRIPT, "livrer", "demo", "feat(demo): livraison intermédiaire");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const pr = teteDeLaPR(d);
  assert.match(pr.champs.head, /^livraison\/demo-\d{8}-\d{4}$/);
  assert.match(pr.champs.body, /Livraison intermédiaire/);
  assert.match(d.git("ls-remote", "--heads", "origin", "sujet/demo"), /refs\/heads\/sujet\/demo/);
  assert.match(d.git("ls-remote", "--heads", "origin", pr.champs.head), /livraison\/demo-/);
});

test("livrer en 5-livraison : la PR part de sujet/<nom>, comme avant", () => {
  const d = sujetAvecCarte("5-livraison");
  const r = d.lancer(SCRIPT, "livrer", "demo", "feat(demo): livraison");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const pr = teteDeLaPR(d);
  assert.equal(pr.champs.head, "sujet/demo");
  assert.doesNotMatch(pr.champs.body, /intermédiaire/);
  assert.equal(d.git("ls-remote", "--heads", "origin", "livraison/*"), "");
});

test("livrer ouvre la PR sans à-fusionner, et le dit", () => {
  const d = sujetAvecCarte("5-livraison");
  const r = d.lancer(SCRIPT, "livrer", "demo", "feat(demo): livraison");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^PR #\d+ ouverte \(sujet\/demo → develop\), sans à-fusionner : le poser après la relecture de la PR$/m);
  const j = d.journal();
  assert.equal(j.filter((e) => e.methode === "POST" && e.route === "pulls").length, 1);
  assert.deepEqual(j.filter((e) => /labels$/.test(e.route)), []);
});

test("livrer sans gh utilisable : sortie 14, fichier de titre et de corps hors de l'arbre, aucune PR, l'aide MCP affichée", () => {
  const d = sujetAvecCarte("5-livraison");
  d.github({ pulls: [], compteIllisible: true });
  const r = d.lancer(SCRIPT, "livrer", "demo", "feat(demo): livraison");
  assert.equal(r.status, 14, r.stdout + r.stderr);
  assert.match(r.stdout, /PR NON OUVERTE \(gh indisponible\)/);
  assert.match(r.stdout, /list_pull_requests\(owner: "[^"]+", repo: "[^"]+", base: "sujet\/demo", state: "open"\)/);
  assert.match(r.stdout, /create_pull_request\(owner: "[^"]+", repo: "[^"]+", base: "develop", head: "sujet\/demo"/);
  const chemin = /Fichier : (\S+)/.exec(r.stdout)[1];
  assert.ok(chemin.startsWith("/"));
  const fichier = readFileSync(chemin, "utf8").split("\n");
  assert.equal(fichier[0], "feat(demo): livraison");
  assert.equal(fichier[1], "");
  assert.match(fichier.slice(2).join("\n"), /## Sous-PR/);
  assert.equal(chemin, join(d.git("rev-parse", "--path-format=absolute", "--git-common-dir").trim(), "livraison-demo.md"));
  assert.deepEqual(d.journal().filter((e) => e.methode === "POST"), []);
  assert.equal(d.git("status", "--porcelain").trim(), "");
});

test("livrer : une lecture des sous-PR vide n'est pas « des sous-PR ouvertes » mais « sans gh » (14), aucune PR", () => {
  const d = sujetAvecCarte("5-livraison");
  d.github({ pulls: [], pannes: [{ route: "^pulls\\?state=open", code: 0, erreur: "" }] });
  const r = d.lancer(SCRIPT, "livrer", "demo", "feat(demo): livraison");
  assert.equal(r.status, 14, r.stdout + r.stderr);
  assert.doesNotMatch(r.stdout, /des sous-PR visent encore/);
  assert.deepEqual(d.journal().filter((e) => e.methode === "POST"), []);
});

test("livrer sans gh utilisable en phase 4 : la branche jetable est poussée, le fichier nomme sa tête", () => {
  const d = sujetAvecCarte("4-vagues");
  d.github({ pulls: [], compteIllisible: true });
  const r = d.lancer(SCRIPT, "livrer", "demo", "feat(demo): livraison intermédiaire");
  assert.equal(r.status, 14, r.stdout + r.stderr);
  const tete = /head: "(livraison\/demo-\d{8}-\d{4})"/.exec(r.stdout)[1];
  assert.match(d.git("ls-remote", "--heads", "origin", tete), /livraison\/demo-/);
  assert.deepEqual(d.journal().filter((e) => e.methode === "POST"), []);
});

// =============================================================================
// Gel d'un chantier (A-11) : ligne `Gel:` de la fiche de la carte, sur origin/sujet/<nom>.
// =============================================================================
const CARTE_GEL = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
const fiche = (gel = "") =>
  `# SPEC_ALL_DEM-1 — Carte\n\nSujet: sujet/demo\n\n## Fiche\n\nPhase: 4-vague-1\nConducteur: session_y\n${gel}\n## Decisions-so-far\n\n- A-1 — x\n`;
const gelSur = (d) =>
  d.git("show", `origin/sujet/demo:${CARTE_GEL}`).match(/^Gel ?:.*$/m)?.[0];
const AUJOURDHUI = /^Gel: \d{4}-\d{2}-\d{2} — le produit change d'avis$/;

// Sujet demo avec sa carte (et sa spec), un ticket par sujet ; la branche de travail part du sujet.
function sujetGelable(gel = "", { carte = true } = {}) {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/demo\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  if (carte) d.ecrire(CARTE_GEL, fiche(gel));
  d.commit("docs: specs et carte");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/demo");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail", "origin/develop");
  return d;
}
const geler = (d, ...a) => d.lancer(SCRIPT, "geler", "demo", ...a);

test("geler écrit la ligne Gel: datée dans la carte du sujet, sans toucher la branche courante ni l'arbre de travail", () => {
  const d = sujetGelable();
  d.ecrire("src/en-cours.ts", "export const x = 1;\n");
  const avant = {
    tete: d.git("rev-parse", "HEAD"),
    branche: d.git("rev-parse", "--abbrev-ref", "HEAD"),
    statut: d.git("status", "--porcelain"),
  };
  const r = geler(d, "le produit change d'avis");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(gelSur(d), AUJOURDHUI);
  const carte = d.git("show", `origin/sujet/demo:${CARTE_GEL}`);
  assert.ok(carte.indexOf("Gel:") < carte.indexOf("## Decisions-so-far"), "la ligne est dans la fiche");
  assert.match(carte, /Conducteur: session_y\nGel: /, "ajoutée après la dernière ligne de la fiche");
  assert.match(d.git("log", "-1", "--format=%s", "origin/sujet/demo"), /gèle le chantier sujet\/demo/);
  assert.equal(d.git("rev-parse", "HEAD"), avant.tete);
  assert.equal(d.git("rev-parse", "--abbrev-ref", "HEAD"), avant.branche);
  assert.equal(d.git("status", "--porcelain"), avant.statut);
  const g = d.lancer(SCRIPT, "gel", "demo");
  assert.equal(g.status, 0);
  assert.match(g.stdout.trim(), /^\d{4}-\d{2}-\d{2} — le produit change d'avis$/);
});

test("geler remplace la ligne Gel: vide de la fiche en place", () => {
  const d = sujetGelable("Gel:\n");
  assert.equal(geler(d, "le produit change d'avis").status, 0);
  const carte = d.git("show", `origin/sujet/demo:${CARTE_GEL}`);
  assert.equal(carte.match(/^Gel/gm).length, 1);
  assert.match(carte, AUJOURDHUI_DANS_FICHE);
});
const AUJOURDHUI_DANS_FICHE = /Conducteur: session_y\nGel: \d{4}-\d{2}-\d{2} — le produit change d'avis\n\n## Decisions-so-far/;

test("degeler vide la ligne Gel: ; sur un sujet non gelé, il ne pousse rien", () => {
  const d = sujetGelable();
  const avant = d.git("rev-parse", "origin/sujet/demo");
  const rien = d.lancer(SCRIPT, "degeler", "demo");
  assert.equal(rien.status, 0, rien.stdout + rien.stderr);
  assert.equal(d.git("ls-remote", "origin", "refs/heads/sujet/demo").split("\t")[0], avant);
  assert.equal(geler(d, "le produit change d'avis").status, 0);
  assert.equal(d.lancer(SCRIPT, "gel", "demo").status, 0);
  const r = d.lancer(SCRIPT, "degeler", "demo");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /prévenir/, "dit qui prévenir");
  assert.equal(gelSur(d), "Gel:");
  assert.equal(d.lancer(SCRIPT, "gel", "demo").status, 1);
});

test("geler refuse un sujet sans carte, une raison vide et un sujet déjà gelé, sans rien pousser", () => {
  const sans = sujetGelable("", { carte: false });
  const tete = sans.git("rev-parse", "origin/sujet/demo");
  const r = geler(sans, "raison");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /pas de carte/);
  assert.equal(sans.git("rev-parse", "origin/sujet/demo"), tete);

  const d = sujetGelable();
  const vide = geler(d, "  ");
  assert.equal(vide.status, 4);
  assert.match(vide.stdout, /raison est obligatoire/);
  assert.equal(geler(d).status, 4, "sans raison");
  assert.equal(gelSur(d), undefined, "rien d'écrit");

  assert.equal(geler(d, "le produit change d'avis").status, 0);
  const apres = d.git("rev-parse", "origin/sujet/demo");
  const deux = geler(d, "autre raison");
  assert.equal(deux.status, 4);
  assert.match(deux.stdout, /déjà gelé : Gel: \d{4}-\d{2}-\d{2} — le produit change d'avis/);
  assert.equal(d.git("rev-parse", "origin/sujet/demo"), apres);

  const inconnu = d.lancer(SCRIPT, "geler", "absent", "raison");
  assert.equal(inconnu.status, 4);
});

test("demarrer refuse un sujet gelé, sortie 4, la raison du gel citée", () => {
  const d = sujetGelable("Gel: 2026-11-13 — pause du produit\n");
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/demo est gelé \(Gel: 2026-11-13 — pause du produit\)/);
  assert.equal(d.git("rev-parse", "--abbrev-ref", "HEAD"), "feat/spec-all-dem-1-01-travail", "la branche n'a pas bougé");
  assert.equal(demarrer(d, "demo").status, 4, "par le nom du sujet aussi");
  // Une fois dégelé, demarrer repasse.
  assert.equal(d.lancer(SCRIPT, "degeler", "demo").status, 0);
  assert.equal(demarrer(d, "SPEC_ALL_DEM-1.01").status, 0);
});

test("une ligne Gel: écrite à la main, sans date, gèle aussi", () => {
  const d = sujetGelable("Gel: pause\n");
  const g = d.lancer(SCRIPT, "gel", "demo");
  assert.equal(g.status, 0);
  assert.equal(g.stdout.trim(), "pause");
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 4);
  assert.match(r.stdout, /Gel: pause/);
  // Un « Gel: » hors de la fiche ne gèle pas.
  const e = sujetGelable();
  e.git("switch", "-q", "-c", "tmp", "origin/sujet/demo");
  e.ecrire(CARTE_GEL, fiche() + "\n## Fog\n\nGel: ceci est du texte\n");
  e.commit("docs: texte");
  e.git("push", "-q", "origin", "HEAD:sujet/demo");
  assert.equal(e.lancer(SCRIPT, "gel", "demo").status, 1);
});

test("livrer refuse un sujet gelé ; livrer-prets livre le sujet prêt qui le suit", () => {
  const d = sujetsALivrer();
  // `gele` : prêt à livrer (ticket fait) mais gelé ; il précède `pret` dans l'ordre alphabétique.
  d.branche(
    "sujet/gele",
    "origin/develop",
    {
      "docs/features/demo/all/SPEC_ALL_DEM-8-demo.spec.md": "# SPEC_ALL_DEM-8\n\nSujet: sujet/gele\n",
      "docs/features/demo/all/issues/SPEC_ALL_DEM-8-demo.01.issue.md": "# .01\n\nStatus: Fait — PR #64\n",
      "docs/features/demo/all/SPEC_ALL_DEM-8-demo.map.md":
        "# carte\n\nSujet: sujet/gele\n\n## Fiche\n\nPhase: 4-vague-1\nGel: 2026-11-13 — pause\n",
    },
    "feat(demo): gele (#64)",
  );
  d.git("switch", "-q", "--detach", "origin/develop");
  const refus = d.lancer(SCRIPT, "livrer", "gele", "feat(demo): gele");
  assert.equal(refus.status, 4, refus.stdout + refus.stderr);
  assert.match(refus.stdout, /sujet\/gele est gelé/);
  assert.match(d.lancer(SCRIPT, "etat").stdout, /^gele\t.*\tgelé$/m);
  const r = d.lancer(SCRIPT, "livrer-prets");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^PR #\d+ ouverte \(sujet\/pret → develop\), étiquetée à-fusionner$/m);
  assert.doesNotMatch(r.stdout, /gele →/);
  assert.ok(
    d.journal().every((e) => e.methode !== "POST" || e.route !== "pulls" || e.champs.head === "sujet/pret"),
    "aucune PR ouverte pour le sujet gelé",
  );
});

test("l'aide nomme geler, degeler et gel, et sort en 4", () => {
  const d = depotJouet();
  const r = d.lancer(SCRIPT);
  assert.equal(r.status, 4);
  assert.match(r.stdout, /geler <nom> "<raison>" \| degeler <nom> \| gel <nom>/);
});

test("gel et geler lisent une carte en CRLF, sans fin de ligne finale, et ignorent les variantes proches", () => {
  const ecrireCarte = (d, texte) => {
    d.git("switch", "-q", "-c", "tmp", "origin/sujet/demo");
    d.ecrire(CARTE_GEL, texte);
    d.commit("docs: carte");
    d.git("push", "-q", "origin", "HEAD:sujet/demo");
  };
  const crlf = sujetGelable();
  ecrireCarte(crlf, fiche("Gel: pause\n").replaceAll("\n", "\r\n"));
  const g = crlf.lancer(SCRIPT, "gel", "demo");
  assert.equal(g.status, 0);
  assert.equal(g.stdout.trim(), "pause", "CRLF");
  const fin = sujetGelable();
  ecrireCarte(fin, "# c\n\nSujet: sujet/demo\n\n## Fiche\n\nPhase: 4\nGel: pause");
  assert.equal(fin.lancer(SCRIPT, "gel", "demo").stdout.trim(), "pause", "dernière ligne sans fin de ligne");
  const voisines = sujetGelable();
  ecrireCarte(voisines, fiche("Gelé: non\nGel sans deux-points\nDégel: non\n"));
  assert.equal(voisines.lancer(SCRIPT, "gel", "demo").status, 1, "variantes proches : pas gelé");
  // geler sur une fiche qui finit sans fin de ligne ajoute la ligne proprement.
  const sans = sujetGelable();
  ecrireCarte(sans, "# c\n\nSujet: sujet/demo\n\n## Fiche\n\nPhase: 4");
  assert.equal(geler(sans, "raison").status, 0);
  assert.match(sans.git("show", `origin/sujet/demo:${CARTE_GEL}`), /Phase: 4\nGel: \d{4}-\d{2}-\d{2} — raison/);
});

test("geler : une raison contenant des séquences d'échappement littérales reste sur une seule ligne", () => {
  const d = sujetGelable();
  assert.equal(geler(d, "a\\nb\\tc \\\\ d").status, 0);
  const carte = d.git("show", `origin/sujet/demo:${CARTE_GEL}`);
  assert.match(carte, /^Gel: \d{4}-\d{2}-\d{2} — a\\nb\\tc \\\\ d$/m);
  assert.equal(d.git("diff", "--numstat", "origin/sujet/demo~1", "origin/sujet/demo").split("\t").slice(0, 2).join(","), "1,0");
});

// =============================================================================
// Une carte de chantier peut couvrir plusieurs sujets : `Sujet: sujet/a, sujet/b, sujet/c`.
// Chaque commande qui lit la carte d'un sujet la trouve quand l'une des valeurs le nomme.
// =============================================================================
const CARTE_MULTI = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
const carteMulti = (ligne = "Sujet: sujet/a, sujet/b, sujet/c", phase = "4-vague-1", suite = "") =>
  `# SPEC_ALL_DEM-1 — Carte\n\n${ligne}\n\n## Fiche\n\nPhase: ${phase}\nConducteur: session_y${suite}\n\n## Decisions-so-far\n\n- A-1 — x\n`;

// Le faux `pnpm` du jouet ne formate rien : un « Prettier » identité, pour `carte <nom>`.
function formateurIdentite(d) {
  const fichier = join(d.racine, "bin", "pnpm");
  writeFileSync(fichier, "#!/bin/sh\ncat\n");
  chmodSync(fichier, 0o755);
}

// Trois sujets a, b, c, chacun avec la carte (trois valeurs sur sa ligne `Sujet:`) et un commit propre ;
// la spec déclare `a`.
function troisSujets(ligne) {
  const d = depotJouet();
  formateurIdentite(d);
  d.ecrire(CARTE_MULTI, carteMulti(ligne));
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/a\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.commit("docs: carte et spec");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/a", "HEAD:refs/heads/sujet/b", "HEAD:refs/heads/sujet/c");
  for (const x of ["a", "b", "c"]) {
    d.branche(`sujet/${x}`, `origin/sujet/${x}`, { [`src/${x}.ts`]: "export {};\n" }, `feat(demo): ${x} (#1)`);
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  return d;
}

test("geler, gel, degeler et etat trouvent la carte qui nomme plusieurs sujets et n'écrivent que sur la branche du sujet visé", () => {
  const d = troisSujets();
  const g = d.lancer(SCRIPT, "geler", "b", "pause");
  assert.equal(g.status, 0, g.stdout + g.stderr);
  assert.equal(d.lancer(SCRIPT, "gel", "b").status, 0);
  assert.equal(d.lancer(SCRIPT, "gel", "a").status, 1, "la copie de la carte sur sujet/a n'est pas touchée");
  assert.equal(d.lancer(SCRIPT, "gel", "c").status, 1);
  assert.match(d.git("show", "origin/sujet/b:" + CARTE_MULTI), /^Gel: \d{4}-\d{2}-\d{2} — pause$/m);
  assert.doesNotMatch(d.git("show", "origin/sujet/a:" + CARTE_MULTI), /^Gel:/m);
  const etat = d.lancer(SCRIPT, "etat").stdout;
  assert.match(etat, /^b\t.*\tgelé$/m);
  assert.match(etat, /^a\t.*\ten cours$/m);
  const r = d.lancer(SCRIPT, "degeler", "b");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(d.lancer(SCRIPT, "gel", "b").status, 1);
});

test("livre : une carte qui nomme plusieurs sujets les donne tous livrés en phase fini sur develop, aucun avant", () => {
  const d = depotJouet();
  d.ecrire(CARTE_MULTI, carteMulti(undefined, "4-vague-1"));
  d.commit("docs: carte");
  d.git("push", "-q", "origin", "HEAD:develop");
  for (const x of ["a", "b", "c"]) assert.equal(d.lancer(SCRIPT, "livre", x).status, 1, `${x} : carte en phase 4`);
  d.ecrire(CARTE_MULTI, carteMulti(undefined, "fini"));
  d.commit("docs: carte finie");
  d.git("push", "-q", "origin", "HEAD:develop");
  for (const x of ["a", "b", "c"]) assert.equal(d.lancer(SCRIPT, "livre", x).status, 0, `${x} : carte finie`);
  assert.equal(d.lancer(SCRIPT, "livre", "d").status, 1, "un sujet que la carte ne nomme pas");
});

test("livrer : la carte qui nomme plusieurs sujets, en phase 4 sur le sujet, donne une livraison intermédiaire", () => {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/b\n");
  d.commit("docs: spec");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.branche("sujet/b", "origin/develop", { [CARTE_MULTI]: carteMulti(undefined, "4-vague-2") }, "docs(demo): carte (#1)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [] });
  const r = d.lancer(SCRIPT, "livrer", "b", "feat(demo): livraison intermédiaire");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(d.journal().find((e) => e.methode === "POST" && e.route === "pulls").champs.head, /^livraison\/b-\d{8}-\d{4}$/);
});

test("carte <nom> pousse la mise à jour d'une carte qui nomme plusieurs sujets, sur chacun des sujets qu'elle nomme, et refuse celui qu'elle ne nomme plus", () => {
  const d = troisSujets();
  for (const x of ["a", "b"]) {
    d.git("switch", "-q", "-C", `docs/carte-${x}`, `origin/sujet/${x}`);
    d.ecrire(CARTE_MULTI, carteMulti(undefined, "4-vague-1", `\nSessions: s-${x}`));
    d.commit(`docs(demo): carte ${x}`);
    const r = d.lancer(SCRIPT, "carte", x);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    d.git("fetch", "-q", "origin");
    assert.match(d.git("show", `origin/sujet/${x}:${CARTE_MULTI}`), new RegExp(`^Sessions: s-${x}$`, "m"));
  }
  assert.doesNotMatch(d.git("show", "origin/sujet/c:" + CARTE_MULTI), /Sessions/);
  d.git("switch", "-q", "-C", "docs/carte-c", "origin/sujet/c");
  d.ecrire(CARTE_MULTI, carteMulti("Sujet: sujet/a, sujet/b"));
  d.commit("docs(demo): c retiré de la carte");
  const refus = d.lancer(SCRIPT, "carte", "c");
  assert.equal(refus.status, 9, refus.stdout + refus.stderr);
  assert.match(refus.stdout, /plus exactement/);
});

test("demarrer refuse un ticket dont la ligne Sujet: nomme plusieurs sujets (sortie 4), le sien d'abord, sinon celle de sa spec", () => {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/a, sujet/b\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.ecrire(ticket("02"), "# .02\n\nStatus: ready-for-agent\nSujet: sujet/a\nBlocked by: —\n");
  d.ecrire(ticket("03"), "# .03\n\nStatus: ready-for-agent\nSujet: sujet/a sujet/b\nBlocked by: —\n");
  d.commit("docs: specs");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/a");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail", "origin/develop");
  for (const nn of ["01", "03"]) {
    const r = demarrer(d, `SPEC_ALL_DEM-1.${nn}`);
    assert.equal(r.status, 4, nn + r.stdout + r.stderr);
    assert.match(r.stdout, new RegExp(`SPEC_ALL_DEM-1\\.${nn} déclare plusieurs sujets \\(Sujet: sujet/a`));
    assert.match(r.stdout, /un ticket se démarre sur un seul sujet/);
  }
  const propre = demarrer(d, "SPEC_ALL_DEM-1.02");
  assert.equal(propre.status, 0, propre.stdout + propre.stderr);
  assert.match(propre.stdout, /^base=sujet\/a$/m);
});
