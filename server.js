const express = require('express') 
const https = require('node:https')
const fs = require('fs'); // module de gestion des fichiers

const app = express(); // appel à expressJS
const port = 3242; // port définit

const options = { // lecture clé privée et certificat
  key: fs.readFileSync('SSL_certificate/key.pem'),
  cert: fs.readFileSync('SSL_certificate/cert.pem')
};

// https://pedago.univ-avignon.fr:3242/
const server = https.createServer(options, app);

server.listen(port, () => {
  console.log("Running on port", port)
});

app.get('/', (req, res) => {
  const indexHTML = fs.createReadStream('index.html');
  indexHTML.pipe(res);
})

app.get('/login', (req, res) => {
  const identifiant = req.query.identifiant;
  const motdepasse = req.query.mot_de_passe;
  console.log("Identifiant :", identifiant, "Mot de passe :", motdepasse)
  res.end()
})