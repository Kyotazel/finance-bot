// Unit tests for todoHandler.js
const { handleTodoCommand } = require("../whatsapp/handlers/todoHandler");
const fs = require("fs");
const path = require("path");
const TODOS_PATH = path.join(__dirname, "../data/todos.json");

describe("Todo Handler", () => {
  beforeEach(() => {
    // Reset todos.json before each test
    fs.writeFileSync(TODOS_PATH, "[]", "utf-8");
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

  test("should add a todo", async () => {
    const msg = mockMsg();
    await handleTodoCommand(msg, "/todo tambah Test | testcat");
    expect(msg.replies[0]).toMatch(/ditambahkan/);
    const todos = JSON.parse(fs.readFileSync(TODOS_PATH, "utf-8"));
    expect(todos.length).toBe(1);
    expect(todos[0].title).toBe("Test");
  });

  test("should list todos", async () => {
    const msg = mockMsg();
    await handleTodoCommand(msg, "/todo tambah Test | testcat");
    const msg2 = mockMsg();
    await handleTodoCommand(msg2, "/todo list");
    expect(msg2.replies[0]).toMatch(/Todo:/);
  });

  test("should check and uncheck a todo", async () => {
    const msg = mockMsg();
    await handleTodoCommand(msg, "/todo tambah Test | testcat");
    let todos = JSON.parse(fs.readFileSync(TODOS_PATH, "utf-8"));
    const id = todos[0].id;
    const msg2 = mockMsg();
    await handleTodoCommand(msg2, `/todo check ${id}`);
    todos = JSON.parse(fs.readFileSync(TODOS_PATH, "utf-8"));
    expect(todos[0].is_done).toBe(true);
    const msg3 = mockMsg();
    await handleTodoCommand(msg3, `/todo uncheck ${id}`);
    todos = JSON.parse(fs.readFileSync(TODOS_PATH, "utf-8"));
    expect(todos[0].is_done).toBe(false);
  });

  test("should edit a todo", async () => {
    const msg = mockMsg();
    await handleTodoCommand(msg, "/todo tambah Test | testcat");
    let todos = JSON.parse(fs.readFileSync(TODOS_PATH, "utf-8"));
    const id = todos[0].id;
    const msg2 = mockMsg();
    await handleTodoCommand(msg2, `/todo edit ${id} Baru`);
    todos = JSON.parse(fs.readFileSync(TODOS_PATH, "utf-8"));
    expect(todos[0].title).toBe("Baru");
  });

  test("should delete a todo", async () => {
    const msg = mockMsg();
    await handleTodoCommand(msg, "/todo tambah Test | testcat");
    let todos = JSON.parse(fs.readFileSync(TODOS_PATH, "utf-8"));
    const id = todos[0].id;
    const msg2 = mockMsg();
    await handleTodoCommand(msg2, `/todo hapus ${id}`);
    todos = JSON.parse(fs.readFileSync(TODOS_PATH, "utf-8"));
    expect(todos.length).toBe(0);
  });
});
