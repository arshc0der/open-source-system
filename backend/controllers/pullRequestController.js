import PullRequest from "../models/pullRequestModel.js";
import Repository from "../models/repositoryModel.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const listPulls = asyncHandler(async (req, res) => {
  const repo = await Repository.getById(req.params.id);
  if (!repo) return res.status(404).json({ message: "repository not found" });
  res.json(await PullRequest.listByRepo(req.params.id));
});

export const createPull = asyncHandler(async (req, res) => {
  const repo = await Repository.getById(req.params.id);
  if (!repo) return res.status(404).json({ message: "repository not found" });
  if (!req.body.title) return res.status(400).json({ message: "title is required" });
  const pr = await PullRequest.create({
    repoId: Number(req.params.id),
    userId: req.user.id,
    title: req.body.title,
    body: req.body.body,
    source_branch: req.body.source_branch,
    target_branch: req.body.target_branch,
  });
  res.status(201).json(pr);
});

export const getPull = asyncHandler(async (req, res) => {
  const pr = await PullRequest.getById(req.params.pullId);
  if (!pr) return res.status(404).json({ message: "pull request not found" });
  const reviews = await PullRequest.listReviews(pr.id);
  res.json({ ...pr, reviews });
});

export const updatePullState = asyncHandler(async (req, res) => {
  const pr = await PullRequest.getById(req.params.pullId);
  if (!pr) return res.status(404).json({ message: "pull request not found" });
  res.json(await PullRequest.setState(pr.id, req.body.state));
});

export const reviewPull = asyncHandler(async (req, res) => {
  const pr = await PullRequest.getById(req.params.pullId);
  if (!pr) return res.status(404).json({ message: "pull request not found" });
  const review = await PullRequest.addReview({
    pullRequestId: pr.id,
    userId: req.user.id,
    state: req.body.state,
    body: req.body.body,
  });
  res.status(201).json(review);
});
