#!/usr/bin/env node
// Receipts for Claude Code: records the shell commands run in a session, and checks the
// "Verified:" part of the end-of-task report against that record before the agent stops.
// Usage (from receipts/hooks.json): receipts.mjs record | receipts.mjs check
// No dependencies: Node.js 18.3 or later.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Programs a "Verified" claim usually starts with. Spans starting with anything else
// (file names, flags, prose) are only checked if a recorded command starts the same way.
const RUNNERS = new Set([
  "npm", "npx", "pnpm", "yarn", "bun", "bunx", "deno", "node", "tsc", "eslint", "prettier",
  "jest", "vitest", "mocha", "playwright", "cypress", "next", "vite", "turbo", "nx",
  "python", "python3", "py", "pip", "pytest", "ruff", "mypy", "uv", "poetry", "tox",
  "go", "cargo", "rustc", "make", "cmake", "ctest", "dotnet", "mvn", "gradle", "./gradlew",
  "ruby", "bundle", "rake", "rspec", "rails", "php", "composer", "phpunit",
  "swift", "xcodebuild", "flutter", "dart", "docker", "kubectl", "terraform", "git", "gh",
  "bash", "sh", "pwsh", "powershell", "curl",
]);

const LABEL = /^[\s>*_#\-\d.)]*\**\s*(not verified|verified|changed|decisions)\s*\**\s*:?/i;
const ACKNOWLEDGED_FAILURE = /\b(fail(s|ed|ing|ure)?|exit(ed)? (with )?code|non-zero|broken)\b/i;

export function verifiedSection(message) {
  const lines = [];
  let inside = false;
  for (const line of String(message ?? "").split(/\r?\n/)) {
    const label = line.match(LABEL);
    if (label) {
      inside = label[1].toLowerCase() === "verified";
      if (inside) lines.push(line.slice(label[0].length));
      continue;
    }
    if (inside) lines.push(line);
  }
  return lines;
}

const normalise = (text) => text.replace(/\s+/g, " ").replace(/["']/g, "").trim();
const firstWord = (text) => normalise(text).split(" ")[0];

export function checkClaims(message, runs) {
  const starts = new Set(runs.map((run) => firstWord(run.command)));
  const problems = [];
  for (const line of verifiedSection(message)) {
    for (const [, span] of line.matchAll(/`([^`\n]+)`/g)) {
      const claim = normalise(span);
      if (!claim || !(RUNNERS.has(firstWord(claim)) || starts.has(firstWord(claim)))) continue;
      const matching = runs.filter((run) => {
        const command = normalise(run.command);
        return command.includes(claim) || claim.includes(command);
      });
      if (matching.length === 0) {
        problems.push(`\`${span}\`: no command like this ran in this session.`);
        continue;
      }
      const last = matching[matching.length - 1];
      if (last.exitCode !== 0 && !ACKNOWLEDGED_FAILURE.test(line)) {
        const how = last.exitCode === null ? "did not finish" : `exited with code ${last.exitCode}`;
        problems.push(`\`${span}\`: the last time it ran, it ${how}.`);
      }
    }
  }
  return problems;
}

function logFile(sessionId) {
  const dir = join(process.env.CLAUDE_PLUGIN_DATA || tmpdir(), "receipts");
  mkdirSync(dir, { recursive: true });
  return join(dir, `${String(sessionId).replace(/[^\w-]/g, "_")}.jsonl`);
}

function readRuns(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function record(input) {
  const command = input.tool_input?.command;
  if (typeof command !== "string") return;
  let exitCode = 0;
  if (input.hook_event_name === "PostToolUseFailure") {
    const code = String(input.error ?? "").match(/Exit code (-?\d+)/);
    exitCode = code ? Number(code[1]) : null;
  }
  appendFileSync(logFile(input.session_id), `${JSON.stringify({ command, exitCode, at: new Date().toISOString() })}\n`);
}

function check(input) {
  // Block once at most: if the agent was already sent back, let it stop.
  if (input.stop_hook_active) return;
  const problems = checkClaims(input.last_assistant_message, readRuns(logFile(input.session_id)));
  if (problems.length === 0) return;
  const reason = [
    "Maison GR receipts: your report lists commands under \"Verified\" that this session's record does not support:",
    ...problems.map((problem) => `- ${problem}`),
    "Run them now and report the real result, or move them to \"Not verified\" with the reason.",
  ].join("\n");
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const mode = process.argv[2];
  if (mode === "record") record(input);
  else if (mode === "check") check(input);
}
