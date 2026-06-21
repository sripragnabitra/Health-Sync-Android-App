# Database Schema

Source of truth: `backend/prisma/schema.prisma`. `backend/sql/001_init.sql`
is the same schema hand-written as raw DDL, for anyone who wants to read
it without Prisma in the loop.

## Tables

### `users`
Standard auth table — email, bcrypt password hash, optional full name.
Nothing unusual here; included for completeness.

### `devices`
One row per physical device a user has synced from. The interesting
column is `client_device_id`: a UUID the *mobile app* generates once on
first launch and persists locally, not a server-generated id. Sending it
on every device-registration call makes registration idempotent —
reinstalling the app, or calling the endpoint twice, updates the same row
instead of creating a duplicate device record. `(user_id, client_device_id)`
is unique for exactly this reason.

### `health_records`
The raw, normalized readings. Two columns carry the actual idempotency
and timezone-correctness guarantees for the whole system:

- **`source_record_id`**, unique together with `user_id`. This is Health
  Connect's own record id (composited with a sample index for heart rate
  — see below). Re-uploading the same data — the user taps "sync" twice,
  or a request times out and the client retries — hits this unique index
  and is silently skipped via `createMany({ skipDuplicates: true })`. No
  application-level "have I seen this before" query needed; Postgres
  enforces it.
- **`local_date`**, a plain `DATE` set by the client, not derived from
  `recorded_at` server-side. See `docs/ASSUMPTIONS.md` for why.

One `HeartRateRecord` from Health Connect contains a *list* of bpm
samples spanning a time range, not one reading — `source_record_id` for
each becomes `"<record-id>_<sample-index>"` so each sample gets its own
row and its own idempotency key, rather than one record id covering many
distinct readings (which would make the unique constraint meaningless for
that parameter).

### `daily_health_summaries`
One row per `(user, date, parameter)`, recomputed synchronously whenever
new records land in that bucket (`sync.service.ts`'s `recomputeDailySummary`,
backed by the same `aggregateDaily` function that has unit tests in
`core/aggregation.test.ts`). `total_value` is `NULL` for `HEART_RATE` —
summing bpm readings across a day doesn't mean anything; only
avg/min/max apply. This is the table both the "today" cards and the
weekly/monthly trend charts read from, so a given day's number exists in
exactly one place.

### `sync_jobs`
One row per sync attempt (manual button tap or, optionally, the
WorkManager periodic trigger), with received/inserted/skipped counts and
a status. This is what the dashboard's sync-status indicator and "last
synced X ago" actually read from — it's a real audit trail, not a derived
value.

### `sync_errors`
One row per failure, linked to the `sync_jobs` row it happened during,
with the error code/message and a JSON context blob (stack trace in dev).
Separated from `sync_jobs` rather than just a `status=FAILED` column with
a message string, so a single job can in principle accumulate multiple
errors without overloading one column — and so error history survives
independently of how many columns `sync_jobs` itself ends up with.

## Indexes worth calling out

- `health_records(user_id, parameter_type, local_date)` — the read path
  for "give me all of today's heart rate records to recompute the
  summary," used on every sync.
- `health_records(user_id, parameter_type, recorded_at)` — the read path
  for "what's the single most recent reading," used by `/summary/latest`.
- `daily_health_summaries(user_id, parameter_type, summary_date)` — the
  read path for trend queries, which scan a date range for one parameter.

## What's deliberately not modeled

No `organizations`/multi-tenancy, no soft-deletes, no audit log beyond
`sync_errors`, no refresh tokens (the JWT is a single long-lived access
token — see ASSUMPTIONS.md). All reasonable next steps if this were
becoming a real product rather than a take-home; left out because adding
them now would be guessing at requirements nobody asked for.
