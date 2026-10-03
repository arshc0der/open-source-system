import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, env.accessTokenSecret, {
    expiresIn: env.accessTokenTtl,
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.refreshTokenSecret, {
    expiresIn: `${env.sessionDays}d`,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.accessTokenSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.refreshTokenSecret);
};
