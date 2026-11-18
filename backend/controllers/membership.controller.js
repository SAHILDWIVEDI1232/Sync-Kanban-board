
const mongoose = require("mongoose");

const Membership = require("../models/Membership");
const Organization = require("../models/Organization");
const Tenant = require("../models/Tenant");
const User = require("../models/User");

// MongoDB ID validation
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get active Org Admin
const getOrgAdminAccess = async (userId, organizationId) => {
  return Membership.findOne({
    userId,
    organizationId,
    tenantId: null,
    role: "ORG_ADMIN",
    status: "ACTIVE"
  });
};

// Get active Tenant Admin
const getTenantAdminAccess = async (userId, organizationId, tenantId) => {
  return Membership.findOne({
    userId,
    organizationId,
    tenantId,
    role: "TENANT_ADMIN",
    status: "ACTIVE"
  });
};

// Emit membership event to a particular user
const emitMembershipEvent = (req, userId, eventName, data = {}) => {
  try {
    const io = req.app.get("io");

    if (!io) {
      console.error("Socket.IO instance not found");
      return;
    }

    io.to(`user:${userId}`).emit(eventName, {
      success: true,
      ...data
    });
  } catch (error) {
    console.error("Membership Socket Error:", error.message);
  }
};

// Revoke all tenant room access for a user
const revokeUserTenantAccess = async (req, userId) => {
  try {
    const io = req.app.get("io");

    if (!io) return;

    const sockets = await io.in(`user:${userId}`).fetchSockets();

    for (const socket of sockets) {
      for (const room of socket.rooms) {
        if (room.startsWith("tenant:")) {
          await socket.leave(room);
        }
      }

      socket.emit("tenant-access-revoked", {
        message: "Your tenant access has changed. Please select an authorized tenant again."
      });
    }
  } catch (error) {
    console.error("Tenant Access Revocation Error:", error.message);
  }
};

// Create Membership
const createMembership = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { email, role, tenantId } = req.body;

    if (!isValidId(organizationId)) {
      return res.status(400).json({
        message: "Invalid organization ID"
      });
    }

    if (!email || !role) {
      return res.status(400).json({
        message: "Email and role are required"
      });
    }

    const allowedRoles = ["ORG_ADMIN", "TENANT_ADMIN", "MEMBER"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        message: "Organization not found"
      });
    }

    const orgAdmin = await getOrgAdminAccess(
      req.user.userId,
      organizationId
    );

    const tenantAdmin = tenantId && isValidId(tenantId)
      ? await getTenantAdminAccess(
          req.user.userId,
          organizationId,
          tenantId
        )
      : null;

    if (!orgAdmin && !tenantAdmin) {
      return res.status(403).json({
        message: "You are not allowed to add members"
      });
    }

    if (tenantAdmin && !orgAdmin) {
      if (
        role !== "MEMBER" ||
        tenantId.toString() !== tenantAdmin.tenantId.toString()
      ) {
        return res.status(403).json({
          message: "Tenant Admin can only add Members to their own tenant"
        });
      }
    }

    if (role === "ORG_ADMIN" && tenantId) {
      return res.status(400).json({
        message: "ORG_ADMIN cannot have a tenantId"
      });
    }

    if (role !== "ORG_ADMIN") {
      if (!tenantId || !isValidId(tenantId)) {
        return res.status(400).json({
          message: "A valid tenantId is required for this role"
        });
      }

      const tenant = await Tenant.findOne({
        _id: tenantId,
        organizationId
      });

      if (!tenant) {
        return res.status(404).json({
          message: "Tenant not found in this organization"
        });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found. User must register before being added."
      });
    }

    const membershipTenantId = role === "ORG_ADMIN" ? null : tenantId;

    const existingMembership = await Membership.findOne({
      userId: user._id,
      organizationId,
      tenantId: membershipTenantId
    });

    if (existingMembership) {
      return res.status(409).json({
        message: "Membership already exists for this user"
      });
    }

    const membership = await Membership.create({
      userId: user._id,
      organizationId,
      tenantId: membershipTenantId,
      role,
      status: "ACTIVE"
    });

    const populatedMembership = await Membership.findById(membership._id)
      .populate("userId", "name email")
      .populate("organizationId", "name slug")
      .populate("tenantId", "name slug");

    emitMembershipEvent(
      req,
      user._id,
      "membership-created",
      { membership: populatedMembership }
    );

    return res.status(201).json({
      message: "Membership created successfully",
      membership: populatedMembership
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Membership already exists"
      });
    }

    console.error("Create Membership Error:", error);

    return res.status(500).json({
      message: "Server error while creating membership"
    });
  }
};

// Get Organization Memberships
const getOrganizationMemberships = async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!isValidId(organizationId)) {
      return res.status(400).json({
        message: "Invalid organization ID"
      });
    }

    const orgAdmin = await getOrgAdminAccess(
      req.user.userId,
      organizationId
    );

    if (!orgAdmin) {
      return res.status(403).json({
        message: "Only Org Admin can view all organization memberships"
      });
    }

    const memberships = await Membership.find({
      organizationId
    })
      .populate("userId", "name email")
      .populate("tenantId", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: memberships.length,
      memberships
    });
  } catch (error) {
    console.error("Get Organization Memberships Error:", error);

    return res.status(500).json({
      message: "Server error while fetching memberships"
    });
  }
};

// Get Tenant Memberships
const getTenantMemberships = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!isValidId(tenantId)) {
      return res.status(400).json({
        message: "Invalid tenant ID"
      });
    }

    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        message: "Tenant not found"
      });
    }

    const orgAdmin = await getOrgAdminAccess(
      req.user.userId,
      tenant.organizationId
    );

    const tenantAdmin = await getTenantAdminAccess(
      req.user.userId,
      tenant.organizationId,
      tenantId
    );

    if (!orgAdmin && !tenantAdmin) {
      return res.status(403).json({
        message: "You are not allowed to view this tenant's memberships"
      });
    }

    const memberships = await Membership.find({
      organizationId: tenant.organizationId,
      tenantId
    })
      .populate("userId", "name email")
      .populate("tenantId", "name slug")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: memberships.length,
      memberships
    });
  } catch (error) {
    console.error("Get Tenant Memberships Error:", error);

    return res.status(500).json({
      message: "Server error while fetching tenant memberships"
    });
  }
};

// Update Membership
const updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status, tenantId } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid membership ID"
      });
    }

    const membership = await Membership.findById(id);

    if (!membership) {
      return res.status(404).json({
        message: "Membership not found"
      });
    }

    const orgAdmin = await getOrgAdminAccess(
      req.user.userId,
      membership.organizationId
    );

    const tenantAdmin = membership.tenantId
      ? await getTenantAdminAccess(
          req.user.userId,
          membership.organizationId,
          membership.tenantId
        )
      : null;

    if (!orgAdmin && !tenantAdmin) {
      return res.status(403).json({
        message: "You are not allowed to update this membership"
      });
    }

    if (tenantAdmin && !orgAdmin) {
      if (
        membership.role !== "MEMBER" ||
        membership.tenantId.toString() !== tenantAdmin.tenantId.toString()
      ) {
        return res.status(403).json({
          message: "Tenant Admin can only manage Members in their own tenant"
        });
      }

      if (role !== undefined || tenantId !== undefined) {
        return res.status(403).json({
          message: "Tenant Admin cannot change membership role or tenant"
        });
      }
    }

    const oldValues = {
      role: membership.role,
      status: membership.status,
      tenantId: membership.tenantId
    };

    if (status !== undefined) {
      const allowedStatuses = ["ACTIVE", "INVITED", "SUSPENDED"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid membership status"
        });
      }

      membership.status = status;
    }

    if (role !== undefined) {
      if (!orgAdmin) {
        return res.status(403).json({
          message: "Only Org Admin can change membership roles"
        });
      }

      const allowedRoles = ["ORG_ADMIN", "TENANT_ADMIN", "MEMBER"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role"
        });
      }

      let newTenantId = null;

      if (role !== "ORG_ADMIN") {
        newTenantId = tenantId || membership.tenantId;

        if (!newTenantId || !isValidId(newTenantId)) {
          return res.status(400).json({
            message: "A valid tenantId is required for this role"
          });
        }

        const tenant = await Tenant.findOne({
          _id: newTenantId,
          organizationId: membership.organizationId
        });

        if (!tenant) {
          return res.status(404).json({
            message: "Tenant not found in this organization"
          });
        }
      } else if (tenantId) {
        return res.status(400).json({
          message: "ORG_ADMIN cannot have a tenantId"
        });
      }

      if (
        membership.role === "ORG_ADMIN" &&
        role !== "ORG_ADMIN"
      ) {
        const orgAdminCount = await Membership.countDocuments({
          organizationId: membership.organizationId,
          tenantId: null,
          role: "ORG_ADMIN",
          status: "ACTIVE"
        });

        if (orgAdminCount <= 1 && membership.status === "ACTIVE") {
          return res.status(400).json({
            message: "Organization must have at least one active Org Admin"
          });
        }
      }

      membership.role = role;
      membership.tenantId = newTenantId;
    } else if (tenantId !== undefined && orgAdmin) {
      return res.status(400).json({
        message: "To change tenant, provide a new role as well"
      });
    }

    await membership.save();

    const updatedMembership = await Membership.findById(id)
      .populate("userId", "name email")
      .populate("organizationId", "name slug")
      .populate("tenantId", "name slug");

    // Revoke previously joined tenant rooms after access changes
    if (
      oldValues.status !== membership.status ||
      oldValues.role !== membership.role ||
      String(oldValues.tenantId || "") !== String(membership.tenantId || "")
    ) {
      await revokeUserTenantAccess(req, membership.userId);

      emitMembershipEvent(
        req,
        membership.userId,
        "membership-updated",
        { membership: updatedMembership }
      );
    }

    return res.status(200).json({
      message: "Membership updated successfully",
      membership: updatedMembership
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Membership already exists for this user and tenant"
      });
    }

    console.error("Update Membership Error:", error);

    return res.status(500).json({
      message: "Server error while updating membership"
    });
  }
};

// Delete Membership
const deleteMembership = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid membership ID"
      });
    }

    const membership = await Membership.findById(id);

    if (!membership) {
      return res.status(404).json({
        message: "Membership not found"
      });
    }

    const orgAdmin = await getOrgAdminAccess(
      req.user.userId,
      membership.organizationId
    );

    const tenantAdmin = membership.tenantId
      ? await getTenantAdminAccess(
          req.user.userId,
          membership.organizationId,
          membership.tenantId
        )
      : null;

    if (!orgAdmin && !tenantAdmin) {
      return res.status(403).json({
        message: "You are not allowed to delete this membership"
      });
    }

    if (tenantAdmin && !orgAdmin) {
      if (membership.role !== "MEMBER") {
        return res.status(403).json({
          message: "Tenant Admin can only remove Members"
        });
      }
    }

    if (
      membership.role === "ORG_ADMIN" &&
      membership.userId.toString() === req.user.userId
    ) {
      return res.status(400).json({
        message: "You cannot delete your own Org Admin membership"
      });
    }

    if (
      membership.role === "ORG_ADMIN" &&
      membership.status === "ACTIVE"
    ) {
      const orgAdminCount = await Membership.countDocuments({
        organizationId: membership.organizationId,
        tenantId: null,
        role: "ORG_ADMIN",
        status: "ACTIVE"
      });

      if (orgAdminCount <= 1) {
        return res.status(400).json({
          message: "Organization must have at least one active Org Admin"
        });
      }
    }

    const deletedUserId = membership.userId;

    await Membership.findByIdAndDelete(id);

    await revokeUserTenantAccess(req, deletedUserId);

    emitMembershipEvent(
      req,
      deletedUserId,
      "membership-deleted",
      { membershipId: id }
    );

    return res.status(200).json({
      message: "Membership deleted successfully"
    });
  } catch (error) {
    console.error("Delete Membership Error:", error);

    return res.status(500).json({
      message: "Server error while deleting membership"
    });
  }
};

module.exports = {
  createMembership,
  getOrganizationMemberships,
  getTenantMemberships,
  updateMembership,
  deleteMembership
};
