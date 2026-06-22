# Assumptions & Tradeoffs

Every deliberate decision made while building this, in one place, instead
of scattered across code comments. If something here looks like it should
have gone differently, it was a choice, not an oversight — and the
alternative considered is usually noted.

## Scope

**Why these 5 of 13 possible parameters.** Steps, Distance, Active
Calories, Heart Rate, Sleep Duration — chosen because they're exactly what
the brief's own example dashboard (section 9) shows, and because they
span three different Health Connect categories (Activity, Heart, Sleep)
rather than five variations on "steps-like" data. Heart rate specifically
earns its slot because it can't be summed the way the other four can —
including it forces the aggregation logic to actually branch on parameter
type instead of one code path quietly handling everything.

**The login → permissions → dashboard order was deliberately changed
mid-build.** An earlier version requested Health Connect permissions
before authentication; this was reordered to match the brief's explicit
flow (section 2: sign in, *then* grant permissions) once the discrepancy
was noticed during testing.

**One trend chart with a period selector, not two separate "weekly" and
"monthly" charts.** Section 8 lists "Weekly trend chart" and "Monthly
trend chart" as two bullet points. This build consolidates both into a
single chart whose granularity (daily bars for Today/Yesterday/Last Week,
weekly-bucketed for Last Month) follows one top-level period selector
that also drives the summary cards. This was a deliberate UX choice, not
an oversight: it avoids two redundant, always-partially-stale charts on
screen at once, and is the same pattern used by most real fitness
dashboards (including the design this one's visual language is adapted
from). Functionally, every requirement in those two bullets — weekly
trends, monthly trends — is covered; it's just unified into one
component the user controls.

## Timezone & date handling

**`localDate` is set by the client, not derived from `recordedAt` on the
server.** A UTC timestamp alone can't tell you what calendar day a user
experienced a reading as — converting it correctly requires knowing their
timezone *at that moment*, which the phone knows and the server doesn't
(a user can travel, or have moved their phone's timezone setting, since
any earlier reading). The tradeoff: the server has to trust the client's
`localDate` rather than deriving it independently, which is a real trust
boundary for a multi-source-of-truth system but acceptable here since
there's exactly one client *type* — this is unrelated to and doesn't
limit how many different *users* can use the app concurrently, which is
fully supported (every request is authenticated and scoped per-user
independently).

**Sleep is attributed to the date the session *ends*, not starts.** "Last
night's sleep" conventionally means the morning you woke up, which is how
most fitness dashboards group it. The alternative — attributing to the
night it started — was considered and rejected because a session starting
at 11pm and ending at 7am would then show up a full calendar day before
the user actually sees it reflected anywhere, which reads as the data
being "late."

**Heart rate's `sourceRecordId` is composite: `"<health-connect-record-id>_<sample-index>"`.**
One `HeartRateRecord` contains a list of bpm samples spanning a time
range, not a single reading. Without compositing the id, all samples in
one record would collide on the backend's idempotency key and only one
would survive the upsert.

## Backend

**Synchronous aggregation, not a queue.** Daily summaries are recomputed
inline during the sync request, not handed off to a background job. A
real product syncing thousands of users' data at once would want this
decoupled (so a slow recompute doesn't hold an HTTP connection open); at
this scale, synchronous is simpler to reason about and to demo, and there
was no evidence the brief expected a queue.

**Postgres, not SQLite.** The brief listed both as acceptable. Postgres
was chosen specifically *because* this build had no time pressure forcing
a shortcut — it's the more production-realistic choice (concurrent
writes, real `DATE`/enum types, the kind of database this would actually
ship on) and the brief's own Docker Compose suggestion points the same
direction.

**JWT is a single long-lived access token, no refresh token.** In a
typical production system, a short-lived access token (minutes) paired
with a longer-lived refresh token lets the app silently obtain new access
tokens in the background without the user noticing, while keeping the
window in which a stolen token is useful very small. This build skips
that and issues one flat-lived token (currently 7 days) with no refresh
mechanism — simpler to implement and reason about, at the cost of a
stolen token remaining valid for the full 7 days instead of minutes.
Acceptable here since there's no token-revocation requirement in the
brief and this isn't handling real user data in production.

**No password reset / forgot-password flow.** Not requested anywhere in
the brief (the auth requirement is "REST APIs for... authentication,"
satisfied by signup/login). Implementing it would require email-sending
infrastructure (SMTP or a transactional email provider) that's out of
scope for a self-contained take-home deliverable. Noted here as a
deliberate omission rather than an oversight.

**No social/OAuth login (Google, etc.).** Same reasoning — not requested,
and would add real infrastructure (OAuth client registration, consent
screens, redirect URI configuration for both the web and Android clients)
for no corresponding requirement. Email/password JWT auth fully satisfies
the brief's authentication requirement on its own.

## Web dashboard

**JWT stored in `localStorage`, not an httpOnly cookie.** An httpOnly
cookie set by the backend is the more secure pattern — it's unreachable
from any injected script (XSS), where `localStorage` is readable by any
JavaScript running on the page. `localStorage` was used here because it's
simpler to wire up against a backend that's already JWT-bearer-token-based
for the mobile client too (one auth mechanism serving two very different
clients, rather than cookies for one and bearer tokens for the other).
Documented as a real, known tradeoff rather than presented as the
obviously-correct choice — for a take-home project with no real user data
at stake, the simplicity was judged worth it.

**Design language adapted from Independence OS's actual product**
(`Scrubber_standalone.html`, provided alongside the assignment) rather
than invented from scratch — same color tokens, same three-typeface
system (Libre Baskerville / IBM Plex Sans / IBM Plex Mono). The summary
cards' large mono-numeral-plus-sparkline styling is the one place this
dashboard spends visual boldness; everything else stays quiet by design.

## Android

**Manual DI, not Hilt/Dagger.** `di/AppContainer.kt` wires repositories
by hand. Hilt's annotation processing is a category of build failure
(KSP misconfiguration, missing annotations, generated-code mismatches)
that's genuinely hard to debug blind. Manual DI removes that risk
entirely; at this app's size (a handful of repositories, one feature
area) it costs nothing in return.

**Fixed lookback window per sync, not an incremental cursor — but now
user-selectable.** Originally every sync read a hardcoded last 7 days (30
on first sync). This was changed during testing to a user-facing date
range picker (Last 7/14/30/60/90 days) on the dashboard, satisfying the
brief's "read historical health data for a selected date range"
requirement explicitly rather than implicitly. Still not an incremental
cursor — every sync re-reads and re-uploads the full selected window,
relying on the backend's idempotent upsert to make repeats cheap. A
cursor that only advances on full success would be more bandwidth-
efficient but introduces a failure mode (a partially-failed sync leaving
the watermark in an inconsistent state) that a fixed, repeatable window
simply doesn't have.

**System fonts instead of bundled Libre Baskerville/IBM Plex.** Getting
the exact brand typefaces onto Android means either shipping font files
as resources or wiring up the Downloadable Fonts API (which needs a
Google Fonts provider certificate hash — getting that wrong fails
silently at runtime). `FontFamily.Serif/Default/Monospace` mirrors the
three-typeface *system* without that risk; swapping in the real families
later is a `Type.kt`-only change.

**Light mode only, no dark theme.** The brand palette this mirrors is a
light, cream-and-iris design with no defined dark variant anywhere in the
source material. Inventing one to satisfy system dark-mode would mean
guessing at a look nobody designed.

**The Health Connect permission-request "ViewPermissionUsageActivity"
manifest alias.** Health Connect requires apps to declare a specific,
exactly-named `activity-alias` (`ViewPermissionUsageActivity`, with the
`android.permission.START_VIEW_PERMISSION_USAGE` permission and a
`VIEW_PERMISSION_USAGE` / `HEALTH_PERMISSIONS` intent filter) before it
will display its permission grant dialog at all. Without it, the system
permission screen opens and silently closes within milliseconds — no
crash, no error, just nothing visibly happening. This was found and
fixed during real-device testing (the symptom looked identical to a GPU
rendering issue on an emulator at first, which delayed finding the actual
cause); documented here because it's exactly the kind of Health Connect
integration detail that's easy to miss and hard to diagnose from
documentation alone.

## What was and wasn't verified

The backend's pure business logic (`backend/src/core/`) — aggregation,
deduplication, date bucketing, rollups — was run via `npx tsx --test`
during initial development, 17/17 passing. The full stack — Android app,
Express/Prisma backend against a live Postgres instance, and the Next.js
dashboard — has since been tested end-to-end on a real Android device
(Samsung SM-S731B) against a local Docker backend, including: account
creation, the full Health Connect permission grant flow, manual sync with
idempotency verified directly (re-syncing identical data produces zero
new inserts), the date range picker, the web dashboard's period selector
and trend charts across all three period options, error states (backend
unreachable, expired session, validation failures), and direct database
inspection via `psql` to confirm data is written and scoped correctly per
user. A number of real, non-obvious bugs were found and fixed this way
rather than through code review alone — among them: a Docker multi-stage
build copying the wrong stage's `node_modules` (missing the generated
Prisma Client entirely), a missing Prisma migration file, a `compileSdk`
version mismatch required by the Health Connect library, a third-party
Retrofit converter dependency that failed to resolve in practice, missing
launcher icon resources, the login/permission ordering bug described
above, the Health Connect manifest alias bug described above, a stale
cached device ID surviving logout and causing "unknown device" errors on
account switches, a date-range boundary bug that silently excluded
same-day data from every dashboard view, and a dashboard rate limit tuned
too low for its own request pattern.

The deployed stack (Railway backend, Vercel dashboard, release APK
pointed at the live backend) is the final verification step, in progress
as of this writing — local testing above is complete and passing, with
deployment-specific configuration (environment variables, CORS origins,
build-time vs runtime variable handling on Vercel) being the remaining
work before the same end-to-end pass is repeated against the live URLs.

## Future enhancements (acknowledged, not implemented)

Out of scope for this submission but worth naming explicitly rather than
leaving unaddressed: a dark theme and a higher-contrast accessible theme
variant (current build is light-mode-only by design, see above); a
refresh-token auth flow; httpOnly-cookie session storage; password reset;
OAuth/social login; background/scheduled sync beyond the optional
WorkManager periodic job already included; and an incremental sync
cursor instead of the current fixed-window-with-idempotent-upsert
approach.
