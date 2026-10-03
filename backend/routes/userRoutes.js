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
  followUser,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/auth/register", registerUser);
router.post("/auth/login", getUserLogin);
router.post("/userlogin", getUserLogin);
router.post("/auth/logout", logout);
router.post("/users", registerUser);

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.get("/profile/:username", getUserByUsername);
router.post("/users/:id/follow", requireAuth, followUser);

export default router;
