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
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawn, spawnSync } from "node:child_process";
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
echo boucle "$@" >> "${dir}/arguments"
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
    const appels = lire("arguments") ? lire("arguments").split("\n") : [];
    return { ...r, lancements, compte, trace: lignes, echeance: lire("echeance"), arguments: appels };
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

// Ticket 57 de gouverner-nos-boucles (A-104, A-142) : une sous-PR qui attend son tour reste « prête », la même ligne de
// sonde en sonde ; celle qui tient son sujet peut quitter la file sans qu'aucune ligne n'apparaisse (étiquette retirée,
// `fusion-bloquée`, fermée). La sonde suit donc l'état de celle qui tient le sujet.
test("sous-PR qui attend son tour dans son sujet : un second regard à la sonde suivante, puis une relance chaque fois que celle qui tient le sujet change d'état ou quitte la file ; plus aucune quand celle qui attendait a quitté la file", () => {
  const file = (etat80, attente = true) => `${etat80 === null ? "" : `80\t${etat80}\t\n`}${attente ? "81\tsujet/lot : prête\t\n" : ""}`;
  const attend = "[#81] attend son tour : #80 passe d'abord dans sujet/lot\n";
  const enCours = file("sujet/lot : CI en cours");
  // Lecture initiale, puis cinq sondes : second regard, rien (même état), #80 bloquée, rien, #80 hors de la file.
  const etats = [enCours, enCours, enCours, file("bloquée"), file("bloquée"), file(null)];
  const r = veilleJouet(etats, { sorties: [attend, attend, attend, attend], sondes: 5 });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 4, r.stdout);
  for (const etat of ["sujet\\/lot : CI en cours", "bloquée", "hors de la file"])
    assert.match(r.stdout, new RegExp(`file à traiter \\(81 attend #80 \\(${etat}\\)\\), boucle relancée`));
  // La boucle ne dit plus que #81 attend (elle l'a prise, ou #81 a quitté la file) : plus aucune relance.
  assert.equal(veilleJouet(etats, { sorties: [attend, ""], sondes: 5 }).lancements, 2);
  // Témoin : sans la ligne de la boucle, la même file ne relance rien.
  assert.equal(veilleJouet(etats, { sondes: 5 }).lancements, 1);
  // #81, qui attendait, quitte la file ; #80 change ensuite d'état : plus rien n'attend, rien n'est relancé.
  const partie = [enCours, enCours, file("sujet/lot : CI en cours", false), file("bloquée", false)];
  assert.equal(veilleJouet(partie, { sorties: [attend, attend], sondes: 3 }).lancements, 2);
});

// Ticket 57 (A-142) : un sujet tenu par une sous-PR en passage chez un autre capitaine. Si ce capitaine est mort, son
// verrou expire sans que rien ne change dans la file : la veille lit la date du verrou dans la ligne de la boucle.
test("sujet tenu par le verrou d'un autre capitaine : la boucle est relancée une fois quand ce verrou a expiré (sa date a plus de 95 minutes), pas avant, et pas deux fois pour la même date", () => {
  const ilYA = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString().replace(/\.\d+Z$/, "Z");
  const tenu = (n, geste, date) => `[sujet/lot-${n}] tenu par #${n} (sortie 7 de ${geste}, verrou du ${date})\n`;
  const file = [prete(80) + prete(82)];
  const lancements = (...sorties) => veilleJouet(file, { sorties, sondes: 3 });
  // Expiré : une relance. La boucle retrouve le même verrou à la même date : la veille ne relance plus pour lui.
  const expire = ilYA(96);
  const r = lancements(tenu(80, "fusionner", expire), tenu(80, "fusionner", expire));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 2, r.stdout);
  assert.match(r.stdout, /^VEILLE \d\d:\d\d : verrou d'un autre capitaine expiré \(sa date a plus de 95 min\), boucle relancée$/m);
  // Le verrou d'un passage de `relancer` se lit de même.
  assert.equal(lancements(tenu(82, "relancer", expire), "").lancements, 2);
  // Pas avant : 90 minutes passées, mais pas la marge de 5 ; ni un verrou récent ; ni une sortie 7 sans verrou.
  assert.equal(lancements(tenu(80, "fusionner", ilYA(92))).lancements, 1);
  assert.equal(lancements(tenu(80, "fusionner", ilYA(10))).lancements, 1);
  assert.equal(lancements("[sujet/lot-80] tenu par #80 (sortie 7 de fusionner)\n").lancements, 1);
  // Deux verrous : le premier à expirer relance la boucle.
  assert.equal(lancements(tenu(80, "fusionner", ilYA(10)) + tenu(82, "fusionner", expire), "").lancements, 2);
  // Le capitaine a rafraîchi son verrou entre deux tours (une autre date), qui expire à son tour : une relance de plus.
  assert.equal(lancements(tenu(80, "fusionner", ilYA(97)), tenu(80, "fusionner", expire), tenu(80, "fusionner", expire)).lancements, 3);
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
  // Ticket 57 : la sous-PR qui attend son tour, et le sujet tenu avec la date du verrou d'un autre capitaine.
  assert.ok(lire("boucle.sh").includes(`echo "[#$n] attend son tour : #\${par%% *} passe d'abord dans $tient"`));
  assert.ok(lire("boucle.sh").includes('echo "[$tient] tenu par #$n (${geste:-CI en cours})"'));
  assert.ok(lire("boucle.sh").includes('geste="sortie $rc de fusionner"') && lire("boucle.sh").includes('geste="sortie $rc de relancer"'));
  assert.ok(lire("boucle.sh").includes(`printf ', verrou du %s' "\${BASH_REMATCH[1]}"`));
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
    // Ticket 74 : ni le verrou de la veille (descripteur 7).
    assert.equal(etatDe(j).status, 2, "le démon de la préparation ne tient pas la veille vivante");
  } finally {
    if (existsSync(pid)) spawnSync("kill", [readFileSync(pid, "utf8").trim()]);
  }
});

// --- Ticket 74 : la veille morte. Un verrou (`veille.verrou`) et un état (`veille.etat`) dans le répertoire commun ;
// `--etat` dit VIVANTE, TERMINÉE ou MORTE ; `--reprendre` repart après `boucle.sh --arreter`. ---

// `veille.sh --etat` du jouet, sans CAPITAINE_ID (il ne l'exige pas).
const etatDe = (j, ...plus) => {
  const { CAPITAINE_ID: _, ...sans } = ENV;
  return spawnSync("bash", [join(j.dir, "veille.sh"), "--etat", ...plus], { cwd: j.clone, env: sans, encoding: "utf8" });
};
const fichierEtat = (j) => join(j.clone, ".git", "veille.etat");
const MORTE_SANS_TRACE = "VEILLE MORTE (aucune trace de veille) : « boucle.sh --arreter », puis la relancer avec --reprendre\n";
const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
// Un `sleep` du PATH qui note son pid : le banc retire lui-même ce qu'il laisse orphelin.
const sleepNote = (j) => {
  mkdirSync(join(j.dir, "bin"), { recursive: true });
  writeFileSync(join(j.dir, "bin", "sleep"), `#!/bin/sh\necho $$ >> "${j.dir}/pids"\nexec /bin/sleep "$@"\n`, { mode: 0o755 });
  return { ...ENV, VEILLE_BOOT_ID: j.fichierBoot, PATH: `${join(j.dir, "bin")}:${ENV.PATH ?? process.env.PATH}` };
};
const tuerNotes = (j) => {
  for (const f of ["pids", "demon.pid", "demon-file.pid"]) {
    if (!existsSync(join(j.dir, f))) continue;
    for (const p of readFileSync(join(j.dir, f), "utf8").split("\n").filter(Boolean)) spawnSync("kill", ["-9", p]);
  }
};

test("--etat : MORTE sans trace, VIVANTE pendant la veille, TERMINÉE avec sa ligne finale (FINIE, ARRÊTÉE de la boucle, de la préparation) ; sans CAPITAINE_ID ni état écrit ; un argument de plus : sortie 64", () => {
  // Pendant le premier lancement de la boucle, la doublure lit l'état : la veille tient son verrou.
  const pendant = 'if [ "$k" = 0 ]; then env -u CAPITAINE_ID bash "$(dirname "$0")/veille.sh" --etat >> "$(dirname "$0")/trace" 2>&1; echo "etat $?" >> "$(dirname "$0")/trace"; fi';
  const j = creerJouet([""], { apresLancement: pendant });
  let e = etatDe(j);
  assert.equal(e.status, 1, e.stdout + e.stderr);
  assert.equal(e.stdout, MORTE_SANS_TRACE);
  assert.equal(existsSync(fichierEtat(j)), false, "--etat n'écrit pas l'état");
  const r = j.lancer(ARGS(0));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.trace.length, 3, r.trace.join("\n"));
  assert.equal(r.trace[0], "boucle");
  assert.match(r.trace[1], /^VEILLE VIVANTE \(lancée à \d\d:\d\d\)$/);
  assert.equal(r.trace[2], "etat 0");
  assert.match(readFileSync(fichierEtat(j), "utf8"), /^fin \d+ VEILLE FINIE \d\d:\d\d\n$/);
  e = etatDe(j);
  assert.equal(e.status, 2, e.stdout + e.stderr);
  assert.match(e.stdout, /^VEILLE TERMINÉE : VEILLE FINIE \d\d:\d\d\n$/);
  assert.equal(etatDe(j, "x").status, 64);

  const arretee = creerJouet([""], { rcBoucle: 3 });
  assert.equal(arretee.lancer(ARGS(1)).status, 3);
  e = etatDe(arretee);
  assert.equal(e.status, 2, e.stdout + e.stderr);
  assert.match(e.stdout, /^VEILLE TERMINÉE : VEILLE ARRÊTÉE \d\d:\d\d : la boucle est sortie en 3\n$/);

  const preparation = creerJouet([""], { contrat: "pas du json" });
  assert.equal(preparation.lancer(ARGS(0)).status, 13);
  e = etatDe(preparation);
  assert.equal(e.status, 2, e.stdout + e.stderr);
  assert.match(e.stdout, /^VEILLE TERMINÉE : VEILLE ARRÊTÉE \d\d:\d\d : contrat illisible/);

  const echeance = creerJouet(["", prete(31)], { apresLancement: '[ "$k" != 0 ] || /bin/sleep 3.5' });
  const fin = echeance.lancer(["--pause", "0.2", "--duree", "1", "--marge", "0", "--sondes", "3"], { VEILLE_LIMITE: "0.05" });
  assert.equal(fin.status, 0, fin.stdout + fin.stderr);
  assert.match(etatDe(echeance).stdout, /^VEILLE TERMINÉE : VEILLE FINIE \d\d:\d\d \(échéance\)\n$/);
});

test("--etat : le fichier d'arrêt posé (boucle.sh --arreter) passe avant la fin écrite et avant une veille morte : VEILLE TERMINÉE, arrêt demandé, sortie 2", () => {
  const j = creerJouet([""]);
  const arret = join(j.clone, ".git", "boucle-arret");
  writeFileSync(fichierEtat(j), `lancee ${Math.floor(Date.now() / 1000)}\n`);
  let e = etatDe(j);
  assert.equal(e.status, 1, e.stdout + e.stderr);
  assert.match(e.stdout, /^VEILLE MORTE \(lancée à \d\d:\d\d, sans ligne finale\) : « boucle\.sh --arreter », puis la relancer avec --reprendre\n$/);
  writeFileSync(arret, "2026-11-21T22:00:00\n");
  e = etatDe(j);
  assert.equal(e.status, 2, e.stdout + e.stderr);
  assert.equal(e.stdout, `VEILLE TERMINÉE : arrêt demandé (${arret}, posé le 2026-11-21T22:00:00) ; « veille.sh --reprendre » quand on veut repartir\n`);
  writeFileSync(fichierEtat(j), "fin 1 VEILLE FINIE 12:00\n");
  assert.match(etatDe(j).stdout, /^VEILLE TERMINÉE : arrêt demandé/);
  // Un état illisible se lit sans trace.
  writeFileSync(fichierEtat(j), "lancee pas-un-nombre\n");
  rmSync(arret);
  assert.equal(etatDe(j).stdout, MORTE_SANS_TRACE);
});

test("veille tuée pendant sa pause (kill -9, comme l'outil Bash ou un conteneur arrêté) : pas de ligne finale, et --etat dit VEILLE MORTE aussitôt, son `sleep` orphelin ne la tient pas vivante", async () => {
  const j = creerJouet([""]);
  // La fin d'une veille d'avant (contre-relecture de la PR 150) : l'état « lancee » la remplace, il ne s'y ajoute pas.
  writeFileSync(fichierEtat(j), "fin 1 VEILLE FINIE 12:00\n");
  const enfant = spawn("bash", [join(j.dir, "veille.sh"), "--pause", "30", "--duree", "5"], { cwd: j.clone, env: sleepNote(j), stdio: "ignore" });
  const sortie = new Promise((ok) => enfant.on("exit", ok));
  try {
    // La boucle lancée (la doublure l'a noté), la veille dort 30 s dans son `sleep`.
    for (let t = 0; !existsSync(join(j.dir, "pids")) && t < 200; t++) await attendre(100);
    assert.ok(existsSync(join(j.dir, "pids")), "la veille dort");
    assert.equal(etatDe(j).status, 0, "vivante avant le kill");
    enfant.kill("SIGKILL");
    await sortie;
    const e = etatDe(j);
    assert.equal(e.status, 1, e.stdout + e.stderr);
    assert.match(e.stdout, /^VEILLE MORTE \(lancée à \d\d:\d\d, sans ligne finale\) : « boucle\.sh --arreter », puis la relancer avec --reprendre\n$/);
    assert.match(readFileSync(fichierEtat(j), "utf8"), /^lancee \d+\n$/);
  } finally {
    enfant.kill("SIGKILL");
    tuerNotes(j);
  }
});

test("un démon laissé par la boucle ou par file.sh ne tient pas la veille vivante après sa fin", () => {
  // Les démons écrivent ailleurs que dans le tube : la veille finit sans les attendre.
  const demon = (pid) => `(exec /bin/sleep 20 >/dev/null 2>&1 </dev/null) & echo $! > "$(dirname "$0")/${pid}"`;
  const j = creerJouet([""], { apresLancement: `[ "$k" != 0 ] || { ${demon("demon.pid")}; }` });
  const file = join(j.dir, "file.sh");
  writeFileSync(file, readFileSync(file, "utf8").replace("#!/usr/bin/env bash\n", `#!/usr/bin/env bash\n[ -f "$(dirname "$0")/demon-file.pid" ] || { ${demon("demon-file.pid")}; }\n`));
  try {
    const r = j.lancer(ARGS(1));
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(existsSync(join(j.dir, "demon.pid")) && existsSync(join(j.dir, "demon-file.pid")), "les deux démons lancés");
    const e = etatDe(j);
    assert.equal(e.status, 2, e.stdout + e.stderr);
    assert.match(e.stdout, /^VEILLE TERMINÉE : VEILLE FINIE /);
  } finally {
    tuerNotes(j);
  }
});

test("veille tuée pendant que `tee` attend un démon de la boucle (sa sortie dans le tube) : --etat dit VEILLE MORTE, `tee` ne la tient pas vivante", async () => {
  // Le démon garde le tube ouvert : la boucle a fini, `tee` attend, la veille attend `tee`. On la tue là.
  const j = creerJouet([""], {
    apresLancement: '[ "$k" != 0 ] || { (exec /bin/sleep 20 </dev/null 2>/dev/null) & echo $! > "$(dirname "$0")/demon.pid"; }',
  });
  const enfant = spawn("bash", [join(j.dir, "veille.sh"), ...ARGS(1)], { cwd: j.clone, env: { ...ENV, VEILLE_BOOT_ID: j.fichierBoot }, stdio: "ignore" });
  const sortie = new Promise((ok) => enfant.on("exit", ok));
  try {
    for (let t = 0; !existsSync(join(j.dir, "demon.pid")) && t < 200; t++) await attendre(100);
    assert.ok(existsSync(join(j.dir, "demon.pid")), "le démon est lancé");
    await attendre(500);
    assert.equal(etatDe(j).status, 0, "vivante avant le kill");
    enfant.kill("SIGKILL");
    await sortie;
    const e = etatDe(j);
    assert.equal(e.status, 1, e.stdout + e.stderr);
    assert.match(e.stdout, /^VEILLE MORTE \(lancée à \d\d:\d\d, sans ligne finale\)/);
  } finally {
    enfant.kill("SIGKILL");
    tuerNotes(j);
  }
});

test("une seconde veille pendant qu'une tourne : VEILLE ARRÊTÉE, sortie 9, aucune boucle lancée, l'état de la première gardé", () => {
  // Un état témoin (« lancee 1 ») posé avant la seconde : elle ne doit pas l'écrire.
  // Elle est lancée avec --reprendre, un arrêt posé (contre-relecture de la PR 150) : refusée, elle ne le retire pas.
  const seconde = 'if [ "$k" = 0 ]; then echo "lancee 1" > .git/veille.etat; echo 2026-11-22T03:00:00 > .git/boucle-arret; bash "$(dirname "$0")/veille.sh" --pause 0.2 --duree 1 --sondes 0 --reprendre > "$(dirname "$0")/seconde" 2>&1; echo "seconde $?" >> "$(dirname "$0")/trace"; cat .git/veille.etat >> "$(dirname "$0")/trace"; [ ! -e .git/boucle-arret ] || echo "arrêt gardé" >> "$(dirname "$0")/trace"; fi';
  const j = creerJouet([""], { apresLancement: seconde });
  const r = j.lancer(ARGS(0));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(r.trace, ["boucle", "seconde 9", "lancee 1", "arrêt gardé"]);
  assert.equal(r.lancements, 1, "la seconde n'a lancé aucune boucle");
  assert.match(readFileSync(join(j.dir, "seconde"), "utf8"), /^VEILLE ARRÊTÉE \d\d:\d\d : une veille tourne déjà \(.*veille\.verrou\) : une seule à la fois, « veille\.sh --etat »$/m);
  assert.match(readFileSync(fichierEtat(j), "utf8"), /^fin \d+ VEILLE FINIE \d\d:\d\d\n$/, "la fin écrite est celle de la première");
});

test("--reprendre : la veille retire le fichier d'arrêt, la boucle ne reçoit jamais --reprendre et trouve son verrou libre ; un arrêt posé pendant le démarrage reste posé ; sans l'option, la veille ne retire rien", () => {
  // Contre-relecture de la PR 150 : la lecture initiale de la file (une lecture GitHub) pose un arrêt, comme un
  // `boucle.sh --arreter` joué pendant le démarrage ; la boucle note si l'arrêt est posé et si son verrou est libre.
  const temoin = '{ [ -e .git/boucle-arret ] && echo "arrêt posé" || echo "pas d\'arrêt"; } >> "$(dirname "$0")/trace"; if flock -n .git/boucle.verrou true; then echo "verrou libre"; else echo "verrou tenu"; fi >> "$(dirname "$0")/trace"';
  const avec = creerJouet(["", prete(31)], { apresLancement: `[ "$k" != 0 ] || { ${temoin}; }` });
  const arret = join(avec.clone, ".git", "boucle-arret");
  writeFileSync(arret, "2026-11-22T03:00:00\n");
  const file = join(avec.dir, "file.sh");
  writeFileSync(file, readFileSync(file, "utf8").replace("#!/usr/bin/env bash\n", `#!/usr/bin/env bash\n[ -f "$(dirname "$0")/compte" ] || { [ ! -e .git/boucle-arret ] && echo "retiré avant la lecture" >> "$(dirname "$0")/trace"; echo 2026-11-22T03:05:00 > .git/boucle-arret; }\n`));
  const r = avec.lancer(["--pause", "0.2", "--duree", "1", "--reprendre", "--sondes", "1"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(r.arguments, ["boucle", "boucle"], "aucun lancement de la boucle ne reçoit --reprendre");
  assert.deepEqual(r.trace.slice(0, 4), ["retiré avant la lecture", "boucle", "arrêt posé", "verrou libre"], r.trace.join("\n"));
  assert.equal(readFileSync(arret, "utf8"), "2026-11-22T03:05:00\n", "l'arrêt posé pendant le démarrage reste");
  const sans = creerJouet(["", prete(31)]);
  const arretSans = join(sans.clone, ".git", "boucle-arret");
  writeFileSync(arretSans, "2026-11-22T03:00:00\n");
  const s = sans.lancer(["--pause", "0.2", "--duree", "1", "--sondes", "1"]);
  assert.deepEqual(s.arguments, ["boucle", "boucle"]);
  assert.ok(existsSync(arretSans), "sans --reprendre, la veille ne retire pas le fichier d'arrêt");
  const usage = veilleJouet([""], { args: ["--reprendre", "oui"] });
  assert.equal(usage.status, 64);
});

test("un fichier du verrou de la veille qui ne s'ouvre pas : --etat et la veille sortent en 6, jamais VEILLE VIVANTE ni « une veille tourne déjà »", () => {
  // Contre-relecture de la PR 150 : `flock` sur un descripteur que l'`exec` n'a pas ouvert sort en 65, pas en 1.
  const j = creerJouet([""]);
  mkdirSync(join(j.clone, ".git", "veille.verrou"));
  const e = etatDe(j);
  assert.equal(e.status, 6, e.stdout + e.stderr);
  assert.equal(e.stdout, "");
  assert.match(e.stderr, /veille\.sh --etat : verrou de la veille illisible \(.*veille\.verrou\)/);
  const r = j.lancer(ARGS(0));
  assert.equal(r.status, 6, r.stdout + r.stderr);
  assert.match(r.stdout, /^VEILLE ARRÊTÉE \d\d:\d\d : verrou de la veille illisible \(.*veille\.verrou\)$/m);
  assert.doesNotMatch(r.stdout, /une veille tourne déjà/);
  assert.equal(r.lancements, 0);
});

// --- Relecture du ticket 74, tour 1 : une veille relancée avec --reprendre retire le fichier d'arrêt avant sa
// préparation ; aucun sous-shell de la veille (sonde, préparation) ne garde son verrou ; un --etat en cours ne fait pas
// refuser une veille qui démarre. ---

// Lance la veille du jouet en tâche de fond, journal dans `veille.log` du jouet ; rend l'enfant et sa fin.
const enFond = (j, args, env = {}) => {
  const enfant = spawn("bash", [join(j.dir, "veille.sh"), ...args], {
    cwd: j.clone,
    env: { ...ENV, VEILLE_BOOT_ID: j.fichierBoot, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let journal = "";
  enfant.stdout.on("data", (b) => (journal += b));
  enfant.stderr.on("data", (b) => (journal += b));
  return { enfant, sortie: new Promise((ok) => enfant.on("exit", ok)), journal: () => journal };
};
const jusqua = async (vrai) => {
  for (let t = 0; !vrai() && t < 200; t++) await attendre(100);
  assert.ok(vrai(), "attente échue");
};

test("--reprendre : le fichier d'arrêt est retiré avant la préparation ; tuée pendant sa préparation, la veille se lit VEILLE MORTE, jamais « arrêt demandé »", async () => {
  const j = creerJouet([""], { contrat: { preparerCapitaine: `echo $$ > "${"$"}(git rev-parse --git-common-dir)/../../demon.pid"; exec /bin/sleep 5` } });
  const arret = join(j.clone, ".git", "boucle-arret");
  writeFileSync(arret, "2026-11-21T22:00:00\n");
  const v = enFond(j, ["--pause", "0.2", "--duree", "1", "--reprendre"]);
  try {
    await jusqua(() => v.journal().includes("préparation ("));
    assert.equal(existsSync(arret), false, "fichier d'arrêt retiré avant la préparation");
    v.enfant.kill("SIGKILL");
    await v.sortie;
    const e = etatDe(j);
    assert.equal(e.status, 1, e.stdout + e.stderr);
    assert.match(e.stdout, /^VEILLE MORTE \(lancée à \d\d:\d\d, sans ligne finale\)/);
  } finally {
    v.enfant.kill("SIGKILL");
    tuerNotes(j);
  }
});

test("--reprendre : préparation en échec (13), le fichier d'arrêt déjà retiré, --etat rend sa ligne finale ; une boucle qui tient son verrou : sortie 9, fichier gardé", () => {
  const j = creerJouet([""], { contrat: { preparerCapitaine: "exit 1" } });
  const arret = join(j.clone, ".git", "boucle-arret");
  writeFileSync(arret, "2026-11-21T22:00:00\n");
  assert.equal(j.lancer(["--pause", "0.2", "--duree", "1", "--reprendre", "--sondes", "0"]).status, 13);
  assert.equal(existsSync(arret), false);
  assert.match(etatDe(j).stdout, /^VEILLE TERMINÉE : VEILLE ARRÊTÉE \d\d:\d\d : préparation du capitaine en échec/);
  const k = creerJouet([""]);
  const arretK = join(k.clone, ".git", "boucle-arret");
  writeFileSync(arretK, "2026-11-21T22:00:00\n");
  const r = k.lancer(["--pause", "0.2", "--duree", "1", "--reprendre", "--sondes", "0"], {}, ["flock", join(k.clone, ".git", "boucle.verrou")]);
  assert.equal(r.status, 9, r.stdout + r.stderr);
  assert.match(r.stdout, /une boucle tient le verrou .* fichier d'arrêt gardé/);
  assert.ok(existsSync(arretK), "fichier d'arrêt gardé");
  assert.equal(r.lancements, 0);
});

test("veille tuée pendant une sonde lente (file.sh) ou pendant sa préparation : --etat dit VEILLE MORTE aussitôt, aucun sous-shell ne la tient vivante", async () => {
  // Sonde : la lecture de rang `rang` dort 5 s (0 : la lecture initiale, avant la boucle ; 1 : la première sonde de la
  // boucle de la veille, après sa pause).
  for (const rang of [0, 1]) {
    const j = creerJouet([""]);
    const file = join(j.dir, "file.sh");
    writeFileSync(file, readFileSync(file, "utf8").replace("#!/usr/bin/env bash\n", `#!/usr/bin/env bash\n[ "$(cat "$(dirname "$0")/compte" 2>/dev/null || echo 0)" != ${rang} ] || { echo $$ >> "$(dirname "$0")/pids"; /bin/sleep 5; }\n`));
    const v = enFond(j, ["--pause", "0.2", "--duree", "1"]);
    try {
      await jusqua(() => existsSync(join(j.dir, "pids")));
      v.enfant.kill("SIGKILL");
      await v.sortie;
      const e = etatDe(j);
      assert.equal(e.status, 1, `pendant la sonde de rang ${rang} : ${e.stdout}${e.stderr}`);
    } finally {
      v.enfant.kill("SIGKILL");
      tuerNotes(j);
    }
  }
  // Préparation : la commande dort 5 s.
  const p = creerJouet([""], { contrat: { preparerCapitaine: `echo $$ > "${"$"}(git rev-parse --git-common-dir)/../../demon.pid"; exec /bin/sleep 5` } });
  const w = enFond(p, ["--pause", "0.2", "--duree", "1"]);
  try {
    await jusqua(() => w.journal().includes("préparation ("));
    w.enfant.kill("SIGKILL");
    await w.sortie;
    const e = etatDe(p);
    assert.equal(e.status, 1, `pendant la préparation : ${e.stdout}${e.stderr}`);
  } finally {
    w.enfant.kill("SIGKILL");
    tuerNotes(p);
  }
});

test("une veille qui démarre pendant qu'un --etat tient le verrou l'attend, sans se croire doublée", () => {
  // `flock … sleep 1` tient le verrou une seconde, comme un --etat lent : la veille démarre après lui.
  const j = creerJouet([""]);
  const tenu = spawn("flock", [join(j.clone, ".git", "veille.verrou"), "/bin/sleep", "1"], { stdio: "ignore" });
  spawnSync("/bin/sleep", ["0.2"]);
  const r = j.lancer(ARGS(0));
  tenu.kill("SIGKILL");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.lancements, 1);
});

test("--etat lit l'état sous le verrou de la veille : aucune veille ne l'écrit entre sa lecture et son verdict", () => {
  // Un `date` du PATH, appelé par --etat pour l'heure de « lancee », note si le verrou de la veille est tenu à ce moment.
  const j = creerJouet([""]);
  const verrou = join(j.clone, ".git", "veille.verrou");
  const note = join(j.dir, "verrou-a-la-lecture");
  mkdirSync(join(j.dir, "bin"), { recursive: true });
  writeFileSync(join(j.dir, "bin", "date"), `#!/bin/sh\nif flock -n "${verrou}" true; then echo libre >> "${note}"; else echo tenu >> "${note}"; fi\nPATH=/usr/bin:/bin exec date "$@"\n`, { mode: 0o755 });
  writeFileSync(fichierEtat(j), `lancee ${Math.floor(Date.now() / 1000)}\n`);
  const { CAPITAINE_ID: _, ...sans } = ENV;
  const e = spawnSync("bash", [join(j.dir, "veille.sh"), "--etat"], { cwd: j.clone, env: { ...sans, PATH: `${join(j.dir, "bin")}:${ENV.PATH ?? process.env.PATH}` }, encoding: "utf8" });
  assert.equal(e.status, 1, e.stdout + e.stderr);
  assert.match(e.stdout, /^VEILLE MORTE \(lancée à \d\d:\d\d, sans ligne finale\)/);
  assert.deepEqual(readFileSync(note, "utf8").trim().split("\n"), ["tenu"], "l'heure de « lancee » se lit verrou tenu");
});

test("régime 8 (clé `relecture` sur develop) : une PR qui passe en « CI en cours » relance la boucle une fois ; sans la clé, aucune relance", () => {
  const enCours = "31\tCI en cours\t\n";
  const sous = "80\tsujet/lot : CI en cours\t\n";
  // La clé sur develop : l'entrée en « CI en cours » est une ligne neuve (une relance), la même ligne ensuite n'en est pas
  // une (un second push pendant la CI ne change rien) ; une sous-PR aussi.
  const r = veilleJouet(["", enCours, enCours, enCours + sous], { contrat: { relecture: { depuis: "2026-11-17T09:00:00Z" } } });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 3, r.stdout);
  assert.match(r.stdout, /file à traiter \(31 en-cours\), boucle relancée/);
  assert.match(r.stdout, /file à traiter \(80 en-cours\), boucle relancée/);
  // Sans la clé (un contrat sans elle) : la sonde d'aujourd'hui.
  const r2 = veilleJouet(["", enCours, enCours + sous], { contrat: { cheminsSensibles: [] } });
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(r2.lancements, 1, r2.stdout);
});
