# Health Sync Web Dashboard

Next.js (App Router) + TypeScript + Tailwind + Recharts.

## Setup

```bash
npm install
cp .env.local.example .env.local   # point at your running backend
npm run dev                        # http://localhost:3000
```

Sign in with the seeded demo account (`demo@independenceos.ai` /
`DemoPass123!`) once you've run the backend's `npm run db:seed`, or create
a new account from the dashboard's sign-up tab.

## What's where

`app/dashboard/page.tsx` is the main screen: today's summary cards (steps,
sleep, heart rate, calories, distance), a weekly/monthly trend chart with a
parameter selector and date range filter, a "latest readings" panel, and
the sync status indicator in the top bar. `app/login/page.tsx` handles
sign-in/sign-up. Components are split out under `components/`; the
typed API client and shared contract types are under `lib/`.

## Design notes

The palette and type system (Libre Baskerville for headlines, IBM Plex
Sans for body/labels, IBM Plex Mono for data) are adapted from
Independence OS's actual product design rather than invented — see
`../docs/ASSUMPTIONS.md`. The signature visual element is the summary
cards: large tabular-numeral mono digits with a quiet sparkline trace
underneath, styled like a vital-sign monitor readout rather than a generic
SaaS metric tile.

The JWT is stored in `localStorage` for simplicity. A production version
would use an httpOnly cookie set by the backend instead, to keep the token
out of reach of any injected script — noted as a deliberate take-home
simplification, not an oversight.
