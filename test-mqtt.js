require("dotenv").config();
const mqtt = require("mqtt");

// Konek ke HiveMQ Cloud sesuai .env backend
const client = mqtt.connect(process.env.MQTT_URL, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
});

client.on("connect", () => {
  console.log("🚀 Simulator ESP32 Aktif. Mengirim data abnormal ke backend...");

  // Ganti 'DEVICE_ID_KAMU' dengan device_id asli yang terdaftar di tabel tandonmu
  const TOPIC = "zurian/device_01/sensor";

  const payloadAbnormal = {
    device_id: "device_01",
    ph: 10, // Kita set 4.5 (di bawah batas normal 6.0)
    ppm: 900,
    volume_air: 28, // Jarak ultrasonik ke air
    is_hujan: true,
  };

  let counter = 1;

  // Kirim data setiap 3 detik sekali sampai 3 kali berturut-turut
  const interval = setInterval(() => {
    console.log(`📡 Mengirim data sensor ke-${counter}...`);
    client.publish(TOPIC, JSON.stringify(payloadAbnormal));

    if (counter >= 3) {
      clearInterval(interval);
      console.log(
        "✅ Simulasi selesai. Periksa terminal backend dan bot Telegram-mu!",
      );
      client.end();
    }
    counter++;
  }, 3000);
});
