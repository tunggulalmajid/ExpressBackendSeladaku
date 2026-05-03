const Area = require("../models/area");

class AreaController {
  // Endpoint untuk List Area (Halaman Kebunku)
  static async getMyAreas(req, res) {
    try {
      const userId = req.user.id_user;
      const areas = await Area.findByUserId(userId);

      res.json({
        success: true,
        data: areas,
      });
    } catch (error) {
      console.error("Error getMyAreas:", error);
      res
        .status(500)
        .json({ success: false, message: "Gagal mengambil data area" });
    }
  }

  // Endpoint Tambah Area
  static async createArea(req, res) {
    try {
      const { nama } = req.body;
      if (!nama || nama.trim() === "") {
        return res
          .status(400)
          .json({ success: false, message: "Nama area tidak boleh kosong" });
      }

      const areaId = await Area.create(req.user.id_user, nama);
      res.status(201).json({
        success: true,
        message: "Area baru berhasil ditambahkan",
        data: { id_area: areaId, nama },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Endpoint Update Area
  static async updateArea(req, res) {
    try {
      const { id_area } = req.params;
      const success = await Area.update(id_area, req.user.id_user, req.body);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Area tidak ditemukan atau akses ditolak",
        });
      }

      res.json({ success: true, message: "Data area berhasil diperbarui" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Endpoint Hapus Area
  static async deleteArea(req, res) {
    try {
      const { id_area } = req.params;
      const success = await Area.delete(id_area, req.user.id_user);

      if (!success) {
        return res
          .status(404)
          .json({ success: false, message: "Gagal menghapus area" });
      }

      res.json({ success: true, message: "Area berhasil dihapus" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = AreaController;
