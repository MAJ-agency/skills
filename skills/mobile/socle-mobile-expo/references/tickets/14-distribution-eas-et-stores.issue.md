# Décider la distribution : EAS, profils, stores, mises à jour

Status: needs-info
Type: grilling

`app.config.ts` porte un nom, un slug et des identifiants de bundle dérivés du projet. Rien n'est décidé sur la façon de construire et de distribuer l'app.

## Questions à trancher

- **Comptes** : quel compte Apple Developer, quel compte Google Play, quel projet EAS ? Un par produit, ou un par client déployé (marque blanche) ?
- **Profils EAS** : `development` (dev client), `preview` (testeurs internes, APK/TestFlight), `production`. Qui déclenche quoi, sur quelle branche, avec quelle approbation ?
- **Mises à jour OTA** (`expo-updates`) : voulues ? Elles imposent des canaux par profil et une politique de compatibilité du contrat API.
- **Secrets de build** : où vivent les clés de signature (jamais dans le dépôt : le `.gitignore` les refuse), qui y a accès ?
- **Cadence des SDK** : une montée de SDK Expo par an, planifiée, avec `expo-doctor` vert.

## Sortie attendue

Une ADR `MOB-2` qui fixe comptes, profils et politique OTA, puis `eas.json`, les icônes et splash, et le job CI `mobile-preview` (build sur la branche d'intégration) et `mobile-production` (sur tag, approbation manuelle).

## Comments
