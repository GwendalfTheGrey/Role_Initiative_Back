const router = require("express").Router();

const pool = require("../../database");

router.get("/getHomeRooms", (req, res) => {
    const roomsSql = "SELECT idUser, username, icon, idRoom, title, description, TTRPGName, idGenre, levelName FROM users NATURAL JOIN rooms NATURAL JOIN roomshavelevels NATURAL join levels NATURAL JOIN ttrpg NATURAL JOIN ttrpg_ttrpggenres WHERE rooms.onGoing = 0";
    pool
        .query(roomsSql)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.get("/getFantasyRooms", (req, res) => {
    const roomsSql = "SELECT idUser, username, icon, idRoom, title, description, TTRPGName, idGenre, levelName FROM users NATURAL JOIN rooms NATURAL JOIN roomshavelevels NATURAL join levels NATURAL JOIN ttrpg NATURAL JOIN ttrpg_ttrpggenres WHERE rooms.onGoing = 0 AND ttrpg_ttrpggenres.idGenre = 1";
    pool
        .query(roomsSql)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.get("/getSciFiRooms", (req, res) => {
    const roomsSql = "SELECT idUser, username, icon, idRoom, title, description, TTRPGName, idGenre, levelName FROM users NATURAL JOIN rooms NATURAL JOIN roomshavelevels NATURAL join levels NATURAL JOIN ttrpg NATURAL JOIN ttrpg_ttrpggenres WHERE rooms.onGoing = 0 AND ttrpg_ttrpggenres.idGenre = 2";
    pool
        .query(roomsSql)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.get("/getHorrorAndOtherRooms", (req, res) => {
    const roomsSql = "SELECT idUser, username, icon, idRoom, title, description, TTRPGName, idGenre, levelName FROM users NATURAL JOIN rooms NATURAL JOIN roomshavelevels NATURAL join levels NATURAL JOIN ttrpg NATURAL JOIN ttrpg_ttrpggenres WHERE rooms.onGoing = 0 AND ttrpg_ttrpggenres.idGenre = 3";
    pool
        .query(roomsSql)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.get("/getRoomDetails/:idRoom", (req, res) => {
    const idRoom = req.params.idRoom;
    const roomDetailsSql = "SELECT idUser, username, icon, idRoom, title, description, discord, onGoing, TTRPGName, idGenre, idLevel, levelName FROM users NATURAL JOIN rooms NATURAL JOIN roomshavelevels NATURAL join levels NATURAL JOIN ttrpg NATURAL JOIN ttrpg_ttrpggenres WHERE rooms.idRoom = ?";
    pool
        .query(roomDetailsSql, [idRoom])
        .then(([rows]) => {
            res.json(rows[0]);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.get("/getAllRoomsProfile", (req, res) => {
    const allRoomsProfileSql = "SELECT rooms.idUser, COALESCE(rooms.idRoom, usersjoinrooms.idRoom) AS idRoom, rooms.title, rooms.onGoing, rooms.idTTRPG, ttrpg_ttrpggenres.idTTRPG, ttrpg_ttrpggenres.idGenre, ttrpg.TTRPGName, roomshavelevels.idLevel, levels.levelName, usersjoinrooms.idUser AS joinedIdUser FROM rooms LEFT JOIN ttrpg_ttrpggenres ON rooms.idTTRPG = ttrpg_ttrpggenres.idTTRPG LEFT JOIN usersjoinrooms ON rooms.idRoom = usersjoinrooms.idRoom LEFT JOIN ttrpg ON rooms.idTTRPG = ttrpg.idTTRPG LEFT JOIN roomshavelevels ON rooms.idRoom = roomshavelevels.idRoom LEFT JOIN levels ON levels.idLevel = roomshavelevels.idLevel GROUP BY rooms.idRoom";
    pool
        .query(allRoomsProfileSql)
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.get("/getGMRoomsProfile/:idUser", (req, res) => {
    const idUser = req.params.idUser;
    const GMRoomsProfileSql = "SELECT rooms.idUser, COALESCE(rooms.idRoom, usersjoinrooms.idRoom) AS idRoom, rooms.title, rooms.onGoing, rooms.idTTRPG, ttrpg_ttrpggenres.idTTRPG, ttrpg_ttrpggenres.idGenre, ttrpg.TTRPGName, roomshavelevels.idLevel, levels.levelName, usersjoinrooms.idUser AS joinedIdUser FROM rooms LEFT JOIN ttrpg_ttrpggenres ON rooms.idTTRPG = ttrpg_ttrpggenres.idTTRPG LEFT JOIN usersjoinrooms ON rooms.idRoom = usersjoinrooms.idRoom LEFT JOIN ttrpg ON rooms.idTTRPG = ttrpg.idTTRPG LEFT JOIN roomshavelevels ON rooms.idRoom = roomshavelevels.idRoom LEFT JOIN levels ON levels.idLevel = roomshavelevels.idLevel WHERE rooms.idUser = ? GROUP BY rooms.idRoom";
    pool
        .query(GMRoomsProfileSql, [idUser])
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.get("/getPlayerRoomsProfile/:idUser", (req, res) => {
    const idUser = req.params.idUser;
    const GMRoomsProfileSql = "SELECT rooms.idUser, rooms.idRoom, rooms.title, rooms.onGoing, rooms.idTTRPG, ttrpg_ttrpggenres.idTTRPG, ttrpg_ttrpggenres.idGenre, ttrpg.TTRPGName, roomshavelevels.idLevel, levels.levelName, usersjoinrooms.idRoom, usersjoinrooms.idUser AS joinedIdUser FROM rooms LEFT JOIN ttrpg_ttrpggenres ON rooms.idTTRPG = ttrpg_ttrpggenres.idTTRPG LEFT JOIN usersjoinrooms ON rooms.idRoom = usersjoinrooms.idRoom LEFT JOIN ttrpg ON rooms.idTTRPG = ttrpg.idTTRPG LEFT JOIN roomshavelevels ON rooms.idRoom = roomshavelevels.idRoom LEFT JOIN levels ON levels.idLevel = roomshavelevels.idLevel WHERE usersjoinrooms.idUser = ?";
    pool
        .query(GMRoomsProfileSql, [idUser])
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.patch("/roomDetails/changeOngoing", (req, res) => {
    const { idRoom, onGoing } = req.body;
    const changeOngoingSql = "UPDATE rooms SET onGoing = ? WHERE idRoom = ?";
    pool
        .query(changeOngoingSql, [onGoing, idRoom])
        .then((result) => {
            res.json(req.body);
        })
        .catch((err) => {
            console.error(err);
        });
});

router.post("/createRoom", (req, res) => {
    const { idUser, title, description, discord, onGoing, idTTRPG, idLevel } = req.body;
    const insertRoomSql = "INSERT INTO rooms (idUser, title, description, discord, idTTRPG, onGoing) VALUES (?, ?, ?, ?, ?, ?)";
    pool
        .query(insertRoomSql, [idUser, title, description, discord, idTTRPG, onGoing])
        .then((result) => {
            const idRoom = result[0].insertId;
            const insertRoomLevelSql = "INSERT INTO roomshavelevels (idRoom, idLevel) VALUES (?, ?)";
            pool
                .query(insertRoomLevelSql, [idRoom, idLevel])
                .then((result) => {
                    res.json({ ...req.body, idRoom: idRoom });
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).json("Une erreur est survenue");
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json("Une erreur est survenue");
        });
});

router.delete("/deleteRoom/:idRoom", (req, res) => {
    const idRoom = req.params.idRoom;
    const deleteRoomSql = "DELETE FROM usersjoinrooms WHERE idRoom = ?";
    pool
        .query(deleteRoomSql, [idRoom])
        .then((result) => {
            const deleteRoomSql = "DELETE FROM roomshavelevels WHERE idRoom = ?";
            pool
                .query(deleteRoomSql, [idRoom])
                .then((result) => {
                    const deleteRoomSql = "DELETE FROM rooms WHERE idRoom = ?";
                    pool
                        .query(deleteRoomSql, [idRoom])
                        .then((result) => {
                            res.end();
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
});

module.exports = router;