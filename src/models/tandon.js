const db = require("../config/dbConf");

const Tandon = {
  // Menambahkan tandon baru ke dalam area tertentu
  createTandon: async (data) => {
    const { nama_tandon, tanggal_tanam, id_area } = data;
    const query = `
      INSERT INTO tandon (nama_tandon, tanggal_tanam, id_area, created_at, update_at) 
      VALUES (?, ?, ?, NOW(), NOW())`;

    const [result] = await db.query(query, [
      nama_tandon,
      tanggal_tanam,
      id_area,
    ]);
    return result.insertId; // Mengembalikan id_tandon yang baru dibuat
  },

  // Mengambil semua tandon dalam satu area + data sensor (riwayat) terbaru
  getTandonById: async (id_area) => {
    const query = `
      SELECT t.*, r.ph, r.ppm, r.volume_air, r.is_hujan 
      FROM tandon AS t
      LEFT JOIN (
          SELECT * FROM riwayat_data 
          WHERE id_riwayat_data IN (
              SELECT MAX(id_riwayat_data) 
              FROM riwayat_data 
              GROUP BY id_tandon
          )
      ) AS r ON t.id_tandon = r.id_tandon
      WHERE t.id_area = ?`;

    const [rows] = await db.query(query, [id_area]);
    return rows;
  },

  // Mengambil detail lengkap satu tandon (untuk halaman pengaturan)
  getDetailTandon: async (id_tandon) => {
    const query = `
      SELECT t.*, r.ph, r.ppm, r.volume_air, r.is_hujan 
      FROM tandon AS t
      LEFT JOIN (
          SELECT * FROM riwayat_data 
          WHERE id_riwayat_data IN (
              SELECT MAX(id_riwayat_data) 
              FROM riwayat_data 
              GROUP BY id_tandon
          )
      ) AS r ON t.id_tandon = r.id_tandon
      WHERE t.id_tandon = ?`;
    const [rows] = await db.query(query, [id_tandon]);
    return rows[0];
  },

  // Update fleksibel (PATCH) - Sudah oke!
  update: async (id_tandon, data) => {
    const query = `UPDATE tandon SET ?, update_at = NOW() WHERE id_tandon = ?`;
    const [result] = await db.query(query, [data, id_tandon]);
    return result.affectedRows > 0;
  },

  // Menghapus tandon
  deleteTandon: async (id_tandon) => {
    const query = `DELETE FROM tandon WHERE id_tandon = ?`;
    const [result] = await db.query(query, [id_tandon]);
    return result.affectedRows > 0;
  },
};

module.exports = Tandon;
