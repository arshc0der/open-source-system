import crypto from "crypto";
import User from "../models/userModel.js";
import Session from "../models/sessionModel.js";
import { hashPassword, verifyPassword } from "./hashService.js";
import { generateAccessToken } from "./tokenService.js";
import { env } from "../config/env.js";

const publicUser = (row) => {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
};

export const registerUser = async ({ username, email, password, display_name }) => {
  if (!username || !email || !password) {
    const err = new Error("username, email and password are required");
    err.status = 400;
    throw err;
  }

  const existingEmail = await User.getByEmail(email);
  if (existingEmail) {
    const err = new Error("email already registered");
    err.status = 409;
    throw err;
  }

  const existingName = await User.getByUsername(username);
  if (existingName) {
    const err = new Error("username already taken");
    err.status = 409;
    throw err;
  }

  const password_hash = await hashPassword(password);
  const { userId } = await User.register({
    username,
    email,
    password_hash,
    display_name: display_name || username,
  });

  return issueSession(userId);
};

export const loginUser = async (email, password) => {
  if (!email || !password) {
    const err = new Error("email and password are required");
    err.status = 400;
    throw err;
  }

  const user = await User.getByEmail(email);
  if (!user || !user.is_active) {
    const err = new Error("invalid credentials");
    err.status = 401;
    throw err;
  }

  const ok = await verifyPassword(user.password_hash, password);
  if (!ok) {
    const err = new Error("invalid credentials");
    err.status = 401;
    throw err;
  }

  return issueSession(user.id);
};

export const logoutUser = async (sessionToken) => {
  if (!sessionToken) return;
  await Session.revoke(hashToken(sessionToken));
};

async function issueSession(userId) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.sessionDays * 24 * 60 * 60 * 1000);
  await Session.create({
    userId,
    tokenHash: hashToken(sessionToken),
    expiresAt,
  });

  const user = publicUser(await User.getById(userId));
  return {
    accessToken: generateAccessToken(userId),
    sessionToken,
    user,
  };
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export { publicUser };
