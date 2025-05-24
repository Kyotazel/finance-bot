// Unit tests for financeHandler.js
const { handleFinanceCommand } = require("../whatsapp/handlers/financeHandler");
const fs = require("fs");
const path = require("path");
const TX_PATH = path.join(__dirname, "../data/transactions.json");

describe("Finance Handler", () => {
  beforeEach(() => {
    // Reset transactions.json before each test
    fs.writeFileSync(TX_PATH, "[]", "utf-8");
  });

  function mockMsg() {
    return {
      replies: [],
      reply(msg) {
        this.replies.push(msg);
        return Promise.resolve();
      },
    };
  }

  test("should add a pemasukan transaction", async () => {
    const msg = mockMsg();
    await handleFinanceCommand(msg, "/finance tambah pemasukan 1000 test");
    expect(msg.replies[0]).toMatch(/berhasil dicatat/);
    const txs = JSON.parse(fs.readFileSync(TX_PATH, "utf-8"));
    expect(txs.length).toBe(1);
    expect(txs[0].type).toBe("pemasukan");
  });

  test("should add a pengeluaran transaction", async () => {
    const msg = mockMsg();
    await handleFinanceCommand(msg, "/finance tambah pengeluaran 500 test");
    expect(msg.replies[0]).toMatch(/berhasil dicatat/);
    const txs = JSON.parse(fs.readFileSync(TX_PATH, "utf-8"));
    expect(txs.length).toBe(1);
    expect(txs[0].type).toBe("pengeluaran");
  });

  test("should show saldo", async () => {
    const msg = mockMsg();
    await handleFinanceCommand(msg, "/finance tambah pemasukan 1000 test");
    await handleFinanceCommand(msg, "/finance tambah pengeluaran 200 test");
    const msg2 = mockMsg();
    await handleFinanceCommand(msg2, "/finance saldo");
    expect(msg2.replies[0]).toMatch(/Saldo/);
    expect(msg2.replies[0]).toMatch(/Pemasukan/);
    expect(msg2.replies[0]).toMatch(/Pengeluaran/);
  });

  test("should show help", async () => {
    const msg = mockMsg();
    await handleFinanceCommand(msg, "/finance help");
    expect(msg.replies[0]).toMatch(/Daftar Perintah/);
  });

  test("should handle unknown command", async () => {
    const msg = mockMsg();
    await handleFinanceCommand(msg, "/finance unknown");
    expect(msg.replies[0]).toMatch(/tidak dikenali/);
  });
});
