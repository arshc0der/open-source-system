import Issue from "../models/issueModel.js";
import Repository from "../models/repositoryModel.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const repoOr404 = async (id, userId) => {
  const repo = await Repository.getById(id);
  if (!repo || (repo.visibility === "private" && !(await Repository.canRead(repo.id, userId)))) {
    const err = new Error("repository not found");
    err.status = 404;
    throw err;
  }
  return repo;
};

export const listIssues = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id, req.user?.id);
  res.json(await Issue.listByRepo(req.params.id));
});

export const createIssue = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id, req.user?.id);
  const { title, body, assignee_ids = [], label_ids = [] } = req.body;
  if (!title) return res.status(400).json({ message: "title is required" });
  if (!Array.isArray(assignee_ids) || !Array.isArray(label_ids)) {
    return res.status(400).json({ message: "assignee_ids and label_ids must be arrays" });
  }
  const [collaborators, labels] = await Promise.all([
    Repository.listCollaborators(req.params.id),
    Issue.listLabels(req.params.id),
  ]);
  const collaboratorIds = new Set(collaborators.map((user) => Number(user.id)));
  const labelIds = new Set(labels.map((label) => Number(label.id)));
  if (assignee_ids.some((id) => !collaboratorIds.has(Number(id)))) {
    return res.status(400).json({ message: "assignees must be repository collaborators" });
  }
  if (label_ids.some((id) => !labelIds.has(Number(id)))) {
    return res.status(400).json({ message: "labels must belong to this repository" });
  }
  const issue = await Issue.create({
    repoId: Number(req.params.id),
    userId: req.user.id,
    title,
    body,
    assigneeIds: [...new Set(assignee_ids.map(Number))],
    labelIds: [...new Set(label_ids.map(Number))],
  });
  res.status(201).json(issue);
});

export const getIssue = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id, req.user?.id);
  if (!(await Issue.belongsToRepo(req.params.issueId, req.params.id))) {
    return res.status(404).json({ message: "issue not found" });
  }
  const issue = await Issue.getById(req.params.issueId);
  if (!issue) return res.status(404).json({ message: "issue not found" });
  const comments = await Issue.listComments(issue.id);
  res.json({ ...issue, comments });
});

export const closeIssue = asyncHandler(async (req, res) => {
  const repo = await repoOr404(req.params.id, req.user?.id);
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  if (!(await Issue.belongsToRepo(req.params.issueId, req.params.id))) {
    return res.status(404).json({ message: "issue not found" });
  }
  const issue = await Issue.getById(req.params.issueId);
  if (!issue) return res.status(404).json({ message: "issue not found" });
  const state = req.body.state || "closed";
  if (!["open", "closed"].includes(state)) {
    return res.status(400).json({ message: "state must be open or closed" });
  }
  res.json(await Issue.setState(issue.id, state));
});

export const addIssueComment = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id, req.user?.id);
  if (!(await Issue.belongsToRepo(req.params.issueId, req.params.id))) {
    return res.status(404).json({ message: "issue not found" });
  }
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
  await repoOr404(req.params.id, req.user?.id);
  res.json(await Issue.listLabels(req.params.id));
});

export const listCollaborators = asyncHandler(async (req, res) => {
  await repoOr404(req.params.id, req.user?.id);
  res.json(await Repository.listCollaborators(req.params.id));
});

export const createLabel = asyncHandler(async (req, res) => {
  const repo = await repoOr404(req.params.id, req.user?.id);
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  if (!req.body.name) return res.status(400).json({ message: "name is required" });
  res.status(201).json(
    await Issue.createLabel({
      repoId: Number(req.params.id),
      name: req.body.name,
      color: req.body.color,
    })
  );
});
