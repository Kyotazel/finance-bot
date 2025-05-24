const { handleFinanceCommand } = require("./handlers/financeHandler");
const { handleTodoCommand } = require("./handlers/todoHandler");
const {
  addTask,
  getTasks,
  updateTask,
  removeTask,
  startTasker,
  runPendingTasks,
} = require("./handlers/taskerHandler");

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Helper: log QR and ready events
function setupClientEvents(client) {
  client.on("qr", (qr) => {
    console.log("QR RECEIVED, scan please:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp client is ready!");
  });
}

// Message handler
async function handleMessage(msg) {
  const text = msg.body?.trim();
  if (!text) return;
  if (text.startsWith("/finance")) return handleFinanceCommand(msg, text);
  if (text.startsWith("/todo")) return handleTodoCommand(msg, text);
  if (text.startsWith("/task")) return handleTaskCommand(msg, text);
  if (text.startsWith("/")) {
    return msg.reply(
      "⚠️ Perintah tidak dikenali. Gunakan /finance, /todo, atau /task."
    );
  }
}

/**
 * Handle /task commands
 */
async function handleTaskCommand(msg, text) {
  const commandText = text.slice("/task".length).trim();
  if (commandText.startsWith("add ")) {
    // Format: /task add <YYYY-MM-DD> <HH:MM> <title> | <description>
    const sisa = commandText.slice(4).trim();
    const [date, time, ...rest] = sisa.split(" ");
    const [title, description] = rest
      .join(" ")
      .split("|")
      .map((s) => s.trim());
    if (!date || !time || !title || !description) {
      return msg.reply(
        "Format: /task add <YYYY-MM-DD> <HH:MM> <title> | <description>"
      );
    }
    addTask({ date, time, title, description, chatId: msg.from });
    return msg.reply(`✅ Task berhasil ditambahkan untuk ${date} ${time}.`);
  }
  if (commandText.startsWith("list")) {
    const tasks = getTasks(msg.from);
    if (!tasks.length) return msg.reply("Tidak ada task.");
    let response = "🗂️ *Task Anda:*\n";
    for (const t of tasks) {
      response += `#${t.id} [${t.status}] ${t.date} ${t.time} - ${t.title}\n${t.description}\n`;
    }
    return msg.reply(response);
  }
  if (commandText.startsWith("done ")) {
    const id = parseInt(commandText.slice(5).trim(), 10);
    if (!id) return msg.reply("Format: /task done <id>");
    const ok = updateTask(id, msg.from, { status: "done" });
    if (!ok) return msg.reply("Task tidak ditemukan.");
    return msg.reply(`✅ Task #${id} ditandai selesai.`);
  }
  if (commandText.startsWith("delete ")) {
    const id = parseInt(commandText.slice(7).trim(), 10);
    if (!id) return msg.reply("Format: /task delete <id>");
    const ok = removeTask(id, msg.from);
    if (!ok) return msg.reply("Task tidak ditemukan.");
    return msg.reply(`🗑️ Task #${id} dihapus.`);
  }
  if (commandText.startsWith("edit ")) {
    // Format: /task edit <id> <title> | <description>
    const [idStr, ...rest] = commandText.slice(5).trim().split(" ");
    const id = parseInt(idStr, 10);
    const [title, description] = rest
      .join(" ")
      .split("|")
      .map((s) => s.trim());
    if (!id || !title || !description)
      return msg.reply("Format: /task edit <id> <title> | <description>");
    const ok = updateTask(id, msg.from, { title, description });
    if (!ok) return msg.reply("Task tidak ditemukan.");
    return msg.reply(`✏️ Task #${id} diupdate.`);
  }
  if (commandText === "help") {
    return msg.reply(
      `📝 *Perintah Tasker:*\n` +
        `/task add <YYYY-MM-DD> <HH:MM> <title> | <description>\n` +
        `/task list\n` +
        `/task done <id>\n` +
        `/task delete <id>\n` +
        `/task edit <id> <title> | <description>\n` +
        `/task help`
    );
  }
  return msg.reply("Perintah task tidak dikenali. Gunakan /task help");
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId: "oktaclient" }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

setupClientEvents(client);
client.on("message", handleMessage);
startTasker(client); // <-- Start tasker scheduler here
client.initialize();
