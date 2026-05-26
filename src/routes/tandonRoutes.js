const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const tandonController = require("../controller/tandonController");

router.post("/", verifyToken, tandonController.store);

router.get("/area/:id_area", verifyToken, tandonController.index);

router.get("/:id", verifyToken, tandonController.show);
router.post("/pair-device/:id", verifyToken, tandonController.pairDevice);

router.patch("/:id", verifyToken, tandonController.update);
router.delete("/:id", verifyToken, tandonController.destroy);

module.exports = router;
