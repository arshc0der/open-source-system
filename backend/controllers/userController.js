const User = require('../models/userModel');

// Handle fetching all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.status(200).json(users); // Sending JSON back (API style)
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Handle fetching a single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
