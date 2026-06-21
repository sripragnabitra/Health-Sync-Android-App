# Health Sync Backend

Node.js + Express + TypeScript + Prisma + PostgreSQL.

## Setup

```bash
npm install
cp .env.example .env        # edit JWT_SECRET at minimum

# Option A — Docker (Postgres + API in containers)
docker compose up --build

# Option B — local Postgres
docker run -d --name healthsync-pg -e POSTGRES_USER=healthsync \
  -e POSTGRES_PASSWORD=healthsync -e POSTGRES_DB=healthsync -p 5432:5432 postgres:16-alpine
npm run db:migrate
npm run db:seed              # creates demo@independenceos.ai / DemoPass123!
npm run dev                  # http://localhost:4000
```

`npm run db:migrate` runs Prisma's own migration generator against your
live database. `sql/001_init.sql` is a hand-written equivalent of the same
schema, for inspecting the DDL directly without Prisma — don't run both
against the same database.

## Tests

```bash
npm test
```

Runs the pure aggregation/dedupe/date-bucketing logic in `src/core/` under
`node:test` — these have zero external dependencies, so they don't need a
database to verify. Everything that talks to Postgres (services, routes)
is integration-tested by actually exercising the running API; see the
Postman collection in `../docs/`.

## API overview

All routes are under `/api/v1`. Authenticated routes expect
`Authorization: Bearer <token>` from `/auth/login` or `/auth/signup`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/signup` | Create an account |
| POST | `/auth/login` | Get a JWT |
| GET | `/auth/me` | Current user profile |
| POST | `/devices` | Register/update this device (idempotent by `clientDeviceId`) |
| GET | `/devices` | List this user's devices |
| POST | `/sync/health-records` | Upload a batch of readings (this *is* manual re-sync) |
| GET | `/sync/status` | Latest job, last successful sync, recent history |
| GET | `/summary/daily?date=` | All 5 parameters for one day (defaults to today) |
| GET | `/summary/latest` | Most recent single reading per parameter |
| GET | `/summary/trend/weekly?parameterType=&from=&to=` | Weekly trend points |
| GET | `/summary/trend/monthly?parameterType=&from=&to=` | Monthly trend points |

Full request/response bodies are in `../docs/API.md`.

## Why these choices

See `../docs/ASSUMPTIONS.md` for the reasoning behind the parameter
selection, the client-supplied `localDate`, server-determined units,
synchronous (not queued) aggregation, and a few other tradeoffs made
deliberately for a take-home rather than by oversight.
