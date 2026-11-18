# Notes de version

La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

## 7.15.1 — 2026-11-18

### Ce qui change

L'architecte et le conducteur relèvent l'état de leurs sessions au plus toutes les 60 minutes (échec, déconnexion, limite d'usage, silence d'une heure) et signalent une session coupée. Toute session lancée charge `send_message` en premier geste, et s'arrête en le disant s'il manque. Le contexte d'une session se lit par `get_session`, jamais dans ce qu'elle annonce. Chaque prompt porte, juste après les intangibles, la ligne « Commits : jamais `git commit --amend` ». Une alerte d'usage d'une session se dit au produit une fois par période de limite.

### Ce qu'un projet fait pour en profiter

1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »). Les skills `architecte` et `chantier` et les prompts de lancement viennent avec le plugin : rien à reposer pour eux.
2. Dans une PR du projet, reporter dans `docs/agents/chaine-de-production.md` (posé par `socle-chaine-de-production`, que le projet a pu amender) les trois changements du gabarit, § 5 : la ligne « Outils : » du prompt d'une fille, la ligne « Commits : » juste après « Intangibles » (qui ne change pas), et le paragraphe « Jamais d'amend » après l'étape 4.
3. Un conducteur ou un architecte en cours reprend ces règles à sa prochaine session ; aucun capitaine à relancer.

**Iroki** : son `docs/agents/chaine-de-production.md` porte déjà le paragraphe « Jamais d'amend » (l. 124, #634) ; il reçoit la ligne « Outils : » et la ligne « Commits : ».
