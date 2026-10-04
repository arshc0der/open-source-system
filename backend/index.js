import express from "express";
import path from "node:path";
import userRoutes from "./routes/userRoutes.js";
import repositoryRoutes from "./routes/repositoryRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { testConnection } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// CORS without an extra package so the Vite client can call this API directly.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", env.clientOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api", userRoutes);
app.use("/api/repos", repositoryRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
  testConnection();
});
