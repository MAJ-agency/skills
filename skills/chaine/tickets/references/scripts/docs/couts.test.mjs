import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { ENV, depotJouet, module, script } from "./depot-jouet.mjs";

const { bilan, enEuros, enMarkdown, lireCarte, messagesIllisibles, montant, table } = await module("docs/couts.mjs");

/** Les tables sont alignées : on compare le contenu, espaces de remplissage écrasés. */
const plat = (md) => md.replace(/ {2,}/g, " ");

const carte = (sujet, lignes, phase = "4-vague-2") =>
  `# X — Carte\n\nSujet: sujet/${sujet}\n\n## Fiche\n\nPhase: ${phase}\n\n## Coût\n\n` +
  "| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |\n| --- | --- | --- | --- | --- | --- |\n" +
  lignes.map((l) => `| ${l.join(" | ")} |`).join("\n") +
  "\n\n## Rétro\n\nRien.\n";

test("un montant à virgule ou à point est lu, un texte ou un gabarit ne l'est pas", () => {
  assert.equal(montant("68,92"), 68.92);
  assert.equal(montant(" 4.08 "), 4.08);
  assert.equal(montant("{{coût}}"), null);
  assert.equal(montant("—"), null);
  assert.equal(enEuros(3.5), "3,50");
});

test("une carte rend son chantier, sa phase et ses seules lignes chiffrées", () => {
  const c = lireCarte(
    "docs/f/all/SPEC_ALL_SOC-9-demo.map.md",
    carte("demo", [
      ["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "200 k", "3,00"],
      ["fille", "SPEC_ALL_SOC-9.02", "s2", "sonnet", "—", "à relever"],
      ["conducteur", "—", "s3", "opus", "300 k", "10,50"],
    ]),
  );
  assert.equal(c.chantier, "demo");
  assert.equal(c.phase, "4-vague-2");
  assert.deepEqual(
    c.lignes.map((l) => [l.role, l.session, l.cout]),
    [
      ["fille", "s1", 3],
      ["conducteur", "s3", 10.5],
    ],
  );
});

test("une carte à plusieurs sujets rend tous ses sujets, dans l'ordre, jamais le premier mot avec sa virgule", () => {
  const ligne = [["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "200 k", "3,00"]];
  const c = lireCarte("docs/f/all/SPEC_ALL_SOC-9-demo.map.md", carte("a, sujet/b, sujet/c", ligne));
  assert.equal(c.chantier, "a, b, c");
  assert.match(plat(enMarkdown([c])), /\| a, b, c \| 4-vague-2 \| 1 \| 1 \|/);
  const mal = lireCarte("docs/f/all/SPEC_ALL_SOC-9-demo.map.md", carte("a sujet/b", ligne));
  assert.equal(mal.chantier, "SPEC_ALL_SOC-9-demo", "une ligne mal formée donne le nom du fichier, pas un demi-nom");
});

test("le bilan compte les tickets distincts des filles et leur coût moyen, hors conducteur", () => {
  const c = lireCarte(
    "docs/f/all/SPEC_ALL_SOC-9-demo.map.md",
    carte("demo", [
      ["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "", "3,00"],
      ["fille", "SPEC_ALL_SOC-9.01", "s1b", "sonnet", "", "1,00"],
      ["fille", "SPEC_ALL_SOC-9.02", "s2", "opus", "", "6,00"],
      ["conducteur", "—", "s3", "opus", "", "10,00"],
    ]),
  );
  assert.deepEqual(bilan(c), { total: 20, filles: 10, tickets: 2, parTicket: 5 });
});

test("une session de relecture compte dans le total et les sessions, pas dans les filles ni dans les tickets", () => {
  const c = lireCarte(
    "docs/f/all/SPEC_ALL_SOC-9-demo.map.md",
    carte("demo", [
      ["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "200 k", "3,00"],
      ["relecture", "SPEC_ALL_SOC-9.01", "s2", "sonnet", "90 k", "1,50"],
      ["relecture", "SPEC_ALL_SOC-9.02", "s3", "sonnet", "80 k", "0,50"],
    ]),
  );
  assert.deepEqual(bilan(c), { total: 5, filles: 3, tickets: 1, parTicket: 3 });
  const md = plat(enMarkdown([c]));
  assert.match(md, /\*\*Total : 5,00 \$\*\* sur 3 session\(s\) et 1 chantier\(s\)\. Filles : 3,00 \$ pour 1 ticket\(s\), soit 3,00 \$ par ticket\./);
  assert.match(md, /\| demo \| relecture \| SPEC_ALL_SOC-9\.01 \| s2 \| sonnet \| 90 k \| 1,50 \|/);
});

test("une carte sans section Coût ni Sujet garde le nom de son fichier et n'apparaît pas au registre", () => {
  const vide = lireCarte("docs/f/all/SPEC_ALL_SOC-8-vide.map.md", "# Carte\n\nPhase: 1-grilling\n");
  assert.equal(vide.chantier, "SPEC_ALL_SOC-8-vide");
  assert.deepEqual(vide.lignes, []);
  const md = enMarkdown([vide]);
  assert.match(md, /\*\*Total : 0,00 \$\*\* sur 0 session\(s\) et 0 chantier\(s\)\./);
  assert.doesNotMatch(md, /SPEC_ALL_SOC-8-vide/);
});

test("le registre totalise tous les chantiers, triés par chemin, avec une ligne par session", () => {
  const b = lireCarte(
    "docs/b/B.map.md",
    carte("beta", [["fille", "SPEC_ALL_SOC-7.01", "sb", "sonnet", "1 k", "2,00"]]),
  );
  const a = lireCarte(
    "docs/a/A.map.md",
    carte(
      "alpha",
      [
        ["fille", "SPEC_ALL_SOC-6.01", "sa", "sonnet", "1 k", "4,00"],
        ["capitaine", "—", "sc", "sonnet", "1 k", "0,50"],
      ],
      "fini",
    ),
  );
  const md = plat(enMarkdown([b, a]));
  assert.match(
    md,
    /\*\*Total : 6,50 \$\*\* sur 3 session\(s\) et 2 chantier\(s\)\. Filles : 6,00 \$ pour 2 ticket\(s\), soit 3,00 \$ par ticket\./,
  );
  assert.ok(md.indexOf("| alpha | fini |") < md.indexOf("| beta | 4-vague-2 |"));
  assert.match(
    md,
    /\| alpha \| fini \| 2 \| 1 \| 4,00 \| 4,50 \| 4,00 \| `docs\/a\/A\.map\.md` \|/,
  );
  assert.match(md, /\| beta \| fille \| SPEC_ALL_SOC-7\.01 \| sb \| sonnet \| 1 k \| 2,00 \|/);
  assert.equal(enMarkdown([a, b]), enMarkdown([b, a]));
});

test("une table est alignée comme Prettier : colonnes à la largeur de la plus longue cellule, au moins 3", () => {
  assert.deepEqual(
    table(
      ["A", "Coût $"],
      [
        ["fille", "4,08"],
        ["—", "68,92"],
      ],
    ),
    ["| A     | Coût $ |", "| ----- | ------ |", "| fille | 4,08   |", "| —     | 68,92  |"],
  );
});

const ligneIllisible =
  "| fille | SPEC_ALL_XYZ-1.01 | s1 | sonnet | 1 k | 4,08 $ |\n| fille | SPEC_ALL_XYZ-1.02 | s2 | sonnet | 1 k | à relever |\n";
const enTete = "## Coût\n\n| R | T | S | M | C | Coût $ |\n| - | - | - | - | - | - |\n";

test("une Phase vide ne lit pas la ligne suivante, et un coût mal écrit est rendu sans être compté", () => {
  const c = lireCarte("docs/f/all/X.map.md", `Phase:\nAutre: y\n\n${enTete}${ligneIllisible}`);
  assert.equal(c.phase, "—");
  assert.deepEqual(c.lignes, []);
  assert.equal(c.illisibles.length, 1);
  assert.equal(c.illisibles[0].cout, "4,08 $");
  assert.deepEqual(messagesIllisibles([c]), [
    `couts : docs/f/all/X.map.md — coût illisible « 4,08 $ », ligne ignorée : ${c.illisibles[0].ligne}`,
  ]);
});

test("un en-tête Coût suivi de milliers de blancs se lit en temps linéaire", () => {
  const duree = (n) => {
    const debut = performance.now();
    const c = lireCarte("docs/c.md", `Sujet: sujet/x\n\n## Coût${" ".repeat(n)}x\n`);
    assert.deepEqual(c.lignes, []);
    return performance.now() - debut;
  };
  duree(1_000); // échauffement
  const court = Math.max(duree(20_000), 1);
  const long = duree(200_000);
  // dix fois plus long : un temps linéaire reste proche de dix, un temps quadratique approche cent
  assert.ok(long / court < 40, `${long} ms contre ${court} ms`);
});

/** Joue `couts.mjs` sur un dépôt jouet qui porte une carte ; renvoie son code de sortie et ses sorties. */
function jouer(lignes) {
  const { travail, bin } = depotJouet({
    fichiers: { "docs/agents/README.md": "agents\n", "docs/f/all/X.map.md": `Sujet: sujet/x\n\n${enTete}${lignes}` },
  });
  const lance = (...a) => {
    const r = spawnSync(process.execPath, [script("docs/couts.mjs"), ...a], {
      cwd: travail,
      env: { ...ENV, PATH: bin },
      encoding: "utf8",
    });
    return { code: r.status, out: r.stdout, err: r.stderr };
  };
  return { lance };
}

test("un coût illisible fait échouer la vérification, que le registre soit à jour ou non", () => {
  const { lance } = jouer(ligneIllisible);
  const avant = lance("--verify");
  assert.equal(avant.code, 1);
  assert.match(avant.err, /docs\/f\/all\/X\.map\.md — coût illisible « 4,08 \$ »/);
  // sans --verify : le registre s'écrit, le message reste sur stderr, la sortie est 0
  const ecrit = lance();
  assert.equal(ecrit.code, 0);
  assert.match(ecrit.err, /coût illisible « 4,08 \$ »/);
  // le registre est maintenant à jour, et la vérification échoue quand même
  const apres = lance("--verify");
  assert.equal(apres.code, 1);
  assert.match(apres.err, /X\.map\.md — coût illisible/);
  assert.doesNotMatch(apres.out, /à jour/);
});

test("un relevé à venir, un tiret, un gabarit ou une cellule vide ne font pas échouer la vérification", () => {
  const { lance } = jouer(
    "| fille | SPEC_ALL_XYZ-1.01 | s1 | sonnet | 1 k | 3,00 |\n| fille | SPEC_ALL_XYZ-1.02 | s2 | sonnet | — | à relever |\n" +
      "| fille | SPEC_ALL_XYZ-1.03 | s3 | sonnet | — | — |\n| fille | SPEC_ALL_XYZ-1.04 | s4 | sonnet | — | {{coût}} |\n" +
      "| fille | SPEC_ALL_XYZ-1.05 | s5 | sonnet | — |  |\n",
  );
  assert.equal(lance().code, 0);
  const r = lance("--verify");
  assert.equal(r.code, 0);
  assert.equal(r.err, "");
  assert.match(r.out, /à jour/);
});
