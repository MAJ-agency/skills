// Node CommonJS : Babel lit ce fichier avec require().
module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 : le runtime JSX de nativewind passe par babel-preset-expo.
    // Ne PAS ajouter `nativewind/babel` (v2) ni le plugin worklets à la main :
    // babel-preset-expo l'ajoute quand react-native-reanimated est installé.
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
  };
};
