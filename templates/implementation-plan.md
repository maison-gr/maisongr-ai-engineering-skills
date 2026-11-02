<!--
Maison GR implementation plan template.

Use it for work that spans several files or steps, touches a public contract or data,
or needs agreement before code is written. Ask the agent to fill it in and wait for
approval, or write it yourself and hand it to the agent.
-->

# Plan: <short title>

## Goal

<One sentence, in the user's terms. What will be true when this is done?>

## Success criteria

- [ ] <Observable result, for example "POST /orders with an expired coupon returns 422 with code coupon_expired">
- [ ] <Observable result>
- [ ] Existing tests, lint, type check and build pass.

## Facts and assumptions

**Facts** (verified in code or docs):
- <fact, with file path>

**Assumptions** (to confirm):
- <assumption>

## Approach

<A few sentences on the chosen approach and why. Mention the alternative you rejected, if any.>

## Steps

| # | Change | Files | Verified by |
|---|---|---|---|
| 1 | <change> | `<path>` | `<command or check>` |
| 2 | <change> | `<path>` | `<command or check>` |

## Out of scope

- <What will deliberately not change.>

## Risks

| Risk | Impact | How we will notice or prevent it |
|---|---|---|
| <risk> | <impact> | <mitigation> |

## Needs approval

- <New dependency, schema change, breaking API change, data migration, or none.>

## Open questions

- <Question whose answer changes the plan.>
