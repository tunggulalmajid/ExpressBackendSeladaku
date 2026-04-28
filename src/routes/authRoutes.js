const express = require("express");
const router = express.Router();
const AuthController = require("../controller/authController"); // Import Class-nya
const verifyToken = require("../middleware/authMiddleware");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.get("/me", verifyToken, AuthController.getMe);
router.delete("/logout", verifyToken, AuthController.logout);

module.exports = router;
