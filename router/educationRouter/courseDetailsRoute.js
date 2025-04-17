const express = require("express");
const {
  createNewCoursesDetails,
  getAllCoursesDetails,
  getSingleCoursesDetails,
  updateCoursesDetails,
  deleteCoursesDetails,
  getSingleTeacherWithCoursesDetails,
} = require("../../controllers/educationController/courseDetailsController");

const router = express.Router();

router.post("/create", createNewCoursesDetails);
router.get("/all", getAllCoursesDetails);
router.get("/", getSingleTeacherWithCoursesDetails);
router.get("/:id", getSingleCoursesDetails);
router.put("/update/:id", updateCoursesDetails);
router.delete("/delete/:id", deleteCoursesDetails);

module.exports = router;
