const express = require("express");
const uploadImage = require("../../middleware/fileUploader");
const {
  createNewCourses,
  getAllCourses,
  getSingleCourses,
  updateCourses,
  coursesStatusUpdate,
  deleteCourses,
  getSingleCoursesWithTopic,
} = require("../../controllers/educationController/coursesController");

const router = express.Router();

router.post("/create", uploadImage.single("image"), createNewCourses);
router.get("/all", getAllCourses);
router.get("/:id", getSingleCourses);
router.get("/with-topic/:id", getSingleCoursesWithTopic);
router.put("/update/:id", uploadImage.single("image"), updateCourses);
router.put("/status/:id", coursesStatusUpdate);
router.delete("/delete/:id", deleteCourses);

module.exports = router;
