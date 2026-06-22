# Health Sync — Android

Kotlin + Jetpack Compose + Health Connect + Retrofit. Minimum SDK 26, target/compile SDK 35.

Sign in with the seeded demo account (`demo@independenceos.ai` /
`DemoPass123!`) once you've run the backend's `npm run db:seed`, or create
a new account from the dashboard's sign-up tab.

## Opening the project

Open the `android/` folder in Android Studio (Ladybird or newer). Android
Studio will detect the missing `gradle-wrapper.jar` binary — this repo
ships `gradle-wrapper.properties` (pinning Gradle 8.7) but not the wrapper
jar itself, since it's a binary file. Studio will offer to regenerate it
automatically, or run `gradle wrapper` once yourself if you have a system
Gradle installed.

## Pointing the app at your backend

**This app is meant to be installed standalone on any phone** — signed
in, synced, with no WiFi-matching or IP configuration required by
whoever's using it. That means `API_BASE_URL` should point at a
**deployed** backend, not a local one.

`app/build.gradle.kts` ships with a placeholder:
```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://REPLACE-WITH-YOUR-RAILWAY-URL.up.railway.app/api/v1/\"")
```
Follow [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) to deploy the
backend (Railway) and dashboard (Vercel), then replace that line with
your real Railway URL and build a release APK. That APK then works on
any phone, anywhere, over WiFi or mobile data.

**For local development only** (testing changes against a backend
running on your own laptop, before deploying): change `API_BASE_URL` to
`http://10.0.2.2:4000/api/v1/` for an emulator, or your laptop's LAN IP
(e.g. `http://192.168.1.50:4000/api/v1/`) for a real device on the same
WiFi network — and ensure your laptop's firewall allows inbound
connections on port 4000 in the latter case.

`usesCleartextTraffic="true"` in the manifest permits plain `http://`
for that local-development path; it has no effect once you're pointed at
the deployed `https://` backend.

## Getting health data onto a test device

This app only requests **read** permissions (see AndroidManifest.xml) — it
doesn't write to Health Connect itself, since the actual feature is
reading data a fitness app already produced, not generating it. To get
data to read during testing: install Google Fit (or any Health
Connect-integrated app) on the same device/emulator and log a few
activities/manual entries through it — that data flows into Health
Connect, and this app's permission screen will then have something to
request access to and sync.

On Android 13 and below, Health Connect is a separate app the user
installs from Play Store (the permission screen's "Install Health
Connect" button handles this). On Android 14+, it's built into the OS
under Settings.

## Architecture notes

**Manual DI, not Hilt.** `di/AppContainer.kt` is a plain class wiring
repositories together by hand. Hilt's annotation processing is a class of
build failure that's hard to debug without actually running a build, and
this project was written somewhere that can't run one — manual DI removes
that risk entirely, and at this app's size (a few repositories, no
multi-module graph) it costs nothing.

**Idempotent sync.** `domain/NormalizedHealthPoint.sourceRecordId` is
built from Health Connect's own record id (and, for heart rate, a
per-sample suffix — one HeartRateRecord contains many bpm samples, see
`HealthDataMapper.mapHeartRate`). The backend's unique constraint on
`(user_id, source_record_id)` is what actually makes re-syncing the same
data safe; this id is just what makes that constraint meaningful.

**Fixed lookback window, not an incremental cursor.** Every sync reads the
last 7 days (30 on first run) from Health Connect and re-uploads all of
it; the backend's idempotent upsert makes the repeats cheap. A watermark
that advances only on success would be more bandwidth-efficient but adds
a failure mode (a partially-failed sync could leave the watermark in a
bad state) that isn't worth the complexity here.

**Three-typeface system, system fonts.** The UI mirrors the web
dashboard's serif/sans/mono type system using Compose's built-in generic
font families rather than bundling the exact brand typefaces — see
`ui/theme/Type.kt` for why (bundling real font files or wiring up the
Downloadable Fonts API both have real ways to fail that aren't verifiable
without a device to test on).
