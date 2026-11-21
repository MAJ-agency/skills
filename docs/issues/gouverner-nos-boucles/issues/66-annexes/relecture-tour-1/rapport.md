# Relecture du ticket 66 (relecteur-66)

Démarré 2026-11-20 11:39, charge 0.52.
Clone neuf : origin/main = 5bf4f39 ; ticket sur claude/compassionate-euler-st84s9 @ 8a68d2c (base 4cd047f, 5bf4f39 non ancêtre).
Ticket 1613 lignes, patch 1322 lignes, spec 439 lignes.

## Constats (au fil de l'eau)

- Patch : `git apply --check` puis `git apply` sur clone neuf 5bf4f39 : OK, 21 fichiers modifiés + 2 chemins neufs (6 fichiers).
- Texte du ticket == patch : extracteur (outils/extraire.mjs) des 6 fichiers neufs + 21 blocs diff, appliqués sur un autre clone neuf de 5bf4f39, `diff -r` avec l'arbre du patch : identiques. Longueurs : relecteur.mjs 328, SKILL.md 86, bancs 279 et 79 : conformes.
- Rouge avant (6 bancs seuls sur 5bf4f39, 59 s, charge 0.14→0.82) : 13/13, 6/6, 2/39, 1/39, 1/15, 6/60 = 29 rouges. Conforme au ticket.
- Vert après (6 bancs sur arbre patché, 77 s, charge 0.75→1.03) : 13, 6, 39, 39, 15, 60 tous verts.
- Repères de ligne de « Où » contre 5bf4f39 : tous exacts (git diff -U0 5bf4f39 | awk hunks).
- PR ouvertes : 44 (livrer de sujet.sh, coverage-diff ; plugin.json et NOTES en commun ; ne touche pas a-juger) et 56 (deux tickets) : seules ouvertes. Fichiers chauds justes.
- Suite entière lancée en fond 11:43:56 (charge 0.80).

### Lecture du code (constats provisoires)
- retirer_label (github.sh:749) rend toujours 0 (`|| true`) : un retrait refusé ne sort jamais en 7 ; ok pour l'ordre A-84, mais décision 7 « une écriture refusée sort en 7 » ne vaut que pour pose et commentaire.
- distribuer ne compare que le nom du geste : un push entre passe et distribuer en règle 6 rend encore `distribuer` (tour 1, sommet neuf) => écrit, pas de sortie 3 ; couple modele/effort et nombre non recomparés (à vérifier par essai).
- contrat() : `depuis` refusé avec millisecondes ou +00:00 (regex plus étroite qu'A-179.1 « ISO 8601 UTC ») ; `modele` daté accepté (A-179.1 « jamais un identifiant daté », traduction par le gabarit non écrite).
- SKILL : veille de 60 min en run_in_background, sans timeout dit ; défaut de l'outil Bash = 30 min => tuée sans ligne finale. À confirmer comme B.
- SKILL : TaskStop employé mais non chargé (outil différé) ; « plafond : elle a écrit » sans message correspondant dans le skill relecture ; « l'état ne se demande que pour la règle 5 » contre « tant qu'elles vivent » (preferees, règle 6).
- pnpm install en échec : silencieux, retenté à chaque préparation ; a-juger d'une PR de mise à jour à retouches => illisible, cause dite « double relecture illisible ».
- PR de fourche : tête absente des refs/heads => illisible à chaque délai, cause trompeuse.
- Suite entière (une fois), arbre patché + pnpm install : 1 256 tests, 1 256 verts, 0 sauté ; 11 min 38 s (11:43:56 → 11:55:34), charge 0.80 → pointe 4.6 → 1.25 (mes essais X1-X15 ont tourné 8 s pendant la dernière minute).
- Essais (essais/essais.test.mjs, 8 s, charge 1.38) : X1 push entre passe et distribuer => distribuer sort 0, écrit tour 1 sur le sommet neuf, faits.effort passé de medium à xhigh (session déjà créée en medium) ; X3 depuis à millisecondes ou +00:00 => contrat-illisible ; X5 --sessions à mot faux ou non-objet => sortie 1 et pile TypeError ; X7 PR fermée => jouer rend distribuer, distribuer écrit sur la PR fermée (sortie 0) ; X8 deux pages ([a][b] et [a]\n[b]) => concaténées, à-fusionner ; X12 à-fusionner à la main sans tour => à-reprendre posée avant retrait (règle 3a) ; X13 plafond avec refus sur autre sommet => plafonner ; X14 lockfile/package.json de la PR changés => une seule install, sur develop (HEAD = develop) ; X15 a-juger refuse la forme => « Lecture illisible — « double relecture exigée » illisible », architecte seul.
- Privé : aucune donnée privée ajoutée ; « anchorpost », « fedora », « Secret » ne sont que des lignes de contexte de fichiers publics existants (grep emails/ids de session/jetons/chemins perso : rien).
- Version : seule plugin.json et NOTES portent 7.38.0 ; aucun test ne l'écrit (grep).
- « les cinq du socle de la chaîne » (ligne 8) : « Où » en nomme quatre (labels.sh, admin.md, SKILL.md, references/CONTENU.md).
- Gestes du modèle : get_session mappé (archivée/échec/introuvable => morte, sinon vivante) ; « plafond : elle a écrit » sans message dans relecture/SKILL.md ; TaskStop non chargé ; exit 2/12/1 de jouer et distribuer sans suite écrite ; VEILLE FINIE « relever son contexte et son coût » sans seuil ni suite ; `effort` refusé par create_session si l'outil est pré-approuvé (description de l'outil) : rien d'écrit.
- Sécurité : aucun code de la PR n'est exécuté (develop seulement : scripts/chaine, pnpm install, commitlint config ; PR lue en objets git, dépôts nus jetables). Une PR peut : faire tracer un illisible (fourche, a-juger refusé) ; faire envoyer les lignes fixes à une session de son choix (Session:/Conducteur: de la demande) ; via le même compte GitHub, une session auteur peut écrire une fausse distribution et un faux verdict (limite du modèle de confiance d'A-80/A-111, hors lot 4).
- Essais 2 (essais/essais2.test.mjs, 4 s, charge 1.61) : X16 trois préparations simultanées dans le même dossier (veille + geste) : 1 sur 18 sort en 12 (« git switch … remove the file manually ») => dans la veille, VEILLE ARRÊTÉE sortie 12, « ne pas relancer » ; X17 un hook post-checkout (core.hooksPath) qui récrit un fichier suivi : passe 1 => 0, passes 2 et 3 => 6 « pas propre » (le relais graphify du socle + graphify-out suivi, cas d'anchorpost, le ferait).

## Brouillon des constats (à finaliser avec les mutations)
B1 veille (l.711) : 60 min en run_in_background sans timeout ; défaut de l'outil 30 min.
m distribuer push (l.79, 684, 1054) ; m couple réemploi (l.688-689) ; m A-179.1 (l.76, 916, 689) ; m depuis ms (l.916) ; m --sessions mot faux (l.965-974) ; m PR fermée (l.1027, 1053) ; m TaskStop (l.665, 703) ; m get_session règle 6 (l.688 vs 695) ; m plafond message (l.695) ; m exit 2/12/1 (l.684) ; m sortie 7 boucle (l.684) ; m concurrence (l.703, X16) ; m hooks (l.894, X17) ; m pnpm silencieux (l.899) ; m cause illisible (l.75, X15) ; m fourche ; m cinq/quatre (l.9) ; m VEILLE FINIE vague (l.714) ; m remplacer --sessions (l.681).

## Mutations
- Annexe (ticket/mutations.mjs sur apres/) : 35/35 rouges, 11:57:09 → 12:07:37 (10 min 28 s), charge 0.25 → 2.56 (mes mutations ont tourné en parallèle sur mut2/ dès 12:01:58).
- Les miennes (outils/mes-mutations.mjs sur mut2/, clone neuf de 5bf4f39 avec le patch) : 18, 3 rouges (N11, N16, N17), 15 survivantes (N1 à N10 sauf N11, N12 à N15, N18). 12:01:58 → 12:08:45 (6 min 47 s), charge 1.12 → 1.59.
- Arbres rendus intacts après les mutations (diff apres == mut2 == patch, fichiers neufs identiques à l'extraction du ticket).

## Verdict : prêt après retouches (1 B, 19 m) — rapport final remis par SubagentHandback.
