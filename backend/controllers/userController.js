import User from "../models/userModel.js";

//register user
const registerUser = async(req,res)=>{
  try{
    const users = await User.register(req.body);
    res.status(200).json({users});
  }catch(error){
    res.status(500).json({
      message: "server error",
      error: error.message
    })
  }
}
// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.getAll();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.getById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

export { registerUser, getUsers, getUserById };
