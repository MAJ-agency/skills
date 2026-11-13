# `couts.mjs --verify` sort en erreur sur un montant illisible (partie plugin de `SPEC_ALL_SOC-1.14`)

Status: ready-for-agent
Type: task
Modèle: sonnet
Fichiers chauds: `skills/chaine/tickets/references/scripts/docs/couts.mjs`, `skills/chaine/tickets/references/scripts/docs/couts.test.mjs`

## Le besoin

Ce ticket est la première des deux PR du ticket `SPEC_ALL_SOC-1.14` du dépôt `anchorpost` (défaut, tranché par l'humain le 2026-11-12). Il vit ici parce qu'une session ne reçoit qu'un dépôt : la partie plugin se fait dans `skills`, la repose dans `anchorpost` se fera ensuite, dans une autre session, une fois cette PR fusionnée par l'humain.

Le constat : dans une carte de chantier, la cellule « Coût $ » d'une ligne portait `126,65 (le 12/11 à 7 h)`. `couts.mjs --verify` écrivait « coût illisible […], ligne ignorée » sur stderr, puis « à jour », et sortait en 0. Le registre des coûts affichait 356,56 $ au lieu de 483,21 $, et le défaut est revenu le jour même. Une note ne suffit pas : il faut un refus.

Quand le ticket est fait, `couts.mjs --verify` sort en 1 dès qu'une cellule « Coût $ » porte autre chose qu'un montant ou une valeur attendue, et nomme la carte et la ligne.

## Où

- `skills/chaine/tickets/references/scripts/docs/couts.mjs` :
  - `lireCarte` rend les lignes illisibles au lieu de seulement les écrire sur stderr (aujourd'hui `console.error` puis `continue`, lignes 56 à 65) ;
  - le bloc `--verify` (lignes 171 à 177) sort en 1 s'il y en a une, que le registre soit à jour ou non.
- `skills/chaine/tickets/references/scripts/docs/couts.test.mjs` : les deux tests de `## Surfaces`. La sortie en 1 vit dans le bloc de commande, qu'aucun test ne joue aujourd'hui : en extraire la décision dans une fonction pure, ou jouer le script sur un dépôt jouet (`depot-jouet.mjs`, dans le même dossier).
- **Un écart à remonter dans la même PR.** La copie d'`anchorpost` a reçu un correctif que le plugin n'a pas (ticket `SPEC_ALL_ANC-4.27`, PR 77 d'`anchorpost`). Sans lui, la repose déferait le correctif. Voici tout l'écart entre le plugin (`main`) et la copie d'`anchorpost` (`develop`), relevé le 2026-11-13 :

  ```diff
  # couts.mjs, ligne 48
  -  const section = /^## Coût\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texte);
  +  const section = /^## Coût[ \t]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texte);

  # couts.test.mjs, ajouté après la ligne 121
  +test("une carte dont l'en-tête Coût est suivi de milliers de blancs se lit en temps linéaire (SPEC_ALL_ANC-4.27)", () => {
  +  const debut = performance.now();
  +  const carte = lireCarte("docs/c.md", `Sujet: sujet/x\n\n## Coût${" ".repeat(100_000)}x\n`);
  +  assert.deepEqual(carte.lignes, []);
  +  assert.ok(performance.now() - debut < 200);
  +});
  ```

  L'expression se reprend telle quelle. Le test, lui, borne une durée en absolu (`< 200` ms), ce que les règles de test du socle interdisent : le reprendre en rapport de tailles (le temps pour une entrée dix fois plus longue ne croît pas plus que linéairement, avec une marge), sous un titre qui convient au plugin, sans identifiant de ticket d'un projet.

## Décisions

- Tranché par l'humain (2026-11-12) : un montant illisible fait sortir `couts.mjs --verify` en 1, avec un test.
- Restent attendus, donc sans échec : une cellule vide, un gabarit `{{…}}`, `—`, `à relever`.
- Sans `--verify`, rien ne change : le registre s'écrit et le message reste sur stderr.
- La session tranche seule, et le dit dans la PR : la forme de ce que rend `lireCarte`, le texte du message.
- La ligne `version` de `.claude-plugin/plugin.json` ne bouge pas (décision `A-1` de la carte, confirmée par l'humain le 2026-11-13) : le dire dans le corps de la PR, pour que la session de repose le note sous `## Comments` du ticket d'`anchorpost`.
- Hors de ce ticket : brancher `--verify` dans un contrôle automatique.

## Surfaces

| Surface                                                   | Preuve (`couts.test.mjs`)                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `couts.mjs --verify`, une carte au coût illisible         | « un coût illisible fait échouer la vérification, que le registre soit à jour ou non »              |
| `couts.mjs --verify`, les valeurs attendues d'une cellule | « un relevé à venir, un tiret, un gabarit ou une cellule vide ne font pas échouer la vérification » |
| L'en-tête « Coût » suivi de milliers de blancs            | le test de linéarité, en rapport de tailles                                                         |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. Essai à la main du refus : dans une carte jouet, écrire `4,08 $` dans une cellule de coût, lancer le script avec `--verify`, constater la sortie 1 et le nom de la carte.

## Livrer

Branche `fix/gnb-3-couts-verify-montant-illisible` depuis `origin/main`. Avant la PR, revue adversariale en suivant `skills/chaine/revue-adversariale/SKILL.md` de ce dépôt, avec les seuls critères du socle ; sa section va dans le corps de la PR. Une PR vers `main`, titre en conventional commit qui cite `SPEC_ALL_SOC-1.14`, corps en français. **Ne jamais la fusionner** : seul un ordre explicite de l'humain le permet. Ne pas modifier ce ticket. Pas d'accès `gh` : utiliser les outils GitHub MCP. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
