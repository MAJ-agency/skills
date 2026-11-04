# Issue tracker : Markdown local dans `docs/features/`

Les specs et les tickets de ce dépôt vivent en Markdown, versionnés avec le code, sous `docs/features/`. Pas de tracker externe. Convention et scripts : skill `tickets` de `maj-skills`.

## Conventions

- Une feature par dossier : `docs/features/<feature>/`. Une portée optionnelle en sous-dossier quand un même sujet se décline par client ou par organisation : `docs/features/<feature>/<portée>/` (`all/` pour ce qui vaut partout).
- La spec est un fichier `<PRÉFIXE>-<n>-<nom>.spec.md` de ce dossier. Le préfixe est le trigramme du sujet, précédé de la portée s'il y en a une (`SOC-1`, `ALL-FOF-12`). `n` est le prochain numéro libre du préfixe, obtenu par `node scripts/docs/next-id.mjs <PRÉFIXE…>` ; il est unique dans tout `docs/`, jamais réutilisé. Un fichier = un sujet : une feature large donne plusieurs specs.
- Les analyses et recherches vont dans le même dossier en `.analyse.md` ; une décision non tranchée en `.question.md` ; la carte d'un chantier en `.map.md`, sous le même identifiant que sa spec.
- Les tickets d'implémentation sont **un fichier par ticket** dans `issues/`, nommés d'après leur spec avec un index à deux chiffres : `issues/<PRÉFIXE>-<n>-<nom>.01.issue.md`, `.02.issue.md`… Jamais un fichier combiné. Un ticket se cite `SOC-1.03`.
- L'état de triage est une ligne `Status:` en tête de chaque ticket (valeurs dans `docs/agents/triage-labels.md`). Le gate `node scripts/verify/tickets.mjs` refuse toute autre valeur.
- **Sujet** : une spec découpée en plusieurs tickets qui se suivent porte en tête `Sujet: sujet/<nom>` (kebab-case), valable pour tous ses tickets. Un ticket peut la remplacer par sa propre ligne. Un ticket qui doit arriver seul en recette garde la spec, mais sa PR vise develop avec le label `hors-sujet`. Pas de ligne : la PR vise develop.
- Les commentaires et l'historique s'ajoutent en bas du fichier sous un titre `## Comments`, datés, les plus anciens en premier.
- Les décisions d'architecture ne vont pas dans le dossier feature : elles vont dans `docs/adr/` (voir `docs/agents/domain.md`). Les règles métier qu'une spec découvre vont dans le registre de règles, jamais dans la spec : elle les cite.

## Réserver un ticket (sessions parallèles)

Plusieurs sessions travaillent en même temps sur le dépôt : chaque ticket est **réservé avant la première ligne de code**. La ligne `Status:` ne suffit pas à réserver : elle n'arrive sur develop qu'à la fusion de la PR. La réservation visible tout de suite, c'est **la branche poussée et la PR brouillon**.

1. **Vérifier qu'il est libre** : `node scripts/docs/ticket-libre.mjs SOC-1.03`. Le script croise la ligne `Status:` sur origin/develop et sur les branches `sujet/*`, les branches distantes qui portent l'identifiant et les PR ouvertes. Sortie 0 : libre. Sortie 1 : pris, avec le nom de la branche ou le numéro de la PR → ne pas commencer. **Sortie 3** : sans `gh` authentifié (session cloud), les PR ne sont pas vérifiées ; le script donne la recherche `search_pull_requests` à faire par l'outil GitHub MCP, et le ticket n'est libre que si elle ne rend rien.
2. **Réserver tout de suite**, avant de coder :
   - Branche `<type>/<identifiant en minuscules, points en tirets>-<nom>`, par exemple `feat/soc-1-03-couche-base`. L'identifiant dans le nom de branche est ce que le script détecte : il est obligatoire.
   - Premier commit : la ligne `Status: en cours — <branche>` dans le fichier du ticket. Le pousser.
   - Ouvrir aussitôt une **PR brouillon** dont le titre se termine par l'identifiant, par exemple `feat(api): couche base de données (SOC-1.03)`. En session cloud, par l'outil GitHub MCP `create_pull_request` avec `draft: true` ; sinon `gh api -X POST 'repos/{owner}/{repo}/pulls' -f title='…' -f head=<branche> -f base=develop -F draft=true`. Une PR brouillon ne lance aucun job de la CI.
   - Une sous-PR de branche de sujet vise `sujet/<nom>` au lieu de develop (skill `sujet`). Avant le premier commit de code, `sujet.sh demarrer <identifiant>` place la branche sur le sujet ; il refuse un ticket dont la spec n'est pas encore sur sa base, ou dont un `Blocked by:` n'y est pas fait : attendre la fusion, ne jamais partir d'une branche de specs ni fusionner localement une dépendance.
3. **Livrer** : poser `Status: Fait — PR #<n>`, sortir la PR du brouillon **après le dernier push**, puis poser `à-fusionner` (sous-PR de sujet comprise). En session cloud : `update_pull_request` (`draft: false`), `issue_write` (`labels`, la liste complète).
4. **Abandonner** : fermer la PR brouillon, supprimer la branche. La ligne `Status:` de develop n'a pas bougé, le ticket redevient libre.

Une branche ou une PR d'une autre session ne se reprend pas sans l'accord de l'humain, même si elle paraît inactive.

## Un ticket prêt pour agent

`Status: ready-for-agent` veut dire qu'une session neuve peut le coder sans exploration large ni question : en tête `Modèle:`, `Fichiers chauds:` et, s'il y a lieu, `Blocked by:` et `Sujet:` ; dans le corps les sections `## Où`, `## Décisions`, `## Surfaces`, `## Vérification`. Format et raisons : `docs/agents/chaine-de-production.md` § 3. Gabarit : `docs/agents/gabarits/ticket.issue.md`. Le gate `tickets` refuse un ticket prêt qui ne le respecte pas.

## Archivage

Un ticket `Fait — PR #n` depuis plus de 180 jours quitte `issues/` pour `issues/archive/`, même nom, par `git mv` ; les liens relatifs qui le visent sont réécrits. Il reste citable par un `Blocked by:`, mais sort du gate, de la réservation et du tableau d'avancement. Le capitaine lance `node scripts/docs/archiver-tickets.mjs` (dry-run par défaut, `--appliquer` pour déplacer) une fois par mois, à la main, jamais en CI.

## Quand un skill dit « publier vers le tracker »

Créer un nouveau fichier sous `docs/features/<feature>/` (créer les dossiers si besoin).

- Une spec → `<PRÉFIXE>-<n>-<nom>.spec.md` avec `n` donné par `next-id.mjs`.
- Un ticket → `issues/<PRÉFIXE>-<n>-<nom-de-la-spec>.<NN>.issue.md`, `NN` = prochain index libre pour cette spec.

## Quand un skill dit « récupérer le ticket »

Lire le fichier au chemin indiqué. L'utilisateur passe normalement le chemin, ou l'identifiant `SOC-1.03`.
