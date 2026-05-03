const db = require("../config/dbConf");

const Area = {
  // Ambil semua area milik user + hitung jumlah tandon di dalamnya
  findByUserId: async (id_user) => {
    const query = `
      SELECT 
        a.id_area, 
        a.nama, 
        a.status, 
        a.created_at,
        COUNT(t.id_tandon) AS total_tandon
      FROM area a
      LEFT JOIN tandon t ON a.id_area = t.id_area
      WHERE a.id_user = ?
      GROUP BY a.id_area
      ORDER BY a.created_at DESC`;

    const [rows] = await db.query(query, [id_user]);
    return rows;
  },

  // Simpan area baru
  create: async (id_user, nama) => {
    const query = "INSERT INTO area (nama, id_user, status) VALUES (?, ?, ?)";
    const [result] = await db.query(query, [nama, id_user, true]);
    return result.insertId;
  },

  // Update data area (nama atau status aktif/non-aktif)
  update: async (id_area, id_user, data) => {
    const { nama, status } = data;
    const query =
      "UPDATE area SET nama = ?, status = ? WHERE id_area = ? AND id_user = ?";
    const [result] = await db.query(query, [nama, status, id_area, id_user]);
    return result.affectedRows > 0;
  },

  // Hapus area (Pastikan di DB set ON DELETE CASCADE agar tandon ikut terhapus)
  delete: async (id_area, id_user) => {
    const query = "DELETE FROM area WHERE id_area = ? AND id_user = ?";
    const [result] = await db.query(query, [id_area, id_user]);
    return result.affectedRows > 0;
  },
};

module.exports = Area;
