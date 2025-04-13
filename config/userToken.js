const jwt = require("jsonwebtoken");
exports.generateUserToken = (userInfo) => {
  const payload = {
    uid: userInfo.uid,
  };

  console.log("userInfo", userInfo, payload);
  const userToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: "365 days",
  });

  return userToken;
};
