
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask
} = require("../controllers/task.controller");

// All task APIs require authentication
router.use(protect);

// My assigned tasks
router.get("/my", getMyTasks);

// Board tasks
router.post(
  "/board/:boardId/column/:columnId",
  createTask
);

router.get(
  "/board/:boardId",
  getTasks
);

// Move task
router.patch("/:id/move", moveTask);

// Single task operations
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
