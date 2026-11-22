// Banc des textes du ticket 74 (A-180 point 1, A-185 point 7) : la veille du capitaine se lance sous le plafond de
// l'outil Bash, une fin sans ligne finale a sa suite, et un réveil de garde voit la veille morte avec son conteneur.
// Chaque phrase est exigée à sa place dans `fusionner/SKILL.md` (le paragraphe, la liste, l'ordre), et les états que
// le skill nomme sont ceux qu'écrit `veille.sh --etat`. Le comportement est jugé par `veille.test.mjs` et
// `une-sous-pr-a-la-fois.test.mjs`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const lire = (chemin) => readFileSync(join(RACINE, chemin), "utf8");
const SKILL = "skills/chaine/fusionner/SKILL.md";
const VEILLE = "skills/chaine/fusionner/scripts/veille.sh";

// Le texte entre deux repères, chacun trouvé une fois et dans cet ordre.
const entre = (texte, debut, fin) => {
  const i = texte.indexOf(debut);
  assert.ok(i >= 0, `« ${debut} » attendu`);
  assert.equal(texte.indexOf(debut, i + 1), -1, `« ${debut} » une seule fois`);
  const j = texte.indexOf(fin, i + debut.length);
  assert.ok(j > i, `« ${fin} » attendu après « ${debut} »`);
  return texte.slice(i, j);
};
const boucle = () => entre(lire(SKILL), "## Boucle\n", "## Renvoyer une PR\n");

test("la veille se lance avec le `timeout` de l'outil Bash à 7200000, dans le paragraphe qui la lance et avant sa commande", () => {
  const lancement = entre(boucle(), "**Automatique (le cas normal) : la veille.**", "```bash\n");
  assert.ok(lancement.includes("**en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `7200000`** (deux heures, son maximum)"), lancement);
  assert.ok(lancement.includes("Sans ce `timeout`, l'outil arrête la tâche à 30 minutes, sans ligne finale, au milieu d'un passage s'il le faut"), lancement);
  const commande = entre(boucle(), "```bash\nmkdir -p <scratchpad>/outils", "```\n\nAvant chaque lancement");
  assert.match(commande, /--reprendre \(après une veille morte\)/);
  // Le journal en ajout (A-190 point 3) : une seconde veille, qui sort en 9, ne tronque pas celui de la première.
  assert.ok(commande.includes("veille.sh >> <scratchpad>/veille.log 2>&1"), commande);
  assert.ok(lancement.includes("sortie dans un journal ouvert en ajout (`>>`"), lancement);
  assert.doesNotMatch(lire(SKILL), /[^>]> <scratchpad>\/veille\.log/, "aucune commande du skill ne tronque le journal de la veille");
  assert.ok(lire(VEILLE).includes("# avec son `timeout` à 7200000 (ms, skill fusionner § « Boucle »)"), "veille.sh : l'en-tête dit le timeout");
});

test("une fin sans ligne finale est une veille morte : quatrième puce de la liste des fins, après les trois lignes finales", () => {
  const fins = entre(boucle(), "La veille s'arrête d'elle-même, et sa fin réveille la session :\n\n", "\n\n**Réveil de garde.**");
  const puces = fins.split("\n").filter((l) => l.startsWith("- "));
  assert.equal(puces.length, 4, fins);
  assert.ok(puces[0].startsWith("- **`VEILLE FINIE`** (sortie 0)"));
  assert.ok(puces[1].startsWith("- **`VEILLE ARRÊTÉE`** :"));
  assert.ok(puces[2].startsWith("- **`VEILLE ARRÊTÉE`, sortie 13**"));
  assert.equal(puces[3], "- **Aucune de ces lignes** (l'outil a arrêté la tâche, hors un `TaskStop` joué par la session elle-même ; le conteneur a redémarré) : une veille morte, jamais une fin sans suite : « Réveil de garde », points 1 à 3, tout de suite.");
  assert.ok(puces[1].includes("Sortie 9 : une autre veille tourne (`une veille tourne déjà`) : ne rien relancer, `veille.sh --etat` et la suite de son point 2 (« Réveil de garde »)"), puces[1]);
  // Contre-relecture de la PR 150 : une boucle qui tient le verrou sans veille qui la porte a sa suite ; `--etat`, qui ne
  // parle que des veilles, n'en donnait aucune (la suite de son point 2 renvoyait à celle-ci).
  assert.ok(puces[1].includes("ou une boucle tient le verrou sans veille qui la porte (`la boucle est sortie en 9`, après le `REFUS` de la boucle, ou `une boucle tient le verrou` de `--reprendre`), une orpheline ou un démon du projet qui garde son verrou : le point 3 du « Réveil de garde », puis le dire une fois au lanceur, avec le pid du `REFUS` et le script du projet à fermer (`9>&-`) ;"), puces[1]);
  // Mineur 13 de la PR 150 (A-194, lot 6b) : la sortie 10 dit qui lève l'arrêt.
  assert.ok(puces[1].includes("sortie 10 : arrêt demandé, levé par qui l'a posé (`--reprendre`), jamais par la session qui se réveille."), puces[1]);
  assert.doesNotMatch(puces[1], /quand on veut repartir/, "la sortie 10 ne laisse plus la session qui se réveille lever l'arrêt");
  assert.ok(entre(lire(SKILL), "**Une seule boucle à la fois, arrêt d'un geste.**", "\n\n").includes("**Reprendre** : relancer la veille avec `--reprendre`"), "« Reprendre » passe par la veille");
});

test("le réveil de garde : après la liste des fins, avant le suivi du journal ; send_later à 60 minutes réarmé au seul réveil de garde, puis quatre points dans l'ordre", () => {
  const garde = entre(boucle(), "**Réveil de garde.**", "\n\nSuivre le journal avec un `Monitor`");
  for (const p of [
    "Une veille morte avec son conteneur ne réveille personne (cas vécu : 5 h 40 sans lecture de la file, file vide) ; un message programmé, lui, survit au redémarrage.",
    "charger `send_later` (ToolSearch, requête « select:mcp__claude-code-remote__send_later »), puis l'appeler : `delay_minutes` `60`",
    "`name` « Garde de la veille du capitaine »",
    // Contre-relecture de la PR 150 : armée une fois, et le message qui fait jouer la garde à la session réveillée.
    "Au premier lancement de la veille dans la session, charger `send_later`",
    "`message` « Réveil de garde : skill fusionner, « Réveil de garde » »",
    "Il ne se réarme qu'au réveil de garde, jamais à un autre réveil : un seul réveil de garde attend à la fois.",
    "`send_later` absent (session locale) : pas de garde, le dire une fois au lanceur.",
    // A-187 point 3, A-190 mineur 12 (lot 6b) : la garde se supprime avant l'archivage du capitaine.
    "Noter le `trigger_id` qu'il rend, chaque fois, le dernier remplaçant le précédent : avant tout arrêt du capitaine et son archivage, `delete_trigger` sur lui ; perdu, le retrouver par `list_triggers`, sous ce nom.",
  ]) assert.ok(garde.includes(p), `réveil de garde : « ${p} » attendu`);
  const points = garde.split("\n").filter((l) => /^\d\. /.test(l));
  assert.deepEqual(points.map((l) => l.slice(0, 2)), ["1.", "2.", "3.", "4."], garde);
  assert.ok(points[0].includes("`git worktree prune`, puis « Mise en place » et la copie (« Copier, puis lancer »), sans lancer la veille"), points[0]);
  assert.ok(points[0].startsWith("1. `test -f <scratchpad>/outils/veille.sh && git -C <scratchpad>/capitaine rev-parse -q --verify HEAD` en échec"), points[0]);
  assert.ok(points[1].startsWith("2. Depuis le worktree, `bash <scratchpad>/outils/veille.sh --etat` (ni `CAPITAINE_ID`, ni réseau) : `VEILLE VIVANTE`, sortie 0 : rien ; `VEILLE TERMINÉE : <ligne finale>`, sortie 2 : `VEILLE FINIE`, la relancer telle quelle"), points[1]);
  assert.ok(points[1].endsWith("`VEILLE MORTE`, sortie 1 : le point 3."), points[1]);
  // Mineur 8 de la PR 150 (A-194, lot 6b) : la copie d'avant `--etat` se reconnaît à sa ligne, pas à la seule sortie 64.
  assert.ok(points[1].includes("la ligne `CAPITAINE_ID requis`, sortie 64 (la copie est d'avant `--etat`, les scripts du projet ne sont pas reposés ; tout autre 64, hors d'un dépôt git par exemple, se rejoue depuis le worktree) : pas de garde, le dire une fois au lanceur (scripts à reposer par « poser », dans une PR du projet), ne plus réarmer, et après une fin sans ligne finale relancer la veille sans `--reprendre` ;"), points[1]);
  assert.ok(lire(VEILLE).includes("CAPITAINE_ID requis (l'id de la session du capitaine"), "veille.sh : la ligne que la garde lit pour reconnaître une copie d'avant `--etat`");
  assert.ok(points[1].includes("et seulement si elle n'a pas déjà été donnée"), points[1]);
  // Décision 6 du ticket : un arrêt demandé n'est jamais levé par un réveil de garde.
  assert.ok(points[1].includes("`VEILLE ARRÊTÉE` ou `arrêt demandé`, rien de plus que sa suite ci-dessus, et seulement si elle n'a pas déjà été donnée (ce qui a été dit au lanceur ne se redit pas ; un arrêt demandé ne se lève jamais au réveil de garde : `--reprendre` attend qui l'a posé, un humain, ou le capitaine après son action à la main) ;"), points[1]);
  // Mineur 11 de la PR 150 (A-194, lot 6b) : l'arrêt que la garde pose elle-même se reconnaît à son heure.
  assert.ok(points[2].startsWith("3. Noter l'heure du geste (`date +%FT%T`), puis, depuis le worktree, `bash <scratchpad>/outils/boucle.sh --arreter`"), points[2]);
  assert.ok(points[2].endsWith("Au réveil de garde suivant, un `arrêt demandé` « posé le » à l'heure notée est le sien, resté posé parce que la relance n'a pas abouti : relancer la veille avec `--reprendre`, sans rejouer `--arreter`."), points[2]);
  assert.ok(lire("skills/chaine/fusionner/scripts/boucle.sh").includes('date +%FT%T > "$ARRET"'), "boucle.sh --arreter écrit l'heure à la forme que la garde note");
  assert.ok(points[2].includes("puis relancer la veille par la seconde ligne du bloc ci-dessus, sans recopier (le worktree peut être resté sur une PR), en tâche de fond avec le même `timeout`, et avec `--reprendre` : elle retire ce fichier dès son verrou pris, avant sa préparation."), points[2]);
  assert.ok(points[2].includes("`--arreter` en échec (sortie 1, des processus tiennent encore le verrou) : le dire au lanceur, ne rien relancer."), points[2]);
  // Le point 4 suit chaque suite, « VEILLE VIVANTE : rien » comprise : sinon la garde meurt à sa première veille vivante.
  assert.equal(points[3], "4. Réarmer, quelle qu'ait été la suite des points 2 et 3 (`VEILLE VIVANTE` comprise), sauf « ne plus réarmer » (point 2) : `send_later`, comme ci-dessus.");
  // Le garde vient après la liste des fins et avant « Sans veille en cours ».
  const texte = boucle();
  assert.ok(texte.indexOf("**Réveil de garde.**") < texte.indexOf("**Sans veille en cours**"));
  // Un seul réveil programmé à la fois : sans veille en cours, la garde qui attend tient lieu de réveil.
  assert.ok(entre(texte, "**Sans veille en cours**", "\n\n").includes("le réveil de garde, s'il attend, en tient lieu, jamais un second `send_later`."), "Sans veille en cours : aucun second send_later");
});

test("les états que nomme le skill sont ceux qu'écrit `veille.sh --etat`, avec leurs sorties", () => {
  const veille = lire(VEILLE);
  const etat = entre(veille, 'if [ "${1-}" = --etat ]; then', "\nfi\n");
  for (const [ligne, code] of [
    ['echo "VEILLE VIVANTE${lancee:+ ($lancee)}"', 0],
    ['echo "VEILLE TERMINÉE : arrêt demandé (', 2],
    ['echo "VEILLE TERMINÉE : $ligne"', 2],
    ['echo "VEILLE MORTE (', 1],
  ]) {
    const i = etat.indexOf(ligne);
    assert.ok(i >= 0, `veille.sh --etat : ${ligne}`);
    assert.match(etat.slice(i).split("\n")[1], new RegExp(`^\\s*exit ${code}$`), `${ligne} : sortie ${code}`);
  }
  assert.ok(veille.includes("--reprendre) reprendre=1; shift; continue ;;"), "veille.sh : l'option --reprendre");
  assert.ok(veille.includes('une veille tourne déjà ($VERROU_VEILLE) : une seule à la fois, « veille.sh --etat »"; exit 9; }'));
});
