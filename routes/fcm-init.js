// require('firebase');
var admin = require('firebase-admin');
var adminServiceAccount = require('./fcm-key');

var _admin = admin.initializeApp(
  {
    credential: admin.credential.cert(adminServiceAccount)
  }, 
  'admin' // this name will be used to retrieve firebase instance. E.g. first.database();
);

exports.fcmAdmin = _admin;