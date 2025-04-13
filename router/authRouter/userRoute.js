const express = require("express");
const {
  signupForEmailPassword,
  getAllUsers,
  getSingleUser,
  userStatusUpdate,
  deleteUser,
  // verifyToken,
  getMeUser,
  updateUser,
  loginForEmailPassword,
  resetPasswordRequest,
  resetPasswordConfirm,
  verifyTokenForSocailMedia,
} = require("../../controllers/authController/userController");
const verifyUser = require("../../middleware/verifyUser");
const uploadImage = require("../../middleware/fileUploader");
const verifyToken = require("../../middleware/verifyToken");

const router = express.Router();

router.post("/signup", signupForEmailPassword);
router.post("/login", loginForEmailPassword);
router.post("/reset-password-request", resetPasswordRequest);
router.post("/reset-password-confirm", resetPasswordConfirm);
router.post("/socail-media", verifyTokenForSocailMedia);
router.get("/me", verifyToken, getMeUser);
router.get("/all", getAllUsers);
router.get("/:id", getSingleUser);
router.put(
  "/update",
  uploadImage.single("profile_pic"),
  verifyUser,
  updateUser
);
router.put("/status/:id", userStatusUpdate);
router.delete("/delete/:id", deleteUser);

module.exports = router;
