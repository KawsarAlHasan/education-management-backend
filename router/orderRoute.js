const express = require("express");
const {
  createOrders,
  getMyOrders,
  getSingleOrder,
} = require("../controllers/orderController");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.post("/create", verifyUser, createOrders);
router.get("/my", verifyUser, getMyOrders);
router.get("/:id", getSingleOrder);
// router.get("/user-id/:user_id", getUserOrders);
// router.get("/:id", getSingleOrder);
// router.put("/status/:id", orderStatus);

module.exports = router;
