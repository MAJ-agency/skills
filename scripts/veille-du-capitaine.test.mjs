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
  assert.ok(puces[1].includes("Sortie 9 : une autre boucle tient le verrou, ou une autre veille tourne (`une veille tourne déjà`) : ne rien relancer avant de savoir laquelle (`veille.sh --etat`) : la suite de son point 2 (« Réveil de garde »)"), puces[1]);
  assert.ok(puces[1].includes("sortie 10 : arrêt demandé, la veille relancée avec `--reprendre` quand on veut repartir."), puces[1]);
  assert.ok(entre(lire(SKILL), "**Une seule boucle à la fois, arrêt d'un geste.**", "\n\n").includes("**Reprendre** : relancer la veille avec `--reprendre`"), "« Reprendre » passe par la veille");
});

test("le réveil de garde : après la liste des fins, avant le suivi du journal ; send_later à 60 minutes réarmé au seul réveil de garde, puis quatre points dans l'ordre", () => {
  const garde = entre(boucle(), "**Réveil de garde.**", "\n\nSuivre le journal avec un `Monitor`");
  for (const p of [
    "Une veille morte avec son conteneur ne réveille personne (cas vécu : 5 h 40 sans lecture de la file, file vide) ; un message programmé, lui, survit au redémarrage.",
    "charger `send_later` (ToolSearch, requête « select:mcp__claude-code-remote__send_later »), puis l'appeler : `delay_minutes` `60`",
    "`name` « Garde de la veille du capitaine »",
    "Il ne se réarme qu'au réveil de garde, jamais à un autre réveil : un seul réveil de garde attend à la fois.",
    "`send_later` absent (session locale) : pas de garde, le dire une fois au lanceur.",
  ]) assert.ok(garde.includes(p), `réveil de garde : « ${p} » attendu`);
  const points = garde.split("\n").filter((l) => /^\d\. /.test(l));
  assert.deepEqual(points.map((l) => l.slice(0, 2)), ["1.", "2.", "3.", "4."], garde);
  assert.ok(points[0].includes("`git worktree prune`, puis « Mise en place » et la copie (« Copier, puis lancer »), sans lancer la veille"), points[0]);
  assert.ok(points[1].startsWith("2. Depuis le worktree, `bash <scratchpad>/outils/veille.sh --etat` (ni `CAPITAINE_ID`, ni réseau) : `VEILLE VIVANTE`, sortie 0 : rien ; `VEILLE TERMINÉE : <ligne finale>`, sortie 2 : `VEILLE FINIE`, la relancer telle quelle"), points[1]);
  assert.ok(points[1].endsWith("`VEILLE MORTE`, sortie 1 : le point 3."), points[1]);
  assert.ok(points[1].includes("une autre sortie (64 : la copie est d'avant `--etat`, les scripts du projet ne sont pas reposés) : pas de garde"), points[1]);
  assert.ok(points[1].includes("et seulement si elle n'a pas déjà été donnée"), points[1]);
  assert.ok(points[2].startsWith("3. Depuis le worktree, `bash <scratchpad>/outils/boucle.sh --arreter`"), points[2]);
  assert.ok(points[2].includes("puis relancer la veille par la seconde ligne du bloc ci-dessus, sans recopier (le worktree peut être resté sur une PR), en tâche de fond avec le même `timeout`, et avec `--reprendre` : elle retire ce fichier dès son verrou pris, avant sa préparation."), points[2]);
  assert.ok(points[2].includes("`--arreter` en échec (sortie 1, des processus tiennent encore le verrou) : le dire au lanceur, ne rien relancer."), points[2]);
  assert.equal(points[3], "4. Réarmer : `send_later`, comme ci-dessus.");
  // Le garde vient après la liste des fins et avant « Sans veille en cours ».
  const texte = boucle();
  assert.ok(texte.indexOf("**Réveil de garde.**") < texte.indexOf("**Sans veille en cours**"));
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
