const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../config/cloudinary");

class AuthController {
  // Helper internal untuk membuat token
  static #generateTokens(id_user) {
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
  }

  // 1. Register (Minimalis: Nama, Email, Password)
  static async register(req, res) {
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

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil! Silakan lengkapi profil Anda nanti.",
    });
  }

  // 2. Login
  static async login(req, res) {
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

    const { accessToken, refreshToken } = AuthController.#generateTokens(
      user.id_user,
    );
    await User.updateRefreshToken(user.id_user, refreshToken);

    res.json({
      success: true,
      message: "Login berhasil",
      accessToken,
      refreshToken,
      data: { id_user: user.id_user, nama: user.nama, email: user.email },
    });
  }

  // 3. Get Profil (Me)
  static async getMe(req, res) {
    const user = await User.findById(req.user.id_user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    res.json({ success: true, data: user });
  }

  static async updateProfile(req, res) {
    try {
      const userId = req.user.id_user;
      console.log(req.body);
      const { nama, email, nomorTelepon, alamat, idTelegram, lat, lon } =
        req.body;

      // 1. Cari data user lama
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

      // 2. Jika ada file foto baru yang diupload
      if (req.file) {
        // Upload ke Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "seladaku_profiles",
          use_filename: true,
        });
        updateData.foto = result.secure_url;
      }
      console.log(updateData);
      // 3. Eksekusi Update ke Database
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
  }

  // 4. Refresh Token
  static async refresh(req, res) {
    const { token } = req.body;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token diperlukan" });
    }

    const userData = await User.findByRefreshToken(token);
    console.log(userData + "INI USERDATA");
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
      res.json({ success: true, accessToken });
    } catch (err) {
      res.status(403).json({ success: false, message: "Token kadaluwarsa" });
    }
  }

  // 5. Logout
  static async logout(req, res) {
    await User.updateRefreshToken(req.user.id_user, null);
    res.json({ success: true, message: "Logout berhasil" });
  }
}

module.exports = AuthController;
