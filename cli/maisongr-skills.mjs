#!/usr/bin/env node
// Installs the Maison GR principles and skills into a project, or for the current user.
// No dependencies: Node.js 18.3 or later.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));

const AGENTS = ["claude", "codex", "cursor", "copilot", "gemini"];
const START = "<!-- maisongr:start (managed by maisongr-skills; edit outside this block) -->";
const END = "<!-- maisongr:end -->";
const BLOCK = new RegExp(`${escape(START)}[\\s\\S]*?${escape(END)}(\\r?\\n){0,2}`);

const usage = `maisongr-skills ${version}
Maison GR engineering principles and skills for AI coding agents.

Usage:
  npx maisongr-skills [init]      Install or update in the current project
  npx maisongr-skills remove      Remove what this tool installed
  npx maisongr-skills list        List the skills

Options:
  --agent <names>   Comma-separated: ${AGENTS.join(", ")}, or all (default: all)
  --global          Install for your user account instead of one project
  --dir <path>      Project directory (default: current directory)
  --dry-run         Show what would change, without writing anything
  -v, --version     Print the version
  -h, --help        Print this help

Docs: https://github.com/maison-gr/maisongr-ai-engineering-skills`;

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
  console.error(`maisongr-skills: ${message}\n\nRun "npx maisongr-skills --help" for usage.`);
  process.exit(1);
}

function parse(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      // No `default` keys: parseArgs only supports them from Node 18.11.
      options: {
        agent: { type: "string" },
        global: { type: "boolean" },
        dir: { type: "string" },
        "dry-run": { type: "boolean" },
        version: { type: "boolean", short: "v" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (error) {
    fail(error.message);
  }
  const { positionals } = parsed;
  const values = { agent: "all", ...parsed.values };
  const command = positionals[0] ?? "init";
  if (positionals.length > 1) fail(`unexpected argument "${positionals[1]}"`);
  if (!["init", "update", "remove", "list"].includes(command)) fail(`unknown command "${command}"`);
  if (values.global && values.dir) fail("--global and --dir cannot be used together");

  const requested = values.agent.split(",").map((name) => name.trim().toLowerCase()).filter(Boolean);
  const agents = requested.includes("all") ? AGENTS : requested;
  const unknown = agents.filter((name) => !AGENTS.includes(name));
  if (unknown.length) fail(`unknown agent "${unknown[0]}"; choose from ${AGENTS.join(", ")} or all`);
  if (!agents.length) fail("--agent needs at least one name");

  return { command, agents, values };
}

// Where each part goes, for the chosen agents and scope.
function plan({ agents, values }) {
  const base = values.global ? homedir() : resolve(values.dir ?? process.cwd());
  const has = (name) => agents.includes(name);
  const usesSharedSkills = agents.some((name) => name !== "claude");
  const targets = { base, skillDirs: [], agentDir: null, principles: [], claudeImport: null, geminiSettings: null, notes: [] };

  if (usesSharedSkills) targets.skillDirs.push(join(base, ".agents", "skills"));
  if (has("claude")) {
    targets.skillDirs.push(join(base, ".claude", "skills"));
    targets.agentDir = join(base, ".claude", "agents");
  }

  if (values.global) {
    if (has("claude")) {
      targets.principles.push(join(base, ".claude", "AGENTS.md"));
      targets.claudeImport = join(base, ".claude", "CLAUDE.md");
    }
    if (has("codex")) targets.principles.push(join(base, ".codex", "AGENTS.md"));
    if (has("gemini")) targets.principles.push(join(base, ".gemini", "GEMINI.md"));
    if (has("cursor") || has("copilot")) {
      targets.notes.push("Cursor and GitHub Copilot have no user-wide instruction file; run this in each project to add AGENTS.md there.");
    }
  } else {
    targets.principles.push(join(base, "AGENTS.md"));
    if (has("claude")) targets.claudeImport = join(base, "CLAUDE.md");
    if (has("gemini")) targets.geminiSettings = join(base, ".gemini", "settings.json");
  }
  return targets;
}

function packageSkills() {
  return readdirSync(join(packageRoot, "skills")).filter((name) => name.startsWith("maisongr-"));
}

function packageAgents() {
  return readdirSync(join(packageRoot, "agents")).filter((name) => /^maisongr-.*\.md$/.test(name));
}

function principlesBlock(eol) {
  const body = readFileSync(join(packageRoot, "AGENTS.md"), "utf8").replace(/\r\n/g, "\n").trim();
  return [START, body, END].join("\n").replace(/\n/g, eol);
}

const dryRunVerbs = { added: "would add", updated: "would update", created: "would create", removed: "would remove", skipped: "would skip" };

function makeReporter(base, dryRun) {
  const lines = [];
  const show = (path) => {
    const rel = relative(base, path);
    return rel && !rel.startsWith("..") ? rel.replace(/\\/g, "/") : path;
  };
  return {
    lines,
    show,
    record(action, path, detail = "") {
      const label = dryRun ? (dryRunVerbs[action] ?? action) : action;
      lines.push(`  ${label.padEnd(14)} ${show(path)}${detail ? `  (${detail})` : ""}`);
    },
  };
}

function write(path, content, dryRun) {
  if (dryRun) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function install(targets, dryRun, report) {
  for (const dir of targets.skillDirs) {
    const skills = packageSkills();
    const existed = skills.some((skill) => existsSync(join(dir, skill)));
    if (!dryRun) {
      for (const skill of skills) {
        rmSync(join(dir, skill), { recursive: true, force: true });
        cpSync(join(packageRoot, "skills", skill), join(dir, skill), { recursive: true });
      }
    }
    report.record(existed ? "updated" : "added", join(dir, "maisongr-*"), `${skills.length} skills`);
  }

  if (targets.agentDir) {
    const agents = packageAgents();
    const existed = agents.some((agent) => existsSync(join(targets.agentDir, agent)));
    for (const agent of agents) write(join(targets.agentDir, agent), readFileSync(join(packageRoot, "agents", agent)), dryRun);
    report.record(existed ? "updated" : "added", join(targets.agentDir, "maisongr-*.md"), `${agents.length} subagents`);
  }

  for (const path of targets.principles) {
    if (!existsSync(path)) {
      write(path, `${principlesBlock("\n")}\n`, dryRun);
      report.record("created", path);
      continue;
    }
    const current = readFileSync(path, "utf8");
    const eol = current.includes("\r\n") ? "\r\n" : "\n";
    const block = principlesBlock(eol);
    if (BLOCK.test(current)) {
      const next = current.replace(BLOCK, `${block}${eol}${eol}`).replace(/(\r?\n)+$/, eol);
      if (next === current) {
        report.record("unchanged", path);
      } else {
        write(path, next, dryRun);
        report.record("updated", path, "principles block");
      }
    } else {
      write(path, `${block}${eol}${eol}${current}`, dryRun);
      report.record("updated", path, "principles added above your content");
    }
  }

  if (targets.claudeImport) {
    const path = targets.claudeImport;
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (current === null) {
      write(path, "@AGENTS.md\n", dryRun);
      report.record("created", path, "imports AGENTS.md");
    } else if (/^@AGENTS\.md\s*$/m.test(current)) {
      report.record("unchanged", path);
    } else {
      const eol = current.includes("\r\n") ? "\r\n" : "\n";
      const separator = current.endsWith("\n") ? "" : eol;
      write(path, `${current}${separator}${eol}@AGENTS.md${eol}`, dryRun);
      report.record("updated", path, "added @AGENTS.md import");
    }
  }

  if (targets.geminiSettings) {
    const path = targets.geminiSettings;
    const existed = existsSync(path);
    let settings = {};
    if (existed) {
      try {
        settings = JSON.parse(readFileSync(path, "utf8"));
      } catch {
        report.record("skipped", path, 'not plain JSON; add "AGENTS.md" to context.fileName yourself');
        return;
      }
    }
    const context = settings.context ?? {};
    const names = [context.fileName ?? "GEMINI.md"].flat();
    if (names.includes("AGENTS.md")) {
      report.record("unchanged", path);
    } else {
      settings.context = { ...context, fileName: ["AGENTS.md", ...names] };
      write(path, `${JSON.stringify(settings, null, 2)}\n`, dryRun);
      report.record(existed ? "updated" : "created", path, "loads AGENTS.md as context");
    }
  }
}

function remove(targets, dryRun, report) {
  for (const dir of targets.skillDirs) {
    const skills = (existsSync(dir) ? readdirSync(dir) : []).filter((name) => name.startsWith("maisongr-"));
    if (!skills.length) continue;
    if (!dryRun) for (const skill of skills) rmSync(join(dir, skill), { recursive: true, force: true });
    report.record("removed", join(dir, "maisongr-*"), `${skills.length} skills`);
  }

  if (targets.agentDir && existsSync(targets.agentDir)) {
    const agents = readdirSync(targets.agentDir).filter((name) => /^maisongr-.*\.md$/.test(name));
    if (agents.length) {
      if (!dryRun) for (const agent of agents) rmSync(join(targets.agentDir, agent));
      report.record("removed", join(targets.agentDir, "maisongr-*.md"), `${agents.length} subagents`);
    }
  }

  for (const path of targets.principles) {
    if (!existsSync(path)) continue;
    const current = readFileSync(path, "utf8");
    if (!BLOCK.test(current)) continue;
    const rest = current.replace(BLOCK, "");
    if (rest.trim() === "") {
      if (!dryRun) rmSync(path);
      report.record("removed", path);
    } else {
      write(path, rest, dryRun);
      report.record("updated", path, "principles block removed; your content kept");
    }
  }

  if (targets.claudeImport && existsSync(targets.claudeImport)) {
    targets.notes.push(`Left ${report.show(targets.claudeImport)} unchanged; delete its @AGENTS.md line if you no longer need it.`);
  }
  if (targets.geminiSettings && existsSync(targets.geminiSettings)) {
    targets.notes.push(`Left ${report.show(targets.geminiSettings)} unchanged; it may still list AGENTS.md in context.fileName.`);
  }
}

function list() {
  for (const skill of packageSkills()) {
    const text = readFileSync(join(packageRoot, "skills", skill, "SKILL.md"), "utf8");
    const description = text.match(/^description:\s*(.*)$/m)?.[1] ?? "";
    const summary = description.split(". ")[0].replace(/^Maison GR method for /, "");
    console.log(`  ${skill.padEnd(26)} ${summary.charAt(0).toUpperCase()}${summary.slice(1)}`);
  }
}

function main() {
  const options = parse(process.argv.slice(2));
  const { command, values } = options;
  if (values.help) return console.log(usage);
  if (values.version) return console.log(version);
  if (command === "list") return list();

  const dryRun = Boolean(values["dry-run"]);
  const targets = plan(options);
  if (!values.global && !existsSync(targets.base)) fail(`directory not found: ${targets.base}`);

  const report = makeReporter(targets.base, dryRun);
  if (command === "remove") remove(targets, dryRun, report);
  else install(targets, dryRun, report);

  const scope = values.global ? "your user account" : targets.base;
  const verb = command === "remove" ? "Removing from" : "Installing into";
  console.log(`maisongr-skills ${version}: ${verb} ${scope}${dryRun ? " (dry run, nothing written)" : ""}\n`);
  console.log(report.lines.length ? report.lines.join("\n") : "  Nothing to do.");
  for (const note of targets.notes) console.log(`\nNote: ${note}`);

  if (command !== "remove" && !dryRun) {
    console.log(
      "\nDone. Restart your agent so it picks up the changes." +
        (values.global ? "" : "\nCommit the new files so everyone on the project, and every agent, uses the same standard."),
    );
  }
}

main();
