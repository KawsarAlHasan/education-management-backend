const express = require("express");
const verifyUser = require("../../middleware/verifyUser");
const {
  createSchoolOrders,
  getMySchoolOrders,
  schollOrderStatus,
  getMySchoolOrder,
} = require("../../controllers/school/schoolOrderController");

const router = express.Router();

router.post("/create", verifyUser, createSchoolOrders);
router.get("/my", verifyUser, getMySchoolOrders);
router.get("/:id", getMySchoolOrder);

router.put("/status/:id", schollOrderStatus);

module.exports = router;
