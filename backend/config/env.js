// Runtime config. Set ACCESS_TOKEN_SECRET / REFRESH_TOKEN_SECRET in the OS
// environment for production. No extra dotenv package is required.

export const env = {
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  accessTokenSecret:
    process.env.ACCESS_TOKEN_SECRET || "change-me-access-token-secret",
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET || "change-me-refresh-token-secret",
  accessTokenTtl: "15m",
  sessionDays: 7,
};
