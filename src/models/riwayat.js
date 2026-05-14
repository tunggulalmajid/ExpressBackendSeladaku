const db = require("../config/dbConf");

const Riwayat = {
  // Simpan data masuk dari ESP32
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

  // Ambil data untuk grafik (Harian/Mingguan)
  getLaporan: async (id_tandon, range) => {
    let interval = "1 DAY"; // Default harian
    if (range === "mingguan") interval = "7 DAY";

    const query = `
      SELECT ph, ppm, volume_air, created_at 
      FROM riwayat_data 
      WHERE id_tandon = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
      ORDER BY created_at ASC`;

    const [rows] = await db.query(query, [id_tandon]);
    return rows;
  },
};

module.exports = Riwayat;
