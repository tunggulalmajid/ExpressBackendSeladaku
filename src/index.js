const express = require("express");
const cors = require("cors");
const http = require("http");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
const { Server } = require("socket.io");
const setupMqtt = require("./services/mqttService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet()); // Keamanan header HTTP
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
); // Izin akses lintas asal (penting untuk Flutter)
app.use(morgan("dev")); // Logger untuk melihat request yang masuk ke terminal
app.use(express.json()); // Parsing body JSON
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }, // Izinkan koneksi dari aplikasi Flutter
});

setupMqtt(io);
const authRoutes = require("./routes/authRoutes");
const areaRoutes = require("./routes/areaRoutes");
const tandonRoutes = require("./routes/tandonRoutes");

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Zurian Hidroponik API 🚀",
    status: "Server is running smoothly",
    path: "/",
    Docs: "/api-docs",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);
app.use("/api/area", areaRoutes);
app.use("/api/tandon", tandonRoutes);

app.use((err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`==========================================`);
  console.log(`Server Zurian aktif di port: ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`==========================================`);
});
