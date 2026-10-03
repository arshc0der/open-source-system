import { verifyAccessToken } from "../service/tokenService.js";
import User from "../models/userModel.js";
import { publicUser } from "../service/authService.js";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "authorization required" });
    }

    const payload = verifyAccessToken(token);
    const user = await User.getById(payload.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "invalid session" });
    }

    req.user = publicUser(user);
    next();
  } catch {
    return res.status(401).json({ message: "invalid or expired token" });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    const payload = verifyAccessToken(token);
    const user = await User.getById(payload.userId);
    req.user = publicUser(user);
  } catch {
    req.user = null;
  }
  next();
};
