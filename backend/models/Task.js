
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true
    },

    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Column",
      required: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM"
    },

    dueDate: {
      type: Date,
      default: null
    },

    position: {
      type: Number,
      required: true,
      default: 0
    },

    version: {
      type: Number,
      default: 0
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

// Efficient task ordering inside columns
taskSchema.index({
  tenantId: 1,
  columnId: 1,
  position: 1
});

// Efficient board loading
taskSchema.index({
  tenantId: 1,
  boardId: 1
});

module.exports = mongoose.model("Task", taskSchema);
