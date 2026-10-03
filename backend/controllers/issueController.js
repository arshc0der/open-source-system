import Issue from "../models/issueModel.js";
import Repository from "../models/repositoryModel.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const repoOr404 = async (id) => {
  const repo = await Repository.getById(id);
  if (!repo) {
    const err = new Error("repository not found");
    err.status = 404;
    throw err;
  }
  return repo;
};

export const listIssues = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id);
  res.json(await Issue.listByRepo(req.params.id));
});

export const createIssue = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id);
  const { title, body } = req.body;
  if (!title) return res.status(400).json({ message: "title is required" });
  const issue = await Issue.create({
    repoId: Number(req.params.id),
    userId: req.user.id,
    title,
    body,
  });
  res.status(201).json(issue);
});

export const getIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.getById(req.params.issueId);
  if (!issue) return res.status(404).json({ message: "issue not found" });
  const comments = await Issue.listComments(issue.id);
  res.json({ ...issue, comments });
});

export const closeIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.getById(req.params.issueId);
  if (!issue) return res.status(404).json({ message: "issue not found" });
  res.json(await Issue.setState(issue.id, req.body.state || "closed"));
});

export const addIssueComment = asyncHandler(async (req, res) => {
  const issue = await Issue.getById(req.params.issueId);
  if (!issue) return res.status(404).json({ message: "issue not found" });
  if (!req.body.body) return res.status(400).json({ message: "body is required" });
  const comment = await Issue.addComment({
    issueId: issue.id,
    userId: req.user.id,
    body: req.body.body,
  });
  res.status(201).json(comment);
});

export const listLabels = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id);
  res.json(await Issue.listLabels(req.params.id));
});

export const createLabel = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id);
  if (!req.body.name) return res.status(400).json({ message: "name is required" });
  res.status(201).json(
    await Issue.createLabel({
      repoId: Number(req.params.id),
      name: req.body.name,
      color: req.body.color,
    })
  );
});
