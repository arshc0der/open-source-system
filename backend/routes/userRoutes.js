import express from "express";
import { getUsers, getUserById } from "../controllers/userController.js";

const router = express.Router();

// GET /api/users
router.get("/users", getUsers);

// GET /api/users/:id
router.get("/users/:id", getUserById);

export default router;
