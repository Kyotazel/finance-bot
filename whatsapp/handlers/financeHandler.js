/**
 * Handle finance-related WhatsApp commands
 * @param {import('whatsapp-web.js').Message} msg
 * @param {string} text
 */
const axios = require("axios");
const { port } = require("../../server");
const API_BASE = `http://localhost:${port}`;

async function handleFinanceCommand(msg, text) {
  const commandText = text.slice("/finance".length).trim();
  if (commandText.startsWith("tambah")) {
    const parts = commandText.split(/\s+/);
    if (parts.length < 4) {
      return msg.reply(
        "⚠️ Format salah. Contoh: /finance tambah pemasukan 500000 gaji"
      );
    }
    const [, type, amountStr, ...descParts] = parts;
    const amount = parseInt(amountStr, 10);
    const description = descParts.join(" ");
    if (!["pemasukan", "pengeluaran"].includes(type)) {
      return msg.reply("⚠️ Type harus *pemasukan* atau *pengeluaran*");
    }
    if (isNaN(amount) || amount <= 0) {
      return msg.reply("⚠️ Jumlah harus angka positif");
    }
    try {
      await axios.post(`${API_BASE}/api/transactions`, {
        type,
        amount,
        description,
      });
      return msg.reply(
        `✅ Transaksi *${type}* Rp${amount.toLocaleString()} (${description}) berhasil dicatat.`
      );
    } catch (err) {
      return msg.reply(`❌ Gagal mencatat transaksi: ${err.message}`);
    }
  }
  if (commandText === "saldo") {
    try {
      const res = await axios.get(`${API_BASE}/api/transactions/saldo`);
      const { saldo, totalPemasukan, totalPengeluaran } = res.data;
      return msg.reply(
        `💰 *Saldo*\n` +
          `Saldo: Rp${saldo.toLocaleString()}\n` +
          `Pemasukan: Rp${totalPemasukan.toLocaleString()}\n` +
          `Pengeluaran: Rp${totalPengeluaran.toLocaleString()}`
      );
    } catch (err) {
      return msg.reply(`❌ Gagal ambil saldo: ${err.message}`);
    }
  }
  if (commandText === "help") {
    return msg.reply(
      `📝 *Daftar Perintah*\n` +
        `/finance tambah pemasukan|pengeluaran <jumlah> <deskripsi>\n` +
        `/finance saldo\n` +
        `/finance help`
    );
  }
  return msg.reply(
    "⚠️ Perintah tidak dikenali. Gunakan /finance help untuk daftar perintah."
  );
}

module.exports = { handleFinanceCommand };
