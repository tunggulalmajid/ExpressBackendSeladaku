const express = require("express");
const router = express.Router();
const AuthController = require("../controller/authController"); // Import Class-nya
const verifyToken = require("../middleware/authMiddleware");
const { storage } = require("../config/cloudinary");
const multer = require("multer");
const upload = multer({ storage: storage });

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.get("/me", verifyToken, AuthController.getMe);
router.put(
  "/update-profile",
  verifyToken,
  upload.single("foto"),
  AuthController.updateProfile,
);

router.post("/tandon/:id/fcm-token", verifyToken, AuthController.updateFcm);
router.delete("/tandon/:id/fcm-token", verifyToken, AuthController.deleteFcm);

module.exports = router;
