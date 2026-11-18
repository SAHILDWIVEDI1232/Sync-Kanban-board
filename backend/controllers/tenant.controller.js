const mongoose = require("mongoose");

const Tenant = require("../models/Tenant");
const Organization = require("../models/Organization");
const Membership = require("../models/Membership");
const Board = require("../models/Board");

// Name ko URL-friendly slug mein convert karna
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// Check valid MongoDB ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// 1. Create Tenant
const createTenant = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { name } = req.body;

    if (!isValidId(organizationId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tenant name is required" });
    }

    // Sirf Org Admin tenant create kar sakta hai
    const orgAdmin = await Membership.findOne({
      userId: req.user.userId,
      organizationId,
      tenantId: null,
      role: "ORG_ADMIN",
      status: "ACTIVE"
    });

    if (!orgAdmin) {
      return res.status(403).json({
        message: "Only Organization Admin can create tenants"
      });
    }

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const tenant = await Tenant.create({
      name: name.trim(),
      slug: generateSlug(name),
      organizationId,
      createdBy: req.user.userId
    });

    return res.status(201).json({
      message: "Tenant created successfully",
      tenant
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Tenant with this name already exists in this organization"
      });
    }

    console.error("Create Tenant Error:", error);

    return res.status(500).json({ message: "Server error" });
  }
};

// 2. Get Tenants of an Organization
const getTenants = async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!isValidId(organizationId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    // Check whether user is Org Admin
    const orgAdmin = await Membership.findOne({
      userId: req.user.userId,
      organizationId,
      tenantId: null,
      role: "ORG_ADMIN",
      status: "ACTIVE"
    });

    let tenants;

    if (orgAdmin) {
      // Org Admin ko organization ke sabhi tenants dikhenge
      tenants = await Tenant.find({ organizationId })
        .sort({ createdAt: -1 });
    } else {
      // Baaki users ko sirf assigned tenants dikhenge
      const memberships = await Membership.find({
        userId: req.user.userId,
        organizationId,
        tenantId: { $ne: null },
        status: "ACTIVE"
      }).select("tenantId");

      const tenantIds = memberships.map((item) => item.tenantId);

      tenants = await Tenant.find({
        _id: { $in: tenantIds },
        organizationId
      }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
      count: tenants.length,
      tenants
    });
  } catch (error) {
    console.error("Get Tenants Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 3. Get Single Tenant
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid tenant ID" });
    }

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const membership = await Membership.findOne({
      userId: req.user.userId,
      organizationId: tenant.organizationId,
      status: "ACTIVE",
      $or: [
        { role: "ORG_ADMIN", tenantId: null },
        { tenantId: tenant._id }
      ]
    });

    if (!membership) {
      return res.status(403).json({
        message: "You do not have access to this tenant"
      });
    }

    return res.status(200).json({ tenant });
  } catch (error) {
    console.error("Get Tenant Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 4. Update Tenant
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid tenant ID" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tenant name is required" });
    }

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const orgAdmin = await Membership.findOne({
      userId: req.user.userId,
      organizationId: tenant.organizationId,
      tenantId: null,
      role: "ORG_ADMIN",
      status: "ACTIVE"
    });

    if (!orgAdmin) {
      return res.status(403).json({
        message: "Only Organization Admin can update tenants"
      });
    }

    tenant.name = name.trim();
    tenant.slug = generateSlug(name);

    await tenant.save();

    return res.status(200).json({
      message: "Tenant updated successfully",
      tenant
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Tenant with this name already exists"
      });
    }

    console.error("Update Tenant Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 5. Delete Tenant
const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid tenant ID" });
    }

    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const orgAdmin = await Membership.findOne({
      userId: req.user.userId,
      organizationId: tenant.organizationId,
      tenantId: null,
      role: "ORG_ADMIN",
      status: "ACTIVE"
    });

    if (!orgAdmin) {
      return res.status(403).json({
        message: "Only Organization Admin can delete tenants"
      });
    }

    // Tenant ke andar boards hain toh delete nahi karenge
    const boardExists = await Board.exists({ tenantId: tenant._id });

    if (boardExists) {
      return res.status(409).json({
        message: "Delete or move this tenant's boards before deleting the tenant"
      });
    }

    // Tenant ke members hain toh pehle unki memberships manage karein
    const membershipExists = await Membership.exists({
      tenantId: tenant._id
    });

    if (membershipExists) {
      return res.status(409).json({
        message: "Remove tenant memberships before deleting the tenant"
      });
    }

    await Tenant.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Tenant deleted successfully"
    });
  } catch (error) {
    console.error("Delete Tenant Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant
};