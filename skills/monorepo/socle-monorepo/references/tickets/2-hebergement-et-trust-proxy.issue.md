# Choisir l'hébergement, puis régler `trust proxy`

Status: needs-info
Type: research

L'hébergement n'est pas décidé, et `trust proxy` est **délibérément non configuré** dans `main.ts` en conséquence.

## Pourquoi les deux vont ensemble

Derrière un proxy, la connexion TCP vient du proxy : `req.ip` serait identique pour tout le monde. D'où l'en-tête `X-Forwarded-For` — que le client peut écrire lui-même, le proxy se contentant d'ajouter sa ligne en dessous. `trust proxy: N` dit « j'ai N intermédiaires à moi, remonte de N crans ».

Se tromper coûte cher, dans les deux sens :

- **Trop haut** (`true`, ou 2 alors qu'il n'y en a qu'un) → le client choisit son IP, la change à chaque requête, **tout comptage par IP est contourné**.
- **Trop bas** → tout le monde partage l'IP du proxy, le premier bruyant fait **bloquer les autres**.

Le nombre dépend donc de la topologie réelle (CDN ? load balancer ? routeur du PaaS ?), qui dépend de l'hébergeur.

## À trancher

1. Quel hébergeur, et combien d'intermédiaires devant l'app ?
2. Contraintes de souveraineté : où les données peuvent-elles vivre ? Un CDN qui termine le TLS est-il acceptable ?
3. PostgreSQL managé : sauvegarde à un instant donné (PITR) chiffrée ? Peut-on créer un rôle applicatif distinct du propriétaire ?

## À faire ensuite

Poser `app.set("trust proxy", N)` dans `main.ts`, puis **le vérifier** : depuis une IP connue, envoyer un `X-Forwarded-For` bidon et comparer à ce que l'app journalise. Ne pas le deviner.

## Comments
