const router = require("express").Router();

const pool = require("../../database");

router.get("/getTTRPG", (req, res) => {
    const sqlTTRPG = "SELECT * FROM ttrpg";
    pool
        .query(sqlTTRPG)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

module.exports = router;