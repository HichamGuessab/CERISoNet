const express = require('express');
const https = require('node:https');
const fs = require('fs'); // module de gestion des fichiers
const pgClient = require('pg');
const bodyParser = require('body-parser');
const sha1 = require('js-sha1');
const path = require('path');
const dateFormat = require('date-format');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session)
const { client, dbName } = require('./mongodb.config.js');

const app = express(); // appel à expressJS
const port = 3201; // port définit

const options = { // lecture clé privée et certificat
  key: fs.readFileSync('SSL_certificate/key.pem'),
  cert: fs.readFileSync('SSL_certificate/cert.pem')
};

// Gérer la méthode POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'CERISoNet/dist/ceriso-net')));

// https://pedago.univ-avignon.fr:3201/
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
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});

// Connexion
app.post('/login', (req, res) => {
  const identifiant = req.body.identifiant;
  const motdepasse = sha1(req.body.mot_de_passe);
  let id = 0;

  let sql = "select * from fredouil.users where identifiant='" + identifiant + "';";

  const connexionObj = new pgClient.Pool({
        user:'uapv2102872',
        host:'127.0.0.1',
        database:'etd',
        password: 'jhFP6M',
        port:5432
      });
  let message = "";

  connexionObj.connect((err, client, done) => {
    if(err) {
      console.log('Erreur de connexion au serveur pg.');
      message += 'Erreur de connexion au serveur pg.';
      res.status(401).send({ message: message });
    } else {
      console.log('Connexion établie / pg db server');
      message += 'Connexion établie / pg db server';

      // Query send to BDD PGSQL
      client.query(sql, (err, result) => {
        if(err) {
          console.log('Erreur d execution de la requete' + err.stack);
          message += 'Erreur d execution de la requete';
          res.status(401).send({ message: message });
        } 
        else if ((result.rows[0] != null) && (result.rows[0].motpasse == motdepasse)) {
          req.session.isConnected = true;
          req.session.identifiant = identifiant;
          id = result.rows[0].id;
          req.session.identifiantPGSQL = id;
          console.log(req.session)

          message = 'Connexion réussie : Bonjour '+ result.rows[0].prenom;

          // Mettre à jour le statut de connexion dans la base de données
          const updateSql = `UPDATE fredouil.users SET statut_connexion = 1 WHERE identifiant = '${identifiant}';`;

          // UPDATE query
          client.query(updateSql, (err, updateResult) => {
            if (err) {
              console.log('Erreur lors de la mise à jour du statut de connexion :', err.stack);
              message += 'Erreur lors de la mise à jour du statut de connexion';
              res.status(401).send({ message: message });
            } else {
              console.log('Statut de connexion mis à jour dans la base de données.');
              message += 'Statut de connexion mis à jour dans la base de données.';
              res.send({ message: message, id: id });
            }
          });
        }
        else {
          console.log('Connexion échouée : informations de connexion incorrectes.');
          message = 'Connexion échouée : informations de connexion incorrectes.';
          res.status(401).send({ message: message });
        }
      })
    }
    client.release();
  })
})

const WebSocket = require('ws');
const wss = new WebSocket.Server({server: server});

wss.on('connection', (socket) => {
  console.log("Un client s'est connecté.");
  socket.on('message', (data) => {
    const dataString = data.toString();
    const jsonData = JSON.parse(dataString);

    if(jsonData.event === "likedMessage"){
      console.log("Recu : ", jsonData);
      wss.emit('likedMessage', jsonData);
      console.log("Je suis sortie");
    }
  })
})

wss.on('userConnected', (socket) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'usersConnected', data: socket }));
    }
  });
})

wss.on('likedMessage', async (data) => {
  console.log("yes je rentre");
  console.log(data); // Soucis ici
  const messageId = data.messageId;
  const like = data.like;
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('CERISoNet');
  try {
    const query = { _id: messageId };
    let update = {};
    if(like) {
      update = { $inc: { likes: 1 } }; // Incrémentation du nombre de likes
    } else {
      update = { $inc: { likes: -1 } }; // Décrémentation du nombre de likes
    }
    console.log(update);
    const result = await collection.updateOne(query, update);
    console.log(result);
    if (result.matchedCount === 1) {
      const updatedMessage = await collection.findOne(query);

      // Envoie de la mise à jour aux clients connectés
      wss.emit('messageLiked', {
        message : "Vous avez liké un message.",
        messageId: updatedMessage._id,
        nbLikes: updatedMessage.likes,
      });
      console.log(updatedMessage.likes)
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du like', error);
  } finally {
    client.close();
  }
});

setInterval(() => {
  const connexionObj = new pgClient.Pool({
    user:'uapv2102872',
    host:'127.0.0.1',
    database:'etd',
    password: 'jhFP6M',
    port:5432
  });

  connexionObj.connect((err, client) => {
    if (err) {
      console.log('Erreur de connexion au serveur pg.');
    } else {
      client.query('SELECT * FROM fredouil.users WHERE statut_connexion = 1', (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des utilisateurs connectés:', error);
        } else {
          const users = results.rows;
          const identifiants = users.map(user => user.identifiant);
          wss.emit('userConnected', {message: identifiants});
        }
      });
    }
    client.release();
  });
}, 2000);

// Déconnexion
app.get('/logout', (req, res) => {
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
        res.send({ message : "Vous avez été déconnecté."});
      }
    });
  } else {
    // L'utilisateur n'était pas connecté
    console.log("L'utilisateur n'était pas connecté.")
    res.send({ message : "Erreur : Vous n'étiez pas connecté."});
  }
});

app.get('/checkConnexion', (req, res) => {
  if(req.session.isConnected) {
    res.send( { isConnected : true, identifiantPGSQL : req.session.identifiantPGSQL } )
  } else {
    res.send( { isConnected : false, identifiantPGSQL : null } )
  }
})

app.get('/messages', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('CERISoNet');
    const messages = await collection.find({}).toArray();
    res.json(messages);
  } catch (err) {
    console.error('Erreur lors de la récupération des messages :', err);
    res.status(500).json({message: 'Erreur lors de la récupération des messages.'})
  } finally {
    client.close();
  }
})

app.post('/messages/:messageId/comment', async (req, res) => {
  const param1 = req.params['messageId'];
  const { text, commentedBy } = req.body;

  const messageId = +param1;

  console.log("MessageId : ", messageId);
  console.log("text : ", text);
  console.log("commentedBy : ", commentedBy);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('CERISoNet');

    const commentaire = {
      commentedBy,
      text,
      date: dateFormat('yyyy-MM-dd', new Date()),
      hour: dateFormat('hh:mm', new Date())
    };

    const filter = { _id: messageId };
    const update = {
      $push: { comments: commentaire },
    };

    const result = await collection.updateOne(filter, update);
    console.log(result.modifiedCount);

    if (result.modifiedCount === 1) {
      res.status(201).json( {message: "Commentaire ajouté avec succès!"});
    } else {
      res.status(404).json({ error: 'Message introuvable.' });
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire :', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du commentaire.' });
  }
});

const crypto = require('crypto-js');
const encryptionKey = 'secretKey';

app.delete('/messages/:messageId/:commentedBy/text/:commentText/date/:commentedDate/:commentedHour/deleteComment', async (req, res) => {
  const messageId = +req.params.messageId;
  const commentedBy = +req.params.commentedBy;
  let encryptedText = req.params.commentText;
  let commentText;
  const commentedDate = req.params.commentedDate;
  const commentedHour = req.params.commentedHour;

  const sanitizedEncryptedText = encryptedText.replace(/SLASH_REPLACEMENT/g, '/');
  const bytes = crypto.AES.decrypt(sanitizedEncryptedText, encryptionKey);
  commentText = bytes.toString(crypto.enc.Utf8);

  if (commentText.endsWith("?") || commentText.endsWith("&")) {
    commentText = commentText.replace(/XYZ$/, "");
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('CERISoNet');

    const filter = { _id: messageId };

    let update;
    let result;
    if(commentedBy === 0 && commentText === "*^$²^s²df;²:pojn84g²1d5") {
      console.log("Deux non renseignés.")
      update = {
        $pull: { comments: {  date: commentedDate, hour: commentedHour } },
      };
      result = await collection.updateOne(filter, update);
    } else if(commentedBy === 0) {
      console.log("Auteur non renseigné.")
      update = {
        $pull: { comments: { text: commentText, date: commentedDate, hour: commentedHour } },
      };
      result = await collection.updateOne(filter, update);
    } else if(commentText === "*^$²^s²df;²:pojn84g²1d5") {
      console.log("Texte non renseigné");
      update = {
        $pull: { comments: { commentedBy: commentedBy, date: commentedDate, hour: commentedHour } },
      };
      result = await collection.updateOne(filter, update);
    } else {
      console.log("Texte non renseigné");
      update = {
        $pull: { comments: { commentedBy: commentedBy, text: commentText, date: commentedDate, hour: commentedHour } },
      };
      result = await collection.updateOne(filter, update);
    }

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Commentaire supprimé avec succès.' });
    } else {
      res.status(404).json({ message: 'Message ou commentaire introuvable.' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire :', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du commentaire.' });
  } finally {
    client.close();
  }
});

