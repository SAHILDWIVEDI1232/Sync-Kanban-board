
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    action: {
      type: String,
      required: true
    },

    entityType: {
      type: String,
      enum: ["BOARD", "COLUMN", "TASK", "MEMBERSHIP"],
      required: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

activityLogSchema.index({
  tenantId: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  "ActivityLog",
  activityLogSchema
);
