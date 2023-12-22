require("dotenv").config();
const mysql = require("mysql");

const connection = mysql.createConnection({
    host: `${process.env.DB_HOST}`,
    user: `${process.env.DB_USER}`,
    password: `${process.env.DB_PASSWORD}`,
    database: `${process.env.DB_DATABASE}`,
});

connection.connect((err) => {
    if (err) throw err;
    console.log("Connecté à la base de données");
});

module.exports = connection;