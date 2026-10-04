import Repository from "../models/repositoryModel.js";
import Organization from "../models/organizationModel.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const ensureRepo = async (id) => {
  const repo = await Repository.getById(id);
  if (!repo) {
    const err = new Error("repository not found");
    err.status = 404;
    throw err;
  }
  return repo;
};

export const listRepositories = asyncHandler(async (req, res) => {
  const repos = await Repository.listPublic({ q: req.query.q });
  res.json(repos);
});

export const createRepository = asyncHandler(async (req, res) => {
  const { name, description, visibility, language, topics, files, owner_organization_id } = req.body;
  if (!name) return res.status(400).json({ message: "name is required" });
  if (visibility && !["public", "private"].includes(visibility)) {
    return res.status(400).json({ message: "visibility must be public or private" });
  }
  if (topics !== undefined && !Array.isArray(topics)) {
    return res.status(400).json({ message: "topics must be an array" });
  }
  let ownerOrganizationId = null;
  if (owner_organization_id) {
    ownerOrganizationId = Number(owner_organization_id);
    const membership = await Organization.getMembership(ownerOrganizationId, req.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return res.status(403).json({ message: "organization owner or admin permission required to create repositories" });
    }
  }
  const repo = await Repository.create({
    ownerUserId: req.user.id,
    ownerOrganizationId,
    name,
    description,
    visibility,
    language,
    files: Array.isArray(files) ? files : [],
  });
  if (topics !== undefined) {
    await Repository.setTopics(repo.id, topics);
  }
  repo.topics = await Repository.getTopics(repo.id);
  res.status(201).json(repo);
});

export const getRepository = asyncHandler(async (req, res) => {
  let repo;
  if (req.params.owner && req.params.name) {
    repo = await Repository.getByFullName(`${req.params.owner}/${req.params.name}`);
  } else {
    repo = await Repository.getById(req.params.id);
  }
  if (!repo) return res.status(404).json({ message: "repository not found" });
  if (repo.visibility === "private" && !(await Repository.canRead(repo.id, req.user?.id))) {
    return res.status(404).json({ message: "repository not found" });
  }
  const [commits, branches, files, topics, starred] = await Promise.all([
    Repository.listCommits(repo.id),
    Repository.listBranches(repo.id),
    Repository.listFiles(repo.id),
    Repository.getTopics(repo.id),
    Repository.isStarred(repo.id, req.user?.id),
  ]);
  const watching = await Repository.isWatching(repo.id, req.user?.id);
  const canWrite = await Repository.canWrite(repo.id, req.user?.id);
  res.json({ ...repo, commits, branches, files, topics, starred, watching, can_write: canWrite });
});

export const watchRepository = asyncHandler(async (req, res) => {
  const repo = await Repository.getById(req.params.id);
  if (!repo) return res.status(404).json({ message: "repository not found" });
  const watching = await Repository.toggleWatcher(repo.id, req.user.id);
  res.json({ watching });
});

export const starRepository = asyncHandler(async (req, res) => {
  await ensureRepo(req.params.id);
  const result = await Repository.toggleStar(req.params.id, req.user.id);
  res.json(result);
});

export const forkRepository = asyncHandler(async (req, res) => {
  const source = await ensureRepo(req.params.id);
  if (source.visibility === "private" && !(await Repository.canRead(source.id, req.user.id))) {
    return res.status(404).json({ message: "repository not found" });
  }
  const forked = await Repository.fork(source.id, req.user.id);
  res.status(201).json(forked);
});

export const listCommits = asyncHandler(async (req, res) => {
  const repo = await ensureRepo(req.params.id);
  if (repo.visibility === "private" && !(await Repository.canRead(repo.id, req.user?.id))) {
    return res.status(404).json({ message: "repository not found" });
  }
  res.json(await Repository.listCommits(req.params.id));
});

export const createCommit = asyncHandler(async (req, res) => {
  const repo = await ensureRepo(req.params.id);
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  if (!req.body.message) return res.status(400).json({ message: "message is required" });
  const commit = await Repository.addCommit(req.params.id, req.user.id, req.body.message);
  res.status(201).json(commit);
});

export const getRepositoryFile = asyncHandler(async (req, res) => {
  const repo = await ensureRepo(req.params.id);
  if (repo.visibility === "private" && !(await Repository.canRead(repo.id, req.user?.id))) {
    return res.status(404).json({ message: "repository not found" });
  }
  const fileParam = Array.isArray(req.params.filePath)
    ? req.params.filePath.join("/")
    : (req.params.filePath || "");
  const requestedPath = decodeURIComponent(fileParam.replace(/^\/+/, ""));
  const filePath = Repository.normalizeRelativePath(requestedPath);
  if (!filePath) return res.status(400).json({ message: "file path is required" });

  const entry = await Repository.readFileContent(repo.id, filePath);
  res.json({ path: filePath, content: entry, type: "file" });
});

export const updateRepositoryFile = asyncHandler(async (req, res) => {
  const repo = await ensureRepo(req.params.id);
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  const fileParam = Array.isArray(req.params.filePath)
    ? req.params.filePath.join("/")
    : (req.params.filePath || "");
  const filePath = Repository.normalizeRelativePath(decodeURIComponent(fileParam.replace(/^\/+/, "")));
  if (!filePath) return res.status(400).json({ message: "file path is required" });
  if (typeof req.body.content !== "string") {
    return res.status(400).json({ message: "content must be a string" });
  }
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ message: "commit message is required" });
  if (message.length > 500) return res.status(400).json({ message: "commit message must be 500 characters or fewer" });
  const result = await Repository.commitFile({
    repoId: repo.id,
    userId: req.user.id,
    filePath,
    content: req.body.content,
    message,
    branchName: req.body.branch || repo.default_branch,
  });
  res.status(201).json(result);
});

export const updateRepositorySettings = asyncHandler(async (req, res) => {
  const repo = await ensureRepo(req.params.id);
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  if (req.body.visibility && !["public", "private"].includes(req.body.visibility)) {
    return res.status(400).json({ message: "visibility must be public or private" });
  }
  const updated = await Repository.updateSettings(repo.id, {
    name: req.body.name,
    description: req.body.description,
    language: req.body.language,
    visibility: req.body.visibility,
  });
  res.json(updated);
});

export const deleteRepository = asyncHandler(async (req, res) => {
  const repo = await ensureRepo(req.params.id);
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  await Repository.deleteRepository(repo.id);
  res.status(204).end();
});

export const createRepositoryBranch = asyncHandler(async (req, res) => {
  const repo = await ensureRepo(req.params.id);
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  const branch = await Repository.createBranch(repo.id, req.body.name, req.body.source_branch || repo.default_branch);
  res.status(201).json(branch);
});

export const deleteRepositoryFile = asyncHandler(async (req, res) => {
  const repo = await ensureRepo(req.params.id);
  if (!(await Repository.canWrite(repo.id, req.user.id))) {
    return res.status(403).json({ message: "write access to this repository is required" });
  }
  const fileParam = Array.isArray(req.params.filePath)
    ? req.params.filePath.join("/")
    : (req.params.filePath || "");
  const filePath = Repository.normalizeRelativePath(decodeURIComponent(fileParam.replace(/^\/+/, "")));
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ message: "commit message is required" });
  const result = await Repository.deleteFileWithCommit({
    repoId: repo.id,
    userId: req.user.id,
    filePath,
    message,
    branchName: req.body.branch || repo.default_branch,
  });
  res.json(result);
});
