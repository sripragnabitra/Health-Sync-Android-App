# Deployment Guide

Goal: anyone can install the Health sync Android app,
sign in, grant Health Connect permissions, tap **Sync Now**, then open a
website URL and see the stats. No laptop, no WiFi matching, no IP
configuration required by whoever's using it.

Two free-tier services do this: **Railway** for the backend+database,
**Vercel** for the web dashboard. Total time: ~45–60 minutes, mostly
waiting on builds.

---

## Part 1 — Push your code to GitHub

Both Railway and Vercel deploy from a GitHub repo, not a zip upload.

```bash
cd health-sync-platform
git init
git add .
git commit -m "Initial commit"
```

Create a new repo on [github.com/new](https://github.com/new) (public or
private, either works), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

---

## Part 2 — Deploy the backend (Railway)

1. Go to [railway.app](https://railway.app) → sign up with GitHub (free, no card required for the free tier).
2. Click **New Project** → **Deploy from GitHub repo** → pick your repo.
3. Railway will ask which folder to deploy — it may try to deploy the repo root. Click the new service's **Settings** tab → **Root Directory** → set to `backend`.
4. Click **New** → **Database** → **Add PostgreSQL**. Railway provisions this automatically and gives it its own `DATABASE_URL`.
5. Click on your **backend service** (not the database) → **Variables** tab → add these:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Click "Add Reference" → select the Postgres service → `DATABASE_URL` (Railway auto-fills this) |
   | `JWT_SECRET` | Any random 32+ character string — generate one: `openssl rand -base64 32` |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | `http://localhost:3000` for now — **you'll update this in Part 3** once you have the Vercel URL |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |

6. Railway auto-detects the `Dockerfile` and `railway.json` already in `backend/` and builds from those — no extra config needed.
7. Click **Deploy**. Watch the build logs. First build takes 3–5 minutes.
8. Once deployed, go to **Settings** → **Networking** → **Generate Domain**. You'll get a URL like:
   ```
   https://healthsync-backend-production.up.railway.app
   ```
9. **Test it.** Open in any browser:
   ```
   https://healthsync-backend-production.up.railway.app/health
   ```
   You should see `{"data":{"status":"ok",...}}`. If you get an error, check the Railway build/deploy logs for what failed — usually a missing environment variable.
10. Seed the demo account. In Railway, click your backend service → the three-dot menu → **Shell** (or use the Railway CLI: `railway run npm run db:seed` from your `backend/` folder after `railway link`).

**Save this URL — you'll need it twice more.**

---

## Part 3 — Deploy the web dashboard (Vercel)

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub.
2. Click **Add New** → **Project** → import your repo.
3. Vercel will ask for the **Root Directory** — set it to `web`.
4. Framework Preset should auto-detect as **Next.js** — leave it.
5. Expand **Environment Variables** and add:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://healthsync-backend-production.up.railway.app/api/v1` (your Railway URL from Part 2, with `/api/v1` appended, **no trailing slash**) |

6. Click **Deploy**. Takes 1–2 minutes.
7. You'll get a URL like:
   ```
   https://healthsync.vercel.app
   ```

**This is the URL the interviewer opens in a browser to see the stats.**

---

## Part 4 — Connect the two (update CORS)

Now that you have the Vercel URL, go back to Railway:

1. Backend service → **Variables** → edit `CORS_ORIGIN` →
   ```
   https://healthsync.vercel.app,http://localhost:3000
   ```
   (comma-separated — the backend already supports this format, so both your deployed dashboard and any local testing work without redeploying again)
2. Railway redeploys automatically when you change a variable.

**Test:** open `https://healthsync.vercel.app`, sign in with the seeded demo account. You should see the (empty, for now) dashboard with no console errors about CORS.

---

## Part 5 — Build the Android APK pointing at your live backend

1. Open `android/app/build.gradle.kts`.
2. Find this line:
   ```kotlin
   buildConfigField("String", "API_BASE_URL", "\"https://REPLACE-WITH-YOUR-RAILWAY-URL.up.railway.app/api/v1/\"")
   ```
3. Replace it with your actual Railway URL (note the trailing slash **is** needed here, unlike Vercel's env var):
   ```kotlin
   buildConfigField("String", "API_BASE_URL", "\"https://healthsync-backend-production.up.railway.app/api/v1/\"")
   ```
4. In Android Studio: **Build** menu → **Generate Signed Bundle / APK** → **APK** → create a new keystore (any password, save it somewhere) → **release** build variant → Finish.
5. Find the output APK at `android/app/release/app-release.apk`.

This APK now works **standalone** — install it on any phone, anywhere, on any WiFi or mobile data, with zero configuration. It talks directly to your live Railway backend over the internet.

---

## Part 6 — Distribute the APK

The easiest way to get the APK onto a phone without a Play Store listing:

- Upload `app-release.apk` to Google Drive, get a shareable link, send it
- Or attach it directly if your submission method supports file attachments
- The installer opens the link on their phone, downloads it, and taps to install (they'll need to allow "install from unknown sources" once — Android will prompt for this automatically)

---

## What the interviewer experiences end-to-end

1. Opens your shared APK link on their phone → installs it
2. Opens the Health Sync app → signs in (use the seeded demo account, or creates their own)
3. Grants Health Connect permissions
4. Taps **Sync Now**
5. Opens `https://healthsync.vercel.app` in any browser, on any device
6. Sees the stats

No laptop. No IP address. No WiFi matching. Exactly what was asked for.

---

## Costs

Both Railway and Vercel have free tiers sufficient for this. Railway's free tier includes a small monthly credit that comfortably covers a low-traffic Postgres + API for a demo/interview use case; Vercel's free tier has no time limit for a project this size. Nothing here requires a credit card to start, though Railway may ask for one once you exceed the free credit (unlikely for this use case).
