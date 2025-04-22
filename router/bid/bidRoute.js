const express = require("express");

const verifyUser = require("../../middleware/verifyUser");
const { createNewBid } = require("../../controllers/bid/bidController");

const router = express.Router();

router.post("/create", verifyUser, createNewBid);
// router.get("/all", getAllAssignment);
// router.get("/:id", getSingleAssignment);
// router.put(
//   "/update/:id",
//   verifyUser,
//   uploadFile.single("file"),
//   updateAssignment
// );
// router.delete("/delete/:id", deleteAssignment);

module.exports = router;
