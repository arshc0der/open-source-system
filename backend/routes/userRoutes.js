import express from "express";
import { registerUser, getUserLogin, getUsers, getUserById } from "../controllers/userController.js";

const router = express.Router();

// GET /api/users
router.get("/users", getUsers);

// GET /api/users/:id
router.get("/users/:id", getUserById);

router.post("/users", registerUser);
router.post("/userlogin",getUserLogin);

export default router;
