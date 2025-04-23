const express = require("express");

const verifyUser = require("../../middleware/verifyUser");
const { createNewBid, myBid } = require("../../controllers/bid/bidController");

const router = express.Router();

router.post("/create", verifyUser, createNewBid);
router.get("/my", verifyUser, myBid);
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
