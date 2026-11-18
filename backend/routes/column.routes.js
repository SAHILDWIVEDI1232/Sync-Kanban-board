
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  createColumn,
  getColumns,
  getColumnById,
  updateColumn,
  deleteColumn
} = require("../controllers/column.controller");

// All column APIs require authentication
router.use(protect);

// Board ke columns
router.post("/board/:boardId", createColumn);
router.get("/board/:boardId", getColumns);

// Single column operations
router.get("/:id", getColumnById);
router.put("/:id", updateColumn);
router.delete("/:id", deleteColumn);

module.exports = router;
