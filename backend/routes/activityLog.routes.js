
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  getTenantActivityLogs
} = require("../controllers/activityLog.controller");

// Authentication required
router.use(protect);

// Get activity logs of a tenant
router.get("/tenant/:tenantId", getTenantActivityLogs);

module.exports = router;
