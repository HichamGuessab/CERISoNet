# CERISoNet

Application FullJS dont le contexte applicatif est le “réseau social”.

## Technologies utilisées

- **Backend :** Node.js, Express, WebSocket, MongoDB
- **Frontend :** Angular (Bootstrap 5.3.2)

## Fonctionnalités

- **Liker**, **commenter** et **partager** un message (le post d'un message n'est disponible que via le partage)
- Tri par propriétaire, date et popularité (nombre de likes)
- Filtrage par hashtags et propriétaire
- Affichage des utilisateurs connectés

## Utilisation

- **Build :** `cd CERISoNet` et `npx ng build`
  Les fichiers sont générés dans le dossier `dist/ceriso-net`.  
  Ce dossier est spécifié dans le fichier `angular.json` de la racine du projet Angular (Clé `outputPath` des `options` de la clé `architect`).

- **Lancer le serveur :** `node server.js`