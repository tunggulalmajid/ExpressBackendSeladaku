const db = require("../config/dbConf");
const firebaseMessaging = require("../config/firebaseConf");
const telegramService = require("../config/telegramConf"); // Hubungkan ke bot Telegram yang baru dibuat

const notificationService = {
  /**
   * Fungsi Multi-Channel: Catat di DB, Kirim Push Notif FCM, dan Kirim Chat Telegram
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

      // 2. AMBIL TOKEN FCM DAN ID TELEGRAM USER SEKALIGUS DARI DB
      const queryUser = `SELECT fcm_token, id_telegram FROM user WHERE id_user = ? LIMIT 1`;
      const [users] = await db.execute(queryUser, [userId]);

      if (users.length > 0) {
        const user = users[0];

        // --- CHANNEL 1: FIREBASE CLOUD MESSAGING (Aplikasi HP Flutter) ---
        if (user.fcm_token) {
          const dataExtra = {
            tipe: tipe,
            id_tandon: idTandon ? idTandon.toString() : "",
          };
          await firebaseMessaging.kirifmNotif(
            user.fcm_token,
            titleFCM,
            pesan,
            dataExtra,
          );
        }

        // --- CHANNEL 2: TELEGRAM BOT NOTIFICATION (Chat Instan) ---
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
