import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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

const avatarStorage = path.resolve(process.cwd(), "uploads", "avatars");

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
  const [counts, lists, activity, repos] = await Promise.all([
    User.followerCounts(req.user.id),
    User.followerLists(req.user.id),
    User.contributionActivity(req.user.id),
    Repository.listByOwnerUser(req.user.id),
  ]);
  res.status(200).json({
    user: req.user,
    ...counts,
    followers_list: lists.followers,
    following_list: lists.following,
    activity,
    repositories: repos,
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updated = await User.updateProfile(req.user.id, req.body);
  res.status(200).json(publicUser(updated));
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) {
    return res.status(400).json({ message: "an image file is required" });
  }
  const extensions = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif" };
  const extension = extensions[req.headers["content-type"]];
  if (!extension) return res.status(415).json({ message: "avatar must be PNG, JPEG, WebP, or GIF" });

  fs.mkdirSync(avatarStorage, { recursive: true });
  const filename = `${req.user.id}-${crypto.randomUUID()}${extension}`;
  const target = path.join(avatarStorage, filename);
  const temporary = `${target}.tmp`;
  fs.writeFileSync(temporary, req.body);
  fs.renameSync(temporary, target);
  const avatarUrl = `/uploads/avatars/${filename}`;
  const updated = await User.updateProfile(req.user.id, { avatar_url: avatarUrl });

  const previous = req.user.avatar_url;
  if (typeof previous === "string" && previous.startsWith("/uploads/avatars/")) {
    const oldPath = path.join(avatarStorage, path.basename(previous));
    if (oldPath !== target) fs.rmSync(oldPath, { force: true });
  }
  res.json({ avatar_url: updated.avatar_url });
});

export const deleteMe = asyncHandler(async (req, res) => {
  await User.deleteUser(req.user.id);
  res.status(200).json({ message: "account deleted" });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.getAll();
  res.status(200).json(users);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.getById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const isSelf = Number(req.user?.id) === Number(user.id);
  const [counts, lists, activity, repos] = await Promise.all([
    User.followerCounts(user.id),
    User.followerLists(user.id),
    User.contributionActivity(user.id, !isSelf),
    isSelf ? Repository.listByOwnerUser(user.id) : Repository.listPublicByOwnerUser(user.id),
  ]);
  const following = req.user ? await User.isFollowing(req.user.id, user.id) : false;
  res.status(200).json({
    ...publicUser(user),
    ...counts,
    followers_list: lists.followers,
    following_list: lists.following,
    activity,
    repositories: repos,
    is_following: following,
  });
});

export const getUserByUsername = asyncHandler(async (req, res) => {
  const user = await User.getByUsername(req.params.username);
  if (!user) return res.status(404).json({ message: "User not found" });
  const isSelf = Number(req.user?.id) === Number(user.id);
  const [counts, lists, activity, repos] = await Promise.all([
    User.followerCounts(user.id),
    User.followerLists(user.id),
    User.contributionActivity(user.id, !isSelf),
    isSelf ? Repository.listByOwnerUser(user.id) : Repository.listPublicByOwnerUser(user.id),
  ]);
  const following = req.user ? await User.isFollowing(req.user.id, user.id) : false;
  res.status(200).json({
    ...publicUser(user),
    ...counts,
    followers_list: lists.followers,
    following_list: lists.following,
    activity,
    repositories: repos,
    is_following: following,
  });
});

export const followUser = asyncHandler(async (req, res) => {
  const target = await User.getById(req.params.id);
  if (!target) return res.status(404).json({ message: "User not found" });
  const result = await Follow.toggle(req.user.id, target.id);
  res.status(200).json(result);
});
