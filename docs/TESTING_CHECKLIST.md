# Pre-Deployment Test Checklist

Run through this top to bottom before deploying or submitting. Each item
says what to do and what "correct" looks like.

## 1. Auth

- [ ] **Sign up** with a brand-new email → succeeds, lands on permission/dashboard screen.
- [ ] **Sign up with an email that already exists** → clear error, not a crash.
- [ ] **Log in with correct credentials** → succeeds.
- [ ] **Log in with wrong password** → generic "invalid credentials" message (should NOT say "wrong password" specifically — confirms the app doesn't leak which field was wrong).
- [ ] **Log in with an email that doesn't exist** → same generic message as wrong password (same reason).
- [ ] **Password under 8 characters at signup** → blocked client-side before even hitting the backend.
- [ ] **Log out, then try opening the dashboard directly** → redirected to login, not a broken/blank page.
- [ ] **Close and reopen the app after logging in** → still logged in (session persisted), doesn't ask to sign in again.

## 2. Health Connect permissions (Android)

- [ ] **Fresh install, no permissions granted yet** → permission screen appears, not the dashboard.
- [ ] **Deny permissions** → app doesn't crash; some reasonable message/retry path, not a silent dead end.
- [ ] **Grant only some of the 5 permissions** (if the system dialog allows partial grant) → app doesn't crash; sync should still work for whichever parameters were granted, and just skip the rest.
- [ ] **Revoke all permissions from Android Settings, then reopen the app** → app detects this and routes back to the permission screen rather than pretending everything's fine.

## 3. Sync — the core feature, test thoroughly

- [ ] **First-ever sync** with real Health Connect data present → records upload, summary cards populate, sync status shows "Up to date."
- [ ] **Sync again immediately with no new data** → `recordsInserted: 0`, `recordsSkippedAsDuplicate` matches what was uploaded before. This is the idempotency proof — confirm the numbers actually make sense, don't just check it "succeeds."
- [ ] **Add new Health Connect data, then sync again** → only the new data shows as inserted; old data still shows as skipped, not re-inserted or duplicated.
- [ ] **Sync with the backend stopped (Docker down / Railway down)** → app shows a clear failure message, not a crash or infinite spinner.
- [ ] **Sync, then immediately background the app mid-sync, then reopen** → doesn't crash, sync either completes or fails cleanly, no stuck "Syncing…" state forever.
- [ ] **Try each date range option** (Last 7/14/30/60/90 days) → each one actually changes how far back it reads; spot-check that a longer range doesn't error out or time out.
- [ ] **Heart rate specifically** — confirm it aggregates as an average, not a sum (a day with 50 readings shouldn't show a wildly large "total" — check the dashboard card caption says "avg," not implying a sum).

## 4. Web dashboard — period selector and data correctness

- [ ] **Yesterday / Last Week / Last Month** — switch between all three multiple times; cards and chart actually change, not stuck showing the same numbers.
- [ ] **Data synced today specifically shows up** — this was a real bug we fixed (Last Week/Last Month previously stopped at yesterday, excluding today entirely). Confirm today's synced data now appears in Last Week and Last Month.
- [ ] **Brand new account, never synced** → empty state shown, not a blank screen or error.
- [ ] **One parameter has data, others don't** (e.g. only Steps synced so far) → that one card shows real data, the rest show "No data yet" individually — not the whole dashboard failing.
- [ ] **Refresh the page mid-load** → no broken half-rendered state.
- [ ] **Trend chart parameter pills** — click through all 5, chart updates correctly for each (bar chart for 4 of them, line chart specifically for Heart Rate).
- [ ] **Sync status badge** — shows correct relative time ("5 min ago," "2 hours ago," etc.), and updates after you sync from the phone and refresh the dashboard.
- [ ] **Click rapidly between periods several times in a row** → no "Too many requests" error under normal use (this was just fixed — confirm it actually holds now).

## 5. Error and fallback states — deliberately break things

- [ ] **Turn off WiFi on your phone mid-sync** → app shows a network error, not a crash.
- [ ] **Stop the backend while the web dashboard is open, then click Refresh** → `ErrorState` component appears with a Retry button, not a blank page.
- [ ] **Click Retry after restarting the backend** → recovers cleanly, doesn't need a full page reload.
- [ ] **Manually break the trend chart's request** (e.g. stop backend, switch parameters) → inline chart error + retry button appears, not a silently empty chart.
- [ ] **JWT expiry** — if you can wait out the token's expiry window (`JWT_EXPIRES_IN`), confirm an expired session redirects to login rather than showing cryptic errors. If waiting isn't practical, at least confirm the code path exists (`ApiError` with 401 → logout/redirect).

## 6. Idempotency edge cases (the thing most worth getting right)

- [ ] **Same sync request sent twice in a row** (tap Sync Now twice quickly) → no duplicate records, no crash from a race condition.
- [ ] **Device re-registration** — reinstall the app (same Health Connect data), sign in again → device registers cleanly without creating a duplicate device row (check `GET /devices` via curl/Postman if you want to confirm directly against the API).

## 7. Cross-device / cross-session

- [ ] **Sync from the phone, then open the dashboard on a completely different browser/device** (logged in as the same account) → sees the same data. Confirms data is account-scoped, not device-local.
- [ ] **Two different accounts** — sign up a second test account, sync different data, confirm each account only sees its own data (no cross-account leakage).

## 8. Deployment smoke tests (do these AFTER deploying, before calling it done)

- [ ] `curl https://<railway-url>/health` → returns `200 {"data":{"status":"ok"}}`.
- [ ] Open the deployed Vercel URL in an incognito window → login screen loads, no console errors about CORS or failed API calls.
- [ ] Sign in on the deployed dashboard → confirm it's actually hitting Railway, not still pointing at localhost (check Network tab in browser dev tools).
- [ ] Install the **release APK** (not a debug build from Android Studio) on a phone with mobile data only, WiFi off → confirms it truly works with no local network dependency.
- [ ] Full end-to-end on the deployed stack: install APK → sign in → grant permissions → sync → open deployed website → see the data. This is the exact flow the interviewer will do — run it yourself first.

## 9. Final sanity checks

- [ ] No `console.log` / `Log.d` debug spam left in critical paths (a few are fine, just nothing embarrassing or leaking tokens/passwords).
- [ ] `JWT_SECRET` on Railway is a real random value, not `your-secret-here` or anything from `.env.example`.
- [ ] Demo account password is the one documented in the README (`DemoPass123!`) — confirm it still works after seeding the deployed database.
- [ ] Read through `docs/ASSUMPTIONS.md` once more — make sure nothing there contradicts what the app actually does after all these fixes (e.g. the login-before-permissions order was changed since that doc was written — worth a quick check it's still accurate).

---

**Priority if you're short on time:** sections 3 (Sync) and 8 (Deployment smoke tests) are non-negotiable. Everything else is good practice but lower risk.