const { addTask, startTasker } = require("../whatsapp/handlers/taskerHandler");
const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");
const TASKS_PATH = path.join(__dirname, "../data/task.json");

describe("Tasker Timezone Handling", () => {
  beforeEach(() => {
    // Clean up tasks file before each test
    fs.writeFileSync(TASKS_PATH, "[]", "utf-8");
  });

  it("should trigger a task at the correct local time (Asia/Jakarta)", (done) => {
    // Set a task for 1 minute ago in Asia/Jakarta timezone
    const nowJakarta = DateTime.now()
      .setZone("Asia/Jakarta")
      .minus({ minutes: 1 });
    const task = addTask({
      date: nowJakarta.toFormat("yyyy-MM-dd"),
      time: nowJakarta.toFormat("HH:mm"),
      title: "Test Timezone",
      description: "Test Desc",
      chatId: "test@c.us",
      timezone: "Asia/Jakarta",
    });
    let messageSent = false;
    const mockClient = {
      sendMessage: (chatId, msg) => {
        if (chatId === "test@c.us" && msg.includes("Test Timezone")) {
          messageSent = true;
        }
        return Promise.resolve();
      },
    };
    // Run the tasker once (simulate interval)
    require("../whatsapp/handlers/taskerHandler").startTasker({
      sendMessage: mockClient.sendMessage,
    });
    setTimeout(() => {
      expect(messageSent).toBe(true);
      done();
    }, 2000);
  });
});
