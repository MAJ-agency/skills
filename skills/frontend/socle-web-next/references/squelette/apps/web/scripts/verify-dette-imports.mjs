#!/usr/bin/env node
// Cliquet de dette des imports entre features — le pendant de DETTE_FEATURES
// dans eslint.rules.mjs. ESLint refuse un couplage NON déclaré ; ce script
// refuse une entrée déclarée qui n'est PLUS utilisée : la dette ne peut que
// baisser. Voir apps/web/CLAUDE.md, Features.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DETTE_FEATURES, features } from "../eslint.rules.mjs";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

function fichiersDe(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiersDe(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

const importsParFeature = new Map();
for (const f of features) {
  const cibles = new Set();
  for (const fichier of fichiersDe(join(racine, "src", "features", f))) {
    for (const m of readFileSync(fichier, "utf8").matchAll(/from\s+["']@\/features\/([^/"']+)/g)) {
      if (m[1] !== f) cibles.add(m[1]);
    }
  }
  importsParFeature.set(f, cibles);
}

const erreurs = [];
for (const [source, declarees] of Object.entries(DETTE_FEATURES)) {
  for (const cible of declarees) {
    if (!importsParFeature.get(source)?.has(cible)) {
      erreurs.push(`dette déclarée mais résorbée : retirer "${source}" → "${cible}" de DETTE_FEATURES`);
    }
  }
}
for (const [source, cibles] of importsParFeature) {
  for (const cible of cibles) {
    if (!(DETTE_FEATURES[source] ?? []).includes(cible)) {
      erreurs.push(`couplage non déclaré : features/${source} importe features/${cible}`);
    }
  }
}

if (erreurs.length) {
  console.error("check:dette — échec\n  " + erreurs.join("\n  "));
  process.exit(1);
}
console.log(`check:dette — OK (${features.length} features, ${Object.keys(DETTE_FEATURES).length} entrées de dette)`);
