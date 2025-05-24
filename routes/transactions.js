/**
 * Express route for finance transactions
 */

const fs = require("fs");
const path = require("path");
const TX_PATH = path.join(__dirname, "../data/transactions.json");

function readTx() {
  if (!fs.existsSync(TX_PATH)) return [];
  const raw = fs.readFileSync(TX_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeTx(txs) {
  fs.writeFileSync(TX_PATH, JSON.stringify(txs, null, 2), "utf-8");
}

let nextId = (() => {
  const txs = readTx();
  return txs.length ? Math.max(...txs.map((t) => t.id)) + 1 : 1;
})();

const express = require("express");
const router = express.Router();

// Tambah transaksi (POST)
router.post("/", (req, res) => {
  const { type, amount, category, description } = req.body;
  if (!type || !amount) {
    return res.status(400).json({ error: "type dan amount wajib diisi" });
  }
  if (!["pemasukan", "pengeluaran"].includes(type)) {
    return res
      .status(400)
      .json({ error: "type harus pemasukan atau pengeluaran" });
  }
  let txs = readTx();
  const tx = {
    id: nextId++,
    type,
    amount,
    category: category || null,
    description: description || null,
    date: new Date().toISOString(),
  };
  txs.push(tx);
  writeTx(txs);
  res.json({ message: "Transaksi berhasil ditambahkan", id: tx.id });
});

// Get semua transaksi (GET)
router.get("/", (req, res) => {
  let txs = readTx();
  txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(txs);
});

// Get saldo (GET)
router.get("/saldo", (req, res) => {
  const txs = readTx();
  const totalPemasukan = txs
    .filter((t) => t.type === "pemasukan")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalPengeluaran = txs
    .filter((t) => t.type === "pengeluaran")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const saldo = totalPemasukan - totalPengeluaran;
  res.json({ saldo, totalPemasukan, totalPengeluaran });
});

module.exports = router;
