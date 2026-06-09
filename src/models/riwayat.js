const db = require("../config/dbConf");

const Riwayat = {
  // Simpan data masuk dari ESP32 (Tetap sama)
  createRiwayat: async (id_tandon, data) => {
    try {
      const { ph, ppm, volume_air, is_hujan } = data;
      const query = `
      INSERT INTO riwayat_data (id_tandon, ph, ppm, volume_air, is_hujan, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())`;
      const [result] = await db.query(query, [
        id_tandon,
        ph,
        ppm,
        volume_air,
        is_hujan,
      ]);
      return result;
    } catch (error) {
      console.log(error);
    }
  },

  // FIXED & OPTIMIZED: Kueri Laporan dengan Grouping Waktu
  getLaporan: async (id_tandon, range) => {
    let interval = "1 DAY";
    let formatWaktu = "%H:00"; // Default Harian formatnya Jam (01:00, 02:00)

    if (range === "mingguan") {
      interval = "7 DAY";
      formatWaktu = "%Y-%m-%d"; // Format tanggal untuk dikelompokkan per hari
    } else if (range === "bulanan") {
      interval = "30 DAY";
      formatWaktu = "%Y-%m-%d"; // Format tanggal untuk dikelompokkan per tanggal
    }
    // Kita gunakan AVG() agar datanya halus dan ramah untuk grafik Flutter
    const query = `
      SELECT 
        DATE_FORMAT(created_at, '${formatWaktu}') AS label_waktu,
        DAYNAME(created_at) AS nama_hari, -- Berguna buat label 'Sen', 'Sel' di mingguan
        ROUND(AVG(ph), 2) AS avg_ph,
        ROUND(AVG(ppm), 0) AS avg_ppm,
        ROUND(AVG(volume_air), 0) AS avg_volume
      FROM riwayat_data 
      WHERE id_tandon = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
      GROUP BY label_waktu, nama_hari
      ORDER BY MIN(created_at) ASC`;

    const [rows] = await db.query(query, [id_tandon]);
    return rows;
  },
};

module.exports = Riwayat;
