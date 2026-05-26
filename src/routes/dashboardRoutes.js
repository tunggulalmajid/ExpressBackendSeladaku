const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const dashboardController = require("../controller/dashboardController");

router.get("/summary", verifyToken, dashboardController.getSummaryArea);

module.exports = router;
