const router = require("express").Router();
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const { key, keyPub } = require("../../keys");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "gwendalftests@gmail.com",
        pass: "cmpa gkeq zsfs epdr"
    }
});

const pool = require("../../database");

// CHECK FOR PRESENCE OF ADMIN IN DATABASE
router.get("/checkAdmin", (req, res) => {
    const sqlAdmin = "SELECT COUNT(admin) 'admin' FROM users WHERE admin = 1";
    pool
        .query(sqlAdmin)
        .then(([rows]) => {
            res.json(rows[0].admin > 0);
        })
        .catch((err) => {
            console.error(err);
        });
});

// USER CREATION AND ASSOCIATION OF A LEVEL
router.post("/register", (req, res) => {
    const { admin, username, emailRegister, passwordRegister, idLevel, GM } = req.body;
    const verifyEmail = "SELECT * FROM users WHERE email = ?";
    pool
        .query(verifyEmail, [emailRegister])
        .then(([rows]) => {
            if (!rows.length) {
                const verifyUsername = "SELECT * FROM users WHERE username = ?";
                pool
                    .query(verifyUsername, [username])
                    .then(async ([rows]) => {
                        if (!rows.length) {
                            const hashedPassword = await bcrypt.hash(passwordRegister, 10);
                            const insertSql = "INSERT INTO users (admin, username, email, userPassword, GM) VALUES (?, ?, ?, ?, ?)";
                            pool
                                .query(insertSql, [admin, username, emailRegister, hashedPassword, GM])
                                .then((result) => {
                                    const idUser = result[0].insertId;
                                    const insertSql = "INSERT INTO usershavelevels (idUser, idLevel) VALUES (?, ?)";
                                    pool
                                        .query(insertSql, [idUser, idLevel])
                                        .then((result) => {
                                            res.status(200).json({ message: "Inscription réussie !" });
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
                        } else {
                            res.status(400).json("Nom d'utilisateur déjà utilisé");
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        res.status(500).json("Une erreur est survenue");
                    });
            } else {
                res.status(400).json("Cet email existe déjà");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json("Une erreur est survenue");
        });
});

// LOGGING USER IN AN PROVIDING COOKIE FOR MAINTAINED CONNECTION
router.post("/login", async (req, res) => {
    try {
        const { emailLogin, passwordLogin, stayConnected, admin } = req.body;
        const sqlVerify = admin ? "SELECT * FROM users NATURAL JOIN usershavelevels NATURAL JOIN levels WHERE admin = 1 AND email = ?"
            : "SELECT * FROM users NATURAL JOIN usershavelevels NATURAL JOIN levels WHERE admin = 0 AND email = ?";
        const [rows] = await pool.query(sqlVerify, [emailLogin]);
        if (rows.length > 0) {
            if (bcrypt.compareSync(passwordLogin, rows[0].userPassword) && !stayConnected) {
                const token = jsonwebtoken.sign({}, key, {
                    subject: rows[0].idUser.toString(),
                    expiresIn: "24h",
                    algorithm: "RS256",
                });
                res.cookie("Role_Initiative_Token", token, {
                    maxAge: 1000 * 60 * 60 * 24,
                    httpOnly: true,
                    secure: true,
                    sameSite: "None",
                });
                res.json({ ...rows[0], userPassword: "", icon: !rows[0].icon ? null : rows[0].icon, GM: rows[0].GM === 1, admin: rows[0].admin === 1 });
            } else if (bcrypt.compareSync(passwordLogin, rows[0].userPassword) && stayConnected) {
                const token = jsonwebtoken.sign({}, key, {
                    subject: rows[0].idUser.toString(),
                    expiresIn: "30d",
                    algorithm: "RS256",
                });
                res.cookie("Role_Initiative_Token", token, {
                    maxAge: 1000 * 60 * 60 * 24 * 30,
                    httpOnly: true,
                    secure: true,
                    sameSite: "None",
                });
                res.json({ ...rows[0], userPassword: "", icon: !rows[0].icon ? null : rows[0].icon, GM: rows[0].GM === 1, admin: rows[0].admin === 1 });
            } else {
                res.status(400).json("Email et/ou mot de passe incorrectes");
            }
        } else {
            res.status(400).json("Email et/ou mot de passe incorrectes");
        }
    } catch (err) {
        console.error(err);
        res.status(500).json("Une erreur est survenue");
    }
});

// GETTING USER IF VALID COOKIE FOR MAINTAINED CONNECTION PRESENT
router.get("/connectedUser", (req, res) => {
    const { Role_Initiative_Token } = req.cookies;
    if (Role_Initiative_Token) {
        const keyPubString = keyPub.toString("utf16le");
        const decodedToken = jsonwebtoken.verify(
            Role_Initiative_Token,
            keyPubString,
            {
                algorithms: "RS256",
            });
        const selectSql =
            "SELECT * FROM users NATURAL JOIN usershavelevels NATURAL JOIN levels WHERE idUser = ?";
        pool
            .query(selectSql, [decodedToken.sub])
            .then(([rows]) => {
                if (rows.length > 0) {
                    const connectedUser = { ...rows[0], userPassword: "", icon: !rows[0].icon ? null : rows[0].icon, GM: rows[0].GM === 1, admin: rows[0].admin === 1 };
                    res.json(connectedUser);
                } else {
                    res.json(null);
                }
            })
            .catch((err) => {
                console.error(err);
                res.json(null);
            });
    } else {
        res.json(null);
    }
});

// COOKIE DELETION (USED IN LOGGING USER OUT)
router.delete("/logout", (req, res) => {
    res.clearCookie("Role_Initiative_Token" || "Role_Initiative_Extended_Token", {
        secure: true,
        httpOnly: true,
        sameSite: "None",
    });
    console.log("Disconnecting");
    res.end();
});

// FETCHING USER WHO HAS JOINED ROOM
router.get("/getUserJoinedRoom/:idUser/:idRoom", (req, res) => {
    const { idUser, idRoom } = req.params;
    const GMRoomsProfileSql = "SELECT * FROM usersjoinrooms WHERE idUser = ? AND idRoom = ?";
    pool
        .query(GMRoomsProfileSql, [idUser, idRoom])
        .then(([rows]) => {
            res.json(rows);
        })
        .catch((err) => {
            console.error(err);
        });
});

// ADDING USER IN USERJOINSROOM TABLE
router.post("/userJoinsRoom", (req, res) => {
    const { idUser, idRoom } = req.body;
    const userJoinsRoomSql = "INSERT INTO usersjoinrooms (idUser, idRoom) VALUES (?, ?)";
    pool
        .query(userJoinsRoomSql, [idUser, idRoom])
        .then((result) => {
            res.json(req.body);
        })
        .catch((err) => {
            console.error(err);
        });
});

// REMOVING USER IN USERJOINSROOM TABLE
router.delete("/userLeavesRoom", (req, res) => {
    const { idUser, idRoom } = req.body;
    const userLeavesRoomSql = "DELETE FROM usersjoinrooms WHERE idUser = ? AND idRoom = ?";
    pool
        .query(userLeavesRoomSql, [idUser, idRoom])
        .then((result) => {
            res.end();
        })
        .catch((err) => {
            console.error(err);
        });
});

// SENDING EMAIL FOR PASSWORD RESET IF EMAIL OF USER IN DATABASE
router.get("/resetPassword/:email", (req, res) => {
    const email = req.params.email;
    const searchMailSql = "SELECT * FROM users WHERE email = ?";
    pool
        .query(searchMailSql, [email])
        .then((result) => {
            if (result[0].length > 0) {
                const confirmLink = `https://role-initiative.vercel.app/reset-password?email=${email}`;
                const mailOptions = {
                    from: "gwendalftests@gmail.com",
                    to: email,
                    subject: "Réinitialisation de mot de passe Role Initiative",
                    text: `Cliquez sur le lien pour être redirigé vers la page de réinitialisation de mot de passe : ${confirmLink}`,
                };
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        throw err;
                    } else {
                        res.status(200).json({ message: "Un lien de réinitialisation à été envoyé par email" });
                    }
                });
            } else {
                res.status(400).json("L'email entré n'exite pas dans la base de données");
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json("Une erreur est survenue");
        });
});

// UPDATING PASSWORD OF USER
router.post("/changePassword", async (req, res) => {
    const { password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const changePasswordSql = "UPDATE users SET userPassword = ? WHERE email = ?";
    pool
        .query(changePasswordSql, [hashedPassword, email])
        .then((result) => {
            res.status(200).json({ message: "Mot de passe modifié, vous allez être redirigé(e)" });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json("Une erreur est survenue");
        });
});

// UPDATING USER: USERNAME, LEVEL,ICON
router.patch("/modifyUser", (req, res) => {
    const { idUser, username, email, idLevel, icon } = req.body;
    const modifyUserSql = icon ?
        "UPDATE users JOIN usershavelevels ON users.idUser = usershavelevels.idUser SET users.username = ?, users.email = ?, users.icon = ?, usershavelevels.idLevel = ? WHERE users.idUser = ?" :
        "UPDATE users JOIN usershavelevels ON users.idUser = usershavelevels.idUser SET users.username = ?, users.email = ?, usershavelevels.idLevel = ? WHERE users.idUser = ?";
    pool
        .query(modifyUserSql, icon ? [username, email, icon, idLevel, idUser] : [username, email, idLevel, idUser])
        .then((result) => {
            const selectModifiedUserSql = "SELECT * FROM users NATURAL JOIN usershavelevels NATURAL JOIN levels WHERE idUser = ?";
            pool
                .query(selectModifiedUserSql, [idUser])
                .then(([rows]) => {
                    if (rows.length > 0) {
                        const modifiedUser = { ...rows[0], userPassword: "", icon: !rows[0].icon ? null : rows[0].icon, GM: rows[0].GM === 1, admin: rows[0].admin === 1 };
                        res.json(modifiedUser);
                    } else {
                        res.status(404).json("Utilisateur non trouvé");
                    }
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

// DELETE USER FROM EVERY TABLES
router.delete("/deleteUser/:idUser", (req, res) => {
    const idUser = req.params.idUser;
    const deleteUserJoinRoomSql = "DELETE FROM usersjoinrooms WHERE idUser = ?";
    pool
        .query(deleteUserJoinRoomSql, [idUser])
        .then((result) => {
            const selectUserRoomsSql = "SELECT * FROM rooms WHERE idUser = ?";
            pool
                .query(selectUserRoomsSql, [idUser])
                .then(([rows]) => {
                    if (rows.length > 0) {
                        rows.map((room) => {
                            const deleteRoomHaveLevelsSql = "DELETE FROM roomshavelevels WHERE idRoom = ?";
                            pool
                                .query(deleteRoomHaveLevelsSql, [room.idRoom])
                                .catch((err) => {
                                    console.error(err);
                                    res.status(500).json({ messageError: "Une erreur est survenue" });
                                });
                        });
                    }
                    const deleteUserRoomsSql = "DELETE FROM rooms WHERE idUser = ?";
                    pool
                        .query(deleteUserRoomsSql, [idUser])
                        .then((result) => {
                            const deleteUserHaveLevel = "DELETE FROM usershavelevels WHERE idUser = ?";
                            pool
                                .query(deleteUserHaveLevel, [idUser])
                                .then((result) => {
                                    const deleteUserSql = "DELETE FROM users WHERE idUser = ?";
                                    pool
                                        .query(deleteUserSql, [idUser])
                                        .then((result) => {
                                            res.clearCookie("Role_Initiative_Token" || "Role_Initiative_Extended_Token");
                                            res.status(200).json({ message: "Compte supprimé, vous allez être redirigé(e) !" });
                                        })
                                        .catch((err) => {
                                            console.error(err);
                                            res.status(500).json({ messageError: "Une erreur est survenue" });
                                        });
                                })
                                .catch((err) => {
                                    console.error(err);
                                    res.status(500).json({ messageError: "Une erreur est survenue" });
                                });
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).json({ messageError: "Une erreur est survenue" });
                        });
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({ messageError: "Une erreur est survenue" });
                });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ messageError: "Une erreur est survenue" });
        });
});


module.exports = router;