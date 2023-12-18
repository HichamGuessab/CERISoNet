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

const app = express();
const port = 3201;

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

// Gestion des sessions via MongoDB
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

// Connexion à la base de donnée MongoDB
client.connect();

// Accueil
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});

// Connexion de l'utilisateur
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

          message = 'Connexion réussie : Bonjour '+ result.rows[0].prenom;

          // Mise à jour du statut de connexion dans la base de données
          const updateSql = `UPDATE fredouil.users SET statut_connexion = 1 WHERE identifiant = '${identifiant}';`;

          client.query(updateSql, (err, updateResult) => {
            if (err) {
              console.log('Erreur lors de la mise à jour du statut de connexion :', err.stack);
              message += 'Erreur lors de la mise à jour du statut de connexion';
              res.status(401).send({ message: message });
            } else {
              console.log('Statut de connexion mis à jour dans la base de données.');
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

// Déconnexion de l'utilisateur
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


// WebSockets
const WebSocket = require('ws');
const wss = new WebSocket.Server({server: server});

// WebSocket principale (chargé de récupérer chaque receive du client et d'emit en fonction)
wss.on('connection', (socket) => {
  console.log("Un client s'est connecté.");
  socket.on('message', (data) => {
    const dataString = data.toString();
    const jsonData = JSON.parse(dataString);

    if(jsonData.event === "likedMessage"){
      wss.emit('likedMessage', jsonData);
    }
    if(jsonData.event === "shareMessage"){
      console.log("Recu : ", jsonData);
      wss.emit('shareMessage', jsonData)
      console.log("Je suis sortie");
    }
  })
})

// WebSocket : Liker un Post
wss.on('likedMessage', async (data) => {
  const messageId = data.messageId;
  const like = data.like;
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
    const result = await collection.updateOne(query, update);
    if (result.matchedCount === 1) {
      const updatedMessage = await collection.findOne(query);

      // Envoie de la mise à jour aux clients connectés
      wss.emit('messageLiked', {
        message : "Vous avez liké un message.",
        messageId: updatedMessage._id,
        nbLikes: updatedMessage.likes,
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du like', error);
  }
});

// WebSocket : Partager un message
wss.on('shareMessage', async (data) => {
  console.log("yes je rentre");

  const newPost = {
    date : dateFormat('yyyy-MM-dd', new Date()),
    hour : dateFormat('hh:mm', new Date()),
    createdBy : data.message.createdBy,
    images: data.message.images,
    likes : data.message.likes,
    hashtags: data.message.hashtags,
    body : data.message.body,
    comments : data.message.comments,
    shared : data.message.shared
  }

  try {
    const db = client.db(dbName);
    const collection = db.collection('CERISoNet');

    // Recherche du plus grand "_id" pour incrémenter dessus
    const lastPost = await collection
        .find({ _id: { $type: 'number' } })
        .sort({ _id: -1 })
        .limit(1)
        .toArray();
    let maxId = 1;

    if (lastPost.length > 0) {
      maxId = lastPost[0]._id + 1;
    }
    newPost._id = maxId;

    const result = await collection.insertOne(newPost);

    if (result.insertedCount === 1) {
      console.log("Message partagé posté avec succès.")
      wss.emit('messagePosted', {
        message : "Vous avez posté un message partagé."
      });
    }
  } catch (error) {
    console.error('Erreur lors du partage du message :', error);
  }
})


// WebSocket : Récupération des utilisateurs connectés
wss.on('userConnected', (socket) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'usersConnected', data: socket }));
    }
  });
})

// Récupération des utilisateurs connectés et emit de la websocket toutes les 2 secondes
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

// Vérifier si l'utilisateur actuel est bien connecté (s'il possède une session en cours)
// Renvoie de l'identifiant PostGreSQL de l'utilisateur si c'est bien le cas
app.get('/checkConnexion', (req, res) => {
  if(req.session.isConnected) {
    res.send( { isConnected : true, identifiantPGSQL : req.session.identifiantPGSQL } )
  } else {
    res.send( { isConnected : false, identifiantPGSQL : null } )
  }
})

// Renvoyer les correspondances utilisateurs Identifiant avec id de chaque utilisateur.
app.get('/usersCorrespondences', (req, res) => {
  const connexionObj = new pgClient.Pool({user:'uapv2102872', host:'127.0.0.1', database:'etd', password: 'jhFP6M', port:5432});
  connexionObj.connect((err, client, done) => {
    if(err) {
      console.log('Erreur de connexion au serveur pg' + err.stack);
    } else {
      console.log('Connexion établie / pg db server');

      const usersCorrespondences = `SELECT id, identifiant from fredouil.users;`;

      client.query(usersCorrespondences, (err, usersCorr) => {
        if (err) {
          console.log('Erreur lors de la récupération des correspondances utilisateurs.', err.stack);
        } else {
          console.log('Correspondances utilisateurs récupérés.');
        }
        res.send(usersCorr.rows);
      });
    }
    client.release();
  }
)});

// Récupération de tous les messages d'un seul coup (n'est plus utilisé)
app.get('/messages', async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection('CERISoNet');
    const messages = await collection.find({}).toArray();
    res.json(messages);
  } catch (err) {
    console.error('Erreur lors de la récupération des messages :', err);
    res.status(500).json({message: 'Erreur lors de la récupération des messages.'})
  }
})

// Récupération des messages par Filtrage et Tri
app.get('/messages/:owner/:hashtag/:sorting/:sortingOrder', async (req, res) => {
  const owner = req.params['owner'].toString();
  const hashtag = req.params['hashtag'];
  const sorting = req.params['sorting'];
  const sortingOrder = req.params['sortingOrder'];

  try {
    const db = client.db(dbName);
    const collection = db.collection('CERISoNet');

    let messages;
    let filterParams = {};

    if(hashtag !== 'null' && hashtag !== 'undefined') {
      filterParams.hashtags = {
        $all: ['#'+hashtag]
      };
    }

    if(owner !== 'null' && owner !== 'undefined') {
      filterParams.createdBy =
        parseInt(owner)
      ;
    }


    messages = await collection.find(
        filterParams
    ).toArray();

    console.log(messages)

    if (sorting !== 'null' && sortingOrder !== 'null') {
      let sortParams = {};
      sortParams[sorting] = sortingOrder === 'true' ? -1 : 1;

      messages.sort((a, b) => {
        const valueA = a[sorting];
        const valueB = b[sorting];

        if (valueA < valueB) {
          return sortParams[sorting];
        } else if (valueA > valueB) {
          return -sortParams[sorting];
        } else {
          return 0;
        }
      });
    }

    res.json(messages);
  } catch (err) {
    console.error('Erreur lors de la récupération des messages filtrés :', err);
    res.status(500).json({message: 'Erreur lors de la récupération des messages.'})
  }
})

// Ajout d'un commentaire sur un post
app.post('/messages/:messageId/comment', async (req, res) => {
  const param1 = req.params['messageId'];
  const { text, commentedBy } = req.body;

  const messageId = +param1;

  console.log("MessageId : ", messageId);
  console.log("text : ", text);
  console.log("commentedBy : ", commentedBy);

  try {
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

// Librairie d'encodage
// Utilisé pour que les messages reçus soit sans caractère spécial
const crypto = require('crypto-js');
const encryptionKey = 'secretKey';

// Suppression d'un commentaire
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
    const db = client.db(dbName);
    const collection = db.collection('CERISoNet');

    const filter = { _id: messageId };

    let update;
    let result;
    if(commentedBy === 0 && commentText === "*^$²^s²df;²:pojn84g²1d5") {
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
  }
});