const express = require("express");
const router = express.Router();
const riwayatController = require("../controller/riwayatController");

const verifyToken = require("../middleware/authMiddleware");

router.get(
  "/grafik/:id_tandon",
  verifyToken,
  riwayatController.getGrafikRiwayat,
);

module.exports = router;
