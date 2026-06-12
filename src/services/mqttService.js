const mqtt = require("mqtt");
const Tandon = require("../models/tandon");
const Riwayat = require("../models/riwayat");
const notifService = require("../services/notificationService");
require("dotenv");

// Memori lokal di server untuk mencatat hitungan fluktuasi dan jeda waktu notifikasi
const tandonCounters = {};

const setupMqtt = (io) => {
  const client = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
  });

  // --- 1. KONEKSI MQTT ---
  client.on("connect", () => {
    console.log("✅ MQTT Connected to HiveMQ Cloud");
    client.subscribe("#");
  });

  // --- 2. PENANGANAN DATA DARI ALAT (ESP32 -> Backend) ---
  client.on("message", async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const { device_id, ph, ppm, volume_air, is_hujan } = payload;
      console.log(payload);
      const tandonRows = await Tandon.getTandonByDevice(device_id);
      console.log(tandonRows.length);
      if (tandonRows.length === 0) return;

      const {
        id_tandon,
        tinggi_tandon,
        jarak_aman,
        id_user,
        nama_tandon,
        min_ph,
        max_ph,
        min_ppm,
        max_ppm,
        min_volume,
        mode_otomatis,
      } = tandonRows[0];

      // Inisialisasi counter dan timestamp di memori server jika belum terdaftar
      if (!tandonCounters[id_tandon]) {
        tandonCounters[id_tandon] = {
          ph: 0,
          ppm: 0,
          volume: 0,
          hujan: 0, // Tambah counter khusus hujan
          last_notified_ph: null,
          last_notified_ppm: null,
          last_notified_volume: null,
          last_notified_hujan: null, // Tambah kunci waktu khusus hujan
        };
      }

      // 1. Hitung Volume Air
      const rangeEfektif = tinggi_tandon - jarak_aman;
      const jarakAirSekarang = tinggi_tandon - volume_air;
      let volumePersen = Math.round((jarakAirSekarang / rangeEfektif) * 100);
      volumePersen = Math.max(0, Math.min(100, volumePersen));

      // 2. Siapkan data penampung database
      const dataRiwayat = {
        ph: ph ?? 0,
        ppm: ppm ?? 0,
        volume_air: volumePersen,
        is_hujan: is_hujan ? 1 : 0,
      };
      const statusAktuator = { last_seen: new Date() };

      if (payload.status_pompa !== undefined)
        statusAktuator.status_pompa = payload.status_pompa;
      if (payload.status_s1 !== undefined)
        statusAktuator.status_s1 = payload.status_s1;
      if (payload.status_s2 !== undefined)
        statusAktuator.status_s2 = payload.status_s2;
      if (payload.mode_otomatis !== undefined)
        statusAktuator.mode_otomatis = payload.mode_otomatis ? 1 : 0;

      // 3. TETAP SIMPAN KE DATABASE (Agar grafik Flutter mendeteksi fluktuasi asli lapangan)
      await Promise.all([
        Riwayat.createRiwayat(id_tandon, dataRiwayat),
        Tandon.update(id_tandon, statusAktuator),
      ]);

      io.emit(`sensor-${id_tandon}`, { ...dataRiwayat, ...statusAktuator });

      // =========================================================================
      // --- LOGIKA ANTI-FLUKTUASI + TIMING ALERT JEDA 1 JAM ---
      // =========================================================================
      const BATAS_TOLERANSI = 3;
      const JEDA_NOTIFIKASI = 1 * 60 * 60 * 1000; // Konversi 1 Jam ke dalam milidetik
      const waktuSekarang = Date.now();

      // A. Validasi Kritis pH Air
      if (ph < min_ph || ph > max_ph) {
        tandonCounters[id_tandon].ph += 1;

        if (tandonCounters[id_tandon].ph >= BATAS_TOLERANSI) {
          const lastNotified = tandonCounters[id_tandon].last_notified_ph;

          if (
            !lastNotified ||
            waktuSekarang - lastNotified >= JEDA_NOTIFIKASI
          ) {
            const pesanPh = `Kadar pH pada ${nama_tandon} berada di luar batas normal (${ph}).`;
            await notifService.buatDanKirimNotif(
              id_user,
              id_tandon,
              pesanPh,
              "WARNING",
              "pH Tidak Normal ⚠️",
            );
            tandonCounters[id_tandon].last_notified_ph = waktuSekarang;
          }
        }
      } else {
        tandonCounters[id_tandon].ph = 0;
      }

      // B. Validasi Kritis Kepekatan Nutrisi PPM
      if (ppm < min_ppm || ppm > max_ppm) {
        tandonCounters[id_tandon].ppm += 1;

        if (tandonCounters[id_tandon].ppm >= BATAS_TOLERANSI) {
          const lastNotified = tandonCounters[id_tandon].last_notified_ppm;

          if (
            !lastNotified ||
            waktuSekarang - lastNotified >= JEDA_NOTIFIKASI
          ) {
            const pesanPpm = `Nutrisi pada ${nama_tandon} tidak stabil (${ppm} ppm). Segera cek tandon nutrisi Anda.`;
            await notifService.buatDanKirimNotif(
              id_user,
              id_tandon,
              pesanPpm,
              "WARNING",
              "Nutrisi Tidak Normal ⚠️",
            );
            tandonCounters[id_tandon].last_notified_ppm = waktuSekarang;
          }
        }
      } else {
        tandonCounters[id_tandon].ppm = 0;
      }

      // C. Validasi Kritis Volume Air Kapasitas
      if (volumePersen < min_volume) {
        tandonCounters[id_tandon].volume += 1;

        if (tandonCounters[id_tandon].volume >= BATAS_TOLERANSI) {
          const lastNotified = tandonCounters[id_tandon].last_notified_volume;

          if (
            !lastNotified ||
            waktuSekarang - lastNotified >= JEDA_NOTIFIKASI
          ) {
            const pesanVol = `Level Air Rendah. ${nama_tandon} memerlukan pengisian air segera (${volumePersen}%).`;
            await notifService.buatDanKirimNotif(
              id_user,
              id_tandon,
              pesanVol,
              "WARNING",
              "Level Air Rendah ⚠️",
            );
            tandonCounters[id_tandon].last_notified_volume = waktuSekarang;
          }
        }
      } else {
        tandonCounters[id_tandon].volume = 0;
      }

      // D. Validasi Keadaan Hujan + Proteksi Fluktuasi & Spam Jeda 1 Jam
      if (is_hujan === 1 || is_hujan === true) {
        tandonCounters[id_tandon].hujan += 1;

        if (tandonCounters[id_tandon].hujan >= BATAS_TOLERANSI) {
          const lastNotified = tandonCounters[id_tandon].last_notified_hujan;

          if (
            !lastNotified ||
            waktuSekarang - lastNotified >= JEDA_NOTIFIKASI
          ) {
            if (mode_otomatis === 1 || mode_otomatis === true) {
              const pesanOtomatis = `Hujan terdeteksi! Mode Hujan aktif ${nama_tandon}.`;
              await notifService.buatDanKirimNotif(
                id_user,
                id_tandon,
                pesanOtomatis,
                "AUTOMATION",
                "Mode Hujan Tandon Aktif 🤖",
              );
            } else {
              const pesanHujanGlobal = `Kebun Anda terdeteksi diguyur hujan. Mohon pantau kondisi tanaman selada Anda.`;
              await notifService.buatDanKirimNotif(
                id_user,
                id_tandon,
                pesanHujanGlobal,
                "INFO",
                "Kebun Diguyur Hujan 🌦️",
              );
            }
            // Kunci waktu pengiriman setelah notifikasi terkirim (baik mode auto maupun global)
            tandonCounters[id_tandon].last_notified_hujan = waktuSekarang;
          }
        }
      } else {
        tandonCounters[id_tandon].hujan = 0; // Reset counter hujan ke 0 saat sensor sudah kering/tidak hujan
      }
    } catch (err) {
      console.error("❌ MQTT Message Error:", err.message);
    }
  });

  // --- 3. PENANGANAN KONTROL DARI APLIKASI (Flutter -> Backend -> ESP32) ---
  io.on("connection", (socket) => {
    socket.on("control-device", async (data) => {
      const { device_id, target, command } = data;
      if (!device_id || !target || !command) return;

      try {
        const rows = await Tandon.getTandonByDevice(device_id);
        if (rows.length === 0) return;

        const tandonCurrent = rows[0];
        const isAuto = tandonCurrent.mode_otomatis === 1;

        if (target !== "mode" && isAuto) {
          return socket.emit("error-msg", {
            message: "Aksi ditolak! Matikan mode AUTO terlebih dahulu.",
          });
        }

        let modeStatus = isAuto ? "auto" : "manual";

        if (target === "mode") {
          modeStatus = command.toLowerCase();
          const modeValue = modeStatus === "auto" ? 1 : 0;
          await Tandon.update(tandonCurrent.id_tandon, {
            mode_otomatis: modeValue,
          });
        }

        const mqttPayload = { mode: modeStatus };
        if (target !== "mode") {
          mqttPayload[target] = command.toLowerCase();
        }

        const topicAktuator = `zurian/${device_id}/aktuator`;
        const messageToESP = JSON.stringify(mqttPayload);

        client.publish(topicAktuator, messageToESP, { qos: 1 });
      } catch (error) {
        console.error("❌ Control Error:", error.message);
      }
    });
  });
};

module.exports = setupMqtt;
