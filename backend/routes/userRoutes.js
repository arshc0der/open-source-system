import express from "express";
import {
  registerUser,
  getUserLogin,
  logout,
  getUsers,
  getUserById,
  getUserByUsername,
  getMe,
  updateMe,
  deleteMe,
  followUser,
  uploadAvatar,
} from "../controllers/userController.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", getUserLogin);
router.post("/userlogin", getUserLogin);
router.post("/auth/logout", logout);
router.post("/users", registerUser);

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);
router.put("/me/avatar", requireAuth, express.raw({ type: "image/*", limit: "5mb" }), uploadAvatar);
router.delete("/me", requireAuth, deleteMe);

router.get("/users", getUsers);
router.get("/users/:id", optionalAuth, getUserById);
router.get("/profile/:username", optionalAuth, getUserByUsername);
router.post("/users/:id/follow", requireAuth, followUser);

export default router;
