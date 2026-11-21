# Petits correctifs du gate, des tranches et du skill relecture : un nom d'accord à caractère de contrôle passe, la limite `await`/`yield` de `codeSeul` n'est pas écrite, un rapport vide de `/security-review` n'est pas une preuve

Status: Fait — PR 145 (`5bf4f39`, plugin 7.37.3)
Type: défaut
Label: contre-revue
Modèle: sonnet. Trois petits défauts mesurés, chacun avec sa décision, ses fichiers, ses cas et ses mutations. Le changement entier est donné : une expression régulière à changer, des phrases à écrire mot pour mot, deux tests à ajouter, dont le texte est ci-dessous. Rien n'est à concevoir ; les décisions de l'architecte sont `A-170`, `A-175`, `A-177` et `A-178`.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs` et `tickets.test.mjs` dans le même dossier, `scripts/tranches.mjs` et `scripts/tranches.test.mjs`, `skills/chaine/relecture/SKILL.md`, `skills/chaine/relecture/references/prompt-regles.md` et `verdict.md`, `scripts/relecture.test.mjs` : aucune PR ouverte ne les touche (les PR 44 et 56 sont les seules ouvertes, au 2026-11-20). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : la PR 44 les touche aussi ; la note s'écrit en tête au moment de livrer, sur la version de `main` d'alors.

## Le besoin

Ce ticket tient trois décisions de l'architecte, dans la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` de la branche de documentation. `A-175` envoie le refus de `\p{Cc}` dans un nom d'accord au prochain ticket du gate `tickets`, avec un cas de banc. `A-177` a refait la lecture de la `/` dans `codeSeul` sur certitude ; il reste une limite, qui n'est écrite nulle part : `await` et `yield`. `A-178` (commit `aa4f04c` de la branche de documentation) tire d'une sonde de C4 deux phrases pour le skill `relecture` ; la spec les envoie « dans le prochain ticket du skill `relecture` ».

Les faits sont lus sur `origin/main` à `4cd047f` (plugin 7.37.2), sur un clone neuf, avec Node 22.23.5 et git 2.43.0. Les numéros de ligne sont ceux de `4cd047f`. Les gates `tickets` s'importent par `module()` de `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs` (le banc pose `identifiants.mjs` du socle à côté).

### 1. Un nom d'accord de `Sensibles:` qui porte un caractère de contrôle passe (`A-175`)

**Le fait.** `ecartsSensibles` (`tickets-regles.mjs:459`) refuse, depuis `A-170`, un nom d'accord « avec un caractère invisible ou une espace autre que l'espace ordinaire » (ligne 481, motif `/\p{Cf}|(?! )\p{Z}/u`). Une tabulation, un `\v`, un `\f` ou U+0085 (NEL) ne sont ni `\p{Cf}` ni `\p{Z}` : ils sont `\p{Cc}`, et passent. Pourtant une tabulation est une espace autre que l'espace ordinaire, et ne se voit pas.

**La mesure.** Sur `4cd047f`, la valeur du défaut :

```
$ node m2.mjs        # module("verify/tickets-regles.mjs"), puis ecartsSensibles(`a — accord de la${c}MOA, 2026-11-19`)
nom avec "\t" -> []
nom avec "\u000b" -> []
nom avec "\f" -> []
nom avec U+0085 -> []
nom avec "\u0000" -> []
nom avec U+007F -> []
repro: []         # ecartsSensibles('a — accord de la\tMOA, 2026-11-19')
```

Les six rendent `[]` : le nom est accepté. `trim()` n'y change rien, vérifié (`nom = accord.slice(0, j).trim()`, ligne 475 ; `\v` pour vertical, `\f` pour saut de page) :

```
"\t"  milieu: "a\tb"   | bouts: "a"
"\v"  milieu: "a\vb"   | bouts: "a"
"\f"  milieu: "a\fb"   | bouts: "a"
U+0085 milieu: gardé   | bouts: gardé       (`"la MOA\u0085".trim()` garde U+0085)
```

`trim()` retire une tabulation, un `\v` ou un `\f` **aux bouts** seulement ; au milieu du nom, rien. U+0085 n'est pas une espace pour `trim()` : il reste, même au bout. Le nouveau motif sur le nom rogné :

```
"la\tMOA"  avant: false  après: true      "la\u0085MOA"  avant: false  après: true
"la\vMOA"  avant: false  après: true      "la\u0000MOA"  avant: false  après: true
"la\fMOA"  avant: false  après: true      "la MOA\u0085" avant: false  après: true
"Camille\u00a0Martin" avant: true après: true     "la MOA" avant: false après: false
```

**Le gate reste sans effet sur les tickets réels.** Le gate lit une ligne `Sensibles:` sous toutes les formes de `fusionner` (`A-113`) : `Sensibles:`, `- Sensibles:`, `* Sensibles:`, `**Sensibles:**`, sans égard à la casse (`ligneDEnTete`, `tickets-regles.mjs:177`). Le compte se fait avec cette expression, `^(?:[-*][ \t]+)?\**Sensibles\**\s*:\**\s*(.*)$` en `i`, sur chaque ligne de chaque `.md` sous `docs/`, sur un clone neuf :

| Arbre | Tickets `.issue.md` | Lignes `Sensibles:` lues (toute forme) | Dont dans un en-tête | Dont un caractère `\p{Cc}` |
| --- | --- | --- | --- | --- |
| `main` à `4cd047f` | 77 | 0 | 0 | 0 |
| branche de documentation à `d7246cc`, sans le ticket 65 | 91 | 1 : le ticket 55, ligne 877, dans le corps | 0 | 0 |

Aucune ligne d'en-tête ne porte donc de nom d'accord : le correctif n'a aucun effet sur les tickets réels. (Un premier compte, fait par `^Sensibles:` seul, ne couvrait pas les formes `- `, `**` ni la casse ; il donnait les mêmes nombres.)

Le gabarit `skills/chaine/tickets/references/gabarits/ticket.issue.md` porte une ligne `Sensibles:` à gabarit `{{…}}` : sans caractère de contrôle, elle reste refusée par la branche du gabarit, comme avant.

### 2. `await` et `yield` pris pour identifiants : la limite de `codeSeul` n'est pas écrite (`A-177`)

**Le fait.** `scripts/tranches.mjs` met `await` et `yield` dans `MOTS_AVANT_REGEX` (ligne 50) : une `/` qui les suit ouvre une expression régulière. Dans un module, c'est juste : ces mots y sont réservés, jamais un identifiant. Dans un script (`.cjs`), `await` et `yield` peuvent nommer une variable, et la `/` est alors une division. `codeSeul` blanchit tout ce qu'il croit être le corps d'une expression régulière, et un appel y disparaît :

```
$ node m.mjs    # codeSeul / aDesSousTests de tranches.mjs à 4cd047f
"var await = 4; x = await /                          / e;"
aDesSousTests(await) : false      # attendu true : `t.test("y", f)` est un sous-test
aDesSousTests(yield) : false      # var yield = 4; x = yield / 2; t.test("y", f); c = d / e;
```

La source était `var await = 4; x = await / 2; t.test("y", f); c = d / e;` : de ` 2; t.test("y", f); c = d ` il ne reste que des espaces.

**Pourquoi c'est hors domaine.** `scripts/poses.test.mjs` ne donne à `codeSeul` que des `.test.mjs`, des modules : sa liste `bancs` (`const bancs = ["scripts/chaine", "scripts/github"].flatMap(…)`) porte `.filter((n) => n.endsWith(".test.mjs"))` (ligne 78), et `aDesSousTests` n'est appelé qu'une fois, sur la source d'un banc de cette liste. La limite ne se montre donc jamais ici. Elle n'est écrite ni dans l'en-tête de `codeSeul` ni dans un test.

**Un test du filtre existe-t-il ?** Cherché : non. `scripts/tranches.test.mjs:170` filtre aussi sur `.test.mjs`, mais c'est son propre filtre, sur les dossiers que `POSES` pose ; il ne lit pas celui de `poses.test.mjs`. Aucun autre fichier de `scripts/` ne le lit (`grep -rn 'endsWith(".test.mjs")' scripts/*.test.mjs` : `tranches.test.mjs:170`, `relecture.test.mjs:714` — celui-là retire les `.test.mjs` —, `un-seul-environnement-de-banc.test.mjs:21`). Le test est à ajouter.

### 3. Le clone de C4 et le rapport vide de `/security-review` (`A-178`)

**Le fait.** La sonde que demandait `A-162` a joué deux montages de C4, par une session principale (`A-178`) :

- **Le clone hors des dossiers de travail** (le scratchpad) : le `cd` ne tient pas. Le préambule de la commande et chaque sous-agent lisent la base, et le filtre de faux positifs écarte deux fois une faille réelle, à 1/10, parce qu'il a lu le fichier de la base.
- **Le clone tel que `gestes.sh c4` le pose** (`<session>/.relecture-securite`, dans le dossier de la session) : le `cd` tient, le préambule lit le diff de la PR, chaque sous-agent tourne dans le clone. Mais une injection réelle, notée 7/10 par le filtre, est écartée par le seuil de 8 de la commande, et **le rapport final est vide**.

Ces mesures sont celles d'`A-178`, jouées par l'architecte : elles ne sont pas rejouées ici.

**Ce que le skill dit aujourd'hui, à `4cd047f`.** `skills/chaine/relecture/SKILL.md`, étape 5, `C4` (ligne 95) : le clone se prépare par `gestes.sh c4`, la session s'y place, vérifie, lance la commande, revient. Aucune phrase ne dit que le clone reste dans le dossier de la session, ni pourquoi. `references/prompt-regles.md` (l'axe Règles, 51 lignes) et `references/verdict.md` (règle de `/security-review:`, ligne 47) ne disent rien d'un rapport vide : un lecteur peut en tirer « `/security-review` n'a rien rendu, donc pas de faille ». Le test du dépôt `scripts/relecture.test.mjs` n'exige aucune de ces phrases (`grep -n "A-178\|rapport vide" scripts/relecture.test.mjs` : rien).

## Où

- `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `ecartsSensibles`, le motif de la ligne 481 et son commentaire.
- `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, le test « Sensibles: `—`, ou des chemins puis l'accord (nom, date), passe ; toute autre forme est refusée, en temps borné » (ligne 177), la liste des noms de l'A-170.
- `scripts/tranches.mjs`, l'en-tête (JSDoc) de `codeSeul`, ligne 58.
- `scripts/tranches.test.mjs`, un test nouveau, placé après « aucun banc posé du plugin n'est pris pour un banc à sous-tests, et aucun n'est dans le doute ».
- `skills/chaine/relecture/SKILL.md`, étape 5, `C4`, après le paragraphe qui finit par « `revenir` en échec : la rejouer une fois ; encore, `C4` est « non exécuté », la cause écrite. ».
- `skills/chaine/relecture/references/prompt-regles.md`, avant « Gravité, deux seulement : ».
- `skills/chaine/relecture/references/verdict.md`, la puce `/security-review:`, à la fin, après « L'en-tête n'a pas de mot pour « non lancée » : la machine lirait le verdict illisible. ».
- `scripts/relecture.test.mjs`, un test nouveau, juste avant « chaque prompt lit le code dans l'arbre à part… » ; il utilise `exigerDans`, `SKILL` et `REFERENCES`, déjà dans le fichier.
- `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`.

Le gate `tickets` est posé dans les projets par `poser` : le défaut 1 corrige le script du skill, pas les projets qui ne reposent pas. Le défaut 3 ne change que du texte de skill : `gestes.sh` et les prompts des autres axes ne changent pas.

## Décisions

### Défaut 1 : un nom d'accord s'écrit sans caractère de contrôle

1. **Le motif devient `/\p{Cf}|\p{Cc}|(?! )\p{Z}/u`**, sous le même message : `nom d'accord avec un caractère invisible ou une espace autre que l'espace ordinaire`. Le message d'`A-170` ne change pas : il dit déjà la cause, et une tabulation en est une. Le refus se tient sur le nom rogné, comme aujourd'hui : une tabulation en bout de nom est retirée par `trim()` avant, et ne rend pas le nom autre (choix écrit, voir « Ce qui n'est pas établi »).
2. **Le commentaire de la ligne 479 gagne une ligne `A-175`** : un caractère de contrôle (`\p{Cc}`) en est aussi, `trim()` ne retirant que ceux des bouts.
3. **Raison.** Un nom d'accord se recopie à la main : un caractère qui ne se voit pas fait deux noms là où l'œil n'en lit qu'un (`A-170`). Le motif `\p{Cc}` couvre d'un trait la tabulation, `\v`, `\f`, U+0085, NUL et DEL ; énumérer `[\t\v\f]` laisserait passer U+0085.

### Défaut 2 : l'en-tête de `codeSeul` dit que la lecture vaut pour un module

4. **L'en-tête de `codeSeul` gagne une phrase**, après « ou `null` dans le doute. », et rien d'autre dans le fichier ne change :

   ```
    * blanchi (fins de ligne, délimiteurs et code des `${…}` gardés), ou `null` dans le doute. Elle lit une source de module,
    * seule que `poses` lui donne (des `.test.mjs`) : `await` et `yield` y sont réservés, jamais un identifiant, donc une `/` qui
    * les suit ouvre une expression régulière ; dans un script (`.cjs`) où ils nomment une variable, `x = await / 2` serait lu à
    * tort comme une expression régulière, et cacherait un appel.
   ```

   Le comportement de `codeSeul` ne change pas : une lecture de module est le domaine, et la liste fermée d'`A-177` reste.
5. **Un test tient le domaine** : le filtre de `poses.test.mjs` ne retient que des `.test.mjs`, et `aDesSousTests` n'y lit que ces bancs. Le test est donné entier (Cas de test). Si ce filtre change un jour (un `.cjs` entre dans les bancs), le test rougit, et la limite doit être levée avant, pas après.
6. **Raison.** La limite est vraie et sans effet aujourd'hui ; l'écrire à l'endroit où l'on lit `codeSeul`, et tenir par un test que `poses` n'en sort pas, coûte une phrase et un test. Lever la limite (lire `await` comme un identifiant dans un script) demanderait de savoir si la source est un module : un analyseur, que `A-177` refuse.

### Défaut 3 : le clone de C4 reste dans la session, et un rapport vide n'est pas une preuve

7. **`SKILL.md`, étape 5, `C4`.** Un paragraphe est ajouté, en retrait comme le paragraphe qui le précède (« La première ligne, puis la commande… »), juste après lui. Il est écrit **mot pour mot** :

   ```
   Le clone de `C4` reste dans le dossier de la session, jamais hors des dossiers de travail : hors d'un dossier de travail, le `cd` ne tient pas, la commande et ses sous-agents lisent la base, et le filtre de faux positifs écarte une faille réelle.
   ```

   Il commence par deux espaces, comme les autres paragraphes de la puce `C4`, et est suivi d'une ligne vide avant le titre « Étape 6 ». `c4-verifier` refuse déjà un dossier courant qui n'est pas le clone (`A-178` (2)) : le texte dit pourquoi, il ne change aucun script.
8. **`references/prompt-regles.md`**, avant la ligne « Gravité, deux seulement : » et avec une ligne vide de part et d'autre, **mot pour mot** :

   ```
   Un rapport vide de `/security-review` ne vaut pas absence de faille : tu appliques tes critères d'injection et de chemins sensibles au diff entier, quoi qu'une commande de sécurité ait rapporté ou non.
   ```

   Le prompt parle à l'axe, qui ne sait rien de la session ni de C4 : la phrase ne cite donc pas « C4 » ni le rapport de la session, et ne change aucun marqueur du prompt.
9. **`references/verdict.md`**, à la fin de la puce `/security-review:`, après « … la machine lirait le verdict illisible. », séparée par une espace, **mot pour mot** :

   ```
   Un rapport vide de `/security-review` ne vaut pas absence de faille : l'axe Règles garde ses critères d'injection et de chemins sensibles sur le diff entier, quel que soit le rapport de `C4`, et le verdict ne cite jamais `/security-review` comme preuve qu'une faille manque.
   ```
10. **Un test de dépôt exige les trois passages** : les deux phrases d'`A-178` (la première en `SKILL.md`, la seconde en `verdict.md`) et celle du prompt de l'axe Règles. Il est donné entier (Cas de test).
11. **Raison.** `A-178` : la commande intégrée juge à son seuil, la relecture juge à ses critères ; l'une ne remplace pas l'autre. Un rapport vide dit seulement que rien n'a passé le seuil. `A-178` (1) laisse C4 tel qu'il est dans `main` : ce ticket n'en change ni le script ni la vérification.

## Cas de test

Les cas du défaut 1 sont vus rouges avant le correctif, puis verts. Celui du défaut 2 est un garde : vert avant et après, il tient le domaine ; ce sont ses mutations qui le prouvent.

| Défaut | Cas | Avant |
| --- | --- | --- |
| 1 | `tickets.test.mjs`, la liste des noms d'`A-170` complétée de sept noms : `la\tMOA`, `la\vMOA`, `la\fMOA`, `la\u0085MOA`, `la\u0000MOA`, `la\u007fMOA`, `la MOA\u0085`. Chacun donne un seul écart, au message `/accord de « .* » : nom d'accord avec un caractère invisible ou une espace autre que l'espace ordinaire$/su`. | rouge : `0 !== 1` sur `la\tMOA`, les sept rendent `[]` |
| 1 | Les noms déjà dans la liste (`Camille\u00a0Martin`, `\u200b`, U+200C, U+200D…) restent refusés par le même message ; `Camille Martin` et les valeurs valides du test passent. | vert avant et après |
| 1 | `tickets.test.mjs`, la liste des valeurs qui passent complétée de `scripts/chaine/passer.sh — accord de la MOA\t, 2026-11-19` (le nom est `la MOA` suivi d'une tabulation, avant la virgule) : `ecartsSensibles` rend `[]`. Il fige le choix de la décision 1 : `trim()` retire la tabulation du bout, le nom lu est propre. | vert avant et après (garde) |
| 2 | `tranches.test.mjs`, test nouveau, entier ci-dessous. | vert avant et après (garde) |
| 3 | `scripts/relecture.test.mjs`, test nouveau « C4 : le clone reste dans le dossier de la session, et un rapport vide de `/security-review` ne vaut pas absence de faille (A-178) », entier ci-dessous. | rouge : `skills/chaine/relecture/SKILL.md : passages absents : Le clone de \`C4\` reste dans le dossier de la session…`, 38 réussis sur 39 ; le test échoue aussi sur `prompt-regles.md` et `verdict.md` tant que leurs phrases manquent |

Le test du défaut 2, à ajouter dans `scripts/tranches.test.mjs` avant « le motif d'une liste de noms est ancré et lit chaque caractère à la lettre » :

```js
test("le filtre de `poses.test.mjs` ne retient que des `.test.mjs` : `codeSeul` ne lit que des modules", () => {
  const racine = fileURLToPath(new URL("..", import.meta.url));
  const poses = lire(join(racine, "scripts/poses.test.mjs"), "utf8");
  // La liste des bancs que `poses` lit : un seul `.filter(…)`, sur le suffixe `.test.mjs`.
  const bancs = /const bancs = [^;]*;/.exec(poses)?.[0];
  assert.ok(bancs, "la liste `bancs` de `poses.test.mjs` n'est plus lue");
  assert.equal((bancs.match(/\.filter\(/g) ?? []).length, 1, bancs);
  assert.match(bancs, /\.filter\(\(n\) => n\.endsWith\("\.test\.mjs"\)\)/);
  // Rien d'autre que ces bancs n'est donné à `aDesSousTests` : la source lue est celle d'un banc de la liste.
  assert.equal((poses.match(/aDesSousTests\(/g) ?? []).length, 1);
  assert.match(poses, /const source = readFileSync\(join\(projet, banc\), "utf8"\);\s*return travaux\(banc, nomsDesTests\(source\), TAILLE, \{ entier: aDesSousTests\(source\), source \}\)/);
});
```

`fileURLToPath`, `join` et `lire` (`readFileSync`) sont déjà importés par `tranches.test.mjs`.

Le test du défaut 3, à ajouter dans `scripts/relecture.test.mjs`, juste avant « chaque prompt lit le code dans l'arbre à part… » :

```js
// A-178 : le clone de C4 reste dans le dossier de la session ; un rapport vide de `/security-review` ne vaut pas absence de faille.
test("C4 : le clone reste dans le dossier de la session, et un rapport vide de `/security-review` ne vaut pas absence de faille (A-178)", () => {
  exigerDans(`${SKILL}/SKILL.md`, ["Le clone de `C4` reste dans le dossier de la session, jamais hors des dossiers de travail : hors d'un dossier de travail, le `cd` ne tient pas, la commande et ses sous-agents lisent la base, et le filtre de faux positifs écarte une faille réelle."]);
  exigerDans(`${REFERENCES}/prompt-regles.md`, ["Un rapport vide de `/security-review` ne vaut pas absence de faille : tu appliques tes critères d'injection et de chemins sensibles au diff entier, quoi qu'une commande de sécurité ait rapporté ou non."]);
  exigerDans(`${REFERENCES}/verdict.md`, ["Un rapport vide de `/security-review` ne vaut pas absence de faille : l'axe Règles garde ses critères d'injection et de chemins sensibles sur le diff entier, quel que soit le rapport de `C4`, et le verdict ne cite jamais `/security-review` comme preuve qu'une faille manque."]);
});
```

`exigerDans` compare après avoir ramené les blancs à une espace : un retour à la ligne dans le texte du skill ne casse pas la phrase, mais un mot changé la casse.

## Mutations

Chacune appliquée seule, le test joué, le fichier restauré ; un passage témoin vert précède chaque série (`tranches.test.mjs` : 16 tests, 0 échec ; `tickets.test.mjs` : 36 tests, 0 échec ; `relecture.test.mjs` : 39 tests, 0 échec avec le défaut 3 appliqué). Résultats mesurés sur `4cd047f` avec le changement appliqué :

| Série | Mutation | Issue |
| --- | --- | --- |
| Défaut 1 | `\p{Cc}` retiré du motif | rouge, 1 échec |
| Défaut 1 | `\p{Cc}` remplacé par `\t` seul | rouge |
| Défaut 1 | `\p{Cc}` remplacé par `[\t\v\f]` (sans U+0085, NUL, DEL) | rouge |
| Défaut 1 | refus des caractères de contrôle ajouté par `\|\| /[\t]/.test(nom)` seulement | rouge |
| Défaut 1 | `\p{Cc}` sous le message du gabarit (« pas un identifiant de session ni un gabarit ») | rouge |
| Défaut 1 | refus testé sur le nom brut, avant `trim()` (`/\p{Cc}/u.test(accord.slice(0, j))`) | rouge, 35 réussis sur 36 : le cas `la MOA\t` rend un écart au lieu de `[]` |
| Défaut 2 | `poses.test.mjs` : le filtre passe sur `.mjs` | rouge |
| Défaut 2 | le filtre est retiré | rouge |
| Défaut 2 | le filtre accepte aussi `.cjs` | rouge |
| Défaut 2 | un second `.filter(…)` est ajouté à la liste | rouge |
| Défaut 2 | `aDesSousTests` lit une autre source que celle du banc | rouge |
| Défaut 2 | un second appel à `aDesSousTests` est ajouté | rouge |
| Défaut 3 | `SKILL.md` : le paragraphe du clone retiré | rouge, 38 réussis sur 39 |
| Défaut 3 | `SKILL.md` : « jamais hors des dossiers de travail » retiré | rouge |
| Défaut 3 | `SKILL.md` : la raison (« et le filtre de faux positifs écarte une faille réelle ») retirée | rouge |
| Défaut 3 | `prompt-regles.md` : la phrase retirée | rouge |
| Défaut 3 | `prompt-regles.md` : « au diff entier » devient « aux lignes ajoutées » | rouge |
| Défaut 3 | `verdict.md` : la phrase retirée | rouge |
| Défaut 3 | `verdict.md` : « et le verdict ne cite jamais `/security-review` comme preuve… » retiré | rouge |

## Surfaces

| Surface | Preuve |
| --- | --- |
| `ecartsSensibles`, le refus d'un caractère de contrôle dans un nom d'accord | `tickets.test.mjs`, la liste des noms d'`A-170` : sept noms rouges avant, verts après ; le cas `la MOA\t` qui passe ; 5 mutations rouges et la mutation « nom brut » rouge |
| `codeSeul`, l'en-tête et sa limite `await`/`yield` | relue (texte) ; le comportement ne change pas, `tranches.test.mjs` existant vert |
| Le filtre de `poses.test.mjs` (`.test.mjs` seul) | `tranches.test.mjs`, le test nouveau du défaut 2 : 6 mutations rouges |
| `SKILL.md`, étape 5, `C4` : le clone reste dans la session | `relecture.test.mjs`, le test nouveau : rouge sans la phrase, 3 mutations rouges |
| `references/prompt-regles.md` : un rapport vide n'est pas une preuve | le même test : phrase retirée et « au diff entier » changé, 2 mutations rouges |
| `references/verdict.md` : le verdict ne cite pas `/security-review` comme preuve | le même test : phrase retirée et fin de phrase retirée, 2 mutations rouges |
| version et note | les tests de version existants de `depot.test.mjs` |

## Vérification

1. Le rouge, avant le correctif : les sept noms ajoutés à la liste d'`A-170`, `node --test skills/chaine/tickets/references/scripts/verify/tickets.test.mjs` rouge (`# pass 35`, `# fail 1`) ; le test du défaut 3 ajouté, `node --test scripts/relecture.test.mjs` rouge (`# pass 38`, `# fail 1`). Le recopier dans la PR.
2. Le vert, après : le même banc vert (36 tests), `node --test scripts/tranches.test.mjs` vert (16 tests), `node --test scripts/relecture.test.mjs` vert (39 tests).
3. La mesure du fait rejouée sur la branche : `ecartsSensibles('a — accord de la\tMOA, 2026-11-19')` rend un écart, au message d'`A-170`.
4. Le gate sans effet sur les tickets réels : recompter sur la branche, sous `docs/`, les lignes que le gate lit comme `Sensibles:` (l'expression de `ligneDEnTete`, toute forme, toute casse) puis celles qui portent un `\p{Cc}`, tabulation comprise ; attendu 0 en en-tête et 0 avec `\p{Cc}`. Jouer le gate `tickets` sur `docs/` : même issue qu'avant.
5. La suite entière, `pnpm test`, verte d'un seul tenant, avec son nombre de tests, sa durée et la charge (`nproc`, `uptime` avant et après).
   - **Un essai** sur `4cd047f`, quatre cœurs, avec les défauts 1 et 2 appliqués : `node --test` sur les quatre motifs de `pnpm test`, `# tests 1222`, `# pass 1222`, `# fail 0`, `# duration_ms 693949`, 11 min 34 s. La charge n'a pas été notée à chaque bord, et d'autres essais de ce poste tournaient pendant ce temps : la durée ne se compare pas à celle de la CI. Les textes du défaut 3 ont été écrits **pendant** cet essai : il ne les couvre pas, ni le test qui les tient ; `relecture.test.mjs` seul les couvre (39 tests verts, après).
6. Les mutations du tableau, chacune seule, le fichier restauré.

## Version

Rien ne change pour un projet, sauf le script `tickets-regles.mjs`, qu'un projet reçoit en reposant ; le défaut 3 est du texte de skill, que chaque session reçoit avec le plugin. C'est donc le troisième nombre, sur **la suivante de `main` au moment de livrer** (7.37.3 si `main` est encore à 7.37.2 : la PR 44 peut la prendre avant). Aucun test n'écrit de version en dur ; les tests de version existants de `depot.test.mjs` suffisent. La note de `NOTES-DE-VERSION.md` dit : pour un projet, un nom d'accord de `Sensibles:` qui porte une tabulation ou un autre caractère de contrôle est refusé, sous le message d'`A-170` ; pour qui joue la CI du plugin, l'en-tête de `codeSeul` écrit sa limite et un test tient le domaine de `poses` ; pour le skill `relecture` (qui ne se pose pas dans un projet : il se charge depuis le plugin), le clone de C4 reste dans la session et un rapport vide de `/security-review` n'est pas une preuve.

## Ce qui n'est pas établi

- **Le refus d'un caractère de contrôle en bout de nom.** `trim()` retire la tabulation, `\v` et `\f` aux bouts ; le motif est joué sur le nom rogné, donc un tel caractère au bout n'est pas refusé. U+0085, lui, est refusé partout. C'est le choix de la décision 1, figé par le cas `la MOA\t` : un blanc ordinaire au bout est déjà retiré de la même façon, et le nom lu est le même.
- **Aucun fichier réel n'écrit de `Sensibles:` en en-tête** (0 ligne d'en-tête sur `main` et sur la branche, selon la forme que lit le gate). Le correctif n'a donc aucun effet mesurable sur le dépôt, c'est voulu (`A-175`) ; sa preuve est celle du banc.
- **La limite `await`/`yield` est écrite, pas levée.** Un `.cjs` donné à `codeSeul` donnerait un faux négatif ; le test tient que `poses` n'en donne pas, il ne tient pas qu'aucune autre surface futur n'appellera `codeSeul`.
- **Les deux mesures d'`A-178` ne sont pas rejouées ici.** Elles viennent de la spec (une session principale, deux montages). Ce ticket n'écrit que les phrases qu'`A-178` décide ; il ne prouve pas que `/security-review` rende un rapport vide sur une injection réelle.
- **Le test du défaut 3 tient des phrases, pas un comportement.** Il garantit que le skill dit la limite ; il ne garantit pas qu'une session ou un axe la suive. L'axe Règles ne reçoit pas le rapport de C4 (il tourne avant, sans contexte) : la phrase du prompt tient son critère, rien de plus.
- **Le test du défaut 2 lit le source de `poses.test.mjs` par expressions régulières.** Un renommage de `bancs` ou de `source` le fait rougir sans qu'une vraie faute soit survenue : c'est un rouge qui dit « relis le domaine », pas une preuve de comportement.

## Hors périmètre

- Les caractères de contrôle ailleurs dans `ecartsSensibles` (les chemins le refusent déjà par `/[\s`{}\\]/`, une tabulation y est un blanc ; la date est lue par `AAAA-MM-JJ`).
- Un analyseur de JavaScript pour `codeSeul`, qui lirait `await` selon la nature de la source (`A-177` le refuse).
- Le gate `tickets` sur `Relecture:` et les autres lignes.
