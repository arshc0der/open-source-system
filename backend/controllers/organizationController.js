import Organization from "../models/organizationModel.js";
import User from "../models/userModel.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const createOrganization = asyncHandler(async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: "name is required" });
  const org = await Organization.create({
    name: req.body.name,
    display_name: req.body.display_name,
    description: req.body.description,
    ownerUserId: req.user.id,
  });
  res.status(201).json(org);
});

export const myOrganizations = asyncHandler(async (req, res) => {
  res.json(await Organization.listForUser(req.user.id));
});

export const getOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.getById(req.params.id);
  if (!org) return res.status(404).json({ message: "organization not found" });
  const members = await Organization.listMembers(org.id);
  const teams = await Promise.all((await Organization.listTeams(org.id)).map(async (team) => ({
    ...team,
    members: await Organization.listTeamMembers(team.id),
  })));
  res.json({ ...org, members, teams });
});

const requireOrgManager = async (orgId, userId) => {
  const membership = await Organization.getMembership(orgId, userId);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    const err = new Error("organization owner or admin permission required");
    err.status = 403;
    throw err;
  }
};

export const addOrganizationMember = asyncHandler(async (req, res) => {
  const org = await Organization.getById(req.params.id);
  if (!org) return res.status(404).json({ message: "organization not found" });
  await requireOrgManager(org.id, req.user.id);
  const user = req.body.username
    ? await User.getByUsername(req.body.username)
    : await User.getById(req.body.user_id);
  if (!user) return res.status(404).json({ message: "user not found" });
  await Organization.addMember(org.id, user.id, req.body.role || "member");
  res.status(201).json({ message: "member added" });
});

export const createTeam = asyncHandler(async (req, res) => {
  const org = await Organization.getById(req.params.id);
  if (!org) return res.status(404).json({ message: "organization not found" });
  await requireOrgManager(org.id, req.user.id);
  if (!req.body.name) return res.status(400).json({ message: "name is required" });
  res.status(201).json(
    await Organization.createTeam({
      orgId: org.id,
      name: req.body.name,
      description: req.body.description,
    })
  );
});

export const addTeamMember = asyncHandler(async (req, res) => {
  const org = await Organization.getById(req.params.id);
  if (!org) return res.status(404).json({ message: "organization not found" });
  await requireOrgManager(org.id, req.user.id);
  const team = await Organization.getTeam(org.id, req.params.teamId);
  if (!team) return res.status(404).json({ message: "team not found" });
  const user = req.body.username
    ? await User.getByUsername(req.body.username)
    : await User.getById(req.body.user_id);
  if (!user) return res.status(404).json({ message: "user not found" });
  if (!(await Organization.getMembership(org.id, user.id))) {
    return res.status(400).json({ message: "team members must belong to the organization" });
  }
  await Organization.addTeamMember(team.id, user.id);
  res.status(201).json({ message: "team member added" });
});

export const removeTeamMember = asyncHandler(async (req, res) => {
  const org = await Organization.getById(req.params.id);
  if (!org) return res.status(404).json({ message: "organization not found" });
  await requireOrgManager(org.id, req.user.id);
  const team = await Organization.getTeam(org.id, req.params.teamId);
  if (!team) return res.status(404).json({ message: "team not found" });
  await Organization.removeTeamMember(team.id, req.params.userId);
  res.status(204).end();
});
