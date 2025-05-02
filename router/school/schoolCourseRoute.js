const express = require("express");
const uploadImage = require("../../middleware/fileUploader");
const {
  createNewSchoolCourses,
  getAllSchoolCourses,
  getStudyNotesByCourseId,
  getSingleSchoolCourses,
  updateSchoolCourses,
  schoolCoursesStatusUpdate,
  deleteSchoolCourses,
  getHomeTutoringByCourseId,
} = require("../../controllers/school/schoolCoursesController");

const router = express.Router();

router.post("/create", uploadImage.single("image"), createNewSchoolCourses);
router.get("/all", getAllSchoolCourses);
router.get("/home-tutoring/:id", getHomeTutoringByCourseId);
router.get("/study-note/:id", getStudyNotesByCourseId);
router.get("/:id", getSingleSchoolCourses);
router.put("/update/:id", uploadImage.single("image"), updateSchoolCourses);
router.put("/status/:id", schoolCoursesStatusUpdate);
router.delete("/delete/:id", deleteSchoolCourses);

module.exports = router;
