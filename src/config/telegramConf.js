const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Telegram Bot Seladaku is standby and polling...");

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const textInput = msg.text ? msg.text.trim() : "";

  if (textInput === "/start") {
    bot.sendMessage(
      chatId,
      `Halo *${msg.from.first_name || "User"}*! Selamat datang di Bot Monitoring Seladaku.\n\n` +
        `Silakan gunakan ID Telegram di bawah ini untuk dimasukkan ke profil aplikasi Anda:\n` +
        `Key ID: \`${chatId}\``,
      { parse_mode: "Markdown" },
    );
  } else if (textInput === "/id") {
    bot.sendMessage(
      chatId,
      `ID Telegram Anda adalah: \`${chatId}\`\n\n_Salin nomor di atas dan tempelkan ke pengaturan profil aplikasi Seladaku Anda._`,
      { parse_mode: "Markdown" },
    );
  } else {
    bot.sendMessage(chatId, `pesan yang anda kirim tidak valid`, {
      parse_mode: "Markdown",
    });
  }
});

const telegramService = {
  /**
   * Fungsi untuk mengirim pesan dari backend ke chat Telegram pribadi milik user
   * @param {string|number} telegramId - ID Telegram user (diambil dari database)
   * @param {string} messageText - Isi pesan teks notifikasi
   */
  kirimPesan: async (telegramId, messageText) => {
    try {
      if (!telegramId) return { success: false, error: "ID Telegram kosong" };

      await bot.sendMessage(telegramId, messageText, {
        parse_mode: "Markdown",
      });
      console.log(
        `✨ [Telegram] Notifikasi sukses dikirim ke ID: ${telegramId}`,
      );
      return { success: true };
    } catch (error) {
      console.error(
        `❌ [Telegram] Gagal mengirim ke ID ${telegramId}:`,
        error.message,
      );
      return { success: false, error: error.message };
    }
  },
};

module.exports = telegramService;
