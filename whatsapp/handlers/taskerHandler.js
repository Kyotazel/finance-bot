const fs = require("fs");
const path = require("path");
const TASKS_PATH = path.join(__dirname, "../../data/task.json");

/**
 * Add a new task
 * @param {Object} task - { date: string, time: string, title: string, description: string, chatId: string }
 * @description
 *   - date: Format 'YYYY-MM-DD'.
 *   - time: Format 24 jam 'HH:MM', misal '08:00', '18:30'.
 *   - title: Judul task.
 *   - description: Isi task.
 *   - chatId: WhatsApp chatId tujuan.
 */
function addTask(task) {
  let tasks = [];
  if (fs.existsSync(TASKS_PATH)) {
    try {
      tasks = JSON.parse(fs.readFileSync(TASKS_PATH, "utf-8"));
    } catch {
      tasks = [];
    }
  }
  task.id = tasks.length ? Math.max(...tasks.map((t) => t.id || 0)) + 1 : 1;
  task.status = "pending";
  tasks.push(task);
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2), "utf-8");
  return task;
}

function getTasks(chatId) {
  if (!fs.existsSync(TASKS_PATH)) return [];
  try {
    const all = JSON.parse(fs.readFileSync(TASKS_PATH, "utf-8"));
    return chatId ? all.filter((t) => t.chatId === chatId) : all;
  } catch {
    return [];
  }
}

function updateTask(id, chatId, update) {
  let tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id && t.chatId === chatId);
  if (idx === -1) return false;
  tasks[idx] = { ...tasks[idx], ...update };
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2), "utf-8");
  return true;
}

function removeTask(id, chatId) {
  let tasks = getTasks();
  const before = tasks.length;
  tasks = tasks.filter((t) => !(t.id === id && t.chatId === chatId));
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2), "utf-8");
  return tasks.length < before;
}

function startTasker(client) {
  setInterval(async () => {
    let tasks = getTasks();
    let changed = false;
    for (const task of tasks) {
      // Hanya kirim task yang status pending dan tanggal+jam sudah lewat atau sama dengan sekarang, dan belum pernah dikirim (_lastSent)
      const now = new Date();
      const taskDateTime = new Date(`${task.date}T${task.time}:00`);
      if (task.status === "pending" && !task._lastSent && now >= taskDateTime) {
        try {
          await client.sendMessage(
            task.chatId,
            `📝 *Task Reminder: ${task.title}*\n${task.description}\nTanggal: ${task.date} ${task.time}`
          );
          task._lastSent = `${task.date}${task.time}`;
          task.status = "done";
          changed = true;
        } catch {}
      }
    }
    if (changed)
      fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2), "utf-8");
  }, 60 * 1000);
}

function runPendingTasks(client) {
  let tasks = getTasks();
  let changed = false;
  for (const task of tasks) {
    if (task.status === "pending") {
      client.sendMessage(
        task.chatId,
        `📝 *Task Manual: ${task.title}*\n${task.description}\nTanggal: ${task.date} ${task.time}`
      );
      task.status = "done";
      changed = true;
    }
  }
  if (changed)
    fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2), "utf-8");
}

module.exports = {
  addTask,
  getTasks,
  updateTask,
  removeTask,
  startTasker,
  runPendingTasks,
};
