/**
 * Handle todo-related WhatsApp commands
 * @param {import('whatsapp-web.js').Message} msg
 * @param {string} text
 */
const fs = require("fs");
const path = require("path");
const TODOS_PATH = path.join(__dirname, "../../data/todos.json");

function readTodos() {
  if (!fs.existsSync(TODOS_PATH)) return [];
  const raw = fs.readFileSync(TODOS_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeTodos(todos) {
  fs.writeFileSync(TODOS_PATH, JSON.stringify(todos, null, 2), "utf-8");
}

let nextId = (() => {
  const todos = readTodos();
  return todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
})();

async function handleTodoCommand(msg, text) {
  const commandText = text.slice("/todo".length).trim();
  if (commandText.startsWith("list")) {
    const args = commandText.slice(4).trim();
    let todos = readTodos();
    let filterInfo = [];
    if (args) {
      let params = {};
      args.split(/\s+/).forEach((arg) => {
        if (arg.startsWith("kategori=")) {
          params.category = arg.split("=")[1];
          filterInfo.push(`Kategori: ${params.category}`);
        } else if (arg === "check") {
          params.is_done = 1;
          filterInfo.push("Sudah Dicheck");
        } else if (arg === "uncheck") {
          params.is_done = 0;
          filterInfo.push("Belum Dicheck");
        } else if (arg.startsWith("tanggal=")) {
          params.date = arg.split("=")[1];
          filterInfo.push(`Tanggal: ${params.date}`);
        }
      });
      if (params.category)
        todos = todos.filter((t) => t.category === params.category);
      if (typeof params.is_done !== "undefined")
        todos = todos.filter((t) => t.is_done === !!params.is_done);
      if (params.date)
        todos = todos.filter(
          (t) => t.created_at && t.created_at.startsWith(params.date)
        );
    }
    if (todos.length === 0) {
      return msg.reply(
        `📋 Tidak ada todo${
          filterInfo.length
            ? ` untuk filter: ${filterInfo.join(", ")}`
            : " yang ditemukan."
        }`
      );
    }
    let response = `📋 *Todo${
      filterInfo.length ? " (" + filterInfo.join(", ") + ")" : ""
    }:*\n`;
    todos.forEach((todo) => {
      response += `- [${todo.is_done ? "x" : " "}] #${todo.id} ${todo.title} (${
        todo.category
      })\n`;
    });
    return msg.reply(response);
  }
  if (commandText.startsWith("check ")) {
    const id = parseInt(commandText.slice(6).trim(), 10);
    let todos = readTodos();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return msg.reply(`❌ Todo #${id} tidak ditemukan.`);
    todos[idx].is_done = true;
    todos[idx].updated_at = new Date().toISOString();
    writeTodos(todos);
    return msg.reply(`✅ Todo #${id} sudah dicheck.`);
  }
  if (commandText.startsWith("uncheck ")) {
    const id = parseInt(commandText.slice(8).trim(), 10);
    let todos = readTodos();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return msg.reply(`❌ Todo #${id} tidak ditemukan.`);
    todos[idx].is_done = false;
    todos[idx].updated_at = new Date().toISOString();
    writeTodos(todos);
    return msg.reply(`☑️ Todo #${id} sudah di-uncheck.`);
  }
  if (commandText.startsWith("hapus ")) {
    const id = parseInt(commandText.slice(6).trim(), 10);
    let todos = readTodos();
    const before = todos.length;
    todos = todos.filter((t) => t.id !== id && t.parent_id !== id);
    if (todos.length === before)
      return msg.reply(`❌ Todo #${id} tidak ditemukan.`);
    writeTodos(todos);
    return msg.reply(`🗑️ Todo #${id} sudah dihapus.`);
  }
  if (commandText.startsWith("edit ")) {
    const [idStr, ...titleParts] = commandText.slice(5).trim().split(" ");
    const id = parseInt(idStr, 10);
    const title = titleParts.join(" ");
    if (!id || !title) return msg.reply("Format: /todo edit <id> <judul baru>");
    let todos = readTodos();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return msg.reply(`❌ Todo #${id} tidak ditemukan.`);
    todos[idx].title = title;
    todos[idx].updated_at = new Date().toISOString();
    writeTodos(todos);
    return msg.reply(`✏️ Todo #${id} sudah diedit.`);
  }
  if (commandText.startsWith("tambah ")) {
    const sisa = commandText.slice(7).trim();
    const [title, category] = sisa.split("|").map((s) => s.trim());
    if (!title || !category)
      return msg.reply("Format: /todo tambah <judul> | <kategori>");
    let todos = readTodos();
    const todo = {
      id: nextId++,
      title,
      category,
      is_done: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    todos.push(todo);
    writeTodos(todos);
    return msg.reply(
      `➕ Todo '${title}' ditambahkan ke kategori '${category}'.`
    );
  }
  if (commandText === "help") {
    return msg.reply(
      `📝 *Perintah Todo:*\n` +
        `/todo list — semua todo\n` +
        `/todo list kategori=<nama> — filter kategori\n` +
        `/todo list check — hanya yang sudah dicheck\n` +
        `/todo list uncheck — hanya yang belum dicheck\n` +
        `/todo list tanggal=<yyyy-mm-dd> — filter per tanggal\n` +
        `/todo list [filter kombinasi] — contoh: /todo list kategori=kerja check tanggal=2025-05-18\n` +
        `/todo tambah <judul> | <kategori>\n` +
        `/todo edit <id> <judul baru>\n` +
        `/todo check <id>\n` +
        `/todo uncheck <id>\n` +
        `/todo hapus <id>\n` +
        `/todo help`
    );
  }
  return msg.reply("Perintah todo tidak dikenali. Gunakan /todo help");
}

module.exports = { handleTodoCommand };
