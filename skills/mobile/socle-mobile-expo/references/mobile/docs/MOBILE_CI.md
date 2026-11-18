# Parcours sur appareil en CI — la méthode

Compagnon de `apps/mobile/CLAUDE.md` et de `MOBILE_GUIDELINES.md`. À lire avant d'écrire le job CI des parcours (ticket « Poser les parcours de bout en bout sur appareil »), et par toute session qui touche ce workflow. Méthode tirée d'un premier projet : elle donne les règles et leurs raisons, jamais les réglages d'un projet (identifiant d'app, noms de parcours, comptes d'un seed, numéros de job). Les identifiants du code restent en anglais, la prose en français.

Chaque section suit le même ordre : le symptôme vécu, la règle, l'extrait, ce qu'on lit quand ça casse. Les extraits supposent Maestro sur l'émulateur Android de `reactivecircus/android-emulator-runner`.

## 1. L'émulateur à 4 cœurs et 4 Go

**Symptôme.** Sur un premier projet, les parcours clignotaient : l'émulateur perdait le lancement de l'app après `launchApp: { clearState: true }`. Par défaut, l'action donne 2 cœurs et un peu plus de 2,5 Go ; affamé (rendu logiciel, services de l'image, API et base sur le même runner), l'émulateur laisse tomber le lancement.

**Règle.** Régler l'émulateur à 4 cœurs, 4 Go, sans animations. Plus de cœurs rétrécit la fenêtre de la panne sans la fermer : d'où le point 2.

```yaml
- uses: reactivecircus/android-emulator-runner@v2
  with:
    cores: 4
    ram-size: 4096M
    disable-animations: true
    script: ./scripts/ci/run-maestro.sh
```

**Quand ça casse.** Un parcours qui attend l'écran d'entrée et ne le voit jamais : lire le point 2 avant de monter encore les ressources.

## 2. Le sous-flux de démarrage à froid : une relance unique et comptée

**Symptôme.** Le `pm clear` de `clearState` retire la tâche de l'app de façon asynchrone et peut tuer le processus que Maestro vient de lancer. Dans le tampon `events` : `am_kill … remove task` juste après `am_proc_start`, sans `am_proc_bound`.

**Règle.** Chaque parcours commence par un sous-flux commun (`e2e/commons/cold-start.yaml`) : attendre l'écran d'entrée 30 s ; sinon relancer **une fois** l'activité (`launchApp` avec `stopApp: false`, sans `clearState`) ; puis attendre 60 s. Aucune commande du parcours n'est rejouée : ce n'est pas un `retry`. La relance laisse un marqueur (un `evalScript` qui écrit une ligne), que le workflow compte à chaque run (« relances : N »), avec le nombre de lancements de l'app lu dans `events`. Au-delà d'une relance par run en moyenne, c'est un défaut à reprendre, pas un réglage à tolérer.

```yaml
# e2e/commons/cold-start.yaml
appId: ${APP_ID}
---
- launchApp:
    clearState: true
- runFlow:
    when:
      notVisible:
        id: home-screen
    commands:
      - evalScript: ${console.log('COLD_START_RELAUNCH')}
      - launchApp:
          stopApp: false
- extendedWaitUntil:
    visible:
      id: home-screen
    timeout: 60000
```

**Cette exception à « jamais un `retry` » se décide par une ADR du projet**, avec son seuil et sa sortie (à quelle condition on retire la relance).

**Quand ça casse.** Le compte « relances : N » monte : lire `events` pour le nombre de lancements et la cause (`am_kill`, `am_anr`).

## 3. `hide_error_dialogs`

**Symptôme.** Un dialogue « Application Not Responding » d'un autre processus (le lanceur) reste au premier plan et masque l'app ; un tap sur « Attendre » ne le ferme pas toujours.

**Règle.** Le script de l'émulateur pose `hide_error_dialogs` juste avant Maestro, relit la valeur et imprime la fenêtre au premier plan. Le réglage cache aussi les dialogues de l'app : **le point 4 est donc obligatoire avec lui**, sinon un ANR de l'app ne se voit plus.

```sh
adb shell settings put global hide_error_dialogs 1
adb shell settings get global hide_error_dialogs
adb shell dumpsys window | grep mCurrentFocus
```

**Quand ça casse.** Un parcours vert mais lent, ou un écran masqué : `mCurrentFocus` dit quelle fenêtre tient le premier plan.

## 4. Le compteur d'incidents par processus, lu dans `events`

**Symptôme.** Avec les dialogues cachés, un parcours peut passer vert alors que l'app a eu un ANR ou un crash en coulisse.

**Règle.** Le workflow enregistre `adb logcat -b events` pendant les parcours, puis lit les lignes `am_anr` et `am_crash` (format `EventLogTags.logtags` d'AOSP : `[user,pid,processus,…]`) et les compte par processus. Par principe, un ANR ou un crash de l'app rend le run rouge, même quand les parcours sont verts ; l'app, c'est son identifiant, ou `<identifiant>:<suffixe>` pour un processus secondaire. Un `events` illisible aussi : sans lui, rien ne dit que l'app n'a pas eu d'incident caché. Un incident d'un autre processus est compté et imprimé, jamais rouge.

```sh
adb logcat -b events -v time > events.log &   # pendant les parcours
node scripts/ci/incidents-events.mjs events.log "$APP_ID"
# entrée : le journal events et l'identifiant de l'app ; sortie : un compte par processus ;
# code 0 sans incident de l'app, 1 sinon (ou journal illisible)
```

Le script est un petit fichier du projet (`scripts/ci/<nom>.mjs`) avec son banc : la référence en donne l'entrée, la sortie et les codes, pas le code.

**Quand ça casse.** Le job est rouge avec des parcours verts : la sortie du script nomme le processus et la ligne de `events`.

## 5. Un timeout propre à l'étape Maestro

**Symptôme.** Une étape bloquée (le gestionnaire de SDK, une image système) attendait le timeout du job, parfois des dizaines de minutes.

**Règle.** Un `timeout-minutes` sur l'étape Maestro, réglé sur la durée normale mesurée plus la pire relance, et un autre sur l'étape de build, à part. Chaque `adb shell` du diagnostic tourne sous `timeout 20` : un diagnostic qui se bloque ne doit pas masquer l'échec qu'il explique.

```yaml
- name: Parcours Maestro
  timeout-minutes: 30   # durée normale mesurée + pire relance, à recalculer
```

**Quand ça casse.** Une étape tuée par son timeout : le journal s'arrête là, c'est elle qui était bloquée, pas le job entier.

## 6. Un diagnostic par parcours en échec

**Symptôme.** Un rouge ne disait pas pourquoi : il fallait télécharger l'artefact et l'ouvrir.

**Règle.** Le rouge se lit dans le journal du job. Pour chaque flux en échec : les dernières commandes Maestro avec leur statut et leur erreur (fichiers `commands-*.json` du `--debug-output` et de `~/.maestro/tests/`), l'écran réel à l'échec (`uiautomator dump`, ses `text`, `resource-id`, `content-desc`), le `logcat` de JS et des erreurs, la fin du journal de l'API. Puis l'artefact, en `if: failure()`.

```yaml
- name: Diagnostic Maestro en texte
  if: failure()
  run: ./scripts/ci/diagnostic-maestro.sh   # un bloc par flux ; chaque adb sous `timeout 20`
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: maestro-debug
    path: maestro-debug/
```

**Quand ça casse.** Le diagnostic est vide : le flux n'a pas écrit son `--debug-output`, ou l'émulateur est mort avant — le point 5 le dit.

## 7. Le filtre `paths`

**Symptôme.** Le workflow des parcours se relançait sur un commit de documentation seule.

**Règle.** Le filtre `paths` d'un `pull_request` juge le diff de toute la PR, pas celui du dernier commit : un commit de documentation seule sur une PR qui a touché l'app relance les parcours. La référence décrit ce comportement, elle ne le contourne pas.

Et un workflow sauté par son filtre laisse un check exigé « en attente » : un workflow filtré par `paths` ne devient pas un check exigé. Pour entrer au gate, le workflow perd son filtre `paths`, ou le tri passe dans un job qui conclut toujours. Le parcours entre au gate quand il est vert trois fois de suite (ticket des parcours sur appareil).

**Quand ça casse.** Une PR bloquée sur « en attente » : le check exigé vient d'un workflow que `paths` a sauté.
