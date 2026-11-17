# CODEOWNERS se génère depuis les chemins sensibles et GitHub le fait respecter : un chemin sensible est relu par un humain

Status: Fait — PR #108
Type: task
Modèle: opus — une conception (source unique, propriétaires, place du fichier, détection de l'attente par le capitaine) et des textes de sécurité à tenir justes ; le reste est mécanique.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `.claude-plugin/plugin.json`
Label: contre-revue

## Le besoin

**Décision du produit (Guillaume, 2026-11-17).** Les projets posés par `socle-chaine-de-production` ont un `.github/CODEOWNERS` réellement utilisé et respecté : un humain approuve toute PR qui touche un chemin sensible.

**Le fait.** Sur `main` à `c17f88b` (plugin 7.12.3), `admin.md` du socle **recommande** un CODEOWNERS écrit à la main, sur un plancher plus large que les chemins sensibles, « non posé par défaut ». Rien ne le génère, rien ne vérifie qu'il suit `cheminsSensibles`, une session peut l'éditer, et le capitaine ne sait pas qu'une PR peut attendre une approbation : refusée à la fusion (405), elle sortait en 5, puis la boucle s'arrêtait au second essai.

Quand le ticket est fait :

1. **Source unique** : `.github/CODEOWNERS` se génère depuis `cheminsSensibles` de `.claude/chaine.json`, plus CODEOWNERS lui-même et `.claude/chaine.json` ; les propriétaires sont une donnée du projet.
2. **Gate** : un contrôle du check du socle refuse un écart, avec la commande qui régénère. Testé.
3. **Garde d'agent** : `garde-fichiers` refuse l'édition directe de CODEOWNERS ; le message dit de modifier `chaine.json`, puis de régénérer. Testé dans `regles.test.mjs`.
4. **Le socle** pose le fichier, le script, le gate, une ADR ; `admin.md` liste « Require review from Code Owners » sur develop et main, « Block force pushes », « Restrict deletions », sans contournement ; l'ADR et `admin.md` disent que GitHub lit CODEOWNERS sur la branche visée, que l'auteur ne peut pas approuver (deuxième propriétaire humain), et qu'avec un seul humain la règle ne protège pas.
5. **`fusionner`** : une PR qui attend l'approbation d'un propriétaire n'est ni rouge ni bloquée ; le capitaine la saute sans la renvoyer et la reprend au tour suivant.
6. **Fragments** : une ligne dans le fragment `CLAUDE.md` et dans `docs/agents/chaine-de-production.md`.
7. `CONTENU.md`, la version du plugin.

## Décisions

1. **Propriétaires dans le contrat** (`proprietaires` de `.claude/chaine.json`), pas en placeholder du fichier posé : un placeholder serait écrasé à la régénération ou ferait une seconde source ; dans le contrat, possédé lui-même, la liste ne change qu'avec l'approbation de la liste en place. Le gabarit porte `[]`, le gate refuse une liste vide : la question 4 de l'étape 1 la remplit.
2. **Un script, deux modes** : `scripts/github/codeowners.mjs` (gate sans argument, `--ecrire` pour régénérer ; `pnpm codeowners`, `check:codeowners`, gate rapide de fin de tour). Sortie 1 écart, 2 contrat qui ne se dit pas en CODEOWNERS (rien d'écrit).
3. **Motifs traduits à l'identique ou refusés** : ancrés par `/` ; `?`, `[…]`, `!`, `#`, `\`, blancs et `/` initial refusés, jamais approchés.
4. **CODEOWNERS n'est pas un index généré** : le capitaine ne le régénère pas de lui-même et `diff-revue.sh` ne l'exclut pas du diff relu. Refus dédié dans `refusEdition`, aux trois places que GitHub lit, sans casse.
5. **Le capitaine** lit l'attente en REST : règle de PR de la base avec `require_code_owner_review` (ruleset, sinon ancienne protection) et relecteurs encore demandés ; état `attend un propriétaire` dans `file.sh`, sortie 7 de `passer.sh` (sautée, sans renvoi), y compris quand la fusion est refusée pour une revue manquante.
6. **Le plancher large de l'ancienne recommandation n'est plus dans CODEOWNERS** : la source unique est `cheminsSensibles` ; un projet qui veut ce plancher l'y écrit (décision restante au produit, voir la PR).
7. **Version : mineure**, 7.12.3 → 7.13.0 (une pièce nouvelle posée, une clé de contrat nouvelle).

## Comments
