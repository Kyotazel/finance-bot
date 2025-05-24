const fs = require("fs");
const path = require("path");
const TX_PATH = path.join(__dirname, "../../data/transactions.json");

/**
 * Handle finance-related WhatsApp commands
 * @param {import('whatsapp-web.js').Message} msg
 * @param {string} text
 */
const axios = require("axios");
const { port } = require("../../server");
const API_BASE = `http://localhost:${port}`;

function readTx() {
  if (!fs.existsSync(TX_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(TX_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function toCSV(transactions) {
  const header = "id,type,amount,category,description,date";
  const rows = transactions.map((t) =>
    [
      t.id,
      t.type,
      t.amount,
      t.category || "",
      t.description || "",
      t.date,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

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
  if (commandText.startsWith("report")) {
    // /finance report 2025-05
    const parts = commandText.split(/\s+/);
    let month = parts[1] || new Date().toISOString().slice(0, 7);
    const txs = readTx().filter((t) => t.date && t.date.startsWith(month));
    if (!txs.length) return msg.reply(`Tidak ada transaksi untuk ${month}`);
    const pemasukan = txs
      .filter((t) => t.type === "pemasukan")
      .reduce((a, b) => a + Number(b.amount), 0);
    const pengeluaran = txs
      .filter((t) => t.type === "pengeluaran")
      .reduce((a, b) => a + Number(b.amount), 0);
    return msg.reply(
      `📅 *Laporan Bulan ${month}*\n` +
        `Pemasukan: Rp${pemasukan.toLocaleString()}\n` +
        `Pengeluaran: Rp${pengeluaran.toLocaleString()}\n` +
        `Transaksi: ${txs.length}`
    );
  }
  if (commandText.startsWith("search ")) {
    // /finance search makan
    const keyword = commandText.slice(7).trim().toLowerCase();
    if (!keyword) return msg.reply("Format: /finance search <keyword>");
    const txs = readTx().filter(
      (t) =>
        (t.description && t.description.toLowerCase().includes(keyword)) ||
        (t.category && t.category.toLowerCase().includes(keyword))
    );
    if (!txs.length) return msg.reply("Tidak ada transaksi ditemukan.");
    let response = `🔎 *Hasil Pencarian: ${keyword}*\n`;
    for (const t of txs) {
      response += `#${t.id} [${t.type}] Rp${t.amount} ${t.date} - ${
        t.description || ""
      }\n`;
    }
    return msg.reply(response);
  }
  if (commandText === "stats") {
    const txs = readTx();
    if (!txs.length) return msg.reply("Belum ada transaksi.");
    const pemasukan = txs
      .filter((t) => t.type === "pemasukan")
      .reduce((a, b) => a + Number(b.amount), 0);
    const pengeluaran = txs
      .filter((t) => t.type === "pengeluaran")
      .reduce((a, b) => a + Number(b.amount), 0);
    const biggest = txs.reduce(
      (max, t) => (Number(t.amount) > Number(max.amount) ? t : max),
      txs[0]
    );
    return msg.reply(
      `📊 *Statistik*\n` +
        `Total transaksi: ${txs.length}\n` +
        `Pemasukan: Rp${pemasukan.toLocaleString()}\n` +
        `Pengeluaran: Rp${pengeluaran.toLocaleString()}\n` +
        `Transaksi terbesar: #${biggest.id} [${biggest.type}] Rp${
          biggest.amount
        } (${biggest.description || ""})`
    );
  }
  if (commandText === "export") {
    const txs = readTx();
    if (!txs.length) return msg.reply("Belum ada transaksi.");
    const csv = toCSV(txs);
    // WhatsApp Web JS tidak support file upload langsung, jadi kirim sebagai pesan teks (atau bisa diimprove dengan upload ke file hosting)
    if (csv.length > 4000) {
      return msg.reply(
        "File terlalu besar untuk dikirim di WhatsApp. Silakan akses file langsung di server."
      );
    }
    return msg.reply("Berikut data transaksi (CSV):\n" + csv);
  }
  if (commandText === "help") {
    return msg.reply(
      `📝 *Daftar Perintah*\n` +
        `/finance tambah pemasukan|pengeluaran <jumlah> <deskripsi>\n` +
        `/finance saldo\n` +
        `/finance report [YYYY-MM]\n` +
        `/finance search <keyword>\n` +
        `/finance stats\n` +
        `/finance export\n` +
        `/finance help`
    );
  }
  return msg.reply(
    "⚠️ Perintah tidak dikenali. Gunakan /finance help untuk daftar perintah."
  );
}

module.exports = { handleFinanceCommand };
