import Repository from "../models/repositoryModel.js";
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
  const { name, description, visibility, language, topics } = req.body;
  if (!name) return res.status(400).json({ message: "name is required" });
  const repo = await Repository.create({
    ownerUserId: req.user.id,
    name,
    description,
    visibility,
    language,
  });
  if (topics) await Repository.setTopics(repo.id, topics);
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
  const [commits, branches, files, topics, starred] = await Promise.all([
    Repository.listCommits(repo.id),
    Repository.listBranches(repo.id),
    Repository.listFiles(repo.id),
    Repository.getTopics(repo.id),
    Repository.isStarred(repo.id, req.user?.id),
  ]);
  res.json({ ...repo, commits, branches, files, topics, starred });
});

export const starRepository = asyncHandler(async (req, res) => {
  await ensureRepo(req.params.id);
  const result = await Repository.toggleStar(req.params.id, req.user.id);
  res.json(result);
});

export const forkRepository = asyncHandler(async (req, res) => {
  const forked = await Repository.fork(req.params.id, req.user.id);
  res.status(201).json(forked);
});

export const listCommits = asyncHandler(async (req, res) => {
  await ensureRepo(req.params.id);
  res.json(await Repository.listCommits(req.params.id));
});

export const createCommit = asyncHandler(async (req, res) => {
  await ensureRepo(req.params.id);
  if (!req.body.message) return res.status(400).json({ message: "message is required" });
  const commit = await Repository.addCommit(req.params.id, req.user.id, req.body.message);
  res.status(201).json(commit);
});
