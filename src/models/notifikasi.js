const db = require("../config/dbConf");

const notifikasi = {
  // 1. Ambil semua data notifikasi milik user tertentu beserta nama tandonnya
  getNotifikasi: async (userId) => {
    const query = `
            SELECT 
                n.id_notifikasi,
                n.id_user,
                n.pesan,
                n.tipe,
                n.id_tandon,
                n.is_read,
                n.created_at,
                t.nama_tandon
            FROM notifikasi n
            LEFT JOIN tandon t ON n.id_tandon = t.id_tandon
            WHERE n.id_user = ?
            ORDER BY n.created_at DESC
        `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  },

  // 2. Tandai status notifikasi menjadi sudah dibaca (is_read = true)
  bacaNotifikasi: async (notifId, userId) => {
    const query = `
            UPDATE notifikasi 
            SET is_read = true 
            WHERE id_notifikasi = ? AND id_user = ?
        `;
    const [result] = await db.execute(query, [notifId, userId]);
    return result.affectedRows;
  },

  // 3. Hapus notifikasi dari riwayat database
  hapusNotifikasi: async (notifId, userId) => {
    const query = `
            DELETE FROM notifikasi 
            WHERE id_notifikasi = ? AND id_user = ?
        `;
    const [result] = await db.execute(query, [notifId, userId]);
    return result.affectedRows;
  },
};

module.exports = notifikasi;
