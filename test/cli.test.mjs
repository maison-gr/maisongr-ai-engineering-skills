import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../cli/maisongr-skills.mjs", import.meta.url));
const skillCount = readdirSync(fileURLToPath(new URL("../skills", import.meta.url))).length;

function project() {
  return mkdtempSync(join(tmpdir(), "maisongr-test-"));
}

function run(args, { cwd, home } = {}) {
  const env = { ...process.env };
  if (home) Object.assign(env, { HOME: home, USERPROFILE: home });
  const result = spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: "utf8" });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

const read = (...parts) => readFileSync(join(...parts), "utf8");
const skills = (...parts) => readdirSync(join(...parts)).filter((name) => name.startsWith("maisongr-"));
const count = (text, needle) => text.split(needle).length - 1;

test("init installs principles, skills and subagents for all agents", () => {
  const dir = project();
  const { code } = run([], { cwd: dir });
  assert.equal(code, 0);
  assert.equal(skills(dir, ".agents", "skills").length, skillCount);
  assert.equal(skills(dir, ".claude", "skills").length, skillCount);
  assert.equal(readdirSync(join(dir, ".claude", "agents")).length, 3);
  assert.ok(existsSync(join(dir, ".agents", "skills", "maisongr-debugging", "SKILL.md")));
  assert.match(read(dir, "AGENTS.md"), /# Maison GR Engineering Principles/);
  assert.equal(read(dir, "CLAUDE.md"), "@AGENTS.md\n");
  assert.deepEqual(JSON.parse(read(dir, ".gemini", "settings.json")).context.fileName, ["AGENTS.md", "GEMINI.md"]);
});

test("running init twice changes nothing the second time", () => {
  const dir = project();
  run(["init"], { cwd: dir });
  const first = [read(dir, "AGENTS.md"), read(dir, "CLAUDE.md"), read(dir, ".gemini", "settings.json")];
  const { code, out } = run(["update"], { cwd: dir });
  assert.equal(code, 0);
  assert.deepEqual([read(dir, "AGENTS.md"), read(dir, "CLAUDE.md"), read(dir, ".gemini", "settings.json")], first);
  assert.equal(count(read(dir, "AGENTS.md"), "maisongr:start"), 1);
  assert.match(out, /unchanged\s+AGENTS\.md/);
});

test("existing AGENTS.md and CLAUDE.md keep their content", () => {
  const dir = project();
  writeFileSync(join(dir, "AGENTS.md"), "# My project\r\n\r\nRun npm test.\r\n");
  writeFileSync(join(dir, "CLAUDE.md"), "Use pnpm.");
  mkdirSync(join(dir, ".gemini"));
  writeFileSync(join(dir, ".gemini", "settings.json"), JSON.stringify({ theme: "Dracula", context: { fileName: "CONTEXT.md" } }));

  run([], { cwd: dir });
  run([], { cwd: dir });

  const agents = read(dir, "AGENTS.md");
  assert.ok(agents.indexOf("Maison GR Engineering Principles") < agents.indexOf("# My project"));
  assert.match(agents, /Run npm test\./);
  assert.equal(count(agents, "maisongr:start"), 1);
  assert.ok(!/[^\r]\n/.test(agents), "keeps the file's CRLF line endings");
  assert.equal(read(dir, "CLAUDE.md"), "Use pnpm.\n\n@AGENTS.md\n");
  const settings = JSON.parse(read(dir, ".gemini", "settings.json"));
  assert.equal(settings.theme, "Dracula");
  assert.deepEqual(settings.context.fileName, ["AGENTS.md", "CONTEXT.md"]);
});

test("--agent limits what is installed", () => {
  const dir = project();
  const { code } = run(["--agent", "codex"], { cwd: dir });
  assert.equal(code, 0);
  assert.equal(skills(dir, ".agents", "skills").length, skillCount);
  assert.ok(existsSync(join(dir, "AGENTS.md")));
  for (const path of [".claude", "CLAUDE.md", ".gemini"]) assert.ok(!existsSync(join(dir, path)), `${path} not created`);

  const claudeOnly = project();
  run(["--agent", "claude"], { cwd: claudeOnly });
  assert.ok(!existsSync(join(claudeOnly, ".agents")));
  assert.equal(skills(claudeOnly, ".claude", "skills").length, skillCount);
});

test("--dry-run writes nothing", () => {
  const dir = project();
  const { code, out } = run(["--dry-run"], { cwd: dir });
  assert.equal(code, 0);
  assert.match(out, /would create\s+AGENTS\.md/);
  assert.deepEqual(readdirSync(dir), []);
});

test("remove deletes only what was installed", () => {
  const dir = project();
  writeFileSync(join(dir, "AGENTS.md"), "# My project\n");
  mkdirSync(join(dir, ".agents", "skills", "my-own-skill"), { recursive: true });
  run([], { cwd: dir });

  const { code } = run(["remove"], { cwd: dir });
  assert.equal(code, 0);
  assert.equal(read(dir, "AGENTS.md"), "# My project\n");
  assert.deepEqual(readdirSync(join(dir, ".agents", "skills")), ["my-own-skill"]);
  assert.deepEqual(skills(dir, ".claude", "skills"), []);
  assert.deepEqual(readdirSync(join(dir, ".claude", "agents")), []);

  const fresh = project();
  run([], { cwd: fresh });
  run(["remove"], { cwd: fresh });
  assert.ok(!existsSync(join(fresh, "AGENTS.md")), "AGENTS.md created by the tool is deleted");
});

test("--global installs into the home directory", () => {
  const home = project();
  const { code, out } = run(["--global"], { cwd: project(), home });
  assert.equal(code, 0);
  assert.equal(skills(home, ".agents", "skills").length, skillCount);
  assert.equal(skills(home, ".claude", "skills").length, skillCount);
  assert.match(read(home, ".claude", "AGENTS.md"), /maisongr:start/);
  assert.equal(read(home, ".claude", "CLAUDE.md"), "@AGENTS.md\n");
  assert.match(read(home, ".codex", "AGENTS.md"), /maisongr:start/);
  assert.match(read(home, ".gemini", "GEMINI.md"), /maisongr:start/);
  assert.match(out, /Cursor and GitHub Copilot have no user-wide instruction file/);
});

test("list, help and version", () => {
  const listed = run(["list"]);
  assert.equal(listed.code, 0);
  assert.equal(count(listed.out, "maisongr-"), skillCount);
  assert.match(run(["--help"]).out, /Usage:/);
  const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(run(["--version"]).out.trim(), version);
});

test("invalid input fails with a clear message", () => {
  for (const args of [["deploy"], ["--agent", "vim"], ["--bogus"], ["--global", "--dir", "x"], ["--dir", join(project(), "missing")]]) {
    const { code, err } = run(args, { cwd: project() });
    assert.equal(code, 1, `exit code for ${args.join(" ")}`);
    assert.match(err, /^maisongr-skills: /, `message for ${args.join(" ")}`);
  }
});
