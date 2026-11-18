const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant
} = require("../controllers/tenant.controller");

// Saari tenant APIs login ke baad hi access hongi
router.use(protect);

// Organization ke andar tenants
router.post("/organization/:organizationId", createTenant);
router.get("/organization/:organizationId", getTenants);

// Single tenant operations
router.get("/:id", getTenantById);
router.put("/:id", updateTenant);
router.delete("/:id", deleteTenant);

module.exports = router;