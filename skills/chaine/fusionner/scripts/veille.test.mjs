// Veille du capitaine (veille.sh) : boucle.sh et file.sh sont des doublures dans un dossier
// d'outils jouet, où veille.sh est copié (il les cherche à côté de lui). Aucun réseau, aucun gh :
// le seul `origin` est un dépôt nu du jouet, que la veille lit pour `preparerCapitaine`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VEILLE = new URL("./veille.sh", import.meta.url).pathname;

// Variables de git et de la chaîne héritées retirées : sous un hook, GIT_DIR viserait le vrai dépôt,
// et un BOUCLE_* du capitaine fausserait la doublure.
const ENV = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(([cle]) => !cle.startsWith("GIT_") && !cle.startsWith("BOUCLE_") && !cle.startsWith("VEILLE_")),
  ),
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.org",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.org",
};

// Jouet de la veille : un dossier d'outils (veille.sh copiée, doublures de boucle.sh et file.sh), un
// dépôt nu `origine.git` dont le develop porte, si `contrat` est donné, `.claude/chaine.json`, et son
// clone `clone/`, le worktree du capitaine, passé en `cwd` : la veille n'écrit jamais dans le dépôt du
// plugin. Les traces (lancements, `trace`, échéance notée) vivent hors du clone, qui reste propre.
// `etats` : la table de file.sh renvoyée à la sonde n (0 = lecture initiale), la dernière se répète.
// `apresLancement` : du shell joué par la doublure de boucle.sh, `$k` valant le rang du lancement.
function creerJouet(etats, { rcBoucle = 0, sorties = [], contrat, apresLancement = "", boot = "boot-1" } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "veille-"));
  const clone = join(dir, "clone");
  const origine = join(dir, "origine.git");
  const trace = join(dir, "trace");
  const fichierBoot = join(dir, "boot_id");
  if (boot !== null) writeFileSync(fichierBoot, `${boot}\n`);
  copyFileSync(VEILLE, join(dir, "veille.sh"));
  writeFileSync(
    join(dir, "boucle.sh"),
    `#!/usr/bin/env bash
echo boucle >> "${dir}/lancements"
echo boucle >> "${trace}"
echo "\${BOUCLE_ECHEANCE-absente}" > "${dir}/echeance"
k=$(cat "${dir}/k" 2>/dev/null || echo 0)
echo $((k+1)) > "${dir}/k"
${apresLancement}
[ ! -f "${dir}/sortie.$k" ] || cat "${dir}/sortie.$k"
exit ${rcBoucle}
`,
  );
  sorties.forEach((o, i) => writeFileSync(join(dir, `sortie.${i}`), o));
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
  const git = (...a) => execFileSync("git", a, { cwd: clone, env: ENV, encoding: "utf8" }).trim();
  execFileSync("git", ["init", "-q", "--bare", "-b", "develop", origine], { env: ENV });
  execFileSync("git", ["clone", "-q", origine, clone], { env: ENV, stdio: "ignore" });
  writeFileSync(join(clone, "README.md"), "jouet\n");
  if (contrat !== undefined) {
    mkdirSync(join(clone, ".claude"));
    writeFileSync(join(clone, ".claude/chaine.json"), typeof contrat === "string" ? contrat : JSON.stringify(contrat));
  }
  git("add", "-A");
  git("commit", "-q", "-m", "initial");
  git("push", "-q", "origin", "HEAD:develop");
  const lancer = (args, env = {}) => {
    const r = spawnSync("bash", [join(dir, "veille.sh"), ...args], {
      cwd: clone,
      env: { ...ENV, VEILLE_BOOT_ID: fichierBoot, ...env },
      encoding: "utf8",
    });
    const lire = (f) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), "utf8").trim() : "");
    const lancements = lire("lancements") ? lire("lancements").split("\n").length : 0;
    const compte = Number(lire("compte") || 0);
    const lignes = lire("trace") ? lire("trace").split("\n") : [];
    return { ...r, lancements, compte, trace: lignes, echeance: lire("echeance") };
  };
  const garde = join(clone, ".git", "capitaine-boot-id");
  return { dir, clone, trace, fichierBoot, garde, git, lancer };
}

// Chaque test borne la veille par `sondes` (le nombre d'états qu'il veut voir consommer, lecture
// initiale exclue) : la durée (1 min) n'est qu'un garde-fou, aucun test ne dépend de l'horloge.
function veilleJouet(
  etats,
  { sondes = etats.length - 1, args = ["--pause", "0.2", "--duree", "1", "--sondes", String(sondes)], env, ...jouet } = {},
) {
  return creerJouet(etats, jouet).lancer(args, env);
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
  const r = veilleJouet([`31\tCI en cours\t\n32\tattend #31\t\n33\tbloquée\t\n`], { sondes: 2 });
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
  // Seul test qui compte sur l'horloge : pas de --sondes, une durée courte, aucun nombre de sondes attendu.
  const r = veilleJouet([""], { args: ["--pause", "0.2", "--duree", "0.04"] });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^VEILLE FINIE \d\d:\d\d$/m);
});

test("boucle.sh sort en 3 : VEILLE ARRÊTÉE, sortie 3", () => {
  const r = veilleJouet([""], { rcBoucle: 3, sondes: 1 });
  assert.equal(r.status, 3);
  assert.match(r.stdout, /^VEILLE ARRÊTÉE \d\d:\d\d/m);
  assert.doesNotMatch(r.stdout, /VEILLE FINIE/);
  assert.equal(r.lancements, 1);
});

test("journal « file vide » : au plus une ligne par tranche de 10 min", () => {
  const r = veilleJouet([""], { sondes: 3 });
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

test("--sondes 2 : la veille s'arrête après deux sondes (lecture initiale + 2 = 3 appels de file.sh)", () => {
  const r = veilleJouet([""], { sondes: 2 });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^VEILLE FINIE \d\d:\d\d$/m);
  assert.equal(r.compte, 3);
  assert.equal(r.lancements, 1);
});

test("PR renvoyée par la boucle puis ré-étiquetée avant la sonde : boucle relancée", () => {
  const r = veilleJouet([prete(130), prete(130), prete(130)], {
    sorties: ["[#130] RENVOI : sans section « Revue de ticket »\n"],
    sondes: 2,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 2);
});

test("PR renvoyée par une boucle relancée, puis ré-étiquetée : boucle relancée de nouveau", () => {
  const r = veilleJouet(["", prete(131), prete(131), prete(131)], {
    sorties: ["", "[#131] RENVOI : titre trop long\n"],
    sondes: 3,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 3);
});

test("jobs rouges relancés par la boucle, de nouveau rouges à la sonde : boucle relancée", () => {
  const rouge = "31\tCI rouge : qualite\t\n";
  const r = veilleJouet([rouge, rouge, rouge], {
    sorties: ["[#31] RELANCE des jobs rouges (qualite)\n"],
    sondes: 2,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 2);
});

test("PR sautée par la boucle, renvoi d'une autre : pas de relance en rond", () => {
  const r = veilleJouet([prete(32), prete(32), prete(32)], {
    sorties: ["[#32] DÉBUT 11:53\n[#32] sortie=7 11:53\n[#40] RENVOI : conflit\n"],
    sondes: 2,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 1);
});

test("les lignes que la veille lit sont celles qu'écrivent renvoyer.sh et boucle.sh", () => {
  const lire = (f) => readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
  assert.ok(lire("renvoyer.sh").includes('echo "[#$N] RENVOI : '));
  assert.ok(lire("boucle.sh").includes('echo "[#$n] RELANCE des jobs rouges'));
});

test("PR qui attend un propriétaire : pas de relance ; approuvée (prête), boucle relancée", () => {
  const attend = `31\tattend un propriétaire\t\n`;
  const r = veilleJouet([attend, attend], { sondes: 2 });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 1);
  const r2 = veilleJouet([attend, attend, prete(31)]);
  assert.equal(r2.lancements, 2);
});
