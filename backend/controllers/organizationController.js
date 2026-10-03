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
  const teams = await Organization.listTeams(org.id);
  res.json({ ...org, members, teams });
});

export const addOrganizationMember = asyncHandler(async (req, res) => {
  const org = await Organization.getById(req.params.id);
  if (!org) return res.status(404).json({ message: "organization not found" });
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
  if (!req.body.name) return res.status(400).json({ message: "name is required" });
  res.status(201).json(
    await Organization.createTeam({
      orgId: org.id,
      name: req.body.name,
      description: req.body.description,
    })
  );
});
