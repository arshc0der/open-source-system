# Open Source System (OSS)

GitHub-like clone using the existing Node + MySQL backend and React + Vite client.

## What you install (already listed in package.json)

Do **not** add extra libraries. Install only what is already in the lockfiles.

**MySQL** must be running locally. Create a `root` user password in `backend/config/db.js` if your MySQL root has one.

```powershell
cd C:\Users\arsh2\Documents\open-source-system\backend
npm install

cd C:\Users\arsh2\Documents\open-source-system\client
npm install
```

Backend packages: `express`, `mysql2`, `argon2`, `jsonwebtoken`  
Client packages: `react`, `react-dom`, `react-router-dom`, `react-icons`, `vite`, `tailwindcss`, `@tailwindcss/vite`

## Database

1. Start MySQL.
2. Apply the production schema (includes your tables plus `password_hash`, unique indexes, `watchers`, `repository_files`, `pull_request_reviews`, and `language` on repositories):

```powershell
mysql -u root -p < C:\Users\arsh2\Documents\open-source-system\backend\sql\schema.sql
```

If the `mysql` CLI is not on PATH, open MySQL Workbench / phpMyAdmin, select an empty connection, and run `backend\sql\schema.sql`.

Database name: `open_source_system` (matches `backend/config/db.js`).

If you already created tables **without** `password_hash`, run:

```sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL AFTER username;
```

## Run

Terminal 1:

```powershell
cd C:\Users\arsh2\Documents\open-source-system\backend
npm start
```

API: http://localhost:4000

Terminal 2:

```powershell
cd C:\Users\arsh2\Documents\open-source-system\client
npm run dev
```

UI: http://localhost:5173 (proxies `/api` to port 4000)

## Production notes

Set these OS environment variables before `npm start` on the server:

- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `DB_HOST` `DB_USER` `DB_PASSWORD` `DB_NAME`
- `CLIENT_ORIGIN` (your frontend origin)
- `PORT` (default 4000)

Passwords are hashed with Argon2. Session tokens are stored hashed in `user_sessions`. JWT access tokens expire in 15 minutes; log in again if the UI starts returning 401.
