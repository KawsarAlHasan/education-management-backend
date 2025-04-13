const firebaseAdmin = require("../config/firebase");
const db = require("../config/db");

const verifyToken = async (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")?.[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "You are not logged in",
    });
  }

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);

    if (!decoded.uid) {
      return res.status(403).send({ message: "Forbidden access" });
    }

    const [result] = await db.query(`SELECT * FROM users WHERE uid=?`, [
      decoded.uid,
    ]);
    const user = result[0];

    if (!user) {
      return res.status(404).json({
        error: "User not found. Please Login Again",
      });
    }

    req.decodedUser = user;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: "Invalid Token",
      error: error.message,
    });
  }
};

module.exports = verifyToken;
