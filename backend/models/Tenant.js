
const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

tenantSchema.index(
  { organizationId: 1, slug: 1 },
  { unique: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);
