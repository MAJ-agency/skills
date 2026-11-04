#!/usr/bin/env node
// Cliquet de dette des imports entre features — le pendant de FEATURE_DEBT
// dans eslint.rules.mjs. ESLint refuse un couplage NON déclaré ; ce script
// refuse une entrée déclarée qui n'est PLUS utilisée : la dette ne peut que
// baisser. Voir apps/web/CLAUDE.md, Features.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FEATURE_DEBT, features } from "../eslint.rules.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function filesOf(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesOf(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const importsByFeature = new Map();
for (const f of features) {
  const targets = new Set();
  for (const file of filesOf(join(root, "src", "features", f))) {
    for (const m of readFileSync(file, "utf8").matchAll(/from\s+["']@\/features\/([^/"']+)/g)) {
      if (m[1] !== f) targets.add(m[1]);
    }
  }
  importsByFeature.set(f, targets);
}

const errors = [];
for (const [source, declared] of Object.entries(FEATURE_DEBT)) {
  for (const target of declared) {
    if (!importsByFeature.get(source)?.has(target)) {
      errors.push(
        `dette déclarée mais résorbée : retirer "${source}" → "${target}" de FEATURE_DEBT`,
      );
    }
  }
}
for (const [source, targets] of importsByFeature) {
  for (const target of targets) {
    if (!(FEATURE_DEBT[source] ?? []).includes(target)) {
      errors.push(`couplage non déclaré : features/${source} importe features/${target}`);
    }
  }
}

if (errors.length) {
  console.error("check:debt — échec\n  " + errors.join("\n  "));
  process.exit(1);
}
console.log(
  `check:debt — OK (${features.length} features, ${Object.keys(FEATURE_DEBT).length} entrées de dette)`,
);
