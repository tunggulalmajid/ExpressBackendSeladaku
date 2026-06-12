const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const notifikasiController = require("../controller/notifikasiController");

router.get("/", verifyToken, notifikasiController.getRiwayat);
router.patch("/:id/read", verifyToken, notifikasiController.bacaNotif);
router.delete("/:id", verifyToken, notifikasiController.hapusNotif);

module.exports = router;
