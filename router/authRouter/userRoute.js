const express = require("express");
const {
  signupForEmailPassword,
  getAllUsers,
  getSingleUser,
  userStatusUpdate,
  deleteUser,
  getMeUser,
  updateUser,
  loginForEmailPassword,
  resetPasswordRequest,
  resetPasswordConfirm,
  verifyTokenForSocailMedia,
  userRoleUpdate,
  teachersSearch,
} = require("../../controllers/authController/userController");
const verifyUser = require("../../middleware/verifyUser");
const uploadImage = require("../../middleware/fileUploader");

const router = express.Router();

router.post("/signup", signupForEmailPassword);
router.post("/login", loginForEmailPassword);
router.post("/reset-password-request", resetPasswordRequest);
router.post("/reset-password-confirm", resetPasswordConfirm);
router.post("/socail-media", verifyTokenForSocailMedia);
router.get("/me", verifyUser, getMeUser);
router.get("/all", getAllUsers);
router.get("/search", teachersSearch);
router.get("/:id", getSingleUser);
router.put(
  "/update",
  uploadImage.single("profile_pic"),
  verifyUser,
  updateUser
);
router.put("/status/:id", userStatusUpdate);
router.put("/role/:id", userRoleUpdate);
router.delete("/delete/:id", deleteUser);

module.exports = router;
