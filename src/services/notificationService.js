const db = require("../config/dbConf");
const firebaseMessaging = require("../config/firebaseConf");
const telegramService = require("../config/telegramConf"); // Hubungkan ke bot Telegram yang baru dibuat

const notificationService = {
  /**
   * Fungsi Multi-Channel: Catat di DB, Kirim Push Notif FCM (Per Tandon), dan Kirim Chat Telegram (Per User)
   */
  buatDanKirimNotif: async (userId, idTandon, pesan, tipe, titleFCM) => {
    try {
      // 1. SIMPAN LOG HISTORI KE TABEL NOTIFIKASI DI DATABASE SQL
      const queryInsert = `
                INSERT INTO notifikasi (id_user, id_tandon, pesan, tipe, is_read, created_at)
                VALUES (?, ?, ?, ?, false, NOW())
            `;
      await db.execute(queryInsert, [userId, idTandon, pesan, tipe]);
      console.log(`🟢 [DB Log] Notifikasi berjenis ${tipe} berhasil dicatat.`);

      // 2. AMBIL ID TELEGRAM DARI TABEL USER
      const queryUser = `SELECT id_telegram FROM user WHERE id_user = ? LIMIT 1`;
      const [users] = await db.execute(queryUser, [userId]);

      // 3. 🟢 PERBAIKAN SAKTI: AMBIL FCM TOKEN LANGSUNG DARI TABEL TANDON (Bukan dari User lagi)
      let fcmToken = null;
      if (idTandon) {
        const queryTandon = `SELECT fcm_token FROM tandon WHERE id_tandon = ? LIMIT 1`;
        const [tandonRows] = await db.execute(queryTandon, [idTandon]);
        if (tandonRows.length > 0) {
          fcmToken = tandonRows[0].fcm_token;
        }
      }

      // --- CHANNEL 1: FIREBASE CLOUD MESSAGING (Menggunakan token hasil query tandon) ---
      if (fcmToken) {
        const dataExtra = {
          tipe: tipe,
          id_tandon: idTandon ? idTandon.toString() : "",
        };
        // Memanggil config firebaseConf-mu
        await firebaseMessaging.kirifmNotif(
          fcmToken,
          titleFCM,
          pesan,
          dataExtra,
        );
        console.log(
          `🚀 FCM Push Notification dikirim ke tandon ID: ${idTandon}`,
        );
      } else {
        console.log(
          `ℹ️ FCM Skip: Tandon ID ${idTandon} tidak memiliki token aktif (Toggle OFF).`,
        );
      }

      // --- CHANNEL 2: TELEGRAM BOT NOTIFICATION (Chat Instan Tetap per Akun User) ---
      if (users.length > 0) {
        const user = users[0];
        if (user.id_telegram) {
          // Beri hiasan cetak tebal (*) pada judul notifikasi agar rapi di Telegram
          const pesanTelegram = `*${titleFCM}*\n\n${pesan}`;
          await telegramService.kirimPesan(user.id_telegram, pesanTelegram);
        } else {
          console.log(
            `ℹ️ Telegram Skip: User ID ${userId} belum menautkan ID Telegram di profil.`,
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ Gagal memproses notificationService multi-channel:",
        error,
      );
    }
  },
};

module.exports = notificationService;
