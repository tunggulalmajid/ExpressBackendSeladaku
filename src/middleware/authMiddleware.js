const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Akses ditolak, token hilang" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id_user: decoded.id };
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: "Token tidak valid atau kadaluwarsa" });
  }
};

module.exports = verifyToken;
