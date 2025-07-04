const admin = require('firebase-admin');
const serviceAccount = require('./path/to/firebase-service-account.json'); // download this from Firebase

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
