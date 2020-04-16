var mysql = require('mysql');
var pool = "";
const environment = process.env.NODE_ENV || 'prod';
// const environment = process.env.NODE_ENV || 'dev';

if (environment === 'dev') {
    pool = mysql.createPool({
        connectionLimit: 100,
        host: '127.0.0.1',
        user: process.env.DB_USERNAME,
        password: 'root',
        database: process.env.DB_NAME,
        debug: true
    });
}
else {
    pool = mysql.createPool({
        connectionLimit: 100,
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        debug: false
    });
}
module.exports = pool;
