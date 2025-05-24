// server.js
/**
 * Simple HTTP server for todos and transactions API (no Express)
 */
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

const TODOS_PATH = path.join(__dirname, "data/todos.json");
const TX_PATH = path.join(__dirname, "data/transactions.json");
const port = process.env.PORT || 3000;

function readJson(file) {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // TODOS API
  if (pathname.startsWith("/api/todos")) {
    let todos = readJson(TODOS_PATH);
    if (req.method === "GET" && pathname === "/api/todos") {
      let filtered = todos;
      if (query.category)
        filtered = filtered.filter((t) => t.category === query.category);
      if (typeof query.is_done !== "undefined")
        filtered = filtered.filter(
          (t) => t.is_done === (query.is_done === "1")
        );
      if (query.date)
        filtered = filtered.filter(
          (t) => t.created_at && t.created_at.startsWith(query.date)
        );
      return sendJson(res, filtered);
    }
    if (req.method === "POST" && pathname === "/api/todos") {
      const { title, category, parent_id } = await parseBody(req);
      if (!title || !category)
        return sendJson(res, { error: "title dan category wajib diisi" }, 400);
      const nextId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
      const todo = {
        id: nextId,
        title,
        category,
        parent_id: parent_id || null,
        is_done: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      todos.push(todo);
      writeJson(TODOS_PATH, todos);
      return sendJson(res, todo, 201);
    }
    const idMatch = pathname.match(/^\/api\/todos\/(\d+)$/);
    if (idMatch) {
      const id = parseInt(idMatch[1], 10);
      if (req.method === "PUT") {
        const { title, category, parent_id } = await parseBody(req);
        const idx = todos.findIndex((t) => t.id === id);
        if (idx === -1)
          return sendJson(res, { error: "Todo tidak ditemukan" }, 404);
        if (title) todos[idx].title = title;
        if (category) todos[idx].category = category;
        if (typeof parent_id !== "undefined") todos[idx].parent_id = parent_id;
        todos[idx].updated_at = new Date().toISOString();
        writeJson(TODOS_PATH, todos);
        return sendJson(res, todos[idx]);
      }
      if (req.method === "PATCH" && pathname.endsWith("/check")) {
        const { is_done } = await parseBody(req);
        const idx = todos.findIndex((t) => t.id === id);
        if (idx === -1)
          return sendJson(res, { error: "Todo tidak ditemukan" }, 404);
        todos[idx].is_done = !!is_done;
        todos[idx].updated_at = new Date().toISOString();
        writeJson(TODOS_PATH, todos);
        return sendJson(res, todos[idx]);
      }
      if (req.method === "DELETE") {
        const before = todos.length;
        todos = todos.filter((t) => t.id !== id && t.parent_id !== id);
        if (todos.length === before)
          return sendJson(res, { error: "Todo tidak ditemukan" }, 404);
        writeJson(TODOS_PATH, todos);
        return sendJson(res, { success: true });
      }
    }
    res.writeHead(404);
    res.end();
    return;
  }

  // TRANSACTIONS API
  if (pathname.startsWith("/api/transactions")) {
    let txs = readJson(TX_PATH);
    if (req.method === "GET" && pathname === "/api/transactions") {
      txs.sort((a, b) => new Date(b.date) - new Date(a.date));
      return sendJson(res, txs);
    }
    if (req.method === "POST" && pathname === "/api/transactions") {
      const { type, amount, category, description } = await parseBody(req);
      if (!type || !amount)
        return sendJson(res, { error: "type dan amount wajib diisi" }, 400);
      if (!["pemasukan", "pengeluaran"].includes(type))
        return sendJson(
          res,
          { error: "type harus pemasukan atau pengeluaran" },
          400
        );
      const nextId = txs.length ? Math.max(...txs.map((t) => t.id)) + 1 : 1;
      const tx = {
        id: nextId,
        type,
        amount,
        category: category || null,
        description: description || null,
        date: new Date().toISOString(),
      };
      txs.push(tx);
      writeJson(TX_PATH, txs);
      return sendJson(res, {
        message: "Transaksi berhasil ditambahkan",
        id: tx.id,
      });
    }
    if (req.method === "GET" && pathname === "/api/transactions/saldo") {
      const totalPemasukan = txs
        .filter((t) => t.type === "pemasukan")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalPengeluaran = txs
        .filter((t) => t.type === "pengeluaran")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const saldo = totalPemasukan - totalPengeluaran;
      return sendJson(res, { saldo, totalPemasukan, totalPengeluaran });
    }
    res.writeHead(404);
    res.end();
    return;
  }

  // Not found
  res.writeHead(404);
  res.end();
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = { server, port };
