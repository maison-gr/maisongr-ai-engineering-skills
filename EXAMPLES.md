# Examples

One realistic scenario per principle: what an agent typically does, why it goes wrong, and what the Maison GR principles produce instead. The code is TypeScript and SQL, but the patterns apply to any stack.

---

## 1. Understand before implementing

**Request:** "Add a 'last active' column to the admin users table."

### Typical agent behaviour

The agent adds a `lastActive` column that displays `user.updatedAt`, formatted with `toLocaleString()`, and reports the task done.

**What went wrong:**

- `updatedAt` changes when an admin edits the user's profile, so it is not activity. The agent did not check whether activity is recorded anywhere.
- `toLocaleString()` renders in the server's time zone when the page is rendered on the server.
- The table is paginated on the server, so sorting by the new column may be expected, and was not considered.

### With the principles

The agent reads the user model and session code first, then replies before writing code:

> **Facts:** the users table renders on the server and paginates through `listUsers()`. `sessions.last_seen_at` is updated on each authenticated request; `users.updated_at` changes on any profile edit.
>
> **Assumptions:** "last active" means the most recent authenticated request, not profile edits. Times show in the viewer's time zone, consistent with the "Created" column.
>
> **Question:** should the column be sortable? Sorting needs an aggregate over `sessions` in `listUsers()` and an index, which is a larger change than display only.

One question, asked because its answer changes the query and the schema. The time zone choice follows an existing convention, so it is stated rather than asked.

---

## 2. Simplicity first

**Request:** "Send a welcome email when someone signs up."

### Typical agent behaviour

```typescript
interface NotificationChannel { send(to: Recipient, message: Message): Promise<DeliveryResult>; }
class EmailChannel implements NotificationChannel { /* ... */ }
class SmsChannel implements NotificationChannel { /* not implemented yet */ }
class NotificationService {
  constructor(private channels: Map<ChannelType, NotificationChannel>, private templates: TemplateRegistry) {}
  async notify(event: DomainEvent, preferences: ChannelPreferences) { /* ... */ }
}
// plus TemplateRegistry, ChannelPreferences, DeliveryResult, a retry policy, and 140 lines of tests
```

**What went wrong:** a notification framework for one email. An SMS channel nobody asked for, a template registry with one template, and user preferences that do not exist. All of it must now be maintained.

### With the principles

The agent finds that the project already sends password-reset emails through `mailer.send()` with templates in `emails/`. It adds:

```typescript
// src/auth/signup.ts
await createUser(input);
await mailer.send({ to: input.email, template: "welcome", data: { name: input.name } });
```

It adds the `emails/welcome.tsx` template, following `emails/password-reset.tsx`, and a test that signup sends the welcome email. The report notes one decision for review: if sending fails, signup still succeeds and the error is logged, matching how password-reset handles failures.

When a second channel becomes a real requirement, that is the time to introduce an abstraction, informed by two real cases instead of one imagined one.

---

## 3. Surgical changes

**Request:** "Invoice totals are sometimes off by a cent. Fix it."

### Typical agent behaviour

```diff
-import { formatMoney } from "../utils/format"
-export function invoiceTotal(lines) {
-  let total = 0
-  for (const line of lines) total += line.unitPrice * line.quantity * (1 + line.taxRate)
-  return Math.round(total * 100) / 100
+import Decimal from "decimal.js";
+import { formatMoney } from "../utils/format";
+
+export const calculateInvoiceTotal = (invoiceLines: InvoiceLine[]): Decimal =>
+  invoiceLines.reduce(
+    (sum, { unitPrice, quantity, taxRate }) =>
+      sum.plus(new Decimal(unitPrice).times(quantity).times(new Decimal(1).plus(taxRate))),
+    new Decimal(0),
+  );
```

**What went wrong:** a new dependency, a renamed export (breaking every caller), a changed return type, added semicolons that the file's style does not use, and the original rounding question still unanswered. The reviewer cannot tell which change fixes the bug.

### With the principles

The agent first reproduces the bug: three lines at 10.04 with 13% tax give a total of 34.04, but the PDF the customer receives shows each line as 11.35, which sums to 34.05. The cause: `invoiceTotal()` rounds once at the end, while the PDF rounds each line.

```diff
 export function invoiceTotal(lines) {
   let total = 0
-  for (const line of lines) total += line.unitPrice * line.quantity * (1 + line.taxRate)
+  for (const line of lines) total += lineTotal(line)
   return Math.round(total * 100) / 100
 }
```

`lineTotal()` already exists in the same file and is used by the PDF renderer. The diff changes one line, with a regression test for the three-lines-at-10.04 case. The report adds: *"Noticed, not changed: money is stored as floating-point numbers throughout `billing/`. Integer cents would remove this class of bug; worth a separate task."*

---

## 4. Goal-driven execution

**Request:** "The CSV import is too slow for big customers."

### Typical agent behaviour

The agent switches to a streaming parser, adds batching, and reports: "Optimised the import, which should now be much faster."

**What went wrong:** "should" means it was not measured. There is no baseline, no target and no check that the output is unchanged.

### With the principles

```text
Goal: large customer imports finish without timing out.
Done when:
  - a 200,000-row fixture imports in under 60 s locally (baseline: measure first)
  - memory stays under 512 MB during the import
  - imported rows are identical to the current implementation's output for the existing fixtures
Steps:
  1. Add a 200k-row fixture and a timing script -> verify: baseline recorded
  2. Profile the import -> verify: the top cost is identified with evidence
  3. Fix the top cost only -> verify: timing script, plus the existing import tests
  4. Repeat 2-3 only if the target is not met
```

Profiling shows that 80% of the time goes to one `SELECT` per row to check for duplicates. Loading existing keys once, in a single query, brings the import from 7 min 40 s to 38 s. The streaming parser was never needed.

---

## 5. Verify before completion

**Request:** "Add rate limiting to the login endpoint."

### Typical agent report

> Done! Added rate limiting to login. All tests pass ✅

The agent ran the unit tests, but the rate limiter is configured in middleware that the unit tests bypass. Nobody has seen it reject a request.

### With the principles

> **Changed:**
> - `src/middleware/rate-limit.ts`: 5 attempts per 15 minutes per IP and email pair, using the existing Redis client.
> - `src/routes/auth.ts`: limiter applied to `POST /login` only.
> - `test/auth/login-rate-limit.test.ts`: new integration test.
>
> **Verified:**
> - `npm test`: 214 passed.
> - New integration test: the 6th attempt returns 429 with a `Retry-After` header, and a different email from the same IP is not blocked.
> - Ran the app locally and sent 6 requests with curl: 401 five times, then 429.
>
> **Not verified:**
> - Behaviour behind the production load balancer. If it does not forward the client IP correctly, all users would share one limit. Please confirm that `trust proxy` is set for production.
>
> **Decisions to review:** the limit is per IP and email pair rather than per IP, so a shared office network is not locked out by one person.

---

## 6. Secure by default

**Request:** "Add an endpoint to download an invoice PDF."

### Typical agent behaviour

```typescript
router.get("/invoices/:id/pdf", requireAuth, async (req, res) => {
  const invoice = await db.invoice.findUnique({ where: { id: req.params.id } });
  res.type("pdf").send(await renderInvoicePdf(invoice));
});
```

**What went wrong:** `requireAuth` checks that someone is signed in, not that the invoice belongs to them. Any customer can download any invoice by changing the id. The endpoint works perfectly in every manual test the author runs with their own invoices.

### With the principles

```typescript
router.get("/invoices/:id/pdf", requireAuth, async (req, res) => {
  const invoice = await db.invoice.findFirst({
    where: { id: req.params.id, accountId: req.session.accountId },
  });
  if (!invoice) return res.status(404).end();
  res.type("pdf").send(await renderInvoicePdf(invoice));
});
```

The test suite includes a case where user A requests user B's invoice and receives 404. The status is 404, not 403, so the response does not confirm that the invoice exists. The report flags the endpoint as security-relevant.

---

## 7. Guard irreversible actions

**Request:** "Rename the `user_name` column to `username`."

### Typical agent behaviour

```sql
ALTER TABLE users RENAME COLUMN user_name TO username;
```

The agent updates the ORM model, runs the migration against the database in `DATABASE_URL`, commits, and pushes.

**What went wrong:** during deployment, servers still running the old code query `user_name` and fail until every instance restarts. The agent did not check which database `DATABASE_URL` pointed to. And it pushed without being asked.

### With the principles

The agent confirms that `DATABASE_URL` points to the local development database, then proposes an expand-and-contract sequence:

```text
Release 1 (expand):  add column username; write to both columns; backfill in batches.
Release 2 (switch):  read from username; keep writing to both.
Release 3 (contract): stop writing user_name; drop it in a separate migration.
```

It implements release 1, runs the migration and its rollback locally, and commits it as one focused change under the developer's Git identity. It does not push. The report says the change needs three deployments and asks whether the team prefers that or a short maintenance window with a single rename.
