import User from "../models/userModel.js";
import Follow from "../models/followModel.js";
import Repository from "../models/repositoryModel.js";
import {
  registerUser as registerAccount,
  loginUser,
  logoutUser,
  publicUser,
} from "../service/authService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
  const result = await registerAccount(req.body);
  res.status(201).json(result);
});

export const getUserLogin = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  let loginEmail = email;
  if (!loginEmail && username) {
    const found = await User.getByUsername(username);
    loginEmail = found?.email;
  }
  const result = await loginUser(loginEmail, password);
  res.status(200).json(result);
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.body.sessionToken);
  res.status(200).json({ message: "logged out" });
});

export const getMe = asyncHandler(async (req, res) => {
  const counts = await User.followerCounts(req.user.id);
  const repos = await Repository.listByOwnerUser(req.user.id);
  res.status(200).json({ user: req.user, ...counts, repositories: repos });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updated = await User.updateProfile(req.user.id, req.body);
  res.status(200).json(publicUser(updated));
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.getAll();
  res.status(200).json(users);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.getById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const counts = await User.followerCounts(user.id);
  const repos = await Repository.listByOwnerUser(user.id);
  res.status(200).json({ ...publicUser(user), ...counts, repositories: repos });
});

export const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await User.getByUsername(req.params.username);
  if (!user) return res.status(404).json({ message: "User not found" });
  const counts = await User.followerCounts(user.id);
  const repos = await Repository.listByOwnerUser(user.id);
  res.status(200).json({ ...publicUser(user), ...counts, repositories: repos });
});

export const followUser = asyncHandler(async (req, res) => {
  const target = await User.getById(req.params.id);
  if (!target) return res.status(404).json({ message: "User not found" });
  const result = await Follow.toggle(req.user.id, target.id);
  res.status(200).json(result);
});
