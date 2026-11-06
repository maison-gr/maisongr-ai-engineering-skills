# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

What counts as breaking: renaming or removing a skill, subagent or principle, or changing an installation path. Rewording guidance is a minor or patch change.

## [Unreleased]

### Fixed

- Receipts no longer reports a Git config read as a change when the next line, a pipe, `&&` or a redirect follows it.

## [1.3.0] - 2026-11-05

### Added

- After an install, a "You can also" list: `list`, updating, `--global`, `--agent`, `remove` and `--help`.

### Fixed

- A repeat install reports skills and subagents that are already current as unchanged, instead of updated, and rewrites only those that differ.

### Changed

- A clearer CLI. Every file it touches is marked ✓ changed, · already as it should be, or ! could not be changed; the run ends with the next steps and Done, with how many lines need a look. Errors say the cause first and the fix under it, and suggest the command, agent or option meant (`remvoe` → `remove`). An unexpected failure says it's a bug and where to report it, and exits with 2. A dry run ends with the command that makes the change. Colour only on a terminal that shows it (`NO_COLOR`, `FORCE_COLOR` and the new `--no-color` are followed), and ASCII symbols in the old Windows console.

## [1.2.0] - 2026-11-03

### Added

- Receipts now also checks guarded, often irreversible Git actions. If a session force-pushed, skipped Git hooks with `--no-verify`, staged everything with `git add -A`, rewrote history (amend, rebase, reset `--hard`), or changed Git config, and the report never mentions it, the agent is sent back to disclose and justify the action or undo it. Deterministic, from the same session record, with no extra model calls.

## [1.1.1] - 2026-11-03

### Added

- Security policy, code of conduct and support guide. Questions now go to Discussions, and vulnerabilities to private reporting.
- The npm package is published from GitHub releases with a provenance attestation.

### Fixed

- The build reads generated files in one step, so a file can't change between the check and the read.

## [1.1.0] - 2026-11-02

### Added

- Receipts for Claude Code: the plugin records the shell commands run in a session and, before the agent stops, checks every command listed under "Verified" in its report. A command that never ran, or whose last run failed while the report says it passed, sends the agent back to run it or move it to "Not verified".

### Changed

- The reporting principle asks agents to write each verified command in backticks, so the report can be checked.

## [1.0.0] - 2026-11-02

### Added

- Seven Maison GR engineering principles in `AGENTS.md`: understand before implementing, simplicity first, surgical changes, goal-driven execution, verify before completion, secure by default, and guard irreversible actions.
- Ten skills following the Agent Skills specification: engineering, architecture, code review, debugging, testing, security review, documentation, database, API and frontend.
- Claude Code plugin and marketplace manifests, with three subagents: architect, reviewer and tester.
- Gemini CLI extension manifest.
- `npx maisongr-skills`: a dependency-free installer that sets up the principles, skills and subagents for any combination of agents, per project or user-wide, with dry-run, update and remove.
- Cursor project rule and GitHub Copilot repository instructions, generated from `AGENTS.md`.
- Installation guide for Claude Code, Codex, Cursor, GitHub Copilot and Gemini CLI, with update and removal steps.
- Templates for project-specific agent instructions and implementation plans.
- Validation script, installer tests and a GitHub Actions workflow that also installs the packed npm tarball with npx on Linux, macOS and Windows.
- Research notes on the projects and platform documentation that informed the design.
