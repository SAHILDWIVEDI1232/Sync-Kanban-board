
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization
} = require("../controllers/organization.controller");

// All organization routes require login
router.use(protect);

router.post("/", createOrganization);

router.get("/", getOrganizations);

router.get("/:id", getOrganizationById);

router.put("/:id", updateOrganization);

router.delete("/:id", deleteOrganization);

module.exports = router;
