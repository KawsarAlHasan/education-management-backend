const express = require("express");
const uploadFile = require("../../middleware/assignmentFilleUploader");

const verifyUser = require("../../middleware/verifyUser");
const {
  createNewAssignment,
  getAllAssignment,
  getSingleAssignment,
  deleteAssignment,
  updateAssignment,
  getMyAssignment,
  getMyAssignmentAsBidWinner,
  updateAssignmentStatus,
  assignmentSubmitFile,
} = require("../../controllers/bid/assignmentController");

const router = express.Router();

router.post(
  "/create",
  verifyUser,
  uploadFile.single("file"),
  createNewAssignment
);
router.get("/all", getAllAssignment);
router.get("/my", verifyUser, getMyAssignment);
router.get("/assigned", verifyUser, getMyAssignmentAsBidWinner);
router.get("/:id", getSingleAssignment);
router.put(
  "/update/:id",
  verifyUser,
  uploadFile.single("file"),
  updateAssignment
);
router.put(
  "/submit-file/:id",
  uploadFile.single("submit_file"),
  assignmentSubmitFile
);
router.put("/status/:id", updateAssignmentStatus);
router.delete("/delete/:id", deleteAssignment);

module.exports = router;
