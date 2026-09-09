import express from "express";
import userRoutes from "./routes/userRoutes.js";
import { testConnection } from "./config/db.js";

const app = express();

const port = 4000;

// Middleware
app.use(express.json());

// Routes
app.use("/api", userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  testConnection();
});
