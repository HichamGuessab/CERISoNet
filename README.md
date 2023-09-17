# CERISoNet

Développement d'une application FullJS dont le contexte applicatif est le “réseau social”.

## Etape 1 - Page de connexion

Mise en place de NodeJS pour la partie serveur/backend.

### 0. Création d'une page de connexion index.html en utilisant bootstrap

- Utilisation de Bootstrap 3.4.1
``` html
<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css">

<!-- jQuery library -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>

<!-- Latest compiled JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
```

### 1. Création clé privée et certificat nécessaires au lancement du serveur node avec HTTPS

Ce certificat ainsi que la clef privée se trouve dans le dossier `SSL_certificate`.

``` bash
openssl genrsa -out key.pem
openssl req -new -key key.pem -out csr.pem
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
rm csr.pem
```

### 2. Création des premières lignes de code en Express

- Permettre l'écoute d'un port spécifique et le renvoi du fichier index.htm de l’étape 0 lorsque l’url [https://pedago.univ-avignon.fr:3xxx/](https://pedago.univ-avignon.fr:3xxx/) est tapé dans un navigateur.

- `3xxxx` est le port utilisé.
### 3. Association du formulaire de connexion dans le fichier index.html à une méthode de type GET et à une URL [https://pedago.univ-avignon.fr:3xxx/](https://pedago.univ-avignon.fr:3xxx/)

- Le traitement de la requête côté serveur, après saisie des informations de login/mot de passe et envoi du formulaire, permet la réception des paramètres de connexion et leur affichage dans la console de log.

## Etape 2 - Front-end (Angular) & Back-end (NodeJS)

Gestion de la connexion de l’internaute et affichage d’un "mur" d’accueil.

### 1. Procédure de connexion pour un internaute enregistré dans la base de données PostgreSQL.

Gestion de la connexion et de la déconnexion.

- Echange des données entre le client et le serveur (requête/réponse HTTPS) pour l’envoi des informations de connexion et l’état de connexion.

- Gestion de la connexion à la base de données PostgreSQL et consultation de la table users côté serveur pour la vérification des données de connexion de l’internaute (identifiant+mot de passe).

- Sauvegarde des données de connexion par le gestionnaire de sessions associé à un store reposant sur le middleware MongoDBSession.