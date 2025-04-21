const express = require("express");
const uploadFile = require("../../middleware/assignmentFilleUploader");

const verifyUser = require("../../middleware/verifyUser");
const {
  createNewAssignment,
  getAllAssignment,
  getSingleAssignment,
  deleteAssignment,
  updateAssignment,
} = require("../../controllers/educationController/assignmentController");

const router = express.Router();

router.post(
  "/create",
  verifyUser,
  uploadFile.single("file"),
  createNewAssignment
);
router.get("/all", getAllAssignment);
router.get("/:id", getSingleAssignment);
router.put(
  "/update/:id",
  verifyUser,
  uploadFile.single("file"),
  updateAssignment
);
router.delete("/delete/:id", deleteAssignment);

module.exports = router;
