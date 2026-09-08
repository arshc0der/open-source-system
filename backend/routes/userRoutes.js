import express from "express"
const router = express.Router();
const userController = require('../controllers/userController');

// Define HTTP methods and match them to controller functions
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);

module.exports = router;
