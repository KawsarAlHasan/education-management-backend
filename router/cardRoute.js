const express = require("express");
const { addCard } = require("../controllers/cardController");

const router = express.Router();

router.post("/add", addCard);
// router.get("/all", getAllCourses);
// router.get("/:id", getSingleCourses);
// router.get("/with-topic/:id", getSingleCoursesWithTopic);
// router.put("/update/:id", uploadImage.single("image"), updateCourses);
// router.put("/status/:id", coursesStatusUpdate);
// router.delete("/delete/:id", deleteCourses);

module.exports = router;
