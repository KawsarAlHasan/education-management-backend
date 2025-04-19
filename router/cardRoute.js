const express = require("express");
const {
  addCard,
  getMyCard,
  deleteAllCard,
  deleteSingleCard,
} = require("../controllers/cardController");

const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.post("/add", verifyUser, addCard);
router.get("/my", verifyUser, getMyCard);
router.delete("/all-delete", verifyUser, deleteAllCard);
router.delete("/delete/:id", deleteSingleCard);

module.exports = router;
