const express = require("express");
const router = express.Router();
const AreaController = require("../controller/areaController"); // Pastikan path & nama file controller sesuai
const verifyToken = require("../middleware/authMiddleware");

// Semua route area diproteksi oleh verifyToken
router.get("/", verifyToken, AreaController.getMyAreas);
router.post("/", verifyToken, AreaController.createArea);
router.put("/:id_area", verifyToken, AreaController.updateArea);
router.delete("/:id_area", verifyToken, AreaController.deleteArea);

module.exports = router;
