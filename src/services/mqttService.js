const mqtt = require("mqtt");
const Tandon = require("../models/tandon");
const Riwayat = require("../models/riwayat");

const setupMqtt = (io) => {
  const client = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
  });

  // --- 1. KONEKSI MQTT ---
  client.on("connect", () => {
    console.log("✅ MQTT Connected to HiveMQ Cloud");
    client.subscribe("zurian/+/sensor");
  });

  // --- 2. PENANGANAN DATA DARI ALAT (ESP32 -> Backend) ---
  client.on("message", async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const { device_id, ph, ppm, volume_air, is_hujan } = payload;
      console.log(
        `device id : ${device_id}, ph : ${ph}, ppm : ${ppm}, volume_air : ${volume_air}, is hujan : ${is_hujan}`,
      );

      const tandonRows = await Tandon.getTandonByDevice(device_id);
      if (tandonRows.length > 0) {
        const { id_tandon, tinggi_tandon, jarak_aman } = tandonRows[0];

        // 1. Hitung Volume Air
        const rangeEfektif = tinggi_tandon - jarak_aman;
        console.log("range efektif:", rangeEfektif.toString());
        const jarakAirSekarang = tinggi_tandon - volume_air;
        console.log("Jarak Air:", jarakAirSekarang.toString());
        let volumePersen = Math.round((jarakAirSekarang / rangeEfektif) * 100);
        volumePersen = Math.max(0, Math.min(100, volumePersen));

        // 2. Data Khusus Tabel riwayat_data (Sesuai kolom di image_92a07b.jpg)
        const dataRiwayat = {
          ph: ph ?? 0,
          ppm: ppm ?? 0,
          volume_air: volumePersen,
          is_hujan: is_hujan ? 1 : 0,
        };

        // 3. Data Khusus Tabel tandon (HANYA kolom yang ada di tabel tandon)
        // JANGAN sertakan 'ph' atau 'ppm' di sini karena akan menyebabkan error Unknown Column
        const statusAktuator = {
          last_seen: new Date(),
        };

        // Hanya update status jika ESP32 mengirimkannya
        if (payload.status_pompa !== undefined)
          statusAktuator.status_pompa = payload.status_pompa;
        if (payload.status_s1 !== undefined)
          statusAktuator.status_s1 = payload.status_s1;
        if (payload.status_s2 !== undefined)
          statusAktuator.status_s2 = payload.status_s2;
        if (payload.mode_otomatis !== undefined) {
          statusAktuator.mode_otomatis = payload.mode_otomatis ? 1 : 0;
        }

        // 4. Eksekusi ke masing-masing tabel
        await Promise.all([
          Riwayat.createRiwayat(id_tandon, dataRiwayat), // Masuk ke riwayat_data
          Tandon.update(id_tandon, statusAktuator), // Masuk ke tandon (Hanya kolom aktuator)
        ]);

        // 5. Kirim data gabungan ke Flutter agar UI terupdate lengkap
        io.emit(`sensor-${id_tandon}`, { ...dataRiwayat, ...statusAktuator });

        console.log(`[DATA] Tandon ${id_tandon} Berhasil Sinkron.`);
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

        // --- LOGIKA BLOKIR (Penyebab kenapa dia otomatis pindah manual ada di sini sebelumnya) ---

        if (target !== "mode" && isAuto) {
          // Jika mode masih AUTO, kita STOP di sini dan tidak kirim apa pun ke MQTT
          console.log(
            `[REJECTED] Perintah ${target} diblokir karena Tandon ${tandonCurrent.id_tandon} masih AUTO`,
          );

          // Beritahu Flutter bahwa aksi ini dilarang
          return socket.emit("error-msg", {
            message: "Aksi ditolak! Matikan mode AUTO terlebih dahulu.",
          });
        }

        // Jika sampai di sini, berarti:
        // 1. Targetnya memang "mode" (ingin ubah manual/auto)
        // 2. Atau targetnya s1/s2/pompa DAN status sudah manual.

        let modeStatus = isAuto ? "auto" : "manual";

        if (target === "mode") {
          modeStatus = command.toLowerCase();
          const modeValue = modeStatus === "auto" ? 1 : 0;
          await Tandon.update(tandonCurrent.id_tandon, {
            mode_otomatis: modeValue,
          });
        }

        // Susun Payload JSON sesuai keinginan ESP32
        const mqttPayload = { mode: modeStatus };
        if (target !== "mode") {
          mqttPayload[target] = command.toLowerCase();
        }

        const topicAktuator = `zurian/${device_id}/aktuator`;
        const messageToESP = JSON.stringify(mqttPayload);

        client.publish(topicAktuator, messageToESP, { qos: 1 }, (err) => {
          if (!err) {
            console.log(`[MQTT] Sent JSON -> ${messageToESP}`);
          }
        });
      } catch (error) {
        console.error("❌ Control Error:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("📱 Client Disconnected");
    });
  });
};

module.exports = setupMqtt;
