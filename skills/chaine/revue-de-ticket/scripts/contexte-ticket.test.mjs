import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

// Le script importe identifiants.mjs depuis ../docs/ : le banc le joue depuis une copie posée
// comme dans un projet (scripts/chaine/ et scripts/docs/ côte à côte).
const ICI = dirname(new URL(import.meta.url).pathname);
const IDENTIFIANTS = [
  join(ICI, "../docs/identifiants.mjs"),
  join(ICI, "../../tickets/references/scripts/docs/identifiants.mjs"),
].find(existsSync);

function depot(fichiers) {
  const racine = mkdtempSync(join(tmpdir(), "contexte-ticket-"));
  mkdirSync(join(racine, "scripts/chaine"), { recursive: true });
  mkdirSync(join(racine, "scripts/docs"), { recursive: true });
  writeFileSync(
    join(racine, "scripts/chaine/contexte-ticket.mjs"),
    readFileSync(join(ICI, "contexte-ticket.mjs")),
  );
  writeFileSync(
    join(racine, "scripts/docs/identifiants.mjs"),
    readFileSync(IDENTIFIANTS),
  );
  for (const [chemin, texte] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(racine, chemin)), { recursive: true });
    writeFileSync(join(racine, chemin), texte);
  }
  return racine;
}
const lancer = (racine, ...args) =>
  spawnSync(
    process.execPath,
    [join(racine, "scripts/chaine/contexte-ticket.mjs"), ...args],
    { env: { ...process.env, PROJET_RACINE: racine }, encoding: "utf8" },
  );
/** Le texte d'une section `### <id> …` de la sortie, jusqu'à la suivante. */
const section = (sortie, id) =>
  new RegExp(`### ${id.replace(/[.]/g, "\\.")}[ \\n][\\s\\S]*?(?=\\n###? |$)`).exec(
    sortie,
  )?.[0] ?? "";

const SPEC = "docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md";
const TICKET = "docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.03.issue.md";
const REGLE_LIC_3 = [
  "---",
  "id: RULE_ALL_LIC-3",
  "title: Une licence par saison et par adhérent",
  "validation:",
  "  status: validated",
  "  date: 2026-11-10",
  "  by: Marie Curie",
  "sources:",
  "  - { ref: réunion du 2026-11-09, path: docs/metier/reunions/2026-11-09.md, at: § 2 }",
  "---",
  "",
  "Un adhérent ne détient qu'une licence par saison.",
  "",
].join("\n");

test("une règle de la ligne Règles: est rendue depuis son fichier, en-tête YAML compris, avant les identifiants cités", () => {
  const r = lancer(
    depot({
      [SPEC]:
        "# SPEC_ALL_SOC-1\n\n| Ticket | Objet |\n| --- | --- |\n| SPEC_ALL_SOC-1.03 | la couche licence (ADR_ALL_ARC-2) |\n",
      [TICKET]:
        "# Couche licence\n\nStatus: ready-for-agent\nType: task\nRègles: RULE_ALL_LIC-3\n\n## Où\n\nSelon `ADR_ALL_ARC-2`.\n",
      "docs/metier/regles/all/RULE_ALL_LIC-3.md": REGLE_LIC_3,
      "docs/adr/ADR_ALL_ARC-2-transactions.md":
        "# ADR_ALL_ARC-2 — Transactions\n",
    }),
    "spec_all_soc-1.03",
  );
  assert.equal(r.status, 0, r.stderr);
  const o = r.stdout;
  assert.match(o, /^# Contexte du ticket SPEC_ALL_SOC-1\.03/);
  const rangs = [
    `## Ticket — ${TICKET}`,
    `## Spec — ${SPEC}`,
    "| SPEC_ALL_SOC-1.03 | la couche licence",
    "## Règles du ticket\n\nRègles: RULE_ALL_LIC-3",
    "### RULE_ALL_LIC-3 (règle du ticket)",
    "## Identifiants cités",
    "### ADR_ALL_ARC-2 (ADR)",
  ].map((m) => o.indexOf(m));
  assert.ok(rangs.every((i) => i >= 0), `un repère manque : ${rangs}\n${o}`);
  assert.deepEqual(rangs, [...rangs].sort((a, b) => a - b), o);
  const lic3 = section(o, "RULE_ALL_LIC-3");
  assert.match(lic3, /- trouvée : docs\/metier\/regles\/all\/RULE_ALL_LIC-3\.md/);
  assert.ok(lic3.includes(REGLE_LIC_3.trim()), "le fichier est rendu tel quel");
  assert.match(lic3, /by: Marie Curie/, "le nom de la personne reste");
  assert.equal(
    o.split("### RULE_ALL_LIC-3").length,
    2,
    "une règle de la ligne Règles: n'est pas répétée parmi les cités",
  );
  assert.match(
    section(o, "ADR_ALL_ARC-2"),
    /- trouvé : docs\/adr\/ADR_ALL_ARC-2-transactions\.md — ADR_ALL_ARC-2 — Transactions/,
  );
});

test("aucune ancienne forme n'est lue : un rules.json et une ligne de tableau ne rendent pas la règle", () => {
  const r = lancer(
    depot({
      [TICKET]:
        "# Couche\n\nStatus: ready-for-agent\nType: task\nRègles: RULE_FFSA_LIC-7, RULE_ALL_FAC-3\n\nVoir RULE_ALL_FAC-4.\n",
      "federations/ffsa/rules.json": JSON.stringify({
        rules: [{ id: "RULE_FFSA_LIC-7", texte: "une licence par saison" }],
      }),
      "docs/metier/regles/FAC-regles.md":
        "| ID | Règle |\n| --- | --- |\n| RULE_ALL_FAC-3 | part du tiers payeur | candidate |\n| RULE_ALL_FAC-4 | plafond | candidate |\n",
    }),
    "SPEC_ALL_SOC-1.03",
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(
    section(r.stdout, "RULE_FFSA_LIC-7"),
    /- introuvable : docs\/metier\/regles\/ffsa\/RULE_FFSA_LIC-7\.md/,
  );
  assert.match(
    section(r.stdout, "RULE_ALL_FAC-3"),
    /- introuvable : docs\/metier\/regles\/all\/RULE_ALL_FAC-3\.md/,
  );
  assert.match(
    section(r.stdout, "RULE_ALL_FAC-4"),
    /### RULE_ALL_FAC-4 \(règle citée\)\n- introuvable : docs\/metier\/regles\/all\/RULE_ALL_FAC-4\.md/,
  );
  assert.doesNotMatch(r.stdout, /rules\.json|une licence par saison|tiers payeur|FAC-regles/);
});

test("une ADR, une spec, une demande et un identifiant absent : trouvés ou introuvables, avec le chemin cherché", () => {
  const r = lancer(
    depot({
      [TICKET]:
        "# Couche\n\nStatus: ready-for-agent\nType: task\n\nSelon ADR_ALL_ARC-2, suite de SPEC_ALL_PAY-2, née de REQ_ALL_LIC-7, maquette DSG_ALL_UI-1, guide DOC_ALL_GUI-1.\n",
      "docs/adr/ADR_ALL_ARC-2-transactions.md": "# ADR_ALL_ARC-2 — Transactions\n",
      "docs/adr/ADR_ALL_ARC-20-autre.md": "# ADR_ALL_ARC-20 — Autre\n",
      "docs/features/paiement/all/SPEC_ALL_PAY-2-paiement.spec.md":
        "# SPEC_ALL_PAY-2 — Paiement\n",
      "docs/demandes/all/REQ_ALL_LIC-7-licence-famille.md":
        "# REQ_ALL_LIC-7 — Licence famille\n",
    }),
    "SPEC_ALL_SOC-1.03",
  );
  assert.equal(r.status, 0, r.stderr);
  const o = r.stdout;
  assert.match(o, /## Règles du ticket\n\n\(le ticket n'a pas de ligne `Règles:`\)/);
  assert.match(
    section(o, "ADR_ALL_ARC-2"),
    /- trouvé : docs\/adr\/ADR_ALL_ARC-2-transactions\.md — ADR_ALL_ARC-2 — Transactions\n*$/,
    "ADR_ALL_ARC-20 n'est pas un candidat de ADR_ALL_ARC-2",
  );
  assert.match(
    section(o, "SPEC_ALL_PAY-2"),
    /### SPEC_ALL_PAY-2 \(spec\)\n- trouvé : docs\/features\/paiement\/all\/SPEC_ALL_PAY-2-paiement\.spec\.md — SPEC_ALL_PAY-2 — Paiement/,
  );
  assert.match(
    section(o, "REQ_ALL_LIC-7"),
    /### REQ_ALL_LIC-7 \(demande\)\n- trouvé : docs\/demandes\/all\/REQ_ALL_LIC-7-licence-famille\.md/,
  );
  assert.match(
    section(o, "DSG_ALL_UI-1"),
    /### DSG_ALL_UI-1 \(design\)\n- introuvable : docs\/\*\*\/DSG_ALL_UI-1-\*/,
  );
  assert.match(
    section(o, "DOC_ALL_GUI-1"),
    /### DOC_ALL_GUI-1 \(guide\)\n- introuvable : docs\/\*\*\/DOC_ALL_GUI-1-\*/,
  );
});

test("deux fichiers pour une même ADR : les deux candidats sont listés, aucun n'est choisi", () => {
  const r = lancer(
    depot({
      [TICKET]: "# Couche\n\nStatus: ready-for-agent\nType: task\n\nSelon ADR_ALL_ARC-2.\n",
      "docs/adr/ADR_ALL_ARC-2-transactions.md": "# ADR_ALL_ARC-2 — Transactions\n",
      "docs/archive/ADR_ALL_ARC-2-ancienne.md": "# ADR_ALL_ARC-2 — Ancienne\n",
    }),
    "SPEC_ALL_SOC-1.03",
  );
  assert.equal(r.status, 0, r.stderr);
  const s = section(r.stdout, "ADR_ALL_ARC-2");
  assert.match(s, /- 2 candidats pour docs\/\*\*\/ADR_ALL_ARC-2-\*, aucun n'est choisi :/);
  assert.match(s, /\n {2}- docs\/adr\/ADR_ALL_ARC-2-transactions\.md — ADR_ALL_ARC-2 — Transactions/);
  assert.match(s, /\n {2}- docs\/archive\/ADR_ALL_ARC-2-ancienne\.md — ADR_ALL_ARC-2 — Ancienne/);
  assert.doesNotMatch(s, /- trouvé/);
});

test("une règle d'un autre contexte que celui du ticket et ALL est rendue et signalée ; les zéros de tête sont gardés", () => {
  const racine = depot({
    [TICKET]:
      "# Couche\n\nStatus: ready-for-agent\nType: task\nRègles: RULE_FNSMR_LIC-05, RULE_ALL_LIC-3\n",
    "docs/features/lic/fnsmr/issues/SPEC_FNSMR_LIC-2-licence.01.issue.md":
      "# Licence\n\nStatus: ready-for-agent\nType: task\nRègles: RULE_FNSMR_LIC-05, RULE_ALL_LIC-3\n",
    "docs/metier/regles/fnsmr/RULE_FNSMR_LIC-05.md":
      "---\nid: RULE_FNSMR_LIC-05\ntitle: Licence FNSMR\n---\n\nÉnoncé FNSMR.\n\n````\nexemple\n````\n",
    "docs/metier/regles/all/RULE_ALL_LIC-3.md": REGLE_LIC_3,
  });
  const all = lancer(racine, "SPEC_ALL_SOC-1.03");
  assert.equal(all.status, 0, all.stderr);
  const lic05 = section(all.stdout, "RULE_FNSMR_LIC-05");
  assert.match(lic05, /- contexte différent du ticket : FNSMR, le ticket est ALL/);
  assert.match(lic05, /- trouvée : docs\/metier\/regles\/fnsmr\/RULE_FNSMR_LIC-05\.md/);
  assert.match(
    lic05,
    /\n`````markdown\n---\nid: RULE_FNSMR_LIC-05[\s\S]*\n````\nexemple\n````\n`````\n/,
    "la clôture dépasse les accents graves du fichier : il est rendu entier",
  );
  assert.doesNotMatch(section(all.stdout, "RULE_ALL_LIC-3"), /contexte différent/);

  const fnsmr = lancer(racine, "SPEC_FNSMR_LIC-2.01");
  assert.equal(fnsmr.status, 0, fnsmr.stderr);
  assert.doesNotMatch(fnsmr.stdout, /contexte différent/, "ALL et le contexte du ticket passent");
});

test("la ligne Règles: qui porte autre chose qu'une règle : chaque jeton est signalé", () => {
  const r = lancer(
    depot({
      [TICKET]:
        "# Couche\n\nStatus: ready-for-agent\nType: task\nRègles: LIC-3, ADR_ALL_ARC-2, RULE_ALL_LIC-3\n",
      "docs/metier/regles/all/RULE_ALL_LIC-3.md": REGLE_LIC_3,
    }),
    "SPEC_ALL_SOC-1.03",
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /### LIC-3\n- illisible : la ligne `Règles:` porte un jeton qui n'est pas un identifiant/);
  assert.match(r.stdout, /### ADR_ALL_ARC-2\n- pas une règle/);
  assert.match(section(r.stdout, "RULE_ALL_LIC-3"), /- trouvée/);
});

test("un ticket cité est lu comme un ticket, pas comme sa spec ; un ticket inconnu sort en 2", () => {
  const racine = depot({
    [TICKET]:
      "# Couche base\n\nStatus: ready-for-agent\nType: task\n\nS'appuie sur SPEC_ALL_SOC-1.06 et SPEC_ALL_SOC-1.04.\n",
    "docs/features/socle/all/issues/archive/SPEC_ALL_SOC-1-socle.06.issue.md":
      "# SPEC_ALL_SOC-1.06 — Tableau\n\nStatus: resolved\n",
  });
  const r = lancer(racine, "SPEC_ALL_SOC-1.03");
  assert.equal(r.status, 0, r.stderr);
  assert.match(
    r.stdout,
    /### SPEC_ALL_SOC-1\.06 \(ticket\)\n- trouvé \(archivé\) : docs\/features\/socle\/all\/issues\/archive\/SPEC_ALL_SOC-1-socle\.06\.issue\.md — SPEC_ALL_SOC-1\.06 — Tableau/,
  );
  assert.match(
    r.stdout,
    /### SPEC_ALL_SOC-1\.04 \(ticket\)\n- introuvable : docs\/\*\*\/issues\/SPEC_ALL_SOC-1-<slug>\.04\.issue\.md/,
  );
  assert.doesNotMatch(r.stdout, /### SPEC_ALL_SOC-1[\n ]/, "le ticket n'est pas sa spec");
  assert.equal(lancer(racine, "SPEC_ALL_SOC-1.02").status, 2);
  assert.equal(lancer(racine, "SOC-1.03").status, 2, "l'ancienne forme n'est pas lue");
  assert.equal(lancer(racine).status, 2);
});
