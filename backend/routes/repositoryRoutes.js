import express from "express";
import {
  listRepositories,
  createRepository,
  getRepository,
  starRepository,
  forkRepository,
  listCommits,
  createCommit,
  getRepositoryFile,
  updateRepositoryFile,
  watchRepository,
  updateRepositorySettings,
  createRepositoryBranch,
  deleteRepositoryFile,
  deleteRepository,
} from "../controllers/repositoryController.js";
import {
  listIssues,
  createIssue,
  getIssue,
  closeIssue,
  addIssueComment,
  listLabels,
  createLabel,
  listCollaborators,
} from "../controllers/issueController.js";
import {
  listPulls,
  createPull,
  getPull,
  updatePullState,
  reviewPull,
} from "../controllers/pullRequestController.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", listRepositories);
router.post("/", requireAuth, createRepository);

// Numeric-id routes must be registered before /:owner/:name.
router.get("/id/:id", optionalAuth, getRepository);
router.post("/:id/star", requireAuth, starRepository);
router.post("/:id/watch", requireAuth, watchRepository);
router.patch("/:id/settings", requireAuth, updateRepositorySettings);
router.post("/:id/branches", requireAuth, createRepositoryBranch);
router.delete("/:id", requireAuth, deleteRepository);
router.post("/:id/fork", requireAuth, forkRepository);
router.get("/:id/commits", optionalAuth, listCommits);
router.post("/:id/commits", requireAuth, createCommit);
router.get("/:id/files/*filePath", optionalAuth, getRepositoryFile);
router.put("/:id/files/*filePath", requireAuth, updateRepositoryFile);
router.delete("/:id/files/*filePath", requireAuth, deleteRepositoryFile);

router.get("/:id/issues", optionalAuth, listIssues);
router.post("/:id/issues", requireAuth, createIssue);
router.get("/:id/issues/:issueId", optionalAuth, getIssue);
router.patch("/:id/issues/:issueId", requireAuth, closeIssue);
router.post("/:id/issues/:issueId/comments", requireAuth, addIssueComment);

router.get("/:id/labels", optionalAuth, listLabels);
router.post("/:id/labels", requireAuth, createLabel);
router.get("/:id/collaborators", optionalAuth, listCollaborators);

router.get("/:id/pulls", optionalAuth, listPulls);
router.post("/:id/pulls", requireAuth, createPull);
router.get("/:id/pulls/:pullId", optionalAuth, getPull);
router.patch("/:id/pulls/:pullId", requireAuth, updatePullState);
router.post("/:id/pulls/:pullId/reviews", requireAuth, reviewPull);

router.get("/:owner/:name", optionalAuth, getRepository);

export default router;
