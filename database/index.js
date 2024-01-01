const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.MYSQL_ADDON_HOST,
    port: process.env.MYSQL_ADDON_PORT,
    user: process.env.MYSQL_ADDON_USER,
    password: process.env.MYSQL_ADDON_PASSWORD,
    database: process.env.MYSQL_ADDON_DB,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
});

// const pool = mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "role_initiative_v3",
// });

pool.getConnection((err, connection) => {
    if (err) {
        console.error("Error getting database connection", err);
        return;
    };
    console.log("Connected to the database");

    connection.ping((pingErr) => {
        connection.release();
        if (pingErr) {
            console.error("Error pinging database", pingErr);
        } else {
            console.log("Database connection is active");
        }
    });
});

module.exports = pool.promise();