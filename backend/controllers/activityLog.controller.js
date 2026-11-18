
const mongoose = require("mongoose");

const ActivityLog = require("../models/ActivityLog");
const Tenant = require("../models/Tenant");
const Membership = require("../models/Membership");

// Create Activity Log
const createActivityLog = async ({
  organizationId,
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  changes = {}
}) => {
  try {
    return await ActivityLog.create({
      organizationId,
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      changes
    });
  } catch (error) {
    console.error("Activity Log Error:", error.message);
    return null;
  }
};

// Get Tenant Activity Logs
const getTenantActivityLogs = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const userId = req.user.userId;

    // Validate tenant ID
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        message: "Invalid tenant ID"
      });
    }

    // Find tenant
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found"
      });
    }

    // Check whether user is an active Org Admin
    const orgAdmin = await Membership.findOne({
      userId,
      organizationId: tenant.organizationId,
      tenantId: null,
      role: "ORG_ADMIN",
      status: "ACTIVE"
    });

    // Otherwise check tenant membership
    let membership = null;

    if (!orgAdmin) {
      membership = await Membership.findOne({
        userId,
        organizationId: tenant.organizationId,
        tenantId: tenant._id,
        role: { $in: ["TENANT_ADMIN", "MEMBER"] },
        status: "ACTIVE"
      });
    }

    if (!orgAdmin && !membership) {
      return res.status(403).json({
        message: "You do not have access to this tenant's activity logs"
      });
    }

    // Fetch only this tenant's activity logs
    const logs = await ActivityLog.find({
      organizationId: tenant.organizationId,
      tenantId: tenant._id
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error("Get Activity Logs Error:", error);

    return res.status(500).json({
      message: "Server error while fetching activity logs"
    });
  }
};

module.exports = {
  createActivityLog,
  getTenantActivityLogs
};
