// Veille du capitaine (veille.sh) : boucle.sh et file.sh sont des doublures dans un dossier
// d'outils jouet, où veille.sh est copié (il les cherche à côté de lui). Aucun réseau, aucun gh.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VEILLE = new URL("./veille.sh", import.meta.url).pathname;

// `etats` : la table de file.sh renvoyée à la sonde n (0 = lecture initiale), la dernière se répète.
function veilleJouet(etats, { rcBoucle = 0, args = ["--pause", "0.2", "--duree", "0.04"] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "veille-"));
  copyFileSync(VEILLE, join(dir, "veille.sh"));
  writeFileSync(
    join(dir, "boucle.sh"),
    `#!/usr/bin/env bash\necho boucle >> "${dir}/lancements"\nexit ${rcBoucle}\n`,
  );
  writeFileSync(
    join(dir, "file.sh"),
    `#!/usr/bin/env bash
n=$(cat "${dir}/compte" 2>/dev/null || echo 0)
echo $((n+1)) > "${dir}/compte"
f="${dir}/etat.$n"; [ -f "$f" ] || f="${dir}/etat.last"
cat "$f"
`,
  );
  chmodSync(join(dir, "boucle.sh"), 0o755);
  chmodSync(join(dir, "file.sh"), 0o755);
  etats.forEach((e, i) => {
    writeFileSync(join(dir, i === etats.length - 1 ? "etat.last" : `etat.${i}`), e);
  });
  const r = spawnSync("bash", [join(dir, "veille.sh"), ...args], { encoding: "utf8" });
  const journal = join(dir, "lancements");
  const lancements = existsSync(journal)
    ? readFileSync(journal, "utf8").trim().split("\n").length
    : 0;
  return { ...r, lancements };
}

const prete = (n) => `${n}\tprête\t\n`;

test("file vide, puis une PR prête : boucle.sh relancée une fois (lancement initial compris)", () => {
  const r = veilleJouet(["", "", prete(31)]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 2);
  assert.match(r.stdout, /file à traiter \(31 prête\), boucle relancée/);
  assert.match(r.stdout, /file vide/);
});

test("PR seulement « CI en cours » : pas de relance", () => {
  const r = veilleJouet([`31\tCI en cours\t\n32\tattend #31\t\n33\tbloquée\t\n`]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 1);
});

test("même PR sautée deux sondes de suite : une seule relance ; rouge puis prête : nouvelle relance", () => {
  const r = veilleJouet(["", prete(31), prete(31), prete(31)]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 2);
  const r2 = veilleJouet(["", `31\tCI rouge : qualite\t\n`, prete(31)]);
  assert.equal(r2.lancements, 3);
});

test("durée écoulée : VEILLE FINIE, sortie 0", () => {
  const r = veilleJouet([""]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^VEILLE FINIE \d\d:\d\d$/m);
});

test("boucle.sh sort en 3 : VEILLE ARRÊTÉE, sortie 3", () => {
  const r = veilleJouet([""], { rcBoucle: 3 });
  assert.equal(r.status, 3);
  assert.match(r.stdout, /^VEILLE ARRÊTÉE \d\d:\d\d/m);
  assert.doesNotMatch(r.stdout, /VEILLE FINIE/);
  assert.equal(r.lancements, 1);
});

test("journal « file vide » : au plus une ligne par tranche de 10 min", () => {
  const r = veilleJouet([""]);
  assert.equal(r.stdout.match(/file vide/g)?.length, 1);
});

test("PR mise de côté sans CI : relancée quand sa CI arrive (prête ou rouge), pas avant", () => {
  const sansCi = "31\tprête (sans CI)\t\n";
  const r = veilleJouet(["", sansCi, sansCi, prete(31)]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 3);
  const r2 = veilleJouet(["", sansCi, `31\tCI en cours\t\n`, `31\tCI rouge : qualite\t\n`]);
  assert.equal(r2.lancements, 3);
});
