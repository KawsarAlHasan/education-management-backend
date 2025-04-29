const express = require("express");
const {
  sendMessage,
  getMessage,
  usersListForMessage,
  singleUserMessage,
  messageRead,
} = require("../controllers/messagesController");

const router = express.Router();

router.post("/", sendMessage);
router.get("/", getMessage);
router.get("/sender/:receiver_id", usersListForMessage);
router.get("/single", singleUserMessage);
router.put("/read-message", messageRead);

module.exports = router;
