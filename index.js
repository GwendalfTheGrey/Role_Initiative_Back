const express = require("express");
const cookie = require("cookie-parser");

const app = express();
app.use(express.json());

app.use(cookie());

const port = 8000;

require("./database");

const routes = require("./routes");

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(routes);

app.use("*", (req, res) => {
    res.status(404).end();
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Le serveur Node écoute sur le port ${port}`);
});