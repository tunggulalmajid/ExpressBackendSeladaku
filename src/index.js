const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");

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

const authRoutes = require("./routes/authRoutes");

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Zurian Hidroponik API 🚀",
    status: "Server is running smoothly",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);

app.use((err, req, res, next) => {
  console.error(`[Error]: ${err.message}`);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`==========================================`);
  console.log(`Server Zurian aktif di port: ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`==========================================`);
});
