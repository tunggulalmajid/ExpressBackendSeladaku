# Seladaku - Backend API 🚀

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/framework-Express.js-green.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/database-MySQL-orange.svg)](https://www.mysql.com/)
[![MQTT](https://img.shields.io/badge/mqtt-HiveMQ-violet.svg)](https://www.hivemq.com/)
[![Docker](https://img.shields.io/badge/docker-compatible-blue.svg)](https://www.docker.com/)

**Seladaku Backend API** (atau dikenal juga sebagai **Zurian Hidroponik API**) adalah backend server berbasis **Express.js** yang dirancang untuk mendukung ekosistem monitoring dan otomatisasi pertanian hidroponik tanaman selada berbasis IoT. Backend ini mengintegrasikan komunikasi real-time, push notification multi-channel, dan kontrol aktuator modular.

---

## 🌟 Fitur Utama

- 🔑 **Autentikasi JWT**: Akses aman dengan Access Token (durasi pendek) dan Refresh Token (durasi panjang) untuk Flutter mobile.
- 📍 **Manajemen Area & Kebun**: Pengelolaan petak kebun hidroponik lengkap dengan koordinat GPS/geolokasi.
- 📦 **Kontrol Tandon Modular**: Konfigurasi parameter batas kritis sensor (min/max pH, min/max PPM, min volume air) dan kontrol relay aktuator (Pompa, Selenoide S1/S2) baik secara manual maupun otomatis.
- 📡 **Integrasi IoT (MQTT & Socket.io)**: 
  - Konsumsi data telemetri dari ESP32 via HiveMQ Cloud.
  - Distribusi data sensor ke aplikasi Flutter secara real-time via Socket.io.
  - Pengiriman kontrol instruksi (aktuator) balik ke ESP32 secara instan.
- 🔔 **Multi-Channel Alert Notification**:
  - **Firebase Cloud Messaging (FCM)**: Push notification ke ponsel pengguna dengan toggle aktif/nonaktif per tandon.
  - **Telegram Bot**: Mengirim pesan peringatan abnormalitas sensor langsung ke chat pribadi Telegram pengguna.
- 📝 **Laporan Historis (Analytics)**: Agregasi data sensor harian, mingguan, dan bulanan yang dirancang ramah visualisasi chart.
- 📚 **Swagger API Documentation**: Dokumentasi interaktif menggunakan OpenAPI 3.0 / Swagger UI.

---

## 🛠️ Tech Stack

- **Runtime**: [Node.js (v20-alpine)](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MySQL (mysql2)](https://github.com/sidorares/node-mysql2)
- **Komunikasi Real-time**: [Socket.io](https://socket.io/)
- **Broker MQTT**: [HiveMQ Cloud](https://www.hivemq.com/cloud/)
- **Media Storage**: [Cloudinary](https://cloudinary.com/) (Unggah foto profil kebun/user)
- **Notifikasi**: [Firebase Admin SDK](https://firebase.google.com/docs/admin) & [Node Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)
- **Dokumentasi**: [Swagger UI Express](https://github.com/scottie198/swagger-ui-express)
- **Containerization**: [Docker & Docker Compose](https://www.docker.com/)

---

## 📁 Struktur Direktori

```bash
ExpressBackendSeladaku/
├── .github/             # GitHub workflow / CI-CD configuration
├── src/
│   ├── config/          # Konfigurasi database, Firebase, Swagger, Telegram, Cloudinary
│   ├── controller/      # Logika pemrosesan request HTTP & API endpoint
│   ├── middleware/      # Middleware autentikasi JWT & validasi request
│   ├── models/          # Layer Query SQL ke database MySQL
│   ├── routes/          # Definisi routing API Express
│   ├── services/        # Service MQTT & Service Push Notifikasi (FCM + Telegram)
│   └── index.js         # Entry point aplikasi utama
├── Dockerfile           # Konfigurasi Docker Image
├── docker-compose.yaml  # Orkestrasi container Web API & MySQL
├── test-mqtt.js         # Simulator ESP32 untuk pengujian sensor & notifikasi
└── package.json         # Dependensi & script npm
```

---

## ⚙️ Persiapan & Instalasi

### 1. Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal:
- [Node.js v20.x atau lebih baru](https://nodejs.org/)
- [MySQL Database Server](https://www.mysql.com/)
- Akun [HiveMQ Cloud](https://www.hivemq.com/cloud/) (atau broker MQTT lainnya)
- Bot Telegram (dibuat via `@BotFather`)
- Project Firebase (untuk mengunduh berkas kunci privat akun layanan FCM)

### 2. Kloning Repositori
```bash
git clone https://github.com/username/backend-api-seladaku.git
cd backend-api-seladaku
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env` dan lengkapi nilai-nilainya:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi koneksi MySQL, kredensial MQTT, API Key Cloudinary, kunci Firebase Admin, dan Token Telegram Bot Anda di dalam `.env`.

### 4. Skema Database (MySQL)
Buat database baru di MySQL Anda (contoh: `ppl_seladaku_2`), lalu buat tabel-tabel berikut:

#### Tabel `user`
```sql
CREATE TABLE user (
    id_user INT PRIMARY KEY AUTO_INCREMENT,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    id_telegram VARCHAR(50),
    latitude DOUBLE,
    longitude DOUBLE,
    nomor_telepon VARCHAR(20),
    alamat TEXT,
    foto VARCHAR(255),
    refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabel `area`
```sql
CREATE TABLE area (
    id_area INT PRIMARY KEY AUTO_INCREMENT,
    nama VARCHAR(150) NOT NULL,
    id_user INT NOT NULL,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE
);
```

#### Tabel `tandon`
```sql
CREATE TABLE tandon (
    id_tandon INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    nama_tandon VARCHAR(100) NOT NULL,
    tanggal_tanam DATETIME,
    id_area INT NOT NULL,
    tinggi_tandon INT NOT NULL,
    jarak_aman INT NOT NULL,
    mode_otomatis TINYINT(1) DEFAULT 0,
    is_notif_aktif TINYINT(1) DEFAULT 0,
    status_s1 VARCHAR(10) DEFAULT 'OFF',
    status_s2 VARCHAR(10) DEFAULT 'OFF',
    status_pompa VARCHAR(10) DEFAULT 'OFF',
    min_ph DOUBLE DEFAULT 5.5,
    max_ph DOUBLE DEFAULT 8.5,
    min_ppm INT DEFAULT 450,
    max_ppm INT DEFAULT 850,
    min_volume DOUBLE DEFAULT 0.3,
    fcm_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_seen TIMESTAMP NULL,
    FOREIGN KEY (id_area) REFERENCES area(id_area) ON DELETE CASCADE
);
```

#### Tabel `riwayat_data`
```sql
CREATE TABLE riwayat_data (
    id_riwayat INT PRIMARY KEY AUTO_INCREMENT,
    id_tandon INT NOT NULL,
    ph DOUBLE NOT NULL,
    ppm INT NOT NULL,
    volume_air INT NOT NULL,
    is_hujan TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tandon) REFERENCES tandon(id_tandon) ON DELETE CASCADE
);
```

#### Tabel `notifikasi`
```sql
CREATE TABLE notifikasi (
    id_notifikasi INT PRIMARY KEY AUTO_INCREMENT,
    id_user INT NOT NULL,
    id_tandon INT NOT NULL,
    pesan TEXT NOT NULL,
    tipe VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
    FOREIGN KEY (id_tandon) REFERENCES tandon(id_tandon) ON DELETE CASCADE
);
```

---

## 🚀 Menjalankan Aplikasi

### Mode Pengembangan (Local)
Instal dependensi proyek terlebih dahulu:
```bash
npm install
```
Lalu jalankan server dalam mode development (menggunakan nodemon):
```bash
npm run dev
```
Server akan aktif di `http://localhost:3000`.

### Menggunakan Docker Compose (Production / VPS)
Aplikasi ini sudah dilengkapi dengan orkestrasi Docker untuk mempermudah deployment ke server VPS:
```bash
# Menjalankan Express API & database MySQL secara background
docker-compose up -d

# Melihat logs container
docker-compose logs -f
```

---

## 🧪 Pengujian & Dokumentasi API

### 1. Swagger API Documentation
Setelah server berjalan, Anda dapat mengakses dokumentasi API interaktif pada URL:
🔗 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

### 2. Simulasi Data IoT (MQTT)
Untuk menguji apakah alur data sensor dari ESP32 masuk ke database, Socket.io, Telegram Bot, dan FCM, Anda dapat menggunakan script simulator ESP32 yang telah disediakan:
1. Daftarkan tandon baru dengan `device_id` bernilai `device_01` via aplikasi/Swagger.
2. Hubungkan akun Anda dengan bot Telegram dengan mengetik `/start` atau `/id` di bot Telegram Anda, lalu simpan chat ID tersebut ke profil pengguna Anda.
3. Jalankan simulator:
   ```bash
   node test-mqtt.js
   ```
4. Simulator akan mengirimkan data sensor abnormal berturut-turut. Perhatikan log di backend dan pesan darurat yang masuk ke bot Telegram Anda!

---

## 🤖 Integrasi Bot Telegram

Aplikasi backend ini dilengkapi dengan bot polling aktif:
1. Cari Bot Telegram Anda di aplikasi Telegram.
2. Kirim perintah `/start` untuk menyapa bot dan mendapatkan **Key ID** Telegram Anda.
3. Kirim perintah `/id` jika Anda ingin menyalin ulang ID Anda sewaktu-waktu.
4. Masukkan **Key ID** tersebut ke pengaturan profil Anda di aplikasi **Seladaku**.
5. Bot secara otomatis akan mengirim pesan peringatan jika kadar pH, PPM, atau Level Air terdeteksi tidak normal selama 3x pembacaan berturut-turut.

---

## 📝 Lisensi & Kontributor

- **Pengembang**: Tunggul Abdul Majid ([@tunggulalmajid](https://github.com/tunggulalmajid))
- **Lisensi**: Proyek ini dilisensikan di bawah [ISC License](LICENSE).
