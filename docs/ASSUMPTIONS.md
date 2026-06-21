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

## Timezone & date handling

**`localDate` is set by the client, not derived from `recordedAt` on the
server.** A UTC timestamp alone can't tell you what calendar day a user
experienced a reading as — converting it correctly requires knowing their
timezone *at that moment*, which the phone knows and the server doesn't
(a user can travel, or have moved their phone's timezone setting, since
any earlier reading). The tradeoff: the server has to trust the client's
`localDate` rather than deriving it independently, which is a real trust
boundary for a multi-source-of-truth system but acceptable here since
there's exactly one client.

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

**JWT is a single long-lived access token, no refresh token.** A real
product would want short-lived access tokens plus a refresh flow so a
stolen token expires quickly. Skipped here as a known, named
simplification rather than an accidental gap — there's exactly one client
type and no token-revocation requirement in the brief.

## Web dashboard

**JWT stored in `localStorage`, not an httpOnly cookie.** An httpOnly
cookie set by the backend is the more secure pattern — it's unreachable
from any injected script, where `localStorage` isn't. `localStorage` was
used here because it's simpler to wire up against a backend that's
already JWT-bearer-token-based for the mobile client too (one auth
mechanism, two clients, rather than cookies for one and bearer tokens for
the other). Documented as a real, known tradeoff rather than presented as
the obviously-correct choice.

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
that's genuinely hard to debug without running an actual build — and this
project was written somewhere that can't run one. Manual DI removes that
risk entirely; at this app's size (a handful of repositories, one feature
area) it costs nothing in return.

**Fixed lookback window per sync, not an incremental cursor.** Every
manual sync reads the last 7 days from Health Connect (30 on the very
first sync) and re-uploads all of it, relying on the backend's idempotent
upsert to make repeats cheap rather than bandwidth-free. A cursor that
only advances on full success would be more efficient but introduces a
failure mode — a partially-failed sync leaving the watermark in an
inconsistent state — that a fixed window simply doesn't have.

**System fonts instead of bundled Libre Baskerville/IBM Plex.** Getting
the exact brand typefaces onto Android means either shipping font files
as resources (not practical to author as binary blobs in a code-editing
environment) or wiring up the Downloadable Fonts API, which needs a
Google Fonts provider certificate hash — get that hash wrong and it fails
silently at runtime, in a way that's hard to debug without a real device.
`FontFamily.Serif/Default/Monospace` mirrors the three-typeface *system*
without that risk; swapping in the real families later is a `Type.kt`-only
change.

**Light mode only, no dark theme.** The brand palette this mirrors is a
light, cream-and-iris design with no defined dark variant anywhere in the
source material. Inventing one to satisfy system dark-mode would mean
guessing at a look nobody designed, which seemed worse than one
deliberate light theme.

## What wasn't verified by actually running it

This was built in a sandboxed environment with no internet access and
none of Postgres, the Android SDK, or a real npm registry available. The
backend's pure business logic (`backend/src/core/`) — aggregation,
deduplication, date bucketing, rollups — *was* actually run via
`npx tsx --test`, 17/17 passing, including two real bugs caught and fixed
that way (an ISO-date validator that let `"2026-13-40"` silently through
because of how `Date.UTC` normalizes overflow, and a test assertion that
didn't account for intentional rounding). Everything that needs Express,
Prisma against a live database, Next.js's build pipeline, or Android's
Gradle/Health Connect stack was written carefully but not executed here —
worth your own test pass before relying on it, particularly given how
much of the Android/Health Connect API surface (record shapes, permission
flow specifics) is being recalled from training data rather than checked
against a compiler in this environment.
