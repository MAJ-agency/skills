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

// ---------------------------------------------------------------------------------------------------------------
// Essais du second contre-relecteur de la PR 141 : la relance à l'expiration du verrou d'un capitaine mort.
// Une horloge de poste avancée à la main : `date +%s` rend l'heure vraie plus le décalage du fichier `decalage`, que la
// doublure de boucle.sh écrit à un lancement donné ; tout autre appel de `date` est le vrai.
const ilYA = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString().replace(/\.\d+Z$/, "Z");
const tenu = (n, date) => `[sujet/lot-${n}] tenu par #${n} (sortie 7 de fusionner, verrou du ${date})\n`;
const VRAIE_DATE = execFileSync("sh", ["-c", "command -v date"], { encoding: "utf8" }).trim();
function horloge() {
  const bin = mkdtempSync(join(tmpdir(), "horloge-"));
  const decalage = join(bin, "decalage");
  writeFileSync(join(bin, "date"), `#!/bin/sh\no=$(cat ${JSON.stringify(decalage)} 2>/dev/null || echo 0)\nif [ "$1" = "+%s" ]; then echo $(( $(${VRAIE_DATE} +%s) + o )); else exec ${VRAIE_DATE} "$@"; fi\n`);
  chmodSync(join(bin, "date"), 0o755);
  return { env: { PATH: `${bin}:${process.env.PATH}`, VEILLE_LIMITE: "100000" }, avancer: (k, minutes) => `[ "$k" != ${k} ] || echo ${minutes * 60} > ${JSON.stringify(decalage)}` };
}

test("ADVV1 : deux verrous de capitaines morts sur deux sujets ; le premier est relu à la même date après sa relance : l'expiration du second ne relance jamais la boucle", () => {
  const h = horloge();
  const file = [prete(80) + prete(84)];
  const deux = tenu(80, ilYA(96)) + tenu(84, ilYA(60));
  // Témoin : le second seul ; l'horloge avance de 45 min au premier lancement : son expiration (60 + 45 > 95) relance.
  const t = veilleJouet(file, { sorties: [tenu(84, ilYA(60)), ""], sondes: 3, env: h.env, apresLancement: h.avancer(0, 45) });
  console.log(`--- témoin\n${t.stdout}`);
  assert.equal(t.status, 0, t.stderr);
  assert.equal(t.lancements, 2, t.stdout);
  // Les deux : relance pour le premier (expiré), qui est relu à la même date ; l'horloge avance de 45 min après ce
  // second lancement : le second a expiré à son tour, et la veille ne relance plus.
  const h2 = horloge();
  const r = veilleJouet(file, { sorties: [deux, deux, ""], sondes: 4, env: h2.env, apresLancement: h2.avancer(1, 45) });
  console.log(`--- deux verrous\n${r.stdout}`);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 2, r.stdout);
});

test("ADVV2 : une date que fromdateiso8601 ne lit pas, à côté d'un verrou expiré lisible : aucune relance", () => {
  const r = veilleJouet([prete(80) + prete(84)], { sorties: [tenu(80, "2026-11-17T12:00Z") + tenu(84, ilYA(96)), ""], sondes: 2 });
  console.log(`--- ADVV2\n${r.stdout}`);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.lancements, 1, r.stdout);
  // Témoin : le verrou lisible seul relance.
  assert.equal(veilleJouet([prete(80) + prete(84)], { sorties: [tenu(84, ilYA(96)), ""], sondes: 2 }).lancements, 2);
});
