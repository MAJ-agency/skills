# Contre-relecture de la PR 148 (ticket 70), tour 1, au sommet `ee93f84`

PR 148, tête `claude/ticket-70-bancs-des-textes`, sommet `ee93f84183a7f3fc31e2d1b6477fd90557797518`, base `main` à `7352df825d6a76fe08b03f76e04bd6b4cb798b72` (plugin 7.38.1). Effort moyen (`P-64`). Joué le 2026-11-22 sur un clone neuf de `https://github.com/MAJ-agency/skills`, Node 22.23.5, en lecture seule vis-à-vis de GitHub.

**Verdict proposé : conforme** au sommet `ee93f84183a7f3fc31e2d1b6477fd90557797518`. Aucun bloquant, rien à corriger, donc pas de retouche ; deux remarques.

## 1. Les bancs de la PR et le patch

Sur un arbre neuf à `7352df8`, `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md 70-annexes/ticket-70.patch` (sha256 `2657363b5c83248ad221d044d15a732b682656654acf66e23b31c0fd6d92ee8e`), puis `git diff --exit-code ee93f84 -- scripts/relecture.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs` : sortie 0, **égaux**. `git diff --stat 7352df8 ee93f84` : les quatre fichiers du ticket, et eux seuls.

## 2. Le banc d'`A-178` : chaque phrase à sa place, et rien de plus

Le test tient ce que la décision 1 du ticket demande :

- **le clone** : la section `## Étape 5 ` (découpe sur `^## `), de `- **\`C4\`, \`/security-review\`**` à la ligne suivante qui commence par `- `, ou à la fin de la section. Le `slice(debutC4 + 1)` empêche la puce de se trouver elle-même. Une phrase hors de la puce (autre étape, puce d'avant, nouvelle puce intercalée) rougit.
- **le prompt** : `PROMPT` suivi, aux blancs près, de « Gravité, deux seulement : ». C'est la place exacte (juste avant), et l'ordre.
- **le verdict** : une seule ligne commence par `- **\`/security-review:\`**` (une puce dupliquée rougit), et la phrase est dans cette ligne.

Il ne demande rien de plus que la décision (ni l'ordre à l'intérieur de la puce `C4`, ni l'indentation, ni la ligne vide, ni l'absence de doublon ailleurs), avec une exception : G4, plus bas.

### Les mutations sur l'arbre de la PR

Journal : [`essais/mutations.txt`](essais/mutations.txt). Chacune joue `node --test scripts/relecture.test.mjs` en entier, et le fichier est remis après ; l'arbre est propre à la fin (`git status` vide).

| Mutation | Attendu | Obtenu |
| --- | --- | --- |
| F1 = M4 : clone déplacé à la fin de l'étape 2 | rouge | rouge |
| F2 : clone dans la puce `C3` | rouge | rouge |
| F3 : clone dans l'étape 6 | rouge | rouge |
| F4 : phrase du prompt dans la liste des gravités | rouge | rouge (deux tests) |
| F5 : phrase du prompt en tête | rouge | rouge |
| F6 : phrase du verdict en paragraphe après la puce | rouge | rouge |
| F7 : phrase du verdict retirée | rouge | rouge |

F1 à F7 (`70-annexes/mutations.mjs`, recopié dans [`essais/mutations-ticket-70.mjs`](essais/mutations-ticket-70.mjs)) : **7 rouges sur 7**, de 51 à 54 s chacune. M4 n'est publiée nulle part (aucun `65-annexes/` sur aucune branche du dépôt ; la carte, ligne 1151, dit seulement qu'elle « déplace le paragraphe dans `SKILL.md` ») : F1 la refait, comme le ticket le dit, et F2 et F3 couvrent deux autres destinations.

### Six mutations à moi

[`essais/mutations-contre.mjs`](essais/mutations-contre.mjs), à sens égal sauf G6 :

| Mutation | Doit | Obtenu |
| --- | --- | --- |
| G1 : `SKILL.md`, le paragraphe du clone désindenté (colonne 0), au même endroit | survivre (seuls des blancs) | verte |
| G2 : `SKILL.md`, le paragraphe du clone remonté juste après le bloc de code de `C4`, avant « La première ligne… » | survivre (toujours dans la puce) | verte |
| G3 : `prompt-regles.md`, la phrase en double, deux fois de suite avant « Gravité » | survivre (à sa place ; la décision n'interdit pas un doublon) | verte |
| G4 : `verdict.md`, la phrase sur une ligne de continuation de la même puce (`\n  `) | survivre, d'après « un retour à la ligne ne casse rien » | **rouge** |
| G5 : `prompt-regles.md`, la ligne vide avant « Gravité » retirée | survivre (seuls des blancs) | verte |
| G6 : `verdict.md`, « n'équivaut pas à une absence » pour « ne vaut pas absence » | rougir (un mot changé) | rouge |

Cinq comme attendu, un écart : G4 (remarque 1).

## 3. Le commentaire de `trim()`

Le commentaire de `tickets.test.mjs` est exactement celui de la décision 2. Il est exact :

- ECMA-262, `String.prototype.trim` → `TrimString(…, start+end)` : il retire aux deux bouts les points de code *WhiteSpace* (TAB, VT, FF, U+FEFF, toute `Zs`) et *LineTerminator* (LF, CR, U+2028, U+2029). Les `\p{Cc}` qui en font partie sont U+0009, U+000A, U+000B, U+000C et U+000D, et ce sont les seuls. U+0085 (NEL) est `Cc`, pas `Zs`, et n'est ni l'un ni l'autre ; NUL et DEL non plus.
- La mesure du ticket, rejouée : `9,a,b,c,d`. Au milieu, `"a\tb\nc".trim()` garde ses 5 caractères.
- Le code commenté, `ecartsSensibles` (`tickets-regles.mjs`, ligne 474) : `const nom = accord.slice(0, j).trim()`, puis `/\p{Cf}|\p{Cc}|(?! )\p{Z}/u.test(nom)`. Un contrôle au milieu du nom ou U+0085 au bout est donc refusé (les cas `'la\tMOA'` … `'la MOA\u0085'`) ; une tabulation au bout serait ôtée avant le test, ce que le commentaire dit.

## 4. La version et la note

`.claude-plugin/plugin.json` passe à 7.38.2 (le seul `version` du dépôt), la version suivante de `main` (7.38.1). La note `## 7.38.2 — 2026-11-22` est la première du fichier, au-dessus de la 7.38.1. Elle a la forme de ses voisines (« Ce qui change », « Ce qu'un projet fait pour en profiter ») et le texte du hunk du patch, sous le numéro pris et à la date du jour. `scripts/depot.test.mjs` est vert (§ 5).

## 5. Les essais

- `node --test scripts/relecture.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs scripts/depot.test.mjs` au sommet : **144 sur 144**, 52 s.
- La suite entière, `pnpm test`, d'un seul tenant ([`essais/suite.txt`](essais/suite.txt)) : **1 296 tests, 1 296 verts**, 0 échec, 0 sauté, 0 annulé. Elle a duré 13 min 54 s (01:35:59 → 01:49:52 UTC, `duration_ms` 833578), avec une charge de 0,80 au départ et de 2,12 à la fin. L'arbre est propre après.

## 6. Les contrôles GitHub au sommet

Lus à 01 h 50 UTC : quatre sur quatre en succès (`bancs`, terminé à 01:33:01, `CodeQL`, `Analyze (actions)`, `Analyze (javascript-typescript)`).

## Remarques (aucune ne bloque)

1. **Remarque : le banc du verdict tient la phrase dans une ligne, pas dans la puce.** Si la phrase passe sur une ligne de continuation de la même puce (G4), le banc rougit alors que la place et le sens n'ont pas changé. La décision 1 dit deux choses : « dans la seule ligne qui commence par… » et « un retour à la ligne ne casse rien ». Le banc suit la première, littéralement. L'erreur ne peut aller que dans un sens : elle donnerait un rouge de trop, jamais un vert de trop. Aujourd'hui, aucune puce de `verdict.md` ne continue sur une seconde ligne. Pas de retouche ; à garder en tête si ces textes passent un jour à des lignes coupées.
2. **Remarque : la note dit un peu plus que le commentaire.** La note 7.38.2 dit que le commentaire donne « exactement ce que `trim()` ôte d'un nom d'accord ». Le commentaire ne parle que des contrôles (`trim()` ôte aussi `Zs`, U+2028, U+2029 et U+FEFF). Le ticket le dit et le texte de la note lui est imposé mot pour mot, donc rien à corriger.
