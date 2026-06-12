const notifikasi = require("../models/notifikasi");

const notifikasiController = {
  // Handler GET All Notifications
  getRiwayat: async (req, res) => {
    try {
      const userId = req.user.id_user; // Diambil dari middleware auth JWT kamu
      const data = await notifikasi.getNotifikasi(userId);

      return res.status(200).json({
        success: true,
        message: "Berhasil mengambil riwayat notifikasi",
        data: data,
      });
    } catch (error) {
      console.error("Error getRiwayat:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  },

  // Handler PATCH Mark as Read
  bacaNotif: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const notifId = req.params.id;

      const affectedRows = await notifikasi.bacaNotifikasi(notifId, userId);

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Notifikasi tidak ditemukan atau bukan milik Anda",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notifikasi berhasil ditandai telah dibaca",
      });
    } catch (error) {
      console.error("Error bacaNotif:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  },

  // Handler DELETE Notification
  hapusNotif: async (req, res) => {
    try {
      const userId = req.user.id_user;
      const notifId = req.params.id;

      const affectedRows = await notifikasi.hapusNotifikasi(notifId, userId);

      if (affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Notifikasi tidak ditemukan atau bukan milik Anda",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Notifikasi berhasil dihapus dari riwayat",
      });
    } catch (error) {
      console.error("Error hapusNotif:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  },
};

module.exports = notifikasiController;
