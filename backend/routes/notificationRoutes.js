import express from "express";
import {
  listNotifications,
  readNotification,
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, listNotifications);
router.patch("/:id/read", requireAuth, readNotification);

export default router;
