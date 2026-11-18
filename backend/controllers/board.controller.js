
const mongoose = require("mongoose");

const Board = require("../models/Board");
const Tenant = require("../models/Tenant");
const Membership = require("../models/Membership");
const Column = require("../models/Column");
const Task = require("../models/Task");

const {
  createActivityLog
} = require("./activityLog.controller");

// MongoDB ID validation
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Check whether user can access a tenant
const getTenantAccess = async (userId, tenantId) => {
  const tenant = await Tenant.findById(tenantId);

  if (!tenant) {
    return { error: "Tenant not found", status: 404 };
  }

  const orgAdmin = await Membership.findOne({
    userId,
    organizationId: tenant.organizationId,
    tenantId: null,
    role: "ORG_ADMIN",
    status: "ACTIVE"
  });

  if (orgAdmin) {
    return { tenant, membership: orgAdmin };
  }

  const membership = await Membership.findOne({
    userId,
    organizationId: tenant.organizationId,
    tenantId: tenant._id,
    role: { $in: ["TENANT_ADMIN", "MEMBER"] },
    status: "ACTIVE"
  });

  if (!membership) {
    return {
      error: "You do not have access to this tenant",
      status: 403
    };
  }

  return { tenant, membership };
};

// Check board access using its tenant
const getBoardAccess = async (userId, boardId) => {
  const board = await Board.findById(boardId);

  if (!board) {
    return { error: "Board not found", status: 404 };
  }

  const access = await getTenantAccess(userId, board.tenantId);

  if (access.error) {
    return access;
  }

  return {
    board,
    tenant: access.tenant,
    membership: access.membership
  };
};

// Only Org Admin and Tenant Admin can modify boards
const canManageBoard = (membership) => {
  return ["ORG_ADMIN", "TENANT_ADMIN"].includes(membership.role);
};

// Create a tenant-scoped real-time event
const emitBoardEvent = (req, tenantId, eventName, board) => {
  try {
    const io = req.app.get("io");

    if (!io) {
      console.error("Socket.IO instance not found");
      return;
    }

    io.to(`tenant:${tenantId}`).emit(eventName, {
      success: true,
      board
    });
  } catch (error) {
    console.error("Board Socket Event Error:", error.message);
  }
};

// 1. Create Board
const createBoard = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { title, description } = req.body;

    if (!isValidId(tenantId)) {
      return res.status(400).json({
        message: "Invalid tenant ID"
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Board title is required"
      });
    }

    const access = await getTenantAccess(
      req.user.userId,
      tenantId
    );

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    if (!canManageBoard(access.membership)) {
      return res.status(403).json({
        message: "Only Organization Admin or Tenant Admin can create boards"
      });
    }

    const board = await Board.create({
      title: title.trim(),
      description: description?.trim() || "",
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      createdBy: req.user.userId
    });

    await createActivityLog({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId: req.user.userId,
      action: "BOARD_CREATED",
      entityType: "BOARD",
      entityId: board._id,
      changes: {
        title: board.title
      }
    });

    emitBoardEvent(
      req,
      access.tenant._id,
      "board-created",
      board
    );

    return res.status(201).json({
      message: "Board created successfully",
      board
    });
  } catch (error) {
    console.error("Create Board Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 2. Get All Boards of a Tenant
const getBoards = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!isValidId(tenantId)) {
      return res.status(400).json({
        message: "Invalid tenant ID"
      });
    }

    const access = await getTenantAccess(
      req.user.userId,
      tenantId
    );

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    const boards = await Board.find({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: boards.length,
      boards
    });
  } catch (error) {
    console.error("Get Boards Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 3. Get Single Board
const getBoardById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid board ID"
      });
    }

    const access = await getBoardAccess(
      req.user.userId,
      id
    );

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    return res.status(200).json({
      board: access.board
    });
  } catch (error) {
    console.error("Get Board Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 4. Update Board
const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isArchived } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid board ID"
      });
    }

    const access = await getBoardAccess(
      req.user.userId,
      id
    );

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    if (!canManageBoard(access.membership)) {
      return res.status(403).json({
        message: "Only Organization Admin or Tenant Admin can update boards"
      });
    }

    const oldValues = {
      title: access.board.title,
      description: access.board.description,
      isArchived: access.board.isArchived
    };

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Board title cannot be empty"
        });
      }

      access.board.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          message: "Description must be a string"
        });
      }

      access.board.description = description.trim();
    }

    if (isArchived !== undefined) {
      if (typeof isArchived !== "boolean") {
        return res.status(400).json({
          message: "isArchived must be true or false"
        });
      }

      access.board.isArchived = isArchived;
    }

    await access.board.save();

    await createActivityLog({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId: req.user.userId,
      action: "BOARD_UPDATED",
      entityType: "BOARD",
      entityId: access.board._id,
      changes: {
        before: oldValues,
        after: {
          title: access.board.title,
          description: access.board.description,
          isArchived: access.board.isArchived
        }
      }
    });

    emitBoardEvent(
      req,
      access.tenant._id,
      "board-updated",
      access.board
    );

    return res.status(200).json({
      message: "Board updated successfully",
      board: access.board
    });
  } catch (error) {
    console.error("Update Board Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 5. Delete Board
const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid board ID"
      });
    }

    const access = await getBoardAccess(
      req.user.userId,
      id
    );

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    if (!canManageBoard(access.membership)) {
      return res.status(403).json({
        message: "Only Organization Admin or Tenant Admin can delete boards"
      });
    }

    const columnExists = await Column.exists({
      boardId: access.board._id,
      tenantId: access.board.tenantId
    });

    const taskExists = await Task.exists({
      boardId: access.board._id,
      tenantId: access.board.tenantId
    });

    if (columnExists || taskExists) {
      return res.status(409).json({
        message: "Delete the board's columns and tasks before deleting the board"
      });
    }

    const deletedBoardId = access.board._id;

    await Board.findByIdAndDelete(deletedBoardId);

    await createActivityLog({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId: req.user.userId,
      action: "BOARD_DELETED",
      entityType: "BOARD",
      entityId: deletedBoardId,
      changes: {
        title: access.board.title
      }
    });

    emitBoardEvent(
      req,
      access.tenant._id,
      "board-deleted",
      { _id: deletedBoardId }
    );

    return res.status(200).json({
      message: "Board deleted successfully"
    });
  } catch (error) {
    console.error("Delete Board Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard
};
