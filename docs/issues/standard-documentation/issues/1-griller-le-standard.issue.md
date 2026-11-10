# Griller le standard de documentation lu par Anchorpost

Status: resolved
Type: grilling

Jouer le second grilling décrit dans `../standard-documentation.spec.md` : une session sur ce dépôt, Fedora, Iroki et Anchorpost attachés, `/mattpocock-skills:grill-with-docs` sur le brief. La frontière est la section « La frontière à griller » ; la section « Déjà décidé » ne se rouvre pas.

## Sorties

- Le standard dans les gabarits (`decisions.md`, `nomenclature.md`, `tests.md`, `tickets`, gabarits) et ses ADR.
- Le skill `anchorpost` et l'option « Anchorpost ? » de `socle-monorepo`.
- Les specs de refonte à déposer dans Fedora et Iroki, et la spec des adaptateurs de la CLI dans Anchorpost.

## Answer

Grilling joué le 2026-11-10 en cinq tours (Q1 à Q43), décisions consignées dans `../standard-documentation.spec.md` § « Décisions du second grilling ». Livré sur la branche `docs/standard-documentation` :

- **Le standard** : `skills/monorepo/socle-monorepo/references/methode/nomenclature.md` (grammaire `<TYPE>_<CTX>_<TRI>-<n>`, six types, contextes, arborescence), `decisions.md` § registre, `grilling.md` § cycle et § « Écrire une question qu'un humain comprend », `racine/.claude/rules/tests.md` (étiquette), `racine/docs/questions-ouvertes.md`, `racine/docs/metier/regles/all/`, ticket `9` ; ADR `ADR_ALL_ARC-1-identifiants-types-et-contextes.md` (remplace `ARC-1`), `ADR_ALL_ARC-N-registre-un-fichier-par-regle.md` ; `ARC-3` et `ARC-4` renommées.
- **Le skill `tickets`** : convention, en-têtes `Type:` et `Règles:`, gabarits `regle.md` et `demande.md`, gabarits de spec et de ticket, fiche `issue-tracker.md` ; `recette-humaine` et critère `T3` alignés.
- **Le skill `anchorpost`** (`skills/chaine/anchorpost/`) et la question « Anchorpost ? » de `socle-monorepo`.
- **Trois specs à déposer** : `../anchorpost-cli-et-pivot-v2.spec.md`, `../refonte-fedora.spec.md`, `../refonte-iroki.spec.md`.

Ce qui n'est pas dans ce ticket et part en tickets `2` à `7` : les scripts (`identifiants.mjs`, gate, `contexte-ticket.mjs`, `sujet.sh`, `fusionner`), les gabarits des autres skills, `socle-tests`, le dépôt des specs.

## Comments

- 2026-11-09 — Brief écrit à la fin du premier grilling (session de pose d'Anchorpost), avec les faits relevés dans les trois dépôts.
- 2026-11-10 — Anchorpost et Iroki n'étaient pas clonés à côté : ajoutés à la session et clonés, comme Fedora. Faits du brief corrigés par la lecture : champs de `rules.json` en anglais, 36 clés de domaines dont quatre non-trigrammes et deux doublons de libellé, niveaux P0/P1/P2 par le chemin seul, aucun `Type:` chez Fedora, dix registres et 156 règles chez Iroki (pas neuf et 147), collisions `BEN-2` et `DOC-1` en plus. Les huit points de Q29 n'étaient écrits nulle part : reconstruits.
- 2026-11-10 — Consigne du capitaine (session parente), relayée de l'humain : les choix techniques ne remontent plus ; tranchés par défaut prudent et notés ici : catégories et niveaux de preuve par le chemin et le suffixe (Q7) ; plancher dans le manifeste (Q8) ; quatre commandes et liste de refus fermée de la CLI (Q12, Q25) ; installation par devDependency, `index-generes.json`, `gatesRapides`, `NODE_AUTH_TOKEN` (Q13, Q26) ; catégorie `chaine` pour le skill (Q14) ; rien pour la CI par test (Q15) ; `CONTEXT.md` au format glossaire, domaines dans le registre des trigrammes (Q17) ; `ex` en source, précisions dans le texte, décisions extraites (Q18) ; champs Fedora sous `extensions` ; `module` lu « à construire » ; dossiers de contexte en minuscules, identifiants en majuscules ; titre d'une règle Iroki dérivé de la première phrase avec alerte de santé.
- 2026-11-10 — L'humain a rouvert deux points « déjà décidés » : les noms des personnes restent et s'affichent avec leur rôle (amende `ANC-13`, `ANC-14`, `ANC-19`), et « en question » devient un indicateur (amende `ANC-6`). Consigné dans la spec Anchorpost § 6.
- 2026-11-10 — Remarque de méthode : une question de grilling écrite en couples « x → y » a reçu « rien compris » ; `grilling.md` gagne la section « Écrire une question qu'un humain comprend », le skill `chantier` y renvoie.
