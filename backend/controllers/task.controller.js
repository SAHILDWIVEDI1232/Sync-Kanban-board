
const mongoose = require("mongoose");

const Task = require("../models/Task");
const Board = require("../models/Board");
const Column = require("../models/Column");
const Tenant = require("../models/Tenant");
const Membership = require("../models/Membership");

const {
  createActivityLog
} = require("./activityLog.controller");

const emitTaskEvent = require("../utils/taskEvents");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const logActivity = async (data) => {
  try {
    await createActivityLog(data);
  } catch (error) {
    console.error("Activity logging failed:", error.message);
  }
};

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

const getBoardAccess = async (userId, boardId) => {
  const board = await Board.findById(boardId);

  if (!board) {
    return { error: "Board not found", status: 404 };
  }

  const access = await getTenantAccess(userId, board.tenantId);

  if (access.error) return access;

  return {
    board,
    tenant: access.tenant,
    membership: access.membership
  };
};

const getTaskAccess = async (userId, taskId) => {
  const task = await Task.findById(taskId);

  if (!task) {
    return { error: "Task not found", status: 404 };
  }

  const board = await Board.findOne({
    _id: task.boardId,
    tenantId: task.tenantId,
    organizationId: task.organizationId
  });

  if (!board) {
    return { error: "Associated board not found", status: 404 };
  }

  const column = await Column.findOne({
    _id: task.columnId,
    boardId: task.boardId,
    tenantId: task.tenantId
  });

  if (!column) {
    return { error: "Associated column not found", status: 404 };
  }

  const access = await getTenantAccess(userId, task.tenantId);

  if (access.error) return access;

  return {
    task,
    board,
    column,
    tenant: access.tenant,
    membership: access.membership
  };
};

const isAdmin = (membership) => {
  return ["ORG_ADMIN", "TENANT_ADMIN"].includes(membership.role);
};

const validateAssignee = async (assignedTo, tenant) => {
  if (!assignedTo) {
    return { valid: true, assignedTo: null };
  }

  if (!isValidId(assignedTo)) {
    return {
      valid: false,
      message: "Invalid assigned user ID"
    };
  }

  const membership = await Membership.findOne({
    userId: assignedTo,
    organizationId: tenant.organizationId,
    tenantId: tenant._id,
    role: { $in: ["TENANT_ADMIN", "MEMBER"] },
    status: "ACTIVE"
  });

  if (!membership) {
    return {
      valid: false,
      message: "Assigned user must be an active member of this tenant"
    };
  }

  return { valid: true, assignedTo };
};

// 1. Create Task
const createTask = async (req, res) => {
  try {
    const { boardId, columnId } = req.params;
    const { title, description, priority, dueDate, assignedTo } = req.body;

    if (!isValidId(boardId) || !isValidId(columnId)) {
      return res.status(400).json({
        message: "Invalid board ID or column ID"
      });
    }

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required"
      });
    }

    const access = await getBoardAccess(req.user.userId, boardId);

    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    if (access.board.isArchived) {
      return res.status(409).json({
        message: "Cannot create tasks in an archived board"
      });
    }

    const column = await Column.findOne({
      _id: columnId,
      boardId: access.board._id,
      tenantId: access.tenant._id
    });

    if (!column) {
      return res.status(404).json({
        message: "Column not found in this board"
      });
    }

    if (
      priority !== undefined &&
      !["LOW", "MEDIUM", "HIGH"].includes(priority)
    ) {
      return res.status(400).json({
        message: "Priority must be LOW, MEDIUM or HIGH"
      });
    }

    let parsedDueDate = null;

    if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
      parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          message: "Invalid due date"
        });
      }
    }

    const assignee = await validateAssignee(assignedTo, access.tenant);

    if (!assignee.valid) {
      return res.status(400).json({ message: assignee.message });
    }

    const lastTask = await Task.findOne({
      boardId: access.board._id,
      columnId: column._id,
      tenantId: access.tenant._id
    }).sort({ position: -1 });

    const task = await Task.create({
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      boardId: access.board._id,
      columnId: column._id,
      assignedTo: assignee.assignedTo,
      createdBy: req.user.userId,
      priority: priority || "MEDIUM",
      dueDate: parsedDueDate,
      position: lastTask ? lastTask.position + 1 : 0,
      version: 0,
      updatedBy: req.user.userId
    });

    await logActivity({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId: req.user.userId,
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task._id,
      changes: {
        title: task.title,
        priority: task.priority,
        columnId: task.columnId
      }
    });

    emitTaskEvent(req, access.tenant._id, "task-created", task);

    return res.status(201).json({
      message: "Task created successfully",
      task
    });
  } catch (error) {
    console.error("Create Task Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 2. Get All Tasks
const getTasks = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!isValidId(boardId)) {
      return res.status(400).json({ message: "Invalid board ID" });
    }

    const access = await getBoardAccess(req.user.userId, boardId);

    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const tasks = await Task.find({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      boardId: access.board._id
    })
      .sort({ columnId: 1, position: 1 })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    return res.status(200).json({
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Get Tasks Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 3. Get My Tasks
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user.userId
    })
      .sort({ createdAt: -1 })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("boardId", "name")
      .populate("columnId", "name")
      .populate("tenantId", "name")
      .populate("organizationId", "name");

    // Only return tasks from tenants the user can currently access
    const accessibleTasks = [];

    for (const task of tasks) {
      const access = await getTenantAccess(
        req.user.userId,
        task.tenantId._id
      );

      if (!access.error) {
        accessibleTasks.push(task);
      }
    }

    return res.status(200).json({
      count: accessibleTasks.length,
      tasks: accessibleTasks
    });
  } catch (error) {
    console.error("Get My Tasks Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 4. Get Single Task
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const access = await getTaskAccess(req.user.userId, id);

    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const task = await Task.findById(id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return res.status(200).json({ task });
  } catch (error) {
    console.error("Get Task Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 5. Update Task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      expectedVersion
    } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
      return res.status(400).json({
        message: "A valid expectedVersion is required"
      });
    }

    const access = await getTaskAccess(req.user.userId, id);

    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    if (access.board.isArchived) {
      return res.status(409).json({
        message: "Cannot update tasks in an archived board"
      });
    }

    const userId = req.user.userId;
    const isTaskCreator = access.task.createdBy.toString() === userId;
    const isAssignedUser =
      access.task.assignedTo &&
      access.task.assignedTo.toString() === userId;

    if (!isAdmin(access.membership) && !isTaskCreator && !isAssignedUser) {
      return res.status(403).json({
        message: "You can only update tasks created by or assigned to you"
      });
    }

    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Task title cannot be empty"
        });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          message: "Description must be a string"
        });
      }
      updates.description = description.trim();
    }

    if (priority !== undefined) {
      if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
        return res.status(400).json({
          message: "Priority must be LOW, MEDIUM or HIGH"
        });
      }
      updates.priority = priority;
    }

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === "") {
        updates.dueDate = null;
      } else {
        const parsedDate = new Date(dueDate);

        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid due date" });
        }

        updates.dueDate = parsedDate;
      }
    }

    if (assignedTo !== undefined) {
      const assignee = await validateAssignee(assignedTo, access.tenant);

      if (!assignee.valid) {
        return res.status(400).json({ message: assignee.message });
      }

      updates.assignedTo = assignee.assignedTo;
    }

    updates.updatedBy = userId;

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: access.task._id,
        tenantId: access.tenant._id,
        version: expectedVersion
      },
      {
        $set: updates,
        $inc: { version: 1 }
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate("assignedTo", "name email")
      .populate("updatedBy", "name email");

    if (!updatedTask) {
      const latestTask = await Task.findById(id).select("version");

      if (!latestTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(409).json({
        message: "Task was modified by another user. Please refresh and try again.",
        currentVersion: latestTask.version
      });
    }

    await logActivity({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId,
      action: "TASK_UPDATED",
      entityType: "TASK",
      entityId: updatedTask._id,
      changes: {
        before: {
          title: access.task.title,
          description: access.task.description,
          priority: access.task.priority,
          dueDate: access.task.dueDate,
          assignedTo: access.task.assignedTo
        },
        after: updates
      }
    });

    emitTaskEvent(req, access.tenant._id, "task-updated", updatedTask);

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask
    });
  } catch (error) {
    console.error("Update Task Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 6. Move Task
const moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetColumnId, position, expectedVersion } = req.body;

    if (!isValidId(id) || !isValidId(targetColumnId)) {
      return res.status(400).json({
        message: "Invalid task ID or target column ID"
      });
    }

    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
      return res.status(400).json({
        message: "A valid expectedVersion is required"
      });
    }

    if (
      position !== undefined &&
      (!Number.isInteger(position) || position < 0)
    ) {
      return res.status(400).json({
        message: "Position must be a non-negative integer"
      });
    }

    const access = await getTaskAccess(req.user.userId, id);

    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    if (access.board.isArchived) {
      return res.status(409).json({
        message: "Cannot move tasks in an archived board"
      });
    }

    const userId = req.user.userId;
    const isTaskCreator = access.task.createdBy.toString() === userId;
    const isAssignedUser =
      access.task.assignedTo &&
      access.task.assignedTo.toString() === userId;

    if (!isAdmin(access.membership) && !isTaskCreator && !isAssignedUser) {
      return res.status(403).json({
        message: "You cannot move this task"
      });
    }

    const targetColumn = await Column.findOne({
      _id: targetColumnId,
      boardId: access.board._id,
      tenantId: access.tenant._id
    });

    if (!targetColumn) {
      return res.status(404).json({
        message: "Target column not found in this board"
      });
    }

    let newPosition = position;

    if (newPosition === undefined) {
      const lastTask = await Task.findOne({
        boardId: access.board._id,
        columnId: targetColumn._id,
        tenantId: access.tenant._id,
        _id: { $ne: access.task._id }
      }).sort({ position: -1 });

      newPosition = lastTask ? lastTask.position + 1 : 0;
    }

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: access.task._id,
        tenantId: access.tenant._id,
        version: expectedVersion
      },
      {
        $set: {
          columnId: targetColumn._id,
          position: newPosition,
          updatedBy: userId
        },
        $inc: { version: 1 }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedTask) {
      const latestTask = await Task.findById(id).select("version");

      if (!latestTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.status(409).json({
        message: "Task was moved or modified by another user. Refresh and try again.",
        currentVersion: latestTask.version
      });
    }

    await logActivity({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId,
      action: "TASK_MOVED",
      entityType: "TASK",
      entityId: updatedTask._id,
      changes: {
        oldColumnId: access.task.columnId,
        oldPosition: access.task.position,
        newColumnId: updatedTask.columnId,
        newPosition: updatedTask.position
      }
    });

    emitTaskEvent(req, access.tenant._id, "task-moved", updatedTask);

    return res.status(200).json({
      message: "Task moved successfully",
      task: updatedTask
    });
  } catch (error) {
    console.error("Move Task Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 7. Delete Task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const access = await getTaskAccess(req.user.userId, id);

    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    if (access.board.isArchived) {
      return res.status(409).json({
        message: "Cannot delete tasks in an archived board"
      });
    }

    const userId = req.user.userId;
    const isTaskCreator = access.task.createdBy.toString() === userId;

    if (!isAdmin(access.membership) && !isTaskCreator) {
      return res.status(403).json({
        message: "Only admins or the task creator can delete this task"
      });
    }

    const deletedTask = await Task.findOneAndDelete({
      _id: access.task._id,
      tenantId: access.tenant._id
    });

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    await logActivity({
      organizationId: access.tenant.organizationId,
      tenantId: access.tenant._id,
      userId,
      action: "TASK_DELETED",
      entityType: "TASK",
      entityId: access.task._id,
      changes: {
        title: access.task.title,
        columnId: access.task.columnId
      }
    });

    emitTaskEvent(
      req,
      access.tenant._id,
      "task-deleted",
      { _id: deletedTask._id }
    );

    return res.status(200).json({
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Delete Task Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask
};
