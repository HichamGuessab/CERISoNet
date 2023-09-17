const express = require('express');
const https = require('node:https');
const fs = require('fs'); // module de gestion des fichiers
const pgClient = require('pg');
const request = require('node:http');
const bodyParser = require('body-parser');
const sha1 = require('js-sha1');
const session = require('express-session');

const MongoDBStore = require('connect-mongodb-session')(session)  

const app = express(); // appel à expressJS
const port = 3201; // port définit

const options = { // lecture clé privée et certificat
  key: fs.readFileSync('SSL_certificate/key.pem'),
  cert: fs.readFileSync('SSL_certificate/cert.pem')
};

// Gérer la méthode POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '10mb'}));

// https://pedago.univ-avignon.fr:3242/
const server = https.createServer(options, app);
server.listen(port, () => {
  console.log("Running on port", port)
});

// Gérer les sessions
app.use(session({
  secret:'ma phrase',
  saveUninitialized: false,
  resave: false,
  store : new MongoDBStore({
      uri: "mongodb://127.0.0.1:27017/db-CERI",
      collection: 'mySessions3201',
      touchAfter: 24 * 3600 // 1 sauvegarde toutes les 24h hormis si données MAJ
  }),
  cookie : {maxAge : 24 * 3600 * 1000} // millisecond valeur par défaut
}));

// Accueil
app.get('/', (req, res) => {
  const indexHTML = fs.createReadStream('index.html');
  indexHTML.pipe(res);
})

// Connexion
app.post('/login', (req, res) => {
  const identifiant = req.body.identifiant;
  const motdepasse = sha1(req.body.mot_de_passe);
  console.log(identifiant + " " + motdepasse);
  let sql = "select * from fredouil.users where identifiant='" + identifiant + "';";
  
  const connexionObj = new pgClient.Pool({user:'uapv2102872', host:'127.0.0.1', database:'etd', password: 'jhFP6M', port:5432});
  connexionObj.connect((err, client, done) => {
    if(err) {
      console.log('Erreur de connexion au serveur pg' + err.stack);
    } else {
      console.log('Connexion établie / pg db server');

      const responseData = {};

      client.query(sql, (err, result) => {
        if(err) {
          console.log('Erreur d execution de la requete' + err.stack);
          responseData.statusMsg = 'Connexion échouée';
          const failedHTML = fs.createReadStream('failed.html');
          failedHTML.pipe(res);
        } 
        else if ((result.rows[0] != null) && (result.rows[0].motpasse == motdepasse)) {
          req.session.isConnected = true;
          req.session.identifiant = identifiant;

          responseData.data = result.rows[0].nom;
          responseData.statusMsg = 'Connexion réussie : Bonjour '+ result.rows[0].prenom;

          // Mettre à jour le statut de connexion dans la base de données
          const updateSql = `UPDATE fredouil.users SET statut_connexion = 1 WHERE identifiant = '${identifiant}';`;
          
          client.query(updateSql, (err, updateResult) => {
            if (err) {
              console.log('Erreur lors de la mise à jour du statut de connexion :', err.stack);
              responseData.statusMsg += 'Erreur lors de la mise à jour du statut de connexion';
            } else {
              console.log('Statut de connexion mis à jour dans la base de données.');
              responseData.statusMsg += 'Statut de connexion mis à jour dans la base de données.';
              const loggedHTML = fs.createReadStream('logged.html');
              loggedHTML.pipe(res);
            }
          });
        }
        else {
          console.log('Connexion échouée : informations de connexion incorrectes.');
          responseData.statusMsg='Connexion échouée : informations de connexion incorrectes.';
          const failedHTML = fs.createReadStream('failed.html');
          failedHTML.pipe(res);
        }
      })
    }
    client.release();
  })
})

// Déconnexion
app.post('/logout', (req, res) => {
  if (req.session.isConnected) {
    const identifiant = req.session.identifiant;

    const connexionObj = new pgClient.Pool({user:'uapv2102872', host:'127.0.0.1', database:'etd', password: 'jhFP6M', port:5432});
    connexionObj.connect((err, client, done) => {
      if(err) {
        console.log('Erreur de connexion au serveur pg' + err.stack);
      } else {
        console.log('Connexion établie / pg db server');

        const updateSql = `UPDATE fredouil.users SET statut_connexion = 0 WHERE identifiant = '${identifiant}';`;
  
        client.query(updateSql, (err, updateResult) => {
          if (err) {
            console.log('Erreur lors de la mise à jour du statut de connexion :', err.stack);
          } else {
            console.log('Statut de connexion réinitialisé dans la base de données.');
          }
        });
      }
      client.release();
    });
    // Déconnexion de l'utilisateur en réinitialisant la session
    req.session.destroy(err => {
      if (err) {
        console.log('Erreur lors de la déconnexion :', err);
      } else {
        console.log('Utilisateur déconnecté avec succès.');
      }
      const logoutHTML = fs.createReadStream('logout.html');
      logoutHTML.pipe(res);
    });
  } else {
    // L'utilisateur n'était pas connecté
    res.redirect('/');
  }
});