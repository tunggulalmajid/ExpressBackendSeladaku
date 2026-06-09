const Riwayat = require("../models/riwayat");
const db = require("../config/dbConf"); // Kita import dbConf untuk cek validitas ID Tandon

const riwayatController = {
  getGrafikRiwayat: async (req, res) => {
    try {
      const { id_tandon } = req.params;
      const range = req.query.range || "harian";

      if (!id_tandon) {
        return res.status(400).json({
          success: false,
          message: "ID Tandon wajib disertakan",
        });
      }

      // LANGKAH 1: Validasi apakah ID Tandon beneran terdaftar di sistem
      const [cekTandon] = await db.query(
        "SELECT id_tandon FROM tandon WHERE id_tandon = ?",
        [id_tandon],
      );

      if (cekTandon.length === 0) {
        // Jika tandon beneran tidak ada di database, lempar 404 murni!
        return res.status(404).json({
          success: false,
          status: "Not Found",
          message: `Tandon dengan ID ${id_tandon} tidak ditemukan di sistem`,
        });
      }

      // LANGKAH 2: Ambil data riwayat (Tandon terbukti ada, sekarang ambil lognya)
      const rows = await Riwayat.getLaporan(id_tandon, range.toLowerCase());

      // Jika tandonnya ada tapi isinya kosong (belum ada aktivitas hardware)
      if (!rows || rows.length === 0) {
        return res.status(200).json({
          success: true,
          message: `Data riwayat ${range} masih kosong (Belum ada aktivitas hardware)`,
          data: [], // Mengembalikan array kosong dengan status 200 OK agar Flutter tidak crash
        });
      }

      const kamusHari = {
        Monday: "Sen",
        Tuesday: "Sel",
        Wednesday: "Rab",
        Thursday: "Kam",
        Friday: "Jum",
        Saturday: "Sab",
        Sunday: "Min",
      };

      const dataGrafik = rows.map((row) => {
        let label = row.label_waktu;

        if (range.toLowerCase() === "mingguan") {
          label = kamusHari[row.nama_hari] || row.nama_hari;
        } else if (range.toLowerCase() === "bulanan") {
          label = row.label_waktu.split("-")[2];
        }

        return {
          x_label: label,
          ph: row.avg_ph || 0.0,
          ppm: row.avg_ppm || 0,
          volume: row.avg_volume || 0,
        };
      });

      return res.status(200).json({
        success: true,
        message: `Data riwayat ${range} berhasil didapatkan`,
        data: dataGrafik,
      });
    } catch (error) {
      console.error("Error di getGrafikRiwayat Controller:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
        error: error.message,
      });
    }
  },
};

module.exports = riwayatController;
