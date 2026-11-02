# Maison GR AI Engineering Skills

**Engineering discipline for AI-powered software development.**

Maison GR AI Engineering Skills is an open-source collection of engineering guidelines designed to make AI coding agents more reliable, predictable, and effective.

The framework establishes how AI agents should understand requirements, make technical decisions, write code, modify existing systems, and verify their work.

Our objective is simple: build better software with less unnecessary complexity, fewer assumptions, and measurable engineering results.

## The Problem

AI coding agents can accelerate development, but speed alone does not guarantee quality.

Common engineering problems include:

- Implementing requirements based on assumptions rather than confirmed intent.
- Introducing unnecessary abstractions and architectural complexity.
- Modifying unrelated files during otherwise simple tasks.
- Producing code without meaningful verification.
- Overlooking existing conventions and established system behavior.
- Declaring tasks complete without demonstrating that they work.

## The Solution

Maison GR establishes five fundamental engineering principles.

| Principle | Purpose |
|---|---|
| Understand Before Implementing | Prevent incorrect assumptions and misunderstood requirements |
| Simplicity First | Reduce unnecessary complexity and overengineering |
| Surgical Changes | Preserve existing systems and limit modifications |
| Goal-Driven Execution | Establish measurable objectives before implementation |
| Verify Before Completion | Ensure results are tested and demonstrable |

## The Five Principles

### 1. Understand Before Implementing

Requirements must be understood before implementation begins.

- Identify ambiguities and missing information.
- Make assumptions visible.
- Ask questions when decisions materially affect the result.
- Explain important technical tradeoffs.
- Challenge requirements when a simpler or safer solution exists.
- Never confuse an educated guess with a confirmed requirement.

### 2. Simplicity First

Engineering quality is not measured by the amount of code produced.

- Implement only what the task requires.
- Avoid unnecessary abstractions.
- Do not introduce speculative functionality.
- Reuse existing project capabilities.
- Prefer straightforward implementations.
- Keep APIs and interfaces focused.
- Remove complexity when it provides no measurable benefit.

### 3. Surgical Changes

Changes should remain limited to the requested scope.

- Inspect existing implementation before modifying it.
- Follow established naming and architectural conventions.
- Avoid unrelated refactoring.
- Preserve existing comments and documentation.
- Do not remove functionality without authorization.
- Clean up unused elements introduced by your own changes.
- Make every modification traceable to the task.

### 4. Goal-Driven Execution

A task is not complete simply because code has been written.

Transform implementation requests into observable results.

| Request | Engineering objective |
|---|---|
| Add validation | Invalid inputs are rejected and tested |
| Fix a defect | The original failure is reproduced and resolved |
| Add functionality | Expected behavior is covered by tests |
| Refactor a component | Existing behavior remains intact |
| Improve performance | The relevant performance metric improves |

For substantial tasks, establish a short execution plan with verification criteria.

### 5. Verify Before Completion

Every implementation should be checked against its intended outcome.

- Run relevant automated tests.
- Validate affected functionality.
- Check types and static analysis when available.
- Review the final changes.
- Identify unverified assumptions.
- Report failures honestly.
- Never claim a successful test that was not executed.

## Recommended Development Workflow

1. **Inspect** — Understand the existing project and its conventions.
2. **Clarify** — Resolve important uncertainties.
3. **Plan** — Define the smallest effective implementation.
4. **Implement** — Make focused changes.
5. **Verify** — Test against measurable success criteria.
6. **Report** — Summarize changes, test results, and limitations.

## Repository Structure

```text
maisongr-ai-engineering-skills/
├── .claude-plugin/
│   └── plugin.json
├── .cursor/
│   └── rules/
│       └── Maison GR-engineering.mdc
├── skills/
│   └── Maison GR-engineering/
│       └── SKILL.md
├── CLAUDE.md
├── CURSOR.md
├── CONTRIBUTING.md
├── EXAMPLES.md
├── LICENSE
└── README.md
