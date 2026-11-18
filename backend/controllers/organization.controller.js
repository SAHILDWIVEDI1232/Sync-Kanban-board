
// const mongoose = require("mongoose");

// const Organization = require("../models/Organization");
// const Membership = require("../models/Membership");
// const Tenant = require("../models/Tenant");

// // Generate unique slug
// const generateSlug = (name) => {
//   return name
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-|-$/g, "");
// };


// // CREATE ORGANIZATION
// const createOrganization = async (req, res) => {
//   try {
//     const { name } = req.body;

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Organization name is required"
//       });
//     }

//     const slug = generateSlug(name);

//     // Create organization and admin membership atomically
//     const session = await mongoose.startSession();

//     let organization;

//     try {
//       await session.withTransaction(async () => {
//         const existing = await Organization.findOne({
//           slug
//         }).session(session);

//         if (existing) {
//           throw new Error("ORGANIZATION_SLUG_EXISTS");
//         }

//         const [createdOrg] = await Organization.create(
//           [{
//             name: name.trim(),
//             slug,
//             createdBy: req.user.userId
//           }],
//           { session }
//         );

//         await Membership.create(
//           [{
//             userId: req.user.userId,
//             organizationId: createdOrg._id,
//             tenantId: null,
//             role: "ORG_ADMIN",
//             status: "ACTIVE"
//           }],
//           { session }
//         );

//         organization = createdOrg;
//       });
//     } finally {
//       await session.endSession();
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Organization created successfully",
//       organization
//     });

//   } catch (error) {
//     if (
//       error.code === 11000 ||
//       error.message === "ORGANIZATION_SLUG_EXISTS"
//     ) {
//       return res.status(409).json({
//         success: false,
//         message: "Organization name already exists"
//       });
//     }

//     console.error("Create Organization Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create organization"
//     });
//   }
// };


// // GET ALL MY ORGANIZATIONS
// const getOrganizations = async (req, res) => {
//   try {
//     const memberships = await Membership.find({
//       userId: req.user.userId,
//       tenantId: null,
//       role: "ORG_ADMIN",
//       status: "ACTIVE"
//     }).select("organizationId");

//     const organizationIds = memberships.map(
//       item => item.organizationId
//     );

//     const organizations = await Organization.find({
//       _id: { $in: organizationIds }
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       count: organizations.length,
//       organizations
//     });

//   } catch (error) {
//     console.error("Get Organizations Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch organizations"
//     });
//   }
// };


// // GET SINGLE ORGANIZATION
// const getOrganizationById = async (req, res) => {
//   try {
//     const organization = await Organization.findById(
//       req.params.id
//     );

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: "Organization not found"
//       });
//     }

//     const membership = await Membership.findOne({
//       userId: req.user.userId,
//       organizationId: organization._id,
//       tenantId: null,
//       role: "ORG_ADMIN",
//       status: "ACTIVE"
//     });

//     if (!membership) {
//       return res.status(403).json({
//         success: false,
//         message: "You cannot access this organization"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       organization
//     });

//   } catch (error) {
//     console.error("Get Organization Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch organization"
//     });
//   }
// };


// // UPDATE ORGANIZATION
// const updateOrganization = async (req, res) => {
//   try {
//     const { name } = req.body;

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Organization name is required"
//       });
//     }

//     const organization = await Organization.findById(
//       req.params.id
//     );

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: "Organization not found"
//       });
//     }

//     const membership = await Membership.findOne({
//       userId: req.user.userId,
//       organizationId: organization._id,
//       tenantId: null,
//       role: "ORG_ADMIN",
//       status: "ACTIVE"
//     });

//     if (!membership) {
//       return res.status(403).json({
//         success: false,
//         message: "Only Organization Admin can update this"
//       });
//     }

//     organization.name = name.trim();
//     organization.slug = generateSlug(name);

//     await organization.save();

//     return res.status(200).json({
//       success: true,
//       message: "Organization updated successfully",
//       organization
//     });

//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: "Organization name already exists"
//       });
//     }

//     console.error("Update Organization Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update organization"
//     });
//   }
// };


// // DELETE ORGANIZATION
// const deleteOrganization = async (req, res) => {
//   try {
//     const organization = await Organization.findById(
//       req.params.id
//     );

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: "Organization not found"
//       });
//     }

//     const membership = await Membership.findOne({
//       userId: req.user.userId,
//       organizationId: organization._id,
//       tenantId: null,
//       role: "ORG_ADMIN",
//       status: "ACTIVE"
//     });

//     if (!membership) {
//       return res.status(403).json({
//         success: false,
//         message: "Only Organization Admin can delete this"
//       });
//     }

//     // Prevent deleting organization with existing branches
//     const tenantExists = await Tenant.exists({
//       organizationId: organization._id
//     });

//     if (tenantExists) {
//       return res.status(409).json({
//         success: false,
//         message: "Delete or archive all branches before deleting organization"
//       });
//     }

//     // Delete its memberships and organization
//     await Membership.deleteMany({
//       organizationId: organization._id
//     });

//     await Organization.deleteOne({
//       _id: organization._id
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Organization deleted successfully"
//     });

//   } catch (error) {
//     console.error("Delete Organization Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete organization"
//     });
//   }
// };


// module.exports = {
//   createOrganization,
//   getOrganizations,
//   getOrganizationById,
//   updateOrganization,
//   deleteOrganization
// };



const mongoose = require("mongoose");

const Organization = require("../models/Organization");
const Membership = require("../models/Membership");
const Tenant = require("../models/Tenant");

// Generate unique slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

// CREATE ORGANIZATION
const createOrganization = async (req, res) => {
  let session;

  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required"
      });
    }

    const slug = generateSlug(name);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid organization name"
      });
    }

    session = await mongoose.startSession();

    let organization;

    await session.withTransaction(async () => {
      const existing = await Organization.findOne({
        slug
      }).session(session);

      if (existing) {
        const error = new Error("ORGANIZATION_SLUG_EXISTS");
        throw error;
      }

      const [createdOrg] = await Organization.create(
        [{
          name: name.trim(),
          slug,
          createdBy: req.user.userId
        }],
        { session }
      );

      await Membership.create(
        [{
          userId: req.user.userId,
          organizationId: createdOrg._id,
          tenantId: null,
          role: "ORG_ADMIN",
          status: "ACTIVE"
        }],
        { session }
      );

      organization = createdOrg;
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization
    });

  } catch (error) {
    if (
      error.code === 11000 ||
      error.message === "ORGANIZATION_SLUG_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "Organization name already exists"
      });
    }

    console.error("Create Organization Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create organization"
    });

  } finally {
    if (session) {
      await session.endSession();
    }
  }
};


// GET ALL MY ORGANIZATIONS
const getOrganizations = async (req, res) => {
  try {
    const organizationIds = await Membership.distinct(
      "organizationId",
      {
        userId: req.user.userId,
        status: "ACTIVE"
      }
    );

    const organizations = await Organization.find({
      _id: { $in: organizationIds }
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: organizations.length,
      organizations
    });

  } catch (error) {
    console.error("Get Organizations Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch organizations"
    });
  }
};


// GET SINGLE ORGANIZATION
const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(
      req.params.id
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    // Check ACTIVE membership
    const membership = await Membership.findOne({
      userId: req.user.userId,
      organizationId: organization._id,
      status: "ACTIVE"
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this organization"
      });
    }

    return res.status(200).json({
      success: true,
      organization
    });

  } catch (error) {
    console.error("Get Organization Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch organization"
    });
  }
};


// UPDATE ORGANIZATION
const updateOrganization = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required"
      });
    }

    const organization = await Organization.findById(
      req.params.id
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    // Only ORG_ADMIN can update
    const membership = await Membership.findOne({
      userId: req.user.userId,
      organizationId: organization._id,
      tenantId: null,
      role: "ORG_ADMIN",
      status: "ACTIVE"
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Only Organization Admin can update this"
      });
    }

    const newSlug = generateSlug(name);

    if (!newSlug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid organization name"
      });
    }

    organization.name = name.trim();
    organization.slug = newSlug;

    await organization.save();

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      organization
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Organization name already exists"
      });
    }

    console.error("Update Organization Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update organization"
    });
  }
};


// DELETE ORGANIZATION
const deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(
      req.params.id
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    // Only ORG_ADMIN can delete
    const membership = await Membership.findOne({
      userId: req.user.userId,
      organizationId: organization._id,
      tenantId: null,
      role: "ORG_ADMIN",
      status: "ACTIVE"
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Only Organization Admin can delete this"
      });
    }

    // Check existing tenants
    const tenantExists = await Tenant.exists({
      organizationId: organization._id
    });

    if (tenantExists) {
      return res.status(409).json({
        success: false,
        message: "Delete or archive all branches before deleting organization"
      });
    }

    // Delete memberships and organization
    await Membership.deleteMany({
      organizationId: organization._id
    });

    await Organization.deleteOne({
      _id: organization._id
    });

    return res.status(200).json({
      success: true,
      message: "Organization deleted successfully"
    });

  } catch (error) {
    console.error("Delete Organization Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete organization"
    });
  }
};


// EXPORT CONTROLLERS
module.exports = {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization
};
