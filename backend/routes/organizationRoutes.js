import express from "express";
import {
  createOrganization,
  myOrganizations,
  getOrganization,
  addOrganizationMember,
  createTeam,
} from "../controllers/organizationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, myOrganizations);
router.post("/", requireAuth, createOrganization);
router.get("/:id", getOrganization);
router.post("/:id/members", requireAuth, addOrganizationMember);
router.post("/:id/teams", requireAuth, createTeam);

export default router;
