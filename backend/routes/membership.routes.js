
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  createMembership,
  getOrganizationMemberships,
  getTenantMemberships,
  updateMembership,
  deleteMembership
} = require("../controllers/membership.controller");

router.use(protect);

// Organization level
router.post("/organization/:organizationId", createMembership);
router.get("/organization/:organizationId", getOrganizationMemberships);

// Tenant level
router.get("/tenant/:tenantId", getTenantMemberships);

// Single membership
router.put("/:id", updateMembership);
router.delete("/:id", deleteMembership);

module.exports = router;
