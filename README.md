# Open Source System (OSS)

A full-stack, GitHub-inspired platform for hosting and managing software repositories, collaborating with developers, and organizing development work. The project combines a React-based web client, a Node.js/Express REST API, and a MySQL relational database.

**Repository:** https://github.com/arshc0der/myOS

---

## Table of Contents

- [Overview](#overview)
- [Project Objectives](#project-objectives)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [ER Diagram](#er-diagram)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Overview](#api-overview)
- [Security Considerations](#security-considerations)
- [Development Notes](#development-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

Open Source System (OSS) is a web-based source-code collaboration and repository management application inspired by the core workflows of modern code-hosting platforms. It provides a central place for developers to create repositories, manage project files, collaborate with other users, track issues, and work with pull requests.

The application is organized as a client-server system:

1. The React frontend provides the user interface and communicates with the backend over HTTP.
2. The Express backend exposes REST API routes, applies authentication and authorization middleware, and coordinates application operations.
3. MySQL stores user, repository, collaboration, issue, pull request, and notification data.
4. Repository content is maintained by the backend's repository storage area, while the database stores repository and file metadata.

This repository is an evolving project. Feature availability and implementation details may change as development continues.

## Project Objectives

- Provide a centralized platform for software repository management.
- Support developer profiles and account-based access.
- Enable collaboration through repository members, organizations, and teams.
- Organize development work using issues, labels, comments, and pull requests.
- Present repository activity and notifications in a unified interface.
- Demonstrate full-stack application development using React, Node.js, Express, and MySQL.

## Features

The following areas are represented in the current project structure and backend routes.

### User Accounts and Profiles

- User registration and login.
- Authenticated account information and profile updates.
- Public user and profile lookup.
- Profile avatar upload.
- Follow relationships between users.
- Logout and session handling.

### Repository Management

- Create and browse repositories.
- Repository detail and settings operations.
- Public and private repository visibility.
- Repository stars and watch subscriptions.
- Forking support.
- Branch creation.
- Commit listing and commit creation.
- Repository file browsing and file updates.
- Repository collaborator listing.

### Issues and Project Tracking

- Create and list repository issues.
- Retrieve issue details.
- Close issues.
- Add issue comments.
- Create and list labels.
- Assign users to issues through the database model.

### Pull Requests

- Create and list pull requests.
- Retrieve pull request details.
- Update pull request state.
- Submit pull request reviews.
- Associate commits with pull requests.

### Organizations and Teams

- Create and list organizations associated with the authenticated user.
- Retrieve organization information.
- Add organization members.
- Create teams.
- Add and remove team members.

### Notifications

- Retrieve notifications for the authenticated user.
- Mark notifications as read.

> Note: This feature list reflects the routes, models, and pages present in the supplied source tree. It does not imply that every workflow has been fully tested or is production-ready. Some interface elements or database capabilities may still be under development.

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 | Component-based user interface |
| Frontend tooling | Vite | Development server and production builds |
| Routing | React Router | Client-side navigation |
| Styling | Tailwind CSS 4 and CSS | UI styling |
| Icons | React Icons | Interface iconography |
| Backend runtime | Node.js | JavaScript server runtime |
| Backend framework | Express 5 | REST API and middleware |
| Database | MySQL | Relational data persistence |
| Database driver | mysql2 | MySQL connectivity and promise-based queries |
| Authentication | JSON Web Tokens | Access-token authentication |
| Password security | Argon2 | Password hashing |
| API communication | HTTP/JSON | Frontend-to-backend communication |

## System Architecture

```text
+------------------------------+
|          Web Browser         |
|       React + Vite UI        |
+---------------+--------------+
                |
                | HTTP / JSON
                | /api/*
                v
+------------------------------+
|       Node.js / Express      |
|                              |
| Routes -> Middleware         |
|        -> Controllers        |
|        -> Services / Models  |
+---------------+--------------+
                |
                | mysql2
                v
+------------------------------+
|           MySQL              |
|      open_source_system      |
|                              |
| Users, Repositories, Issues, |
| Pull Requests, Organizations,|
| Teams, Notifications, etc.   |
+------------------------------+

Backend repository storage:
backend/storage/repositories/
```

### Request Flow

1. A user performs an action in the React application.
2. The frontend sends an HTTP request to the relevant `/api` endpoint.
3. Express routes the request to the appropriate controller.
4. Authentication middleware validates protected requests.
5. Controllers and services perform application operations using the MySQL connection pool and repository storage where applicable.
6. The API returns a JSON response to the frontend.

## Project Structure

```text
open-source-system/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── service/
│   ├── sql/
│   │   └── schema.sql
│   ├── storage/
│   │   └── repositories/
│   ├── index.js
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── Component/
│   │   ├── Pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

### Backend

The backend is divided by responsibility:

- `config/` — database connection and runtime configuration.
- `controllers/` — request handling and application operations.
- `middleware/` — authentication, authorization-related checks, and error handling.
- `models/` — database access and domain data operations.
- `routes/` — REST endpoint definitions.
- `service/` — authentication, hashing, and token-related services.
- `sql/` — database schema and SQL setup.
- `storage/` — repository content managed by the application.
- `index.js` — Express application entry point.

### Frontend

The frontend contains:

- `Pages/` — application screens such as dashboard, login, registration, profile, repositories, repository details, organizations, and notifications.
- `Component/` — reusable interface components.
- `api.js` — frontend API communication.
- `App.jsx` — application routing and composition.
- `main.jsx` — frontend entry point.

## Database Design

The application uses **MySQL** as its relational database. The database name configured by default is:

```text
open_source_system
```

The canonical schema is maintained at:

```text
backend/sql/schema.sql
```

The schema currently defines the following 26 tables:

| Domain | Tables |
|---|---|
| Accounts | `users`, `user_emails`, `user_sessions` |
| Organizations and teams | `organizations`, `organization_members`, `teams`, `team_members` |
| Social relationships | `followers` |
| Repository metadata | `repositories`, `repository_members`, `repository_topics`, `topics` |
| Repository activity | `commits`, `branches`, `stars`, `watchers`, `repository_files` |
| Issue tracking | `issues`, `issue_comments`, `labels`, `issue_labels`, `issue_assignees` |
| Pull requests | `pull_requests`, `pull_request_commits`, `pull_request_reviews` |
| Notifications | `notifications` |

### Database Design Notes

- InnoDB is used for relational tables and foreign-key constraints.
- `utf8mb4` character encoding is configured for the database.
- Foreign keys define relationships between users, repositories, organizations, issues, and other entities.
- Unique constraints help prevent duplicate usernames, repository names, and other domain-specific duplicates.
- Indexes are defined for commonly queried relationships.
- User passwords are stored as hashes, not as plaintext passwords.
- Session token hashes are stored separately from short-lived access tokens.

The SQL schema is the source of truth for the current database structure. If the schema changes, update this section and the ER diagram together.

## ER Diagram

The Entity Relationship (ER) diagram will be maintained as part of the project documentation. It will illustrate the database entities, primary keys, foreign keys, and relationships between users, repositories, organizations, teams, issues, pull requests, and notifications.

**ER diagram location (planned):**

```text
docs/diagrams/er-diagram.png
```

Add the exported ER diagram image at the path above, then uncomment the image reference below:

<!--
![Open Source System Entity Relationship Diagram](docs/diagrams/er-diagram.png)
-->

The diagram is intentionally left as a placeholder until the project maintainer adds the finalized ER diagram. The SQL schema in `backend/sql/schema.sql` should be used to verify the diagram.

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js (a current LTS release is recommended).
- npm (included with Node.js).
- MySQL Server 8.0 or a compatible MySQL release.
- Git.
- A terminal or command prompt.

### 1. Clone the Repository

```bash
git clone https://github.com/arshc0der/myOS.git
cd myOS
```

### 2. Configure MySQL

Start your MySQL server and create the database by importing the provided schema.

From the project root, run:

```bash
mysql -u root -p < backend/sql/schema.sql
```

Enter your MySQL password when prompted.

Alternatively, open `backend/sql/schema.sql` in MySQL Workbench or another MySQL client and execute the script.

The schema creates the `open_source_system` database if it does not already exist.

### 3. Configure the Backend

The backend reads its configuration from environment variables. See [Environment Configuration](#environment-configuration).

The default local database configuration is:

- Host: `localhost`
- Port: MySQL default port
- User: `root`
- Database: `open_source_system`

If your MySQL username or password differs, configure `DB_USER` and `DB_PASSWORD` before starting the backend.

### 4. Install Backend Dependencies

Open a terminal:

```bash
cd backend
npm install
```

### 5. Install Frontend Dependencies

Open another terminal from the project root:

```bash
cd client
npm install
```

## Environment Configuration

The backend uses operating-system environment variables. No `.env` loader is configured in the current backend package, so setting values in a `.env` file alone will not automatically load them.

Configure these variables in your shell or deployment environment:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend HTTP port | `4000` |
| `CLIENT_ORIGIN` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | Empty string |
| `DB_NAME` | MySQL database name | `open_source_system` |
| `ACCESS_TOKEN_SECRET` | Secret used to sign access tokens | Development fallback; replace it |
| `REFRESH_TOKEN_SECRET` | Secret used to sign refresh/session tokens | Development fallback; replace it |

**Important:** Always set strong, unique token secrets in production. Never commit production credentials, database passwords, or private keys to the repository.

### PowerShell Example

Run these commands in the backend terminal before starting the server:

```powershell
$env:DB_HOST = "localhost"
$env:DB_USER = "root"
$env:DB_PASSWORD = "your_mysql_password"
$env:DB_NAME = "open_source_system"
$env:ACCESS_TOKEN_SECRET = "replace_with_a_long_random_secret"
$env:REFRESH_TOKEN_SECRET = "replace_with_another_long_random_secret"
$env:CLIENT_ORIGIN = "http://localhost:5173"
$env:PORT = "4000"
```

Replace the example password and secrets with your own values. Do not use the example secrets in a real deployment.

## Running the Application

Run the backend and frontend in separate terminals.

### Start the Backend

```bash
cd backend
npm start
```

For development with Node's watch mode:

```bash
npm run dev
```

The backend API is available at:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

### Start the Frontend

In a second terminal:

```bash
cd client
npm run dev
```

Vite will display the local development URL. By default, it is:

```text
http://localhost:5173
```

The Vite development server is configured to proxy `/api` and `/uploads` requests to the backend at `http://localhost:4000`.

### Build the Frontend

```bash
cd client
npm run build
```

To preview a production build locally:

```bash
npm run preview
```

To run the configured lint check:

```bash
npm run lint
```

## API Overview

The backend exposes REST endpoints under the `/api` prefix. The following table summarizes the route groups currently registered in the application.

| Base path | Purpose |
|---|---|
| `/api/health` | API health check |
| `/api/auth` | Registration, login, and logout |
| `/api/me` | Current authenticated user's profile and account operations |
| `/api/users` | User listing, lookup, and follow operations |
| `/api/profile` | Public profile lookup |
| `/api/repos` | Repository management, files, commits, branches, stars, and forks |
| `/api/repos/:id/issues` | Repository issues, comments, labels, and collaborators |
| `/api/repos/:id/pulls` | Pull requests and reviews |
| `/api/organizations` | Organization and team management |
| `/api/notifications` | Notification listing and read status |

### Example Health Check

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "ok": true
}
```

Protected endpoints require a valid authentication token according to the backend authentication middleware. Refer to the route files in `backend/routes/` for the current endpoint methods and parameters.

## Security Considerations

Security is an important part of a repository collaboration platform. The current codebase includes the following mechanisms:

- Argon2-based password hashing.
- JSON Web Token-based authentication.
- Short-lived access tokens (15-minute configured lifetime).
- Hashed session tokens stored in the `user_sessions` table.
- Authentication middleware for protected routes.
- Foreign-key constraints and database-level integrity rules.

Before deploying publicly, review and strengthen the following:

- Replace all development fallback secrets with strong environment-specific secrets.
- Use HTTPS for all production traffic.
- Restrict database network access and use a dedicated database account with least-privilege permissions.
- Validate and sanitize all user input.
- Review authorization checks for repository ownership, organization membership, and collaborator permissions.
- Apply upload type, size, and content validation.
- Configure production CORS origins explicitly.
- Add rate limiting and monitoring for authentication endpoints.
- Back up the database and repository storage regularly.
- Keep dependencies updated and review security advisories.

## Development Notes

- Keep the database schema in `backend/sql/schema.sql` synchronized with model changes.
- Keep frontend API calls aligned with the backend route definitions.
- Do not commit `node_modules`, generated build output, local secrets, or private user data.
- Test authentication and authorization for both permitted and forbidden operations.
- Treat repository files and uploaded content as untrusted input.
- Update the ER diagram whenever database relationships change.

## Roadmap

Potential areas for continued development include:

- Complete and publish the ER diagram and database documentation.
- Add automated backend and frontend tests.
- Add API reference documentation with request and response examples.
- Improve repository file browsing and code viewing.
- Expand pull request review and merge workflows.
- Add advanced search and filtering for repositories and issues.
- Improve role-based access control for organizations and repositories.
- Add audit logs and more detailed activity feeds.
- Add CI workflows and deployment documentation.
- Improve production observability, backups, and operational security.

This roadmap describes possible future work and is not a claim that these items are already implemented.

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and add or update tests where appropriate.
4. Run the relevant lint and build checks.
5. Commit your changes with a clear message:

   ```bash
   git commit -m "Add: describe your change"
   ```

6. Push your branch and open a Pull Request describing the change.

For substantial changes, open an issue first to discuss the proposed implementation.

## License

A license has not yet been specified in this repository. Until a license is added, do not assume that the project is available for unrestricted reuse, modification, or redistribution.

To make the project open source, add a suitable `LICENSE` file and update this section with the selected license.

## Project Links

- **GitHub Repository:** https://github.com/arshc0der/myOS
- **Issue Tracker:** https://github.com/arshc0der/myOS/issues
- **Pull Requests:** https://github.com/arshc0der/myOS/pulls

---

Maintained as an evolving full-stack software project.
