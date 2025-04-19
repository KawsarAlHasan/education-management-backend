const express = require("express");
const {
  createCoupons,
  checkCoupon,
} = require("../controllers/couponsController");

const router = express.Router();

router.post("/create", createCoupons);
router.put("/check", checkCoupon);
// router.get("/", getAllCoupons);
// router.get("/couponsSendUser", getCouponsSendUser);
// router.get("/:id", getSingleCoupons);
// router.put("/update/:id", updateCoupons);
// router.delete("/delete/:id", deleteCoupons);
// router.post("/", sendCouponUser);

module.exports = router;
