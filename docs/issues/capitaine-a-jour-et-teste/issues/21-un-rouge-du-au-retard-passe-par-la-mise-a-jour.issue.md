# La boucle du capitaine met à jour avec develop une PR rouge en retard, avant de la relancer ou de la renvoyer

Status: needs-triage
Type: défaut
Modèle: à décider au triage
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/passer.sh`, leurs bancs, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

Constat sur Iroki, le 2026-11-20 : une PR de docs vers develop (MAJ-agency/iroki-monorepo#691) est renvoyée deux fois de suite, alors que sa branche est propre à son sommet.

## Le besoin

**Le défaut.** Une PR dont le seul rouge vient de son retard sur develop est classée « rouge ». Dans le cas d'Iroki, l'index généré `anchorpost/anchorpost.json` devient périmé une fois la branche fusionnée avec develop, et le groupe 9 de `check:anchorpost` échoue. La PR part alors dans `traiter_rouges`. Cette fonction relance le même sommet, puis renvoie la PR, sans jamais passer par `passer.sh`. Or `passer.sh` est le seul à fusionner develop dans la branche et à régénérer les index générés. Si on la ré-étiquette, la PR est renvoyée au tour suivant, ses runs étant déjà en tentative 2. Sur Iroki, le capitaine a contourné le défaut à la main : il a arrêté la veille et lancé `passer.sh <n>`.

**Quand le ticket est fait :**

1. Avant de relancer ou de renvoyer une PR rouge, la boucle regarde si elle est en retard sur develop. Si oui, elle la passe d'abord par la mise à jour : fusion de develop, régénération des index générés, push sous les hooks. La relance porte alors sur le nouveau sommet.
2. La boucle ne renvoie une PR que si le rouge persiste sur un sommet à jour avec develop.
3. Un banc prouve les deux voies : rouge en retard puis vert après la mise à jour ; rouge à jour puis renvoi.
4. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet repose.

## Comments

- 2026-11-20 — Ouvert par le conducteur d'Iroki, sur le constat de son capitaine (cause et correctif attendu repris ici).
