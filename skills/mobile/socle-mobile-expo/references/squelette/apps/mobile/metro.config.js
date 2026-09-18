// Node CommonJS : Metro lit ce fichier avec require().
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");

const racineProjet = __dirname;
const racineMonorepo = path.resolve(racineProjet, "../..");

const config = getDefaultConfig(racineProjet);

// Monorepo pnpm : les paquets partagés exposent leurs SOURCES (packages/CLAUDE.md).
// Metro doit les surveiller et résoudre depuis les deux node_modules.
config.watchFolders = [racineMonorepo];
config.resolver.nodeModulesPaths = [
  path.resolve(racineProjet, "node_modules"),
  path.resolve(racineMonorepo, "node_modules"),
];
// pnpm est fait de liens symboliques : Metro doit les suivre, et honorer le
// champ `exports` des paquets modernes.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Un `node:*` (crypto, path…) qui fuit dans le bundle via un paquet partagé
// n'a pas de sens sur un appareil : on le remplace par un module vide plutôt
// que d'échouer à la résolution.
config.resolver.resolveRequest = (contexte, nomModule, plateforme) => {
  if (nomModule.startsWith("node:")) return { type: "empty" };
  return contexte.resolveRequest(contexte, nomModule, plateforme);
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
