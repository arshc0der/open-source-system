import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import Repository from "../models/repositoryModel.js";

test("normalizeRelativePath strips traversal and normalizes separators", () => {
  assert.equal(Repository.normalizeRelativePath("../../tmp/../docs/README.md"), "docs/README.md");
  assert.equal(Repository.normalizeRelativePath("src\\app\\main.js"), "src/app/main.js");
  assert.equal(Repository.normalizeRelativePath("/unsafe/../index.js"), "index.js");
});

test("getRepoStorageDir resolves a repo storage folder", () => {
  const root = Repository.getRepoStorageDir(42);
  assert.equal(path.basename(root), "42");
  assert.ok(root.includes(path.join("storage", "repositories")));
});
