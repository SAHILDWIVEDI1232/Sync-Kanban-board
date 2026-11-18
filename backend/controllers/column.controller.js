
const mongoose = require("mongoose");

const Column = require("../models/Column");
const Board = require("../models/Board");
const Tenant = require("../models/Tenant");
const Membership = require("../models/Membership");
const Task = require("../models/Task");

const {
  createActivityLog
} = require("./activityLog.controller");

// Validate MongoDB ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Check tenant access
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

// Check board access
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

// Check column access
const getColumnAccess = async (userId, columnId) => {
  const column = await Column.findById(columnId);

  if (!column) {
    return { error: "Column not found", status: 404 };
  }

  const board = await Board.findOne({
    _id: column.boardId,
    tenantId: column.tenantId
  });

  if (!board) {
    return {
      error: "Associated board not found",
      status: 404
    };
  }

  const access = await getTenantAccess(userId, column.tenantId);

  if (access.error) {
    return access;
  }

  return {
    column,
    board,
    tenant: access.tenant,
    membership: access.membership
  };
};

// Only Org Admin and Tenant Admin can manage columns
const canManageColumns = (membership) => {
  return ["ORG_ADMIN", "TENANT_ADMIN"].includes(membership.role);
};

// Emit tenant-scoped column event
const emitColumnEvent = (req, tenantId, eventName, column) => {
  try {
    const io = req.app.get("io");

    if (!io) {
      console.error("Socket.IO instance not found");
      return;
    }

    io.to(`tenant:${tenantId}`).emit(eventName, {
      success: true,
      column
    });
  } catch (error) {
    console.error("Column Socket Event Error:", error.message);
  }
};

// 1. Create Column
const createColumn = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, position } = req.body;

    if (!isValidId(boardId)) {
      return res.status(400).json({
        message: "Invalid board ID"
      });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Column title is required"
      });
    }

    const access = await getBoardAccess(req.user.userId, boardId);

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    if (!canManageColumns(access.membership)) {
      return res.status(403).json({
        message: "Only Organization Admin or Tenant Admin can create columns"
      });
    }

    if (access.board.isArchived) {
      return res.status(409).json({
        message: "Cannot add columns to an archived board"
      });
    }

    let columnPosition = position;

    if (columnPosition === undefined) {
      const lastColumn = await Column.findOne({
        boardId: access.board._id,
        tenantId: access.tenant._id
      }).sort({ position: -1 });

      columnPosition = lastColumn ? lastColumn.position + 1 : 0;
    }

    if (!Number.isInteger(columnPosition) || columnPosition < 0) {
      return res.status(400).json({
        message: "Position must be a non-negative integer"
      });
    }

    const column = await Column.create({
      title: title.trim(),
      boardId: access.board._id,
      tenantId: access.tenant._id,
      position: columnPosition,
      createdBy: req.user.userId
    });

    await createActivityLog({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId: req.user.userId,
      action: "COLUMN_CREATED",
      entityType: "COLUMN",
      entityId: column._id,
      changes: {
        title: column.title,
        position: column.position,
        boardId: column.boardId
      }
    });

    emitColumnEvent(
      req,
      access.tenant._id,
      "column-created",
      column
    );

    return res.status(201).json({
      message: "Column created successfully",
      column
    });
  } catch (error) {
    console.error("Create Column Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 2. Get All Columns of a Board
const getColumns = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!isValidId(boardId)) {
      return res.status(400).json({
        message: "Invalid board ID"
      });
    }

    const access = await getBoardAccess(req.user.userId, boardId);

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    const columns = await Column.find({
      boardId: access.board._id,
      tenantId: access.tenant._id
    }).sort({
      position: 1,
      createdAt: 1
    });

    return res.status(200).json({
      count: columns.length,
      columns
    });
  } catch (error) {
    console.error("Get Columns Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 3. Get Single Column
const getColumnById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid column ID"
      });
    }

    const access = await getColumnAccess(req.user.userId, id);

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    return res.status(200).json({
      column: access.column
    });
  } catch (error) {
    console.error("Get Column Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 4. Update Column
const updateColumn = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, position } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid column ID"
      });
    }

    const access = await getColumnAccess(req.user.userId, id);

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    if (!canManageColumns(access.membership)) {
      return res.status(403).json({
        message: "Only Organization Admin or Tenant Admin can update columns"
      });
    }

    if (access.board.isArchived) {
      return res.status(409).json({
        message: "Cannot update columns of an archived board"
      });
    }

    const oldValues = {
      title: access.column.title,
      position: access.column.position
    };

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Column title cannot be empty"
        });
      }

      access.column.title = title.trim();
    }

    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        return res.status(400).json({
          message: "Position must be a non-negative integer"
        });
      }

      access.column.position = position;
    }

    await access.column.save();

    await createActivityLog({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId: req.user.userId,
      action: "COLUMN_UPDATED",
      entityType: "COLUMN",
      entityId: access.column._id,
      changes: {
        before: oldValues,
        after: {
          title: access.column.title,
          position: access.column.position
        }
      }
    });

    emitColumnEvent(
      req,
      access.tenant._id,
      "column-updated",
      access.column
    );

    return res.status(200).json({
      message: "Column updated successfully",
      column: access.column
    });
  } catch (error) {
    console.error("Update Column Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

// 5. Delete Column
const deleteColumn = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid column ID"
      });
    }

    const access = await getColumnAccess(req.user.userId, id);

    if (access.error) {
      return res.status(access.status).json({
        message: access.error
      });
    }

    if (!canManageColumns(access.membership)) {
      return res.status(403).json({
        message: "Only Organization Admin or Tenant Admin can delete columns"
      });
    }

    const taskExists = await Task.exists({
      columnId: access.column._id,
      boardId: access.board._id,
      tenantId: access.tenant._id
    });

    if (taskExists) {
      return res.status(409).json({
        message: "Move or delete tasks before deleting this column"
      });
    }

    const deletedColumnId = access.column._id;

    await Column.findByIdAndDelete(deletedColumnId);

    await createActivityLog({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId: req.user.userId,
      action: "COLUMN_DELETED",
      entityType: "COLUMN",
      entityId: deletedColumnId,
      changes: {
        title: access.column.title,
        boardId: access.board._id
      }
    });

    emitColumnEvent(
      req,
      access.tenant._id,
      "column-deleted",
      { _id: deletedColumnId }
    );

    return res.status(200).json({
      message: "Column deleted successfully"
    });
  } catch (error) {
    console.error("Delete Column Error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  createColumn,
  getColumns,
  getColumnById,
  updateColumn,
  deleteColumn
};
