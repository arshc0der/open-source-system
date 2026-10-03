-- =============================================================================
-- OSS (Open Source System) — production MySQL schema
-- GitHub-like clone. Apply once: mysql -u root -p < sql/schema.sql
-- Database name must match backend/config/db.js (open_source_system).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS open_source_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE open_source_system;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Parent tables (no inbound FKs)
-- -----------------------------------------------------------------------------

-- Application accounts. password_hash is required for login (Argon2).
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  -- Argon2id hash; never store plaintext passwords.
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(255),
  company VARCHAR(255),
  website_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Company / group owners of repositories.
CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  description TEXT,
  avatar_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Shared topic tags (e.g. javascript, devops).
CREATE TABLE IF NOT EXISTS topics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. Tables that depend on users or organizations
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_emails (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_emails_user (user_id)
) ENGINE=InnoDB;

-- Opaque session tokens (hashed). Complements short-lived JWTs.
CREATE TABLE IF NOT EXISTS user_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teams (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY uq_team_org_name (organization_id, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_members (
  team_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS followers (
  follower_user_id BIGINT NOT NULL,
  followed_user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_user_id, followed_user_id),
  FOREIGN KEY (follower_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followed_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_no_self_follow CHECK (follower_user_id <> followed_user_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. Repositories, commits, branches, stars
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS repositories (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_user_id BIGINT,
  owner_organization_id BIGINT,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(500) NOT NULL UNIQUE,
  description TEXT,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  default_branch VARCHAR(255) DEFAULT 'main',
  is_fork BOOLEAN NOT NULL DEFAULT FALSE,
  parent_repository_id BIGINT,
  -- UI language badge (not a git object).
  language VARCHAR(80),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id)
  REFERENCES users(id)
  ON DELETE RESTRICT,
FOREIGN KEY (owner_organization_id)
  REFERENCES organizations(id)
  ON DELETE RESTRICT,
  FOREIGN KEY (parent_repository_id) REFERENCES repositories(id) ON DELETE SET NULL,
  CONSTRAINT chk_repo_owner CHECK (
    (owner_user_id IS NOT NULL AND owner_organization_id IS NULL)
    OR (owner_user_id IS NULL AND owner_organization_id IS NOT NULL)
  ),
  CONSTRAINT chk_repo_visibility CHECK (visibility IN ('public', 'private')),
  INDEX idx_repos_owner_user (owner_user_id),
  INDEX idx_repos_owner_org (owner_organization_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS repository_members (
  repository_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  permission VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (repository_id, user_id),
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_repo_permission CHECK (permission IN ('read', 'write', 'admin'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS repository_topics (
  repository_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  PRIMARY KEY (repository_id, topic_id),
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS commits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  repository_id BIGINT NOT NULL,
  sha VARCHAR(40) NOT NULL,
  author_user_id BIGINT,
  commit_message TEXT NOT NULL,
  committed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_commit_sha (repository_id, sha),
  INDEX idx_commits_repo (repository_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS branches (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  repository_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  head_commit_id BIGINT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (head_commit_id) REFERENCES commits(id) ON DELETE SET NULL,
  UNIQUE KEY uq_branch_name (repository_id, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stars (
  repository_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (repository_id, user_id),
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- GitHub "Watch" / subscribe to repo activity.
CREATE TABLE IF NOT EXISTS watchers (
  repository_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (repository_id, user_id),
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Lightweight file tree for the repo browser (metadata clone, not git objects).
CREATE TABLE IF NOT EXISTS repository_files (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  repository_id BIGINT NOT NULL,
  path VARCHAR(1024) NOT NULL,
  is_directory BOOLEAN NOT NULL DEFAULT FALSE,
  commit_message VARCHAR(500),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  INDEX idx_files_repo (repository_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. Issues, comments, labels, assignees
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS issues (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  repository_id BIGINT NOT NULL,
  author_user_id BIGINT,
  issue_number BIGINT NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT,
  state VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_issue_number (repository_id, issue_number),
  CONSTRAINT chk_issue_state CHECK (state IN ('open', 'closed')),
  INDEX idx_issues_repo (repository_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issue_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  issue_id BIGINT NOT NULL,
  author_user_id BIGINT,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS labels (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  repository_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(6) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_label_name (repository_id, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issue_labels (
  issue_id BIGINT NOT NULL,
  label_id BIGINT NOT NULL,
  PRIMARY KEY (issue_id, label_id),
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issue_assignees (
  issue_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  PRIMARY KEY (issue_id, user_id),
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. Pull requests
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pull_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  repository_id BIGINT NOT NULL,
  author_user_id BIGINT,
  issue_id BIGINT,
  pull_number BIGINT NOT NULL,
  title VARCHAR(500) NOT NULL,
  body TEXT,
  state VARCHAR(20) NOT NULL DEFAULT 'open',
  source_branch VARCHAR(255) NOT NULL DEFAULT 'feature',
  target_branch VARCHAR(255) NOT NULL DEFAULT 'main',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL,
  UNIQUE KEY uq_pr_number (repository_id, pull_number),
  CONSTRAINT chk_pr_state CHECK (state IN ('open', 'closed', 'merged')),
  INDEX idx_prs_repo (repository_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pull_request_commits (
  pull_request_id BIGINT NOT NULL,
  commit_id BIGINT NOT NULL,
  PRIMARY KEY (pull_request_id, commit_id),
  FOREIGN KEY (pull_request_id) REFERENCES pull_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (commit_id) REFERENCES commits(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pull_request_reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pull_request_id BIGINT NOT NULL,
  author_user_id BIGINT NOT NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'commented',
  body TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pull_request_id) REFERENCES pull_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_review_state CHECK (state IN ('commented', 'approved', 'changes_requested'))
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. Notifications
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  repository_id BIGINT,
  issue_id BIGINT,
  pull_request_id BIGINT,
  notification_type VARCHAR(50) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (pull_request_id) REFERENCES pull_requests(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, is_read)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
