# La commande du skill en tête du prompt de lancement : un conducteur ou un capitaine charge son skill, patch du plugin

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — tous les textes à écrire sont donnés ci-dessous, mot pour mot ; le test est donné entier ; rien n'est à concevoir.
Blocked by: 17 (même ligne `skills/chaine/socle-chaine-de-production/SKILL.md:32` ; le 17 est livré, PR 79, plugin 7.3.0 : la session part d'un `main` où il est entré)
Dépendances: —
Fichiers chauds: `skills/chaine/architecte/references/lancement.md`, `skills/chaine/architecte/SKILL.md`, `skills/chaine/architecte/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait rapporté**, le 2026-11-14, par l'architecte d'un autre projet qui utilise le plugin : « `architecte/references/lancement.md` : un prompt qui dit « lis et suis /maj-skills:chantier » ne charge pas le skill (disable-model-invocation) ; le conducteur s'est arrêté pour « skill absent ». Seule la commande EN TÊTE du prompt de create_session le charge (vérifié pour chantier et pour un /fusionner de projet). »

**Précision reçue ensuite du même architecte.** Le prompt de son premier conducteur avait été écrit d'après `lancement.md` d'une version 6.x du plugin, dont le repli était seulement « S'il n'est pas parmi tes skills : écris-le-moi (send_message) et arrête-toi, sans rien improviser » (texte posé par `cf83baf`, ticket 13, et resté tel quel jusqu'à la 7.1.x) : le conducteur l'a suivi à la lettre, d'où l'arrêt. Le repli par lecture du fichier n'était pas dans ce prompt. Le second conducteur, lancé avec la commande en tête du prompt, a chargé le skill sans avoir besoin d'aucun repli.

**Ce qui reste à corriger sur `main` (`c9a6055`, plugin 7.2.0).** Le repli de 7.2.0 donne déjà la lecture du fichier (`lancement.md:13`, `:31` : installer le plugin, puis « lis ~/.claude/plugins/marketplaces/maj/skills/chaine/<nom>/SKILL.md ») : il ne manque pas. Le défaut restant est **la place de la commande** : les deux gabarits qui confient un rôle dont le skill est marqué `disable-model-invocation: true` (`chantier`, `fusionner`) la mettent dans le corps du prompt, sur la deuxième ligne, derrière « lis et suis », où elle ne charge rien. Deux défauts en découlent :

1. **La condition du repli est toujours vraie pour un skill marqué.** « S'il n'est pas parmi tes skills » : la documentation dit qu'un skill marqué n'est jamais dans le contexte du modèle (citations ci-dessous). Une session lancée par le gabarit actuel prend donc toujours le repli, même plugin installé ; elle n'en sort que si elle ose lire le fichier, ce qu'aucune session réelle n'a encore montré.
2. **Le repli peut se heurter au refus de l'outil Skill.** Une session qui tente d'abord d'invoquer le skill marqué est bloquée, et la documentation dit qu'elle reçoit alors la consigne de ne pas refaire la procédure autrement : la lecture du fichier qui suit peut être refusée par la session elle-même. Le repli doit donc dire, sans ambiguïté, que le skill se **lit** comme un fichier et ne s'invoque pas.

Hors des prompts de lancement, la même erreur est écrite à deux endroits du plugin : `architecte/SKILL.md:28` fait vérifier `/maj-skills:chantier` et `/maj-skills:fusionner` « parmi les skills de la session », ce qu'aucune session ne peut voir ; `socle-chaine-de-production/SKILL.md:32` fait invoquer `/maj-skills:fusionner poser` par le modèle, ce que le drapeau refuse.

Quand le ticket est fait : le prompt d'un conducteur commence par `/maj-skills:chantier <nom>`, celui d'un capitaine par `/maj-skills:fusionner`, le reste après ; le repli ne se déclenche que sur le plugin absent, et dit de lire le fichier ; aucun `SKILL.md` ne demande au modèle la commande d'un skill marqué ; un test du dépôt le garde.

### Ce que dit la documentation de Claude Code

Page des skills, `https://code.claude.com/docs/en/skills`, lue le 2026-11-14 :

- Référence de l'en-tête : `disable-model-invocation` — « Set to `true` to prevent Claude from automatically loading this skill. Use for workflows you want to trigger manually with `/name`. »
- « **`disable-model-invocation: true`**: Claude can't invoke the skill on its own. » ; et, dans la table « Invocation and context » : « You can invoke: Yes ; Claude can invoke: Not on its own ; Description not in context, full skill loads when invoked ».
- « **Hide individual skills** by adding `disable-model-invocation: true` to their frontmatter. This removes the skill from Claude's context entirely. »
- « If Claude tries anyway, Claude Code blocks the call and instructs it not to reproduce the deploy steps another way ».
- « To run a skill directly, put its name at the start of your message. After plain text, the name gives Claude permission to run the skill but doesn't run it » ; table : « At the start of your message | `/deploy staging` | Claude Code runs the skill directly ».
- « Through the Agent SDK or `claude -p`, Claude Code loads only the first skill, with the rest of the line as its arguments. »

Ce que la page **ne dit pas** : si un prompt de `create_session` est traité comme un message tapé (la commande en tête y charge le skill) ; si les lignes qui suivent la première arrivent au modèle avec le skill ; si le modèle peut lire le `SKILL.md` d'un skill marqué avec son outil de lecture (aucune phrase ne l'interdit ni ne le permet). Les deux premiers points ne sont qu'**observés** par l'architecte qui a rapporté le fait (commande en tête : skill chargé, pour `chantier` et pour un skill de projet) ; le troisième n'a été vu nulle part. La page dit seulement que le reste de la **première ligne** devient les arguments du skill (substitués à `$ARGUMENTS`, ou ajoutés en « ARGUMENTS: <valeur> » quand le skill n'a pas de placeholder, ce qui est le cas de `chantier/SKILL.md`) ; elle ne dit rien des lignes suivantes ni de `create_session`. Le risque que les lignes 2 et suivantes du prompt soient tronquées, ou prises pour des arguments, n'est donc pas écarté par la documentation. Les trois points sont la sonde de l'architecte, après la fusion (§ Vérification).

### Pourquoi ces trois skills portent le drapeau, et pourquoi il reste

`fusionner` (`fa90696`), `chantier` (`b3d3d36`) et `architecte` (`5a5e4f3`, ticket 6 : « `disable-model-invocation: true` : le skill se lance à la main ») le portent depuis leur création. La raison se lit dans leurs descriptions : `fusionner` « À lancer dans UNE seule session, « Capitaine de fusion », jamais dans une session de travail » ; `chantier` « À lancer dans une session neuve dédiée » ; `architecte` « À lancer à la main dans une session ouverte par le produit ». Ce sont des **rôles**, un par session ; une session de travail qui chargerait `fusionner` d'elle-même se ferait capitaine (fusion, mise à jour de branches) à côté du capitaine en titre. C'est l'usage que la documentation donne au drapeau (« workflows with side effects or that you want to control timing »). La raison tient : **le drapeau reste**, et le remède le respecte — c'est la session qui lance (l'architecte, ou l'humain) qui choisit le rôle, par la première ligne du prompt.

Les skills non marqués (`revue-de-ticket`, `revue-adversariale`, `tickets`, `sujet`, les socles) ont leur description dans le contexte et le modèle peut les invoquer de lui-même (même table) : pour eux, « lis et suis /maj-skills:<nom> » suffit, et rien ne change.

## Où

Lignes de `origin/main` à `c9a6055` (2026-11-14, plugin 7.2.0). Les tickets 17, 19 et 20 s'écrivent en même temps ; si `main` a bougé, **la session retrouve chaque endroit par le texte cité**, pas par le numéro de ligne.

Relevé complet des endroits du plugin qui disent à une session de charger un skill (`git grep -n "maj-skills:\|lis et suis" origin/main -- skills README.md`), et ce qu'en fait ce ticket :

| Endroit | Ce qu'il dit | Ce ticket |
| --- | --- | --- |
| `skills/chaine/architecte/references/lancement.md:3` | « la consigne de lecture (le skill, par son nom `/maj-skills:<nom>`) » ; repli « skill absent de la session » | réécrit (point 1) |
| `skills/chaine/architecte/references/lancement.md:12-13` | conducteur : « lis et suis /maj-skills:chantier » sur la 2ᵉ ligne ; « S'il n'est pas parmi tes skills » | réécrit (point 1) |
| `skills/chaine/architecte/references/lancement.md:30-31` | capitaine : « lis et suis /maj-skills:fusionner » sur la 2ᵉ ligne | réécrit (point 1) |
| `skills/chaine/architecte/references/lancement.md:48` | session de ticket : « lis et suis … /maj-skills:revue-de-ticket » | **inchangé** : skill non marqué |
| `skills/chaine/architecte/SKILL.md:28` | « `/maj-skills:chantier` et `/maj-skills:fusionner` parmi les skills de la session » | réécrit (point 2) |
| `skills/chaine/architecte/SKILL.md:58` | « il porte **la consigne de lecture des skills**, **le repli** si le skill est absent » | réécrit (point 2) |
| `skills/chaine/architecte/references/CONTENU.md:5` | « avec la consigne de lecture des skills, son repli » | réécrit (point 3) |
| `skills/chaine/socle-chaine-de-production/SKILL.md:32` | « `/maj-skills:fusionner poser` » invoqué par le modèle | réécrit (point 4) |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:5` | « Pour lancer un chantier : `/maj-skills:chantier <objectif>` dans une session neuve » | **inchangé** : un humain la tape en tête de son message, c'est le geste documenté |
| `chaine-de-production.md:101-108` (gabarit d'une fille, § 5) et `:119` (`revue-de-ticket`) | aucun skill marqué | **inchangé** |
| `skills/chaine/chantier/SKILL.md:21`, `:23` | invoque `socle-chaine-de-production` et `socle-tests` (non marqués) ; « il en ouvre une avec le skill `fusionner` » (le produit) | **inchangé** |
| `skills/chaine/chantier/SKILL.md:72-74` | prompt d'une fille : le gabarit du § 5, aucun skill marqué | **inchangé** |
| `README.md:90` | « `/maj-skills:architecte`, `/maj-skills:fusionner` et `/maj-skills:chantier` chacun dans une session dédiée » | **inchangé** : lu par un humain |
| `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs:79-81` | le hook de démarrage signale le plugin absent (`installed_plugins.json`) | **inchangé** : c'est le signal que le repli lit désormais |

### 1. `skills/chaine/architecte/references/lancement.md`

**Ligne 3**, remplacer la phrase « Chaque prompt porte donc trois choses : **la consigne de lecture** (le skill, par son nom `/maj-skills:<nom>`), **le repli** et **les consignes du produit** (ci-dessous). Le repli : skill absent de la session (le hook de démarrage le signale), elle installe elle-même le plugin, puis lit le skill sous `~/.claude/plugins/marketplaces/maj/skills/chaine/<nom>/SKILL.md`, car un plugin installé en cours de session n'entre pas dans sa liste de skills ; si l'installation échoue, elle l'écrit à qui l'a lancée et s'arrête, sans improviser. » par :

```text
Chaque prompt porte donc trois choses : **la commande du skill**, **le repli** et **les consignes du produit** (ci-dessous). `chantier` et `fusionner` portent `disable-model-invocation: true` : une session ne peut pas les invoquer d'elle-même, et ils n'entrent jamais dans sa liste de skills ; seule leur commande **en première ligne** du prompt les charge (« To run a skill directly, put its name at the start of your message », documentation de Claude Code, page des skills). Plus bas dans le prompt, « lis et suis /maj-skills:chantier » ne charge rien : cas rapporté le 2026-11-14 par l'architecte d'un autre projet, dont le conducteur s'est arrêté pour « skill absent ». La première ligne du prompt d'un conducteur ou d'un capitaine est donc sa commande, seule avec ses arguments, et tout le reste vient après. Le drapeau reste : un rôle se choisit par la session qui lance, jamais par la session lancée. Les skills non marqués (`revue-de-ticket`, `revue-adversariale`, `tickets`, `sujet`) se chargent quand le prompt les nomme : « lis et suis » leur suffit. Le repli : la commande n'a rien chargé parce que le plugin manque (le hook de démarrage le signale) ; la session installe elle-même le plugin, puis **lit** le fichier du skill, `~/.claude/plugins/marketplaces/maj/skills/chaine/<nom>/SKILL.md`, avec son outil de lecture, et le suit : un plugin installé en cours de session n'entre pas dans sa liste de skills, et l'outil Skill refuse un skill marqué. Plugin installé mais commande sans effet : elle lit quand même le fichier. Si l'installation échoue ou si le fichier ne se lit pas, elle l'écrit à qui l'a lancée et s'arrête, sans improviser.
```

(Le reste de la ligne 3, de « Cas vécu le 2026-11-14 : deux sessions lancées » jusqu'à « n'a plus d'objet. », reste tel quel.)

**Bloc du conducteur, lignes 12-13**, les deux premières lignes du bloc `text` deviennent ces trois-là (les lignes 14 à 16 du bloc ne changent pas) :

```text
/maj-skills:chantier <nom du sujet, sans le préfixe sujet/>
Conducteur du chantier <nom>, programme <programme>, architecte : <session_id de cette session>.
Skills : la première ligne de ce prompt charge le skill chantier ; suis-le, ses références comprises, et tout skill qu'il invoque. Si elle n'a rien chargé (le hook de démarrage signale le plugin maj-skills absent) : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj` ; puis lis le fichier ~/.claude/plugins/marketplaces/maj/skills/chaine/chantier/SKILL.md avec ton outil de lecture et suis-le. Si le plugin est installé mais que la première ligne n'a rien chargé : lis quand même ce fichier, de la même façon. Ce skill ne s'invoque pas par l'outil Skill, il se lit : son absence de ta liste de skills n'est pas une raison de t'arrêter. Si l'installation échoue ou si le fichier ne se lit pas : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
```

**Paragraphe sous ce bloc** (ligne 19, « Ce que le conducteur fait de ce prompt est écrit dans `chantier/SKILL.md` ; le relire avant d'écrire le prompt : »), ajouter en tête de sa liste ce premier point :

```text
- la première ligne est l'argument du skill (`chantier/SKILL.md` § 0, point 1) : le nom du sujet, sans `sujet/`, le même que la ligne « Sujet : » du prompt ; au premier lancement, ce nom ne trouve encore rien sur `origin` (ni branche `sujet/<nom>` ni carte) : le conducteur passe au cadrage (§ 0, point 3), avec la spec et les lignes du prompt ; relancé sur ce nom, un conducteur de suite reprend à la phase écrite dans la carte ;
```

**Bloc du capitaine, lignes 30-31**, les deux premières lignes du bloc `text` deviennent ces trois-là (les lignes 32-33 du bloc ne changent pas) :

```text
/maj-skills:fusionner
Capitaine de fusion du dépôt <dépôt>, programme <programme>, architecte : <session_id de cette session>.
Skills : la première ligne de ce prompt charge le skill fusionner ; suis-le, ses références comprises. Si elle n'a rien chargé (le hook de démarrage signale le plugin maj-skills absent) : si `claude plugin marketplace list` ne rend pas maj, `claude plugin marketplace add MAJ-agency/skills` ; puis `claude plugin install maj-skills@maj` ; puis lis le fichier ~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/SKILL.md avec ton outil de lecture et suis-le. Si le plugin est installé mais que la première ligne n'a rien chargé : lis quand même ce fichier, de la même façon. Ce skill ne s'invoque pas par l'outil Skill, il se lit : son absence de ta liste de skills n'est pas une raison de t'arrêter. Si l'installation échoue ou si le fichier ne se lit pas : écris-le-moi (send_message) et arrête-toi, sans rien improviser.
```

Sans argument : `fusionner` prend `poser` ou un numéro de PR (`argument-hint`), et un capitaine ne reçoit ni l'un ni l'autre. **Un dépôt sans la chaîne** (pas de `.claude/chaine.json`, ligne 33, dans le bloc) : le skill `fusionner` ne s'y applique pas, sa procédure est dans le prompt ; la première ligne `/maj-skills:fusionner` et la ligne « Skills : » s'y **retirent**, le prompt commence à « Capitaine de fusion du dépôt ». Ajouter cette phrase à la fin du paragraphe sous le bloc (ligne 36, « La procédure du capitaine est celle du skill `fusionner` … un message ne l'élargira pas. ») :

```text
Ce prompt-là ne commence pas par `/maj-skills:fusionner` et n'a pas de ligne « Skills : » : le skill chargé contredirait la procédure donnée.
```

**Bloc de la session d'un ticket, ligne 48** : inchangé (skill non marqué). **Après le lancement, lignes 73 et 75** : inchangées.

### 2. `skills/chaine/architecte/SKILL.md` (106 lignes, autant après)

**Ligne 28**, la cellule de droite de la ligne « les skills de la chaîne » devient :

```text
le plugin `maj-skills` installé : le hook de démarrage ne le signale pas absent, et `test -f ~/.claude/plugins/marketplaces/maj/skills/chaine/chantier/SKILL.md` réussit. `chantier` et `fusionner` n'apparaissent jamais dans la liste des skills d'une session (`disable-model-invocation: true`) : ils ne se chargent que par leur commande en première ligne d'un prompt (`references/lancement.md`). Absent, l'architecte installe le plugin lui-même par les commandes de `references/lancement.md`, puis le dit au produit
```

**Ligne 58**, remplacer « il porte **la consigne de lecture des skills**, **le repli** si le skill est absent (l'installer soi-même) et **les consignes du produit** (§ 7). » par :

```text
il porte **en première ligne la commande du skill du rôle**, seule avec ses arguments (le skill d'un conducteur et celui d'un capitaine ne se chargent pas autrement), **le repli** si elle n'a rien chargé (installer soi-même le plugin, puis lire le fichier du skill) et **les consignes du produit** (§ 7).
```

Aucune autre ligne ne change ; la ligne 73 (« Un skill absent ») reste vraie.

### 3. `skills/chaine/architecte/references/CONTENU.md`

Ligne 5, remplacer « avec la consigne de lecture des skills, son repli (installer soi-même le plugin, puis lire le skill sur le disque) » par :

```text
avec la commande du skill en première ligne (`chantier` et `fusionner` ne se chargent pas autrement), son repli (installer soi-même le plugin, puis lire le fichier du skill sur le disque)
```

### 4. `skills/chaine/socle-chaine-de-production/SKILL.md`

Ligne 32, telle que le ticket 17 la laisse (il y écrit « (`scripts/chaine/diff-revue.sh` et `chemins-sensibles.mjs`, le fichier de critères) » : d'où `Blocked by: 17`), remplacer la ligne entière par :

```text
   Puis `/maj-skills:revue-adversariale poser` (`scripts/chaine/diff-revue.sh` et `chemins-sensibles.mjs`, le fichier de critères), l'étape 0 du skill `fusionner` et `/maj-skills:sujet poser` (les scripts du capitaine et du sujet dans `scripts/chaine/`, avec leurs tests). `fusionner` ne s'invoque pas d'ici : il porte `disable-model-invocation: true`, réservé à la session du capitaine ; son « Étape 0 — poser » se **lit** dans son fichier, `~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/SKILL.md`, et se suit ; les chemins relatifs s'y lisent depuis le dossier de ce fichier. Le script `check:tickets` joue aussi `node --test scripts/chaine/*.test.mjs`.
```

Si la ligne 32 de `main` ne porte pas la formule du 17 quand la session part, le 17 n'est pas entré : elle s'arrête et l'écrit à l'architecte.

### 5. `scripts/depot.test.mjs` : le test, écrit d'abord et vu rouge

Aucun test ne garde aujourd'hui `lancement.md` ni les en-têtes des skills (relevé : `git grep -ln "lancement.md\|disable-model-invocation" origin/main -- '*.mjs'` ne rend rien ; `demarrage.mjs` et `regles.test.mjs` ne lisent ni l'un ni l'autre). `scripts/depot.test.mjs` est le banc du dépôt contre lui-même : y ajouter, **à la fin du fichier**, ce bloc (il réutilise `skillsDuDepot`, `lire`, `lignes`, `RACINE`, `readFileSync`, `join`, déjà définis). La fonction d'aide s'appelle `cmdSkill`, pas `commande` : `commande` existe déjà, ligne 91 (le lecteur du workflow) ; un second `const commande` ne se compile pas.

```js
// Un skill marqué `disable-model-invocation: true` ne se charge que par sa commande en tête du
// message (documentation de Claude Code, page des skills) : tout bloc de prompt de lancement qui
// nomme un tel skill commence par sa commande, et aucun SKILL.md ne demande au modèle de l'invoquer.
const LANCEMENT = "skills/chaine/architecte/references/lancement.md";
const marque = (texte) => {
  const entete = texte.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return Boolean(entete) && /^disable-model-invocation:\s*true\s*$/m.test(entete[1]);
};
const blocsTexte = (texte) => [...texte.matchAll(/^```text\r?\n([\s\S]*?)^```/gm)].map((m) => m[1]);
const cmdSkill = (n) => `/maj-skills:${n}(?![\\w-])`;
// Les skills marqués nommés dans le bloc dont la commande n'ouvre pas la première ligne.
const horsTete = (bloc, noms) => {
  const premiere = lignes(bloc)[0] ?? "";
  return noms.filter((n) => new RegExp(cmdSkill(n)).test(bloc) && !new RegExp(`^${cmdSkill(n)}`).test(premiere));
};
const skillsMarques = () => skillsDuDepot.filter((s) => marque(lire(s))).map((s) => s.split("/").pop());

test("lecteurs des prompts de lancement : entrées piégées", () => {
  assert.equal(marque("---\nname: x\ndisable-model-invocation: true\n---\n"), true);
  assert.equal(marque("---\r\nname: x\r\ndisable-model-invocation: true\r\n---\r\n"), true, "CRLF");
  assert.equal(marque("---\nname: x\ndisable-model-invocation: false\n---\n"), false);
  assert.equal(marque("---\nname: x\n---\ndisable-model-invocation: true\n"), false, "hors de l'en-tête");
  assert.deepEqual(blocsTexte("a\n```text\nl1\nl2\n```\n```bash\nx\n```\n"), ["l1\nl2\n"]);
  assert.deepEqual(horsTete("/maj-skills:chantier nom\nlis /maj-skills:chantier\n", ["chantier"]), []);
  assert.deepEqual(horsTete("Conducteur\nlis et suis /maj-skills:chantier\n", ["chantier"]), ["chantier"]);
  assert.deepEqual(horsTete("/maj-skills:chantiers x\n", ["chantier"]), [], "nom voisin non nommé");
  assert.deepEqual(horsTete("/maj-skills:chantierx\n/maj-skills:chantier\n", ["chantier"]), ["chantier"], "variante voisine en tête");
  assert.deepEqual(horsTete("Session\nlis et suis /maj-skills:revue-de-ticket\n", ["chantier"]), []);
});

test("chaque prompt de lancement qui nomme un skill marqué commence par sa commande", () => {
  const noms = skillsMarques();
  assert.ok(noms.includes("chantier") && noms.includes("fusionner"), "chantier et fusionner sont marqués");
  const blocs = blocsTexte(readFileSync(join(RACINE, LANCEMENT), "utf8"));
  assert.ok(blocs.length >= 3, `${LANCEMENT} : au moins trois blocs de prompt`);
  const fautes = blocs.flatMap((b, i) => horsTete(b, noms).map((n) => `bloc ${i + 1} : /maj-skills:${n} hors de la première ligne`));
  assert.deepEqual(fautes, [], `${LANCEMENT} : ${fautes.join(" ; ")}`);
});

test("aucun SKILL.md ne demande la commande d'un skill marqué, que le modèle ne peut pas invoquer", () => {
  const noms = skillsMarques();
  const fautes = skillsDuDepot.flatMap((s) =>
    lignes(lire(s)).flatMap((l, i) =>
      noms.filter((n) => new RegExp(cmdSkill(n)).test(l)).map((n) => `${s}/SKILL.md:${i + 1} : /maj-skills:${n}`),
    ),
  );
  assert.deepEqual(fautes, [], `lire le fichier du skill, jamais l'invoquer : ${fautes.join(" ; ")}`);
});
```

Ajouter aussi à la fin du commentaire d'en-tête du fichier (lignes 1-3) : « , et un skill marqué `disable-model-invocation` ne se charge que par sa commande en tête d'un prompt de lancement ».

**Vu rouge par le rédacteur**, le 2026-11-14, dans une copie jetable de `c9a6055` (bloc ajouté seul, aucun autre fichier touché) : le test des lecteurs vert ; « chaque prompt de lancement… » rouge, `bloc 1 : /maj-skills:chantier hors de la première ligne ; bloc 2 : /maj-skills:fusionner hors de la première ligne` ; « aucun SKILL.md… » rouge, `./skills/chaine/architecte/SKILL.md:28 : /maj-skills:chantier ; ./skills/chaine/architecte/SKILL.md:28 : /maj-skills:fusionner ; ./skills/chaine/socle-chaine-de-production/SKILL.md:32 : /maj-skills:fusionner`. Les deux deviennent verts avec les points 1, 2 et 4. Rejoué par le relecteur avec `cmdSkill` : 15 vert, 16 et 17 rouges pour la bonne raison sur `c9a6055`, puis les 17 tests du fichier verts et 394/394 après les remplacements. La session rejoue cet ordre : test d'abord, rouge vu et noté dans la PR, puis les textes.

### 6. La version — `.claude-plugin/plugin.json`

Un correctif : la version **patch** qui suit celle de `main` au moment où la session ouvre sa PR, lue dans `.claude-plugin/plugin.json` (`git show origin/main:.claude-plugin/plugin.json`) juste avant le dernier commit. Le ticket 17 passe avant celui-ci (`Blocked by: 17`) et monte `main` à 7.3.0 : ce ticket sera donc 7.3.1 si rien d'autre n'est passé. Le ticket 20 (PR 78, qui vise 7.2.1) peut être fusionné avant ou après : la règle ne change pas, le correctif qui suit celle de `main`. Le numéro et l'objet entrent dans le titre de la PR.

## Décisions

- **Le drapeau reste** sur `architecte`, `chantier` et `fusionner` : sa raison (un rôle par session, choisi par qui lance) tient, et la documentation le destine à ce cas. Le retirer rendrait « lis et suis » suffisant, mais laisserait toute session se faire capitaine ou conducteur d'elle-même.
- **La commande seule sur la première ligne**, ses arguments derrière elle sur la même ligne, et rien d'autre : la documentation dit qu'en mode SDK « the rest of the line » devient l'argument du skill ; une phrase sur cette ligne deviendrait l'argument.
- **L'argument du conducteur est le nom du sujet** (sans `sujet/`), pas l'objectif : `chantier/SKILL.md` § 0, point 1 cherche d'abord la carte par ce nom, ce qui rend le même prompt bon pour une relance ; l'objectif et la spec sont déjà dans les lignes qui suivent.
- **Le repli ne se déclenche que sur le plugin absent**, signalé par le hook de démarrage, plus sur « pas parmi tes skills », toujours vrai pour un skill marqué. Il dit de lire le fichier avec l'outil de lecture et de ne pas passer par l'outil Skill, pour ne pas tomber sur la consigne de blocage de la documentation.
- **Le capitaine d'un dépôt sans la chaîne** ne reçoit ni la commande ni la ligne « Skills : » : sa procédure est entière dans le prompt, et charger `fusionner` la contredirait.
- **`fusionner poser`** depuis le socle se lit dans le fichier, plutôt que de déplacer `poser` dans un skill non marqué : c'est la plus petite correction ; le déplacement est hors périmètre.

## Surfaces

Six fichiers, aucun créé.

| Surface | Point | Preuve |
| --- | --- | --- |
| `skills/chaine/architecte/references/lancement.md` | 1 | `scripts/depot.test.mjs` « chaque prompt de lancement qui nomme un skill marqué commence par sa commande » |
| `skills/chaine/architecte/SKILL.md` | 2 | `scripts/depot.test.mjs` « aucun SKILL.md ne demande la commande d'un skill marqué, que le modèle ne peut pas invoquer » |
| `skills/chaine/architecte/references/CONTENU.md` | 3 | relecture (texte seul) |
| `skills/chaine/socle-chaine-de-production/SKILL.md` | 4 | `scripts/depot.test.mjs` « aucun SKILL.md ne demande la commande d'un skill marqué, que le modèle ne peut pas invoquer » |
| `scripts/depot.test.mjs` | 5 | `scripts/depot.test.mjs` « lecteurs des prompts de lancement : entrées piégées » |
| `.claude-plugin/plugin.json` | 6 | relecture (version) |

Fichiers partagés avec d'autres tickets : `skills/chaine/socle-chaine-de-production/SKILL.md`, ligne 32, avec le ticket 17 (d'où `Blocked by: 17`) ; `.claude-plugin/plugin.json` avec les tickets 17, 19 et 20.

## Vérification

Critères, chacun vérifiable par une commande depuis la racine du dépôt :

- `pnpm test` vert. À `c9a6055` : **391 tests**, tous verts (rejoués le 2026-11-14 dans une copie jetable). Ce ticket en ajoute trois : **394** attendus, plus ou moins ceux qu'auront ajoutés ou retirés les tickets fusionnés avant lui. Aucun test retiré, sauté ou assoupli.
- `node --test scripts/depot.test.mjs` : les trois tests nouveaux, vus rouges avant les textes (point 5), verts après.
- `grep -n "^/maj-skills:" skills/chaine/architecte/references/lancement.md` rend exactement deux lignes : `/maj-skills:chantier <nom du sujet, sans le préfixe sujet/>` et `/maj-skills:fusionner`.
- `grep -c "lis et suis /maj-skills:\(chantier\|fusionner\)" skills/chaine/architecte/references/lancement.md` rend `0`.
- `grep -c "S'il n'est pas parmi tes skills" skills/chaine/architecte/references/lancement.md` rend `1` (le seul bloc de la session de ticket, inchangé).
- `git grep -n "/maj-skills:\(architecte\|chantier\|fusionner\)" -- 'skills/**/SKILL.md'` ne rend rien.
- `grep -c "avec ton outil de lecture" skills/chaine/architecte/references/lancement.md` rend `2`.
- `git diff --stat origin/main` ne nomme que les six fichiers des Surfaces.
- Le dépôt n'a ni gate des tickets ni `commitlint` : le reste se contrôle à la relecture.

**La sonde de l'architecte, après la fusion et la mise à jour du plugin dans son environnement** (ce que seule une session réelle prouve ; aucun rédacteur ni aucune session de ticket ne peut lancer de session). Trois `create_session` sur `MAJ-agency/skills`, branche `main`, `permission_mode` `"auto"`, tag `role:sonde`, archivées aussitôt relevées ; chaque prompt dit sur sa deuxième ligne de ne rien faire d'autre que répondre par `send_message`, puis s'arrêter :

1. **Commande en tête** : première ligne `/maj-skills:chantier sonde-21`. La session répond : le titre du skill chargé (« Chantier : le conducteur de bout en bout »), l'argument reçu, en disant s'il vaut exactement `sonde-21` ou s'il contient le reste du prompt, et si elle a lu les lignes suivantes du prompt (elle en cite la dernière). Prouve : la commande en tête d'un prompt de `create_session` charge un skill marqué, et le reste du prompt arrive. **Si le reste du prompt n'arrive pas** (tronqué, ou avalé dans l'argument), un ticket suit : les gabarits reviennent à la commande seule dans le prompt, et le reste part dans un message de suite (`send_message`) dès la session créée.
2. **Lecture du fichier** : aucune commande ; le prompt lui fait lire `~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/SKILL.md` avec son outil de lecture, sans l'outil Skill, et citer le titre de son « Étape 0 ». Prouve : le repli se joue.
3. **Refus de l'outil Skill** : aucune commande ; le prompt lui fait tenter l'outil Skill sur `maj-skills:fusionner`, rapporter mot pour mot le refus reçu, puis tenter de lire le fichier comme en 2. Prouve, ou infirme : qu'une session refusée ne s'interdit pas la lecture du fichier. Si elle se l'interdit, le repli (« ne s'invoque pas par l'outil Skill ») est la seule voie, et un ticket suit.

Les trois réponses, avec le coût des sessions, vont au journal de la carte du programme.

## Hors périmètre

- **Retirer ou changer le drapeau** des trois skills (Décisions).
- **Sortir `poser` de `fusionner`** vers un skill non marqué (par exemple le socle) : plus propre peut-être, mais un changement de structure ; à instruire si la sonde 3 montre que la lecture du fichier est refusée.
- **Le bloc de la session d'un ticket** (`lancement.md:48`) et le gabarit d'une fille (`chaine-de-production.md` § 5) : aucun skill marqué, rien à corriger ; leur repli « S'il n'est pas parmi tes skills » reste juste pour un skill non marqué.
- **`chaine-de-production.md:5`** et **`README.md:90`** : une commande tapée par un humain en tête de son message, le geste que la documentation décrit.
- **`demarrage.mjs`** : son signalement du plugin absent est déjà le signal que le repli lit.
- **Les dépôts de projet** : les prompts déjà écrits par un architecte ne changent qu'à son prochain lancement ; aucune copie du plugin n'existe plus dans un projet (`P-24`).

## Intangibles

Jamais `--no-verify` ; jamais de push forcé ni de réécriture d'historique ; jamais de test retiré, sauté ou assoupli ; pas de dépendance nouvelle ; jamais de push sur `main`. La PR vise `main` ; la session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion. `Label: contre-revue` : l'architecte contre-relit avant de poser `à-fusionner`.

## Comments

- 2026-11-14 — Écrit par un rédacteur (sous-agent) depuis `origin/main` à `c9a6055` (plugin 7.2.0, 391 tests rejoués verts dans une copie jetable, les trois tests du point 5 vus rouges sur la même copie puis verts avec les deux blocs de `lancement.md` corrigés). Documentation de Claude Code lue le 2026-11-14 (page des skills). Non vérifié : qu'un prompt de `create_session` se traite comme un message tapé, que les lignes après la commande arrivent au modèle, qu'un skill marqué se lit par l'outil de lecture — d'où la sonde. Non vérifié non plus : que `~/.claude/plugins/marketplaces/maj/` existe dans une installation locale faite depuis `.claude/settings.json` (le chemin est celui que `lancement.md` et `demarrage.mjs` donnent déjà). À relire par un agent neuf avant le lancement.
- 2026-11-14 — Relu par un agent neuf : « pas prêt », trois bloquants de forme, le fond, les faits et les citations confirmés. Reportés : fonction d'aide du test renommée `cmdSkill` (`commande` existe déjà, ligne 91 de `scripts/depot.test.mjs`) ; `Type: défaut` avec la colonne « Preuve » dans `## Surfaces`, `Label: contre-revue`, `Dépendances: —` ; `Blocked by: 17` pour la ligne 32 du socle, écrite avec la formule du 17, et fichiers partagés corrigés. Mineures reportées : arguments de la première ligne et risque sur les lignes suivantes (Le besoin), réponse et branche de la sonde 1, premier lancement du conducteur, repli quand le plugin est installé mais la commande sans effet, chemins relatifs de `fusionner/SKILL.md`, ordre des versions avec le 17.
