import express from "express"
import userController from "../controllers/userController.js"
const router = express.Router();

// Define HTTP methods and match them to controller functions
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);

module.exports = router;
