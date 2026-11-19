// Banc du ticket 43 (A-50) : chaque script .mjs du plugin qui se joue en ligne de commande agit quand on le
// lance, quel que soit le chemin par lequel on le lance : direct, par un lien symbolique, depuis un dossier à
// espace, depuis un dossier à accent. Un script qui ne reconnaît pas son point d'entrée sort en 0 sans rien
// faire : un contrôle qui ne tourne pas passe pour vert.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { environnementDeBanc } from "../skills/chaine/sujet/scripts/depot-jouet.mjs";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SANS_GIT = environnementDeBanc();

// Un script, ce qu'on lui donne et la preuve qu'il a agi (sa sortie propre, pas le code 0 d'un script muet).
const SCRIPTS = [
  { nom: "migrations-ordre", fichier: "skills/chaine/fusionner/scripts/migrations-ordre.mjs", args: [], statut: 2, sortie: /usage : node migrations-ordre\.mjs/ },
  { nom: "revue-exigee", fichier: "skills/chaine/fusionner/scripts/revue-exigee.mjs", args: ["", "feat: x"], entree: "apps/a.ts\n", statut: 1, sortie: /sans section « Revue de ticket »/ },
  { nom: "demarrage", fichier: "skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs", args: [], statut: 0, sortie: /démarrage : fetch-develop/ },
  { nom: "vagues", fichier: "skills/chaine/tickets/references/scripts/docs/vagues.mjs", avec: ["skills/monorepo/socle-monorepo/references/scripts/docs"], args: [], statut: 2, sortie: /Usage : node scripts\/docs\/vagues\.mjs/ },
  { nom: "couts", fichier: "skills/chaine/tickets/references/scripts/docs/couts.mjs", avec: ["skills/monorepo/socle-monorepo/references/scripts/docs"], args: ["--verify"], statut: 1, sortie: /couts : .* n'est pas à jour/ },
  { nom: "mutation-regles", fichier: "skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs", args: [], statut: 2, sortie: /usage : node scripts\/verify\/mutation-regles\.mjs/ },
  { nom: "mutation-regles-synthese", fichier: "skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.mjs", args: [], statut: 0, sortie: /Mutation sur les règles prouvées : périmètre vide/ },
  { nom: "contexte-regle", fichier: "skills/chaine/criticite/scripts/contexte-regle.mjs", args: [], statut: 2, sortie: /usage : node contexte-regle\.mjs/ },
];

const tmp = mkdtempSync(join(tmpdir(), "entree-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

// Un dépôt git vide : c'est le dossier de travail de chaque essai.
const depot = join(tmp, "depot");
mkdirSync(depot);
spawnSync("git", ["init", "-q", depot], { env: SANS_GIT });

/**
 * Le chemin par lequel on lance `script`, pour chacun des six accès. Le script est posé comme chez un projet :
 * son dossier, avec les dossiers du plugin que `poser` copie au même endroit (`avec`), dans un dossier du banc.
 */
function chemins(script) {
  const poser = (parent) => {
    const vers = join(tmp, parent, "scripts");
    mkdirSync(vers, { recursive: true });
    for (const dossier of [dirname(script.fichier), ...(script.avec ?? [])]) cpSync(join(RACINE, dossier), vers, { recursive: true });
    return join(vers, basename(script.fichier));
  };
  const direct = poser(`pose ${script.nom}`.replace(/ /g, "-"));
  // Le lien est posé à côté du script, avec ses frères : sous `--preserve-symlinks-main`, Node résout les imports
  // depuis le dossier du lien, pas depuis celui du fichier.
  const lien = join(dirname(direct), `lien-${basename(script.fichier)}`);
  symlinkSync(direct, lien);
  return {
    direct: { chemin: direct },
    "lien symbolique": { chemin: lien },
    "lien symbolique, --preserve-symlinks-main": { chemin: lien, options: ["--preserve-symlinks-main"] },
    "lien symbolique, NODE_OPTIONS=--preserve-symlinks-main": { chemin: lien, env: { NODE_OPTIONS: "--preserve-symlinks-main" } },
    "dossier à espace": { chemin: poser(`avec espace ${script.nom}`) },
    "dossier à accent": { chemin: poser(`accentué-é ${script.nom}`) },
  };
}

for (const script of SCRIPTS) {
  const accès = chemins(script);
  for (const [nom, { chemin, options = [], env = {} }] of Object.entries(accès)) {
    test(`${script.nom} agit quand on le lance : ${nom}`, () => {
      const r = spawnSync(process.execPath, [...options, chemin, ...script.args], {
        cwd: depot,
        env: { ...SANS_GIT, CLAUDE_PROJECT_DIR: depot, CLAUDE_ENV_FILE: "", ...env },
        input: script.entree ?? "",
        encoding: "utf8",
        timeout: 60_000,
      });
      assert.match(r.stdout + r.stderr, script.sortie, `muet (statut ${r.status}) : le point d'entrée n'est pas reconnu par ${chemin}`);
      assert.equal(r.status, script.statut);
    });
  }
}
