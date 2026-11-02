<!--
Maison GR project instructions template.

Append this section to your project's AGENTS.md, below the Maison GR principles,
and fill in every placeholder. Delete sections that do not apply.
Keep it short: agents load this file in every session, so every line costs context.
Write facts an agent cannot discover quickly from the code, not general advice.
-->

## This project

<One or two sentences: what the product does and who uses it.>

**Stack:** <framework and version>, <language>, <database>, <hosting>.

## Commands

Run these from the repository root.

| Purpose | Command |
|---|---|
| Install | `<command>` |
| Develop | `<command>` |
| Test (all) | `<command>` |
| Test (one file) | `<command> <path>` |
| Lint | `<command>` |
| Type check | `<command>` |
| Build | `<command>` |

A change is ready when test, lint, type check and build all pass.

## Layout

- `<path>/`: <what lives here>
- `<path>/`: <what lives here>

## Conventions

- <A convention an agent would get wrong without being told, for example "server actions live next to the page that uses them".>
- <Error handling pattern, for example "throw AppError from services; route handlers map it to Problem Details".>
- <Testing pattern, for example "integration tests use the real Postgres from docker compose, never mocks".>

## Boundaries

**Always:**
- <for example: run the test command before reporting a task done>

**Ask first:**
- <for example: adding a dependency, changing the database schema, editing CI>

**Never:**
- <for example: edit files under `generated/`, commit `.env` files, run migrations against a non-local database>

## Domain terms

- **<Term>:** <meaning in this product, where it differs from everyday use>
