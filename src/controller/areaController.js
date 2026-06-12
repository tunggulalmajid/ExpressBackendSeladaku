const Area = require("../models/area");

const AreaController = {
  // 1. Endpoint untuk List Area (Halaman Kebunku)
  getMyAreas: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const areas = await Area.findByUserId(userId);

      return res.json({
        success: true,
        data: areas,
      });
    } catch (error) {
      console.error("Error getMyAreas:", error);
      return res
        .status(500)
        .json({ success: false, message: "Gagal mengambil data area" });
    }
  },

  // 2. Endpoint Tambah Area
  createArea: async (req, res) => {
    try {
      const { nama } = req.body;
      if (!nama || nama.trim() === "") {
        return res
          .status(400)
          .json({ success: false, message: "Nama area tidak boleh kosong" });
      }

      const areaId = await Area.create(req.user.id_user, nama);
      return res.status(201).json({
        success: true,
        message: "Area baru berhasil ditambahkan",
        data: { id_area: areaId, nama },
      });
    } catch (error) {
      console.error("Error createArea:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Endpoint Update Area
  updateArea: async (req, res) => {
    try {
      const { id_area } = req.params;
      const success = await Area.update(id_area, req.user.id_user, req.body);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Area tidak ditemukan atau akses ditolak",
        });
      }

      return res.json({
        success: true,
        message: "Data area berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updateArea: " + error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Endpoint Hapus Area
  deleteArea: async (req, res) => {
    try {
      const { id_area } = req.params;
      const success = await Area.delete(id_area, req.user.id_user);

      if (!success) {
        return res
          .status(404)
          .json({ success: false, message: "Gagal menghapus area" });
      }

      return res.json({ success: true, message: "Area berhasil dihapus" });
    } catch (error) {
      console.error("Error deleteArea:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = AreaController;
