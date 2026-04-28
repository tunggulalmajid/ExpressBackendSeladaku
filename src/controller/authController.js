const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthController {
  // Helper internal untuk membuat token
  static #generateTokens(id_user) {
    const accessToken = jwt.sign(
      { id: id_user },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    const refreshToken = jwt.sign(
      { id: id_user },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );
    return { accessToken, refreshToken };
  }

  // 1. Register (Minimalis: Nama, Email, Password)
  static async register(req, res) {
    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
      return res
        .status(400)
        .json({
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
      user: { id: user.id_user, nama: user.nama, email: user.email },
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

  // 4. Refresh Token
  static async refresh(req, res) {
    const { token } = req.body;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token diperlukan" });
    }

    const userData = await User.findByRefreshToken(token);
    if (!userData) {
      return res
        .status(403)
        .json({ success: false, message: "Token tidak valid" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const accessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" },
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
