import express from "express";
import {
  listRepositories,
  createRepository,
  getRepository,
  starRepository,
  forkRepository,
  listCommits,
  createCommit,
} from "../controllers/repositoryController.js";
import {
  listIssues,
  createIssue,
  getIssue,
  closeIssue,
  addIssueComment,
  listLabels,
  createLabel,
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
router.post("/:id/fork", requireAuth, forkRepository);
router.get("/:id/commits", listCommits);
router.post("/:id/commits", requireAuth, createCommit);

router.get("/:id/issues", listIssues);
router.post("/:id/issues", requireAuth, createIssue);
router.get("/:id/issues/:issueId", getIssue);
router.patch("/:id/issues/:issueId", requireAuth, closeIssue);
router.post("/:id/issues/:issueId/comments", requireAuth, addIssueComment);

router.get("/:id/labels", listLabels);
router.post("/:id/labels", requireAuth, createLabel);

router.get("/:id/pulls", listPulls);
router.post("/:id/pulls", requireAuth, createPull);
router.get("/:id/pulls/:pullId", getPull);
router.patch("/:id/pulls/:pullId", requireAuth, updatePullState);
router.post("/:id/pulls/:pullId/reviews", requireAuth, reviewPull);

router.get("/:owner/:name", optionalAuth, getRepository);

export default router;
