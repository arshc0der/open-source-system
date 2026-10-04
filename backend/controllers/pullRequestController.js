import PullRequest from "../models/pullRequestModel.js";
import Repository from "../models/repositoryModel.js";
import Issue from "../models/issueModel.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const listPulls = asyncHandler(async (req, res) => {
  const repo = await Repository.getById(req.params.id);
  if (!repo || (repo.visibility === "private" && !(await Repository.canRead(repo.id, req.user?.id)))) return res.status(404).json({ message: "repository not found" });
  res.json(await PullRequest.listByRepo(req.params.id));
});

export const createPull = asyncHandler(async (req, res) => {
  const repo = await Repository.getById(req.params.id);
  if (!repo || (repo.visibility === "private" && !(await Repository.canRead(repo.id, req.user?.id)))) return res.status(404).json({ message: "repository not found" });
  if (!req.body.title) return res.status(400).json({ message: "title is required" });
  if (req.body.issue_id && !(await Issue.belongsToRepo(req.body.issue_id, repo.id))) {
    return res.status(400).json({ message: "linked issue must belong to this repository" });
  }
  const commitIds = req.body.commit_ids || [];
  if (!Array.isArray(commitIds)) return res.status(400).json({ message: "commit_ids must be an array" });
  if (commitIds.length) {
    const commits = await Repository.listCommits(repo.id);
    const allowedIds = new Set(commits.map((commit) => Number(commit.id)));
    if (commitIds.some((id) => !allowedIds.has(Number(id)))) {
      return res.status(400).json({ message: "pull request commits must belong to this repository" });
    }
  }
  const pr = await PullRequest.create({
    repoId: Number(req.params.id),
    userId: req.user.id,
    title: req.body.title,
    body: req.body.body,
    source_branch: req.body.source_branch,
    target_branch: req.body.target_branch,
    issueId: req.body.issue_id,
    commitIds: [...new Set(commitIds.map(Number))],
  });
  res.status(201).json(pr);
});

export const getPull = asyncHandler(async (req, res) => {
  const repo = await Repository.getById(req.params.id);
  if (!repo || (repo.visibility === "private" && !(await Repository.canRead(repo.id, req.user?.id)))) return res.status(404).json({ message: "pull request not found" });
  if (!(await PullRequest.belongsToRepo(req.params.pullId, req.params.id))) {
    return res.status(404).json({ message: "pull request not found" });
  }
  const pr = await PullRequest.getById(req.params.pullId);
  if (!pr) return res.status(404).json({ message: "pull request not found" });
  const reviews = await PullRequest.listReviews(pr.id);
  res.json({ ...pr, reviews });
});

export const updatePullState = asyncHandler(async (req, res) => {
  const repo = await Repository.getById(req.params.id);
  if (!repo || (repo.visibility === "private" && !(await Repository.canRead(repo.id, req.user?.id)))) return res.status(404).json({ message: "pull request not found" });
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  if (!(await PullRequest.belongsToRepo(req.params.pullId, req.params.id))) {
    return res.status(404).json({ message: "pull request not found" });
  }
  const pr = await PullRequest.getById(req.params.pullId);
  if (!pr) return res.status(404).json({ message: "pull request not found" });
  if (!["open", "closed", "merged"].includes(req.body.state)) {
    return res.status(400).json({ message: "state must be open, closed, or merged" });
  }
  res.json(await PullRequest.setState(pr.id, req.body.state));
});

export const reviewPull = asyncHandler(async (req, res) => {
  const repo = await Repository.getById(req.params.id);
  if (!repo || (repo.visibility === "private" && !(await Repository.canRead(repo.id, req.user?.id)))) return res.status(404).json({ message: "pull request not found" });
  if (!(await PullRequest.belongsToRepo(req.params.pullId, req.params.id))) {
    return res.status(404).json({ message: "pull request not found" });
  }
  const pr = await PullRequest.getById(req.params.pullId);
  if (!pr) return res.status(404).json({ message: "pull request not found" });
  if (!["commented", "approved", "changes_requested"].includes(req.body.state)) {
    return res.status(400).json({ message: "state must be commented, approved, or changes_requested" });
  }
  const review = await PullRequest.addReview({
    pullRequestId: pr.id,
    userId: req.user.id,
    state: req.body.state,
    body: req.body.body,
  });
  res.status(201).json(review);
});
