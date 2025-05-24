const fs = require("fs");
const path = require("path");
const TODOS_PATH = path.join(__dirname, "../data/todos.json");

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

/**
 * Express route for todos
 */
const express = require("express");
const router = express.Router();

// GET /api/todos?category=xxx
router.get("/", (req, res) => {
  const { category, is_done, date } = req.query;
  let todos = readTodos();
  if (category) todos = todos.filter((t) => t.category === category);
  if (typeof is_done !== "undefined")
    todos = todos.filter((t) => (t.is_done === is_done) === "1");
  if (date)
    todos = todos.filter((t) => t.created_at && t.created_at.startsWith(date));
  res.json(todos);
});

// POST /api/todos
router.post("/", (req, res) => {
  const { title, category, parent_id } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: "title dan category wajib diisi" });
  }
  let todos = readTodos();
  const todo = {
    id: nextId++,
    title,
    category,
    parent_id: parent_id || null,
    is_done: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  todos.push(todo);
  writeTodos(todos);
  res.status(201).json(todo);
});

// PUT /api/todos/:id
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title, category, parent_id } = req.body;
  let todos = readTodos();
  const idx = todos.findIndex((t) => t.id === parseInt(id, 10));
  if (idx === -1)
    return res.status(404).json({ error: "Todo tidak ditemukan" });
  if (title) todos[idx].title = title;
  if (category) todos[idx].category = category;
  if (typeof parent_id !== "undefined") todos[idx].parent_id = parent_id;
  todos[idx].updated_at = new Date().toISOString();
  writeTodos(todos);
  res.json(todos[idx]);
});

// PATCH /api/todos/:id/check
router.patch("/:id/check", (req, res) => {
  const { id } = req.params;
  const { is_done } = req.body;
  let todos = readTodos();
  const idx = todos.findIndex((t) => t.id === parseInt(id, 10));
  if (idx === -1)
    return res.status(404).json({ error: "Todo tidak ditemukan" });
  todos[idx].is_done = !!is_done;
  todos[idx].updated_at = new Date().toISOString();
  writeTodos(todos);
  res.json(todos[idx]);
});

// DELETE /api/todos/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  let todos = readTodos();
  const before = todos.length;
  todos = todos.filter(
    (t) => t.id !== parseInt(id, 10) && t.parent_id !== parseInt(id, 10)
  );
  if (todos.length === before)
    return res.status(404).json({ error: "Todo tidak ditemukan" });
  writeTodos(todos);
  res.json({ success: true });
});

module.exports = router;
