const express = require("express");
const {
  createNewCourseTopic,
  getAllCoursesTopic,
  getSingleCoursesTopic,
  updateCoursesTopic,
  deleteCoursesTopic,
} = require("../../controllers/educationController/courseTopicController");

const router = express.Router();

router.post("/create", createNewCourseTopic);
router.get("/all", getAllCoursesTopic);
router.get("/:id", getSingleCoursesTopic);
router.put("/update/:id", updateCoursesTopic);
router.delete("/delete/:id", deleteCoursesTopic);

module.exports = router;
