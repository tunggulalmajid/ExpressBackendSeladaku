// Jalur ekspor resmi sub-modul Firebase Admin SDK Modern
const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const firebaseCredential = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Mengubah literal \n dari string .env menjadi baris baru yang valid secara kriptografi
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
};

// Inisialisasi Firebase Admin SDK menggunakan fungsi 'cert' hasil bongkar pasang subpath /app
initializeApp({
  credential: cert(firebaseCredential),
});

const firebaseMessaging = {
  /**
   * Fungsi helper universal untuk menembak push notification ke HP user
   */
  kirimNotif: async (fcmToken, title, body, dataExtra = {}) => {
    try {
      const payload = {
        token: fcmToken,
        notification: { title, body },
        data: dataExtra,
        android: {
          priority: "high",
          notification: {
            sound: "default",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
        },
      };

      // Mengirim payload notifikasi via instance Messaging resmi
      const response = await getMessaging().send(payload);
      console.log("🟢 FCM Berhasil Terkirim via Env:", response);
      return { success: true, response };
    } catch (error) {
      console.error("❌ FCM Gagal Terkirim via Env:", error);
      return { success: false, error: error.message };
    }
  },
};

module.exports = firebaseMessaging;
