
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null
    },

    role: {
      type: String,
      enum: ["ORG_ADMIN", "TENANT_ADMIN", "MEMBER"],
      required: true
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INVITED", "SUSPENDED"],
      default: "ACTIVE"
    }
  },
  { timestamps: true }
);

membershipSchema.pre("validate", function () {
  if (this.role === "ORG_ADMIN" && this.tenantId != null) {
    this.invalidate(
      "tenantId",
      "Organization Admin membership must be organization-level"
    );
  }

  if (
    ["TENANT_ADMIN", "MEMBER"].includes(this.role) &&
    !this.tenantId
  ) {
    this.invalidate(
      "tenantId",
      "Tenant membership requires a tenant"
    );
  }
});

membershipSchema.index(
  { userId: 1, organizationId: 1, tenantId: 1 },
  { unique: true }
);

membershipSchema.index({
  organizationId: 1,
  tenantId: 1,
  status: 1
});

module.exports = mongoose.model("Membership", membershipSchema);
