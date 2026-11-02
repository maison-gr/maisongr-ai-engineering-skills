// Checks the repository for the mistakes that break installation or let files drift apart.
//
//   node scripts/validate.mjs

import { readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { root, read, outputs } from "./build.mjs";

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

// Top-level "key: value" pairs of a YAML frontmatter block. Nested keys are skipped;
// the checks below only need top-level scalars.
function frontmatter(path) {
  const text = read(path);
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { data: null, body: text };
  const data = {};
  for (const line of match[1].split("\n")) {
    const pair = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (pair) data[pair[1]] = pair[2].replace(/^["']|["']$/g, "");
  }
  return { data, body: text.slice(match[0].length) };
}

function json(path) {
  try {
    return JSON.parse(read(path));
  } catch (error) {
    fail(path, `invalid JSON (${error.message})`);
    return {};
  }
}

// Skills: Agent Skills specification (agentskills.io/specification).
const skillNames = new Set();
for (const dir of readdirSync(join(root, "skills"))) {
  const path = `skills/${dir}/SKILL.md`;
  if (!existsSync(join(root, path))) {
    fail(`skills/${dir}`, "missing SKILL.md");
    continue;
  }
  const { data, body } = frontmatter(path);
  if (!data) {
    fail(path, "missing YAML frontmatter");
    continue;
  }
  const { name = "", description = "" } = data;
  if (name !== dir) fail(path, `name "${name}" must match its directory "${dir}"`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    fail(path, "name must be 1-64 lowercase letters, digits and single hyphens");
  }
  if (!name.startsWith("maisongr-")) fail(path, 'name must start with "maisongr-" to avoid collisions');
  if (description.length < 1 || description.length > 1024) {
    fail(path, `description must be 1-1024 characters (has ${description.length})`);
  }
  if (body.split("\n").length > 500) fail(path, "body should stay under 500 lines");
  skillNames.add(name);
}

// Subagents. Claude Code and Gemini CLI both load agents/, so only the keys both document are allowed.
const sharedAgentKeys = ["name", "description", "model"];
const agentFiles = readdirSync(join(root, "agents")).filter((file) => file.endsWith(".md"));
for (const file of agentFiles) {
  const path = `agents/${file}`;
  const { data } = frontmatter(path);
  if (!data?.name || !data?.description) {
    fail(path, "agent needs name and description");
    continue;
  }
  if (data.name !== file.replace(/\.md$/, "")) fail(path, `name "${data.name}" must match the file name`);
  if (!data.name.startsWith("maisongr-")) fail(path, 'name must start with "maisongr-"');
  for (const key of Object.keys(data)) {
    if (!sharedAgentKeys.includes(key)) fail(path, `key "${key}" is not supported by both Claude Code and Gemini CLI`);
  }
}

// Manifests agree with each other and with the changelog.
const plugin = json(".claude-plugin/plugin.json");
const marketplace = json(".claude-plugin/marketplace.json");
const gemini = json("gemini-extension.json");
const listed = (marketplace.plugins ?? []).map((entry) => entry.name);
if (!listed.includes(plugin.name)) {
  fail(".claude-plugin/marketplace.json", `does not list plugin "${plugin.name}"`);
}
const released = read("CHANGELOG.md").match(/^## \[(\d+\.\d+\.\d+)\]/m)?.[1];
for (const [path, version] of [
  [".claude-plugin/plugin.json", plugin.version],
  ["gemini-extension.json", gemini.version],
]) {
  if (version !== released) fail(path, `version ${version} does not match CHANGELOG.md (${released})`);
}

// Generated files match AGENTS.md.
for (const [path, content] of Object.entries(outputs())) {
  if (!existsSync(join(root, path)) || read(path) !== content) {
    fail(path, "out of date; run node scripts/build.mjs");
  }
}

// Relative links in Markdown resolve.
function markdownFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (entry === ".git" || entry === "node_modules") return [];
    if (statSync(full).isDirectory()) return markdownFiles(full);
    return /\.(md|mdc)$/.test(entry) ? [full] : [];
  });
}
for (const file of markdownFiles(root)) {
  const path = relative(root, file).replace(/\\/g, "/");
  const text = read(path).replace(/```[\s\S]*?```/g, "");
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const local = decodeURIComponent(target.split("#")[0]);
    if (!existsSync(join(dirname(file), local))) fail(path, `broken link: ${target}`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `x ${error}`).join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`OK: ${skillNames.size} skills, ${agentFiles.length} agents, manifests at ${released}, generated files current, links resolve.`);
