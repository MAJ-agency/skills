// Lint des tests (skill socle-tests) — chargé par eslint.config.mjs de la racine quand ce
// fichier existe. Chaque règle ferme un cas vu sur un premier projet : des `it` sans
// assertion, des assertions sous condition qui ne s'exécutent jamais, des `it.skip` sans
// ticket, des `setTimeout` pour « laisser le temps » à un écouteur — verts sur une machine,
// rouges sur le runner. Le complément « assertion qui ne contraint rien » (`toBeDefined()`
// seul) est tenu par scripts/verify/tests-creux.mjs : ESLint ne sait pas compter.
import vitest from "@vitest/eslint-plugin";

export default [
  {
    files: ["**/*.spec.{ts,tsx}", "**/*.test.{ts,tsx}"],
    plugins: { vitest },
    rules: {
      // Un cas sans assertion ne prouve rien. Les helpers d'assertion maison sont reconnus par
      // leur nom ; en ajouter un ici quand il naît.
      "vitest/expect-expect": ["error", { assertFunctionNames: ["expect", "expect*", "assert*", "refuse*", "fc.assert"] }],
      // Une assertion sous `if`/`try` peut ne jamais s'exécuter : le cas passe sans rien prouver.
      "vitest/no-conditional-expect": "error",
      // Un cas désactivé sans ticket est oublié. `it.skip` accepté avec, sur la ligne au-dessus :
      // `// eslint-disable-next-line vitest/no-disabled-tests -- skip: <TICKET> <raison>`.
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/valid-expect": "error",
      // Un `expect` hors d'un cas ne s'exécute pas sous le nom d'un test. Dans un hook il garde
      // une fixture : il fait échouer la suite, c'est voulu.
      "vitest/no-standalone-expect": ["error", { additionalTestBlockFunctions: ["beforeAll", "beforeEach", "afterAll", "afterEach"] }],
      // Un délai n'attend rien de précis : il parie sur la vitesse de la machine. Attendre la
      // promesse de l'opération, un événement, ou une condition (boucle bornée).
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='setTimeout']",
          message: "Pas de délai dans un test : attendre une promesse ou une condition, pas un délai.",
        },
      ],
    },
  },
];
