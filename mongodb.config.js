const { MongoClient } = require('mongodb');

const dbUrl = 'mongodb://127.0.0.1:27017/db-CERI';
const dbName = 'db-CERI';

const client = new MongoClient(dbUrl, { useUnifiedTopology: true });

module.exports = { client, dbName };