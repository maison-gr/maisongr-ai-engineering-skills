# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

What counts as breaking: renaming or removing a skill, subagent or principle, or changing an installation path. Rewording guidance is a minor or patch change.

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
