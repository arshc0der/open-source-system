import Notification from "../models/notificationModel.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  res.json(await Notification.listForUser(req.user.id));
});

export const readNotification = asyncHandler(async (req, res) => {
  await Notification.markRead(req.params.id, req.user.id);
  res.json({ message: "marked read" });
});
