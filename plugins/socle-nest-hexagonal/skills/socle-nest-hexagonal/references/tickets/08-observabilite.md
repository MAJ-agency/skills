# Choisir et brancher l'observabilité

Status: needs-info
Type: research

Le port `IAppLoggerService` existe et son adapter écrit dans le logger du framework. C'est le minimum ; il manque le reste.

## À trancher

1. **Suivi d'erreurs** — quel outil, et où tourne-t-il ? Si la souveraineté des données compte, préférer un backend auto-hébergé parlant un protocole standard, pour garder la possibilité d'en changer.
2. **Logs structurés** — JSON, avec un identifiant de corrélation propagé par requête et **masquage des données personnelles au niveau du logger**, pas au niveau de l'appelant.
3. **Rétention** — combien de temps, et qui y a accès ?

## Garde-fou

Ne jamais envoyer de données personnelles à un service tiers sans l'avoir décidé explicitement. Le filtrage se fait **avant l'envoi**, pas après.

## Comments
