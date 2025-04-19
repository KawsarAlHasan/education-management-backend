const express = require("express");
const {
  addCard,
  getMyCard,
  deleteAllCard,
  deleteSingleCard,
} = require("../controllers/cardController");

const router = express.Router();

router.post("/add", addCard);
router.get("/my", getMyCard);
router.delete("/all-delete", deleteAllCard);
router.delete("/delete/:id", deleteSingleCard);

module.exports = router;
