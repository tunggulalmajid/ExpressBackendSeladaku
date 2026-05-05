const Tandon = require("../models/tandon");

const tandonController = {
  // 1. Tambah Tandon Baru
  store: async (req, res) => {
    try {
      const id = await Tandon.createTandon(req.body);
      res.status(201).json({
        success: true,
        message: "Tandon berhasil ditambahkan",
        id_tandon: id,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Ambil Semua Tandon di Satu Area (Daftar Tandon + Sensor Terbaru)
  index: async (req, res) => {
    try {
      const { id_area } = req.params;
      const data = await Tandon.getTandonById(id_area);
      res.status(200).json({
        success: true,
        message: "Data tandon berhasil dimuat",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Ambil Detail Tandon (Untuk Pengaturan)
  show: async (req, res) => {
    try {
      const data = await Tandon.getDetailTandon(req.params.id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Tandon tidak ditemukan" });
      }
      res.status(200).json({ success: true, data: data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const dataPerubahan = req.body;

      if (Object.keys(dataPerubahan).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Tidak ada data perubahan" });
      }

      const berhasil = await Tandon.update(id, dataPerubahan);

      if (berhasil) {
        res.status(200).json({
          success: true,
          message: "Data berhasil diperbarui",
          updatedFields: Object.keys(dataPerubahan),
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Gagal update atau data tetap sama",
        });
      }
    } catch (error) {
      console.log("error Update : " + error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 5. Hapus Tandon (Otomatis Cascade Riwayat karena setting DB kamu)
  destroy: async (req, res) => {
    try {
      const berhasil = await Tandon.deleteTandon(req.params.id);
      if (berhasil) {
        res
          .status(200)
          .json({ success: true, message: "Tandon berhasil dihapus" });
      } else {
        res
          .status(404)
          .json({ success: false, message: "Tandon tidak ditemukan" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = tandonController;
