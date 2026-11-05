import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

// Le script importe identifiants.mjs depuis ../docs/ : le banc le joue depuis une copie posée
// comme dans un projet (scripts/chaine/ et scripts/docs/ côte à côte).
import { existsSync, readFileSync } from "node:fs";
const ICI = dirname(new URL(import.meta.url).pathname);
const IDENTIFIANTS = [join(ICI, "../docs/identifiants.mjs"), join(ICI, "../../tickets/references/scripts/docs/identifiants.mjs")].find(existsSync);

function depot(fichiers) {
  const racine = mkdtempSync(join(tmpdir(), "contexte-ticket-"));
  mkdirSync(join(racine, "scripts/chaine"), { recursive: true });
  mkdirSync(join(racine, "scripts/docs"), { recursive: true });
  writeFileSync(join(racine, "scripts/chaine/contexte-ticket.mjs"), readFileSync(join(ICI, "contexte-ticket.mjs")));
  writeFileSync(join(racine, "scripts/docs/identifiants.mjs"), readFileSync(IDENTIFIANTS));
  for (const [chemin, texte] of Object.entries(fichiers)) {
    mkdirSync(dirname(join(racine, chemin)), { recursive: true });
    writeFileSync(join(racine, chemin), texte);
  }
  return racine;
}
const lancer = (racine, ...args) =>
  spawnSync(process.execPath, [join(racine, "scripts/chaine/contexte-ticket.mjs"), ...args], { env: { ...process.env, PROJET_RACINE: racine }, encoding: "utf8" });

test("le contexte porte le ticket, la ligne de spec, les règles d'un registre markdown ou d'un rules.json, et les ADR", () => {
  const r = lancer(
    depot({
      "docs/features/socle/SOC-1-socle.spec.md": "# SOC-1\n\n| Ticket | Objet |\n| --- | --- |\n| SOC-1.03 | la couche base (FAC-3, ARC-2) |\n",
      "docs/features/socle/issues/SOC-1-socle.03.issue.md": "# Couche base\n\nStatus: ready-for-agent\n\nApplique `FAC-3` et `ALL-LIC-7`, selon `ARC-2`.\n",
      "docs/metier/regles/FAC-regles.md": "| ID | Règle |\n| --- | --- |\n| FAC-3 | part du tiers payeur = heures × tarif × taux | candidate |\n",
      "federations/ffsa/rules.json": JSON.stringify({ rules: [{ id: "ALL-LIC-7", texte: "une licence par saison" }] }),
      "docs/adr/ARC-2-transactions-et-isolation.md": "# ARC-2 — Transactions et isolation\n",
    }),
    "soc-1.03",
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^# Contexte du ticket SOC-1\.03/);
  assert.match(r.stdout, /## Ticket — docs\/features\/socle\/issues\/SOC-1-socle\.03\.issue\.md/);
  assert.match(r.stdout, /\| SOC-1\.03 \| la couche base/);
  assert.match(r.stdout, /### FAC-3 \(règle\)\n- docs\/metier\/regles\/FAC-regles\.md :\n {2}\| FAC-3 \| part du tiers payeur/);
  assert.match(r.stdout, /### ALL-LIC-7 \(règle\)\n- federations\/ffsa\/rules\.json :\n {2}\{"id":"ALL-LIC-7"/);
  assert.match(r.stdout, /### ARC-2 \(ADR\)\n- docs\/adr\/ARC-2-transactions-et-isolation\.md : ARC-2 — Transactions et isolation/);
});

test("un identifiant cité que le dépôt ne porte pas est dit introuvable ; un ticket inconnu sort en 2", () => {
  const racine = depot({ "docs/features/x/issues/X-1-x.01.issue.md": "# x\n\nStatus: needs-triage\n\nVoir `ZZZ-9`.\n" });
  const r = lancer(racine, "X-1.01");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /### ZZZ-9\n- introuvable/);
  assert.equal(lancer(racine, "X-1.02").status, 2);
  assert.equal(lancer(racine).status, 2);
});
