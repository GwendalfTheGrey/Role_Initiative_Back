const router = require("express").Router();

const pool = require("../../database");

router.get("/getLevels", (req, res) => {
    const sqlLevels = "SELECT * FROM levels";
    pool
        .query(sqlLevels)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

module.exports = router;