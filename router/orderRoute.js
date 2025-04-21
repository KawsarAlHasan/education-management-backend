const express = require("express");
const {
  createOrders,
  getMyOrders,
  getSingleOrder,
  getItemsOfMyOrder,
  getItemsOfMyOrderWithVideos,
  orderStatus,
} = require("../controllers/orderController");
const verifyUser = require("../middleware/verifyUser");

const router = express.Router();

router.post("/create", verifyUser, createOrders);
router.get("/my", verifyUser, getMyOrders);
router.get("/check", verifyUser, getItemsOfMyOrder);
router.get("/check2", verifyUser, getItemsOfMyOrderWithVideos);
router.get("/:id", getSingleOrder);

router.put("/status/:id", orderStatus);

module.exports = router;
