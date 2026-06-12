const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../config/cloudinary");

// 🟢 Helper Lokal untuk membuat token (Pengganti Private Method Class)
const generateTokens = (id_user) => {
  const accessToken = jwt.sign(
    { id_user: id_user },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "30m" },
  );
  const refreshToken = jwt.sign(
    { id_user: id_user },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  );
  return { accessToken, refreshToken };
};

const AuthController = {
  // 1. Register (Minimalis: Nama, Email, Password)
  register: async (req, res) => {
    try {
      const { nama, email, password } = req.body;

      if (!nama || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Nama, email, dan password wajib diisi",
        });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email sudah terdaftar" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({ nama, email, password: hashedPassword });

      return res.status(201).json({
        success: true,
        message: "Registrasi berhasil! Silakan lengkapi profil Anda nanti.",
      });
    } catch (error) {
      console.error("Error Register:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // 2. Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Email atau password salah" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Email atau password salah" });
      }

      const { accessToken, refreshToken } = generateTokens(user.id_user);
      await User.updateRefreshToken(user.id_user, refreshToken);

      return res.json({
        success: true,
        message: "Login berhasil",
        accessToken,
        refreshToken,
        data: { id_user: user.id_user, nama: user.nama, email: user.email },
      });
    } catch (error) {
      console.error("Error Login:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // 3. Get Profil (Me)
  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id_user);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User tidak ditemukan" });
      }
      return res.json({ success: true, data: user });
    } catch (error) {
      console.error("Error GetMe:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // 4. Update Profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id_user;
      console.log(req.body);
      const { nama, email, nomorTelepon, alamat, idTelegram, lat, lon } =
        req.body;

      // Cari data user lama
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      let updateData = {
        nama: nama || user.nama,
        email: email || user.email,
        nomor_telepon: nomorTelepon || user.nomor_telepon,
        alamat: alamat || user.alamat,
        id_telegram: idTelegram || user.id_telegram,
        latitude: lat || user.latitude,
        longitude: lon || user.longitude,
        foto: user.foto, // Default pakai foto lama
      };

      // Jika ada file foto baru yang diupload
      if (req.file) {
        // Upload ke Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "seladaku_profiles",
          use_filename: true,
        });
        updateData.foto = result.secure_url;
      }
      console.log(updateData);

      // Eksekusi Update ke Database
      const success = await User.update(userId, updateData);

      if (success) {
        return res.status(200).json({
          status: "success",
          message: "Profil Seladaku berhasil diperbarui",
          data: updateData,
        });
      }
    } catch (error) {
      console.error("Error updateProfile:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // 5. Refresh Token
  refresh: async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token diperlukan" });
    }

    const userData = await User.findByRefreshToken(token);
    console.log(`${userData}` + "INI USERDATA");
    if (!userData) {
      return res
        .status(403)
        .json({ success: false, message: "Token tidak valid" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const accessToken = jwt.sign(
        { id_user: decoded.id_user },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "30m" },
      );
      return res.json({ success: true, accessToken });
    } catch (err) {
      return res
        .status(403)
        .json({ success: false, message: "Token kadaluwarsa" });
    }
  },

  // 6. Logout
  logout: async (req, res) => {
    try {
      await User.updateRefreshToken(req.user.id_user, null);
      return res.json({ success: true, message: "Logout berhasil" });
    } catch (error) {
      console.error("Error Logout:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  // 7. HANDLER TOGGLE ON: Simpan Token FCM ke Tandon Spesifik
  updateFcm: async (req, res) => {
    try {
      const tandonId = req.params.id;
      const { fcm_token } = req.body;

      if (!fcm_token) {
        return res.status(400).json({
          success: false,
          message: "Parameter fcm_token wajib dikirim di request body",
        });
      }

      const isSuccess = await User.saveFcmToken(tandonId, fcm_token);

      if (!isSuccess) {
        return res.status(404).json({
          success: false,
          message: "Gagal menyinkronkan token, data tandon tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Token FCM perangkat tandon berhasil diaktifkan di database!",
      });
    } catch (error) {
      console.error("Error updateFcm:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  },

  // 8. HANDLER TOGGLE OFF: Hapus Token FCM dari Tandon Spesifik
  deleteFcm: async (req, res) => {
    try {
      const tandonId = req.params.id;

      const isSuccess = await User.clearFcmToken(tandonId);

      if (!isSuccess) {
        return res.status(404).json({
          success: false,
          message: "Gagal menghapus token, data tandon tidak ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Token FCM tandon berhasil dinonaktifkan dari server Seladaku!",
      });
    } catch (error) {
      console.error("Error deleteFcm:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  },
};

module.exports = AuthController;
