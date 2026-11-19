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

// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { environnementDeBanc } = await import(existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs");

const VEILLE = new URL("./veille.sh", import.meta.url).pathname;

// Variables de git et de la chaîne héritées retirées : sous un hook, GIT_DIR viserait le vrai dépôt,
// et un BOUCLE_* du capitaine fausserait la doublure.
const ENV = {
  ...Object.fromEntries(Object.entries(environnementDeBanc()).filter(([cle]) => !cle.startsWith("VEILLE_"))),
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.org",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.org",
  // Le verrou du passage exige l'id de la session du capitaine : la veille refuse de démarrer sans lui.
  CAPITAINE_ID: "capitaine-banc",
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
  // `avant` : une commande qui enveloppe la veille (`flock <verrou>` pour un verrou tenu pendant qu'elle tourne).
  const lancer = (args, env = {}, avant = []) => {
    const [cmd, ...pre] = [...avant, "bash"];
    const r = spawnSync(cmd, [...pre, join(dir, "veille.sh"), ...args], {
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
  // Publie un contrat sur le develop d'origine depuis le clone (il peut citer `trace`, connue ici seulement).
  const publier = (c) => {
    mkdirSync(join(clone, ".claude"), { recursive: true });
    writeFileSync(join(clone, ".claude/chaine.json"), JSON.stringify(c));
    git("add", "-A");
    git("commit", "-q", "-m", "chaine: contrat");
    git("push", "-q", "origin", "HEAD:develop");
  };
  const garde = join(clone, ".git", "capitaine-boot-id");
  return { dir, clone, trace, fichierBoot, garde, git, lancer, publier };
}

// Chaque test borne la veille par `sondes` (le nombre d'états qu'il veut voir consommer, lecture
// initiale exclue) : la durée (1 min) n'est qu'un garde-fou. Seuls dépendent de l'horloge, de quelques
// secondes, « durée écoulée » et les deux bancs de l'échéance (`VEILLE_LIMITE`).
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

// --- Préparation du capitaine (`preparerCapitaine`) et échéance (limite de 2 h d'une tâche de fond) ---

const contratPrep = (trace, mot = "prep") => ({ preparerCapitaine: `echo ${mot} >> "${trace}"` });
const ARGS = (sondes) => ["--pause", "0.2", "--duree", "1", "--sondes", String(sondes)];

test("préparation jouée avant le premier lancement, boot_id gardé ; veille relancée sur le même boot : pas rejouée", () => {
  const j = creerJouet([""]);
  j.publier(contratPrep(j.trace));
  const r = j.lancer(ARGS(1));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(r.trace, ["prep", "boucle"]);
  assert.match(r.stdout, /^VEILLE \d\d:\d\d : préparation \(« echo prep/m);
  assert.match(r.stdout, /^VEILLE \d\d:\d\d : préparation réussie$/m);
  assert.equal(readFileSync(j.garde, "utf8").trim(), "boot-1");
  const r2 = j.lancer(ARGS(1));
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.deepEqual(r2.trace, ["prep", "boucle", "boucle"]);
  assert.doesNotMatch(r2.stdout, /préparation/);
});

test("boot_id changé entre deux lancements de la boucle : préparation rejouée avant le lancement suivant", () => {
  const j = creerJouet(["", prete(31)]);
  j.publier(contratPrep(j.trace));
  // Au premier lancement, la machine « redémarre » : le boot_id change.
  writeFileSync(
    join(j.dir, "boucle.sh"),
    readFileSync(join(j.dir, "boucle.sh"), "utf8").replace(
      'echo $((k+1)) > ',
      `[ "$k" != 0 ] || echo boot-2 > "${j.fichierBoot}"\necho $((k+1)) > `,
    ),
  );
  const r = j.lancer(ARGS(1));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(r.trace, ["prep", "boucle", "prep", "boucle"]);
  assert.equal(readFileSync(j.garde, "utf8").trim(), "boot-2");
});

test("préparation en échec : VEILLE ARRÊTÉE, sortie 13, boucle jamais lancée, boot_id non écrit", () => {
  const r0 = creerJouet([""], { contrat: { preparerCapitaine: "echo base perdue; exit 7" } });
  const r = r0.lancer(ARGS(1));
  assert.equal(r.status, 13, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /^VEILLE ARRÊTÉE \d\d:\d\d : préparation du capitaine en échec \(sortie 7 de « echo base perdue; exit 7 »\) : aucune fusion/m,
  );
  assert.match(r.stdout, /^base perdue$/m, "la sortie de la commande est dans le journal");
  assert.equal(r.lancements, 0);
  assert.ok(!existsSync(r0.garde), "boot_id non écrit");
});

test("sans clé preparerCapitaine : rien n'est joué ; contrat illisible ou clé non textuelle : sortie 13 sans lancer la boucle", () => {
  for (const contrat of [undefined, {}, { preparerCapitaine: "" }]) {
    const r = veilleJouet([""], { contrat, sondes: 1 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.lancements, 1);
    assert.doesNotMatch(r.stdout, /préparation/);
  }
  for (const contrat of ["{ pas du json", "[1]", { preparerCapitaine: 3 }, { preparerCapitaine: null }]) {
    const r = veilleJouet([""], { contrat, sondes: 1 });
    assert.equal(r.status, 13, `${JSON.stringify(contrat)} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /^VEILLE ARRÊTÉE \d\d:\d\d : contrat illisible : préparation inconnue/m);
    assert.equal(r.lancements, 0);
  }
});

test("boot_id illisible : préparation jouée au démarrage, une ligne le dit, pas de nouvelle préparation entre deux lancements", () => {
  const j = creerJouet(["", prete(31)], { boot: null });
  j.publier(contratPrep(j.trace));
  const r = j.lancer(ARGS(1));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(r.trace, ["prep", "boucle", "boucle"]);
  assert.equal(r.stdout.match(/boot_id illisible, préparation jouée à chaque démarrage de la veille/g)?.length, 1);
  // Une veille relancée rejoue la préparation : sans boot_id, rien ne dit que la machine n'a pas redémarré.
  const r2 = j.lancer(ARGS(0));
  assert.deepEqual(r2.trace, ["prep", "boucle", "boucle", "prep", "boucle"]);
});

test("défauts : durée 75 min, marge 40 min, et BOUCLE_ECHEANCE transmise à la boucle", () => {
  const avant = Math.floor(Date.now() / 1000);
  const r = veilleJouet([""], { args: ["--pause", "0.2", "--sondes", "0"] });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^VEILLE \d\d:\d\d : durée 75 min, aucun passage après \d\d:\d\d \(marge 40 min\)$/m);
  const echeance = Number(r.echeance);
  assert.ok(Number.isInteger(echeance), `échéance notée : ${r.echeance}`);
  assert.ok(Math.abs(echeance - (avant + 80 * 60)) <= 5, `échéance ${echeance}, attendue ${avant + 80 * 60}`);
});

test("--marge invalide (non entière, 120 ou plus) : sortie 64, un message qui nomme --marge ; --duree décimale acceptée", () => {
  for (const marge of ["1.5", "120", "200", "abc", "-1", ""]) {
    const r = veilleJouet([""], { args: ["--marge", marge, "--sondes", "0"] });
    assert.equal(r.status, 64, `--marge ${marge} : ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /--marge/);
    assert.equal(r.lancements, 0);
  }
  for (const duree of ["0", "abc", "-2"]) {
    const r = veilleJouet([""], { args: ["--duree", duree, "--sondes", "0"] });
    assert.equal(r.status, 64, `--duree ${duree} : ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /--duree/);
  }
  const ok = veilleJouet([""], { args: ["--pause", "0.2", "--duree", "0.04", "--marge", "119", "--sondes", "0"] });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /durée 0\.04 min, aucun passage après \d\d:\d\d \(marge 119 min\)/);
});

test("preparerCapitaine se lit sur origin/develop, jamais dans l'arbre de travail : la commande d'une branche de PR n'est pas jouée", () => {
  const j = creerJouet([""]);
  j.publier(contratPrep(j.trace));
  // Le worktree est laissé sur le code d'une PR, qui nomme sa propre commande.
  j.git("switch", "-q", "-c", "capitaine/42");
  writeFileSync(join(j.clone, ".claude/chaine.json"), JSON.stringify(contratPrep(j.trace, "PR")));
  j.git("commit", "-q", "-am", "feat: une PR");
  const r = j.lancer(ARGS(0));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(r.trace, ["prep", "boucle"]);
  assert.equal(j.git("rev-parse", "HEAD"), j.git("rev-parse", "origin/develop"));
  assert.equal(spawnSync("git", ["symbolic-ref", "-q", "HEAD"], { cwd: j.clone, env: ENV }).status, 1, "HEAD détachée");

  // Worktree sale : rien n'est joué, la veille s'arrête.
  const s = creerJouet([""]);
  s.publier(contratPrep(s.trace));
  writeFileSync(join(s.clone, "brouillon.txt"), "reste d'un passage\n");
  const rs = s.lancer(ARGS(0));
  assert.equal(rs.status, 13, rs.stdout + rs.stderr);
  assert.match(rs.stdout, /^VEILLE ARRÊTÉE \d\d:\d\d : worktree du capitaine pas propre : préparation non jouée/m);
  assert.deepEqual(rs.trace, []);
});

test("échéance passée : plus de relance de la boucle", () => {
  // Limite de 3 s, marge 0 : l'échéance tombe pendant le premier lancement, qui dure 3,5 s.
  const r = veilleJouet(["", prete(31)], {
    apresLancement: '[ "$k" != 0 ] || /bin/sleep 3.5',
    args: ["--pause", "0.2", "--duree", "1", "--marge", "0", "--sondes", "3"],
    env: { VEILLE_LIMITE: "0.05" },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.lancements, 1);
  assert.match(r.stdout, /^VEILLE FINIE \d\d:\d\d \(échéance\)$/m);
});

test("--duree au-delà de limite - marge : VEILLE FINIE (échéance) avant la fin de la durée", () => {
  const debut = Date.now();
  const r = veilleJouet([""], {
    args: ["--pause", "0.2", "--duree", "1", "--marge", "0"],
    env: { VEILLE_LIMITE: "0.1" },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^VEILLE FINIE \d\d:\d\d \(échéance\)$/m);
  assert.ok(Date.now() - debut < 30000, "finie à l'échéance (6 s), pas à la durée (60 s)");
});

test("fetch passager en échec, projet sans preparerCapitaine : la veille repart au second essai, la boucle est lancée", () => {
  // Un `git` du PATH fait échouer le premier `fetch`, puis passe la main au vrai ; `sleep` est immédiat.
  const j = creerJouet([""], { boot: null });
  const bin = join(j.dir, "bin");
  mkdirSync(bin);
  const vraiGit = execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
  writeFileSync(
    join(bin, "git"),
    `#!/bin/sh\nif [ "$1" = fetch ] && [ ! -e "${j.dir}/fetch-raté" ]; then touch "${j.dir}/fetch-raté"; exit 1; fi\nexec "${vraiGit}" "$@"\n`,
  );
  writeFileSync(join(bin, "sleep"), "#!/bin/sh\n:\n");
  chmodSync(join(bin, "git"), 0o755);
  chmodSync(join(bin, "sleep"), 0o755);
  const r = j.lancer(["--pause", "0.2", "--duree", "1", "--sondes", "0"], { PATH: `${bin}:${process.env.PATH}` });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(existsSync(join(j.dir, "fetch-raté")), "le premier fetch a bien échoué");
  assert.equal(r.lancements, 1);
  // Sans clé, aucune ligne de préparation, même sans boot_id lisible.
  assert.doesNotMatch(r.stdout, /préparation|boot_id/);
});

test("une boucle tient le verrou : préparation non jouée, sortie 13, worktree laissé tel quel", () => {
  const j = creerJouet([""]);
  j.publier(contratPrep(j.trace));
  j.git("switch", "-q", "-c", "capitaine/7");
  const verrou = join(j.clone, ".git", "boucle.verrou");
  // `flock <verrou> bash veille.sh` : le verrou est tenu par un autre descripteur pendant toute la veille.
  const r = j.lancer(ARGS(0), {}, ["flock", verrou]);
  assert.equal(r.status, 13, r.stdout + r.stderr);
  assert.match(r.stdout, /^VEILLE ARRÊTÉE \d\d:\d\d : une boucle tient le verrou/m);
  assert.deepEqual(r.trace, []);
  assert.equal(j.git("symbolic-ref", "--short", "HEAD"), "capitaine/7", "worktree non détaché");
});

test("démon lancé par la préparation (`(exec sleep 15) &`) : la boucle obtient le verrou (`flock -n`)", () => {
  // Un démon (PostgreSQL de demarrer-local.sh) qui hériterait du descripteur du verrou le garderait après la
  // préparation, et chaque boucle sortirait en 9. Le démon écrit son pid ; sa sortie ne tient pas le tube du banc.
  const j = creerJouet([""]);
  const pid = join(j.dir, "demon.pid");
  j.publier({ preparerCapitaine: `(exec sleep 15 >/dev/null 2>&1 </dev/null) & echo $! > "${pid}"` });
  const verrou = join(j.clone, ".git", "boucle.verrou");
  writeFileSync(
    join(j.dir, "boucle.sh"),
    readFileSync(join(j.dir, "boucle.sh"), "utf8").replace(
      "echo boucle >> ",
      `if flock -n "${verrou}" true; then echo "verrou libre" >> "${j.trace}"; else echo "verrou tenu" >> "${j.trace}"; fi\necho boucle >> `,
    ),
  );
  try {
    const r = j.lancer(ARGS(0));
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(existsSync(pid), "le démon a été lancé");
    assert.deepEqual(r.trace, ["verrou libre", "boucle"], r.stdout + r.stderr);
  } finally {
    if (existsSync(pid)) spawnSync("kill", [readFileSync(pid, "utf8").trim()]);
  }
});
