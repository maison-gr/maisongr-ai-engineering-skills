# Maison GR AI Engineering Skills

**Engineering discipline for AI coding agents.** Seven principles and ten skills that make agents understand before they build, keep changes small, and prove their work, in Claude Code, OpenAI Codex, Cursor, GitHub Copilot and Gemini CLI.

[![Validate](https://github.com/maison-gr/maisongr-ai-engineering-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/maison-gr/maisongr-ai-engineering-skills/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## The problem

AI coding agents are fast and fluent, so their mistakes look finished. The common ones:

- They fill gaps in a request with confident guesses instead of asking.
- They build abstractions and options the task never needed.
- They "improve" files nobody asked them to touch.
- They stop when the code is written, not when it works.
- They report tests as passing without running them.
- They take actions that cannot be undone: a push, a dropped column, a broken public API.

None of these is a knowledge problem. The model knows the right practice; it does not apply it under the pull of finishing the task. Maison GR makes that practice the default.

## The principles

Loaded into every session through [`AGENTS.md`](AGENTS.md):

| # | Principle | Prevents |
|---|---|---|
| 1 | **Understand before implementing** | Building the wrong thing correctly |
| 2 | **Simplicity first** | Code that costs more to own than it is worth |
| 3 | **Surgical changes** | Unreviewable diffs and regressions in untouched code |
| 4 | **Goal-driven execution** | Work that ends when code is written, not when the goal is met |
| 5 | **Verify before completion** | Confident reports of untested work |
| 6 | **Secure by default** | Vulnerabilities in code that works |
| 7 | **Guard irreversible actions** | Damage another edit cannot undo |

Every task follows the same loop: **inspect, clarify, plan, implement, verify, report.**

[Read the reasoning behind each principle](docs/principles.md) · [See them in action](EXAMPLES.md)

## The skills

Detailed methods that agents load only when a task needs them:

| Skill | Use it for |
|---|---|
| [`maisongr-engineering`](skills/maisongr-engineering/SKILL.md) | Carrying any non-trivial change from request to verified result |
| [`maisongr-architecture`](skills/maisongr-architecture/SKILL.md) | Design decisions, new modules or dependencies, decision records |
| [`maisongr-code-review`](skills/maisongr-code-review/SKILL.md) | Reviewing a diff or pull request, findings ranked by severity |
| [`maisongr-debugging`](skills/maisongr-debugging/SKILL.md) | Reproducing a failure, finding its root cause, proving the fix |
| [`maisongr-testing`](skills/maisongr-testing/SKILL.md) | Meaningful tests at the right level, proven able to fail |
| [`maisongr-security-review`](skills/maisongr-security-review/SKILL.md) | Threat modelling, access control, injection, secrets, dependencies |
| [`maisongr-documentation`](skills/maisongr-documentation/SKILL.md) | Accurate, verified READMEs, guides, references and runbooks |
| [`maisongr-database`](skills/maisongr-database/SKILL.md) | Safe migrations, integrity constraints, correct and fast queries |
| [`maisongr-api`](skills/maisongr-api/SKILL.md) | API contracts, validation, consistent errors, compatible evolution |
| [`maisongr-frontend`](skills/maisongr-frontend/SKILL.md) | Accessible (WCAG 2.2 AA), responsive, fast, finished interfaces |

On Claude Code and Gemini CLI, three subagents run in their own context: **`maisongr-architect`** (read-only design and planning), **`maisongr-reviewer`** (independent read-only review) and **`maisongr-tester`** (tests only).

## Supported platforms

| Platform | Principles | Skills | Install |
|---|---|---|---|
| **Claude Code** | `CLAUDE.md` importing `AGENTS.md` | ✓ | Plugin marketplace |
| **OpenAI Codex** | `AGENTS.md` | ✓ | `npx maisongr-skills` |
| **Cursor** | `AGENTS.md` or project rule | ✓ | `npx maisongr-skills` |
| **GitHub Copilot** | `AGENTS.md` and `copilot-instructions.md` | ✓ | `npx maisongr-skills` |
| **Gemini CLI** | Extension context | ✓ | Extension |

Any other agent that reads [`AGENTS.md`](https://agents.md/) or the [Agent Skills](https://agentskills.io/specification) format can use the same files. Details and sources are in [compatibility](docs/compatibility.md).

## Quick start

### Any agent, one command

From your project's root:

```bash
npx maisongr-skills
```

It adds the principles to `AGENTS.md` (above anything already there), the skills where each agent looks for them, the subagents for Claude Code, and the settings that make Claude Code and Gemini CLI read `AGENTS.md`. It never overwrites your own content, and running it again updates to the latest version.

```bash
npx maisongr-skills --agent codex,cursor   # only some agents: claude, codex, cursor, copilot, gemini
npx maisongr-skills --global               # for your user account, every project
npx maisongr-skills --dry-run              # show what would change
npx maisongr-skills remove                 # undo
```

Requires Node.js 18.3 or later. Prefer native packaging? Use the plugin or extension below.

### Claude Code

Run these two commands inside Claude Code:

```text
/plugin marketplace add maison-gr/maisongr-ai-engineering-skills
/plugin install maisongr@maison-gr
```

On Claude Code 2.1.275 or later, one command does both: `/plugin install maisongr --marketplace maison-gr/maisongr-ai-engineering-skills`.

This installs the skills and subagents for **all your projects**. To share them with everyone who works on one repository instead, install from a terminal into the project scope, which records the plugin in the repository's committed `.claude/settings.json`:

```bash
claude plugin marketplace add maison-gr/maisongr-ai-engineering-skills
claude plugin install maisongr@maison-gr --scope project
```

Then add the always-on principles, which a plugin cannot install: copy [`AGENTS.md`](AGENTS.md) into the project root and put `@AGENTS.md` in its `CLAUDE.md`. To apply them to every project in a folder, put the import in a `CLAUDE.md` in that parent folder instead, for example `@path/to/AGENTS.md`.

Updates: `claude plugin marketplace update maison-gr`, then `claude plugin update maisongr@maison-gr`. Removal: `claude plugin uninstall maisongr@maison-gr`.

### Gemini CLI

```bash
gemini extensions install https://github.com/maison-gr/maisongr-ai-engineering-skills
```

### Codex, Cursor and GitHub Copilot

All three read `AGENTS.md` and skills in `.agents/skills/`. Use `npx maisongr-skills` above, or copy the files yourself from your project's root:

```bash
git clone --depth 1 https://github.com/maison-gr/maisongr-ai-engineering-skills.git ~/maisongr
cp ~/maisongr/AGENTS.md AGENTS.md
mkdir -p .agents/skills && cp -R ~/maisongr/skills/maisongr-* .agents/skills/
```

```powershell
git clone --depth 1 https://github.com/maison-gr/maisongr-ai-engineering-skills.git "$HOME\maisongr"
Copy-Item "$HOME\maisongr\AGENTS.md" AGENTS.md
New-Item -ItemType Directory -Force .agents\skills | Out-Null
Copy-Item -Recurse "$HOME\maisongr\skills\maisongr-*" .agents\skills\
```

If your project already has an `AGENTS.md`, add the principles at the top instead of overwriting it. For Copilot, also copy [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

The [installation guide](docs/installation.md) covers every platform in detail, including user-wide installs, updates and removal.

## Usage

Once installed, work as usual. The principles apply to every task, and agents pick up skills when a request matches them:

> *"Users say the CSV import drops rows. Find out why."* → `maisongr-debugging`: reproduce, find the root cause, fix, add a regression test.
>
> *"Review my changes before I open the PR."* → `maisongr-code-review`: findings ranked by severity, each with a failure scenario.
>
> *"Add a `discount_code` column to orders."* → `maisongr-database`: expand-and-contract migration with a rollback.

Invoke a skill explicitly when you want it for certain: `/maisongr:maisongr-security-review` in Claude Code, `$maisongr-security-review` in Codex.

At the end of a task, expect a report like this:

```text
Changed:      the files and what changed in each
Verified:     the commands run and their results
Not verified: what could not be checked, and why
Decisions:    assumptions and trade-offs to review
```

## Customisation

The principles are defaults, written to be adapted:

- **Make them concrete.** Add a project section to `AGENTS.md` with your commands, conventions and boundaries. Start from [`templates/project-instructions.md`](templates/project-instructions.md). Specific project instructions take precedence over the general principles.
- **Plan bigger changes.** Ask the agent to fill in [`templates/implementation-plan.md`](templates/implementation-plan.md) and wait for your approval.
- **Pick your skills.** Each skill folder is self-contained. Copy only the ones your team needs.
- **Scope rules to files.** With Copilot, add `.github/instructions/*.instructions.md` with an `applyTo` glob; with Cursor, add a rule with `globs`.

## Repository structure

```text
maisongr-ai-engineering-skills/
├── AGENTS.md                      # The principles: the single source
├── CLAUDE.md                      # Imports AGENTS.md for Claude Code
├── GEMINI.md                      # Generated from AGENTS.md (Gemini extension context)
├── .cursor/rules/
│   └── maisongr-engineering.mdc   # Generated from AGENTS.md (Cursor rule)
├── .github/
│   ├── copilot-instructions.md    # Generated from AGENTS.md (Copilot)
│   ├── workflows/validate.yml     # CI
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── skills/                        # Ten skills, Agent Skills format
│   └── maisongr-*/SKILL.md
├── agents/                        # Three subagents (Claude Code, Gemini CLI)
├── .claude-plugin/
│   ├── plugin.json                # Claude Code plugin
│   └── marketplace.json           # Claude Code marketplace
├── gemini-extension.json          # Gemini CLI extension
├── package.json                   # npm package for npx maisongr-skills
├── cli/maisongr-skills.mjs        # The installer (Node.js, no dependencies)
├── test/                          # Installer tests
├── templates/                     # Project instructions, implementation plan
├── docs/                          # Principles, architecture, installation, compatibility, FAQ
├── scripts/                       # build.mjs and validate.mjs (Node.js, no dependencies)
├── EXAMPLES.md                    # Each principle in a realistic scenario
├── RESEARCH.md                    # What informed the design
├── CONTRIBUTING.md
├── CHANGELOG.md
└── LICENSE
```

Why it is shaped this way: [architecture](docs/architecture.md).

## Contributing

Contributions are welcome, especially fixes to installation steps and guidance that leads agents astray. Read [CONTRIBUTING](CONTRIBUTING.md), then run `node scripts/validate.mjs` before opening a pull request. Propose new skills with an issue first.

## Further reading

- [Principles in depth](docs/principles.md)
- [Examples](EXAMPLES.md)
- [Installation](docs/installation.md)
- [Compatibility](docs/compatibility.md)
- [FAQ](docs/faq.md)
- [Research](RESEARCH.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) © Maison GR
