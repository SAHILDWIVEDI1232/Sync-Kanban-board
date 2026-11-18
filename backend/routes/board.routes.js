
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard
} = require("../controllers/board.controller");

// All board routes require login
router.use(protect);

// Tenant ke boards
router.post("/tenant/:tenantId", createBoard);
router.get("/tenant/:tenantId", getBoards);

// Single board operations
router.get("/:id", getBoardById);
router.put("/:id", updateBoard);
router.delete("/:id", deleteBoard);

module.exports = router;
