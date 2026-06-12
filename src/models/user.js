const db = require("../config/dbConf");

const User = {
  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM user WHERE email = ?", [
      email,
    ]);
    return rows[0];
  },

  findById: async (id_user) => {
    const [rows] = await db.query(
      "SELECT id_user, nama, email, id_telegram,latitude, longitude, nomor_telepon, alamat, foto, created_at FROM user WHERE id_user = ?",
      [id_user],
    );
    return rows[0];
  },

  create: async (data) => {
    const { nama, email, password } = data;
    const [result] = await db.query(
      "INSERT INTO user (nama, email, password) VALUES (?, ?, ?)",
      [nama, email, password],
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const {
      nama,
      email,
      nomor_telepon,
      alamat,
      foto,
      id_telegram,
      latitude,
      longitude,
    } = data;
    console.log(data);
    const query = `
        UPDATE user SET 
        nama = ?, 
        email = ?, 
        nomor_telepon = ?, 
        alamat = ?, 
        foto = ?, 
        id_telegram = ?, 
        latitude = ?, 
        longitude = ? 
        WHERE id_user = ?`;

    const values = [
      nama,
      email,
      nomor_telepon,
      alamat,
      foto,
      id_telegram,
      latitude,
      longitude,
      id,
    ];
    const [result] = await db.execute(query, values);
    return result.affectedRows > 0;
  },

  updateRefreshToken: async (id_user, token) => {
    await db.query("UPDATE user SET refresh_token = ? WHERE id_user = ?", [
      token,
      id_user,
    ]);
  },

  findByRefreshToken: async (token) => {
    const [rows] = await db.query(
      "SELECT id_user FROM user WHERE refresh_token = ?",
      [token],
    );
    return rows[0];
  },
  updateFcmToken: async (id_user, fcmToken) => {
    const query = "UPDATE user SET fcm_token = ? WHERE id_user = ?";
    const [result] = await db.execute(query, [fcmToken, id_user]);
    return result.affectedRows > 0;
  },
};

module.exports = User;
