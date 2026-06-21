-- ============================================================================
-- Mobile Health Data Sync Platform — initial schema
--
-- This is a hand-written equivalent of prisma/schema.prisma. Prisma normally
-- generates migration SQL from `prisma migrate dev` against a live database;
-- this file exists so the schema can be inspected/run directly without that
-- step, and so it's a tangible artifact of the relational design rather than
-- something that only exists inside an ORM.
--
-- Run with: psql "$DATABASE_URL" -f sql/001_init.sql
-- (Prisma's migration history is the source of truth if both are used — see
-- backend/README.md for which one to actually run.)
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create type platform as enum ('ANDROID', 'IOS');
create type parameter_type as enum ('STEPS', 'DISTANCE_METERS', 'ACTIVE_CALORIES', 'HEART_RATE', 'SLEEP_DURATION');
create type sync_trigger as enum ('MANUAL', 'SCHEDULED');
create type sync_status as enum ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- A trigger-based updated_at, so it stays correct even for rows touched by
-- something other than Prisma Client (a manual psql UPDATE, a future batch job).
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
create table users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  full_name     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
create table devices (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  client_device_id text not null, -- generated once on-device, persisted client-side
  platform         platform not null default 'ANDROID',
  device_model     text,
  os_version       text,
  app_version      text,
  last_seen_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (user_id, client_device_id)
);

create index idx_devices_user on devices(user_id);

-- ----------------------------------------------------------------------------
create table sync_jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  device_id        uuid not null references devices(id) on delete cascade,
  status           sync_status not null default 'PENDING',
  trigger          sync_trigger not null default 'MANUAL',
  records_received int not null default 0,
  records_inserted int not null default 0,
  records_skipped  int not null default 0,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index idx_sync_jobs_user_started on sync_jobs(user_id, started_at desc);

-- ----------------------------------------------------------------------------
create table health_records (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  device_id         uuid not null references devices(id) on delete cascade,
  sync_job_id       uuid references sync_jobs(id) on delete set null,
  parameter_type    parameter_type not null,
  value             numeric(12, 4) not null,
  unit              text not null,
  recorded_at       timestamptz not null,
  recorded_end_at   timestamptz,
  -- Calendar day this reading counts toward, decided client-side. See
  -- docs/ASSUMPTIONS.md for why this isn't derived from recorded_at here.
  local_date        date not null,
  -- Health Connect's own record id. This unique constraint is the actual
  -- idempotency guarantee for re-syncs — see core/dedupe.ts for the
  -- in-memory mirror of this same rule.
  source_record_id  text not null,
  created_at        timestamptz not null default now(),
  unique (user_id, source_record_id)
);

create index idx_health_records_user_param_localdate on health_records(user_id, parameter_type, local_date);
create index idx_health_records_user_param_recordedat on health_records(user_id, parameter_type, recorded_at);

-- ----------------------------------------------------------------------------
create table daily_health_summaries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  summary_date   date not null,
  parameter_type parameter_type not null,
  unit           text not null,
  -- null for HEART_RATE: summing bpm readings across a day is meaningless.
  total_value    numeric(12, 4),
  avg_value      numeric(12, 4),
  min_value      numeric(12, 4),
  max_value      numeric(12, 4),
  record_count   int not null default 0,
  updated_at     timestamptz not null default now(),
  unique (user_id, summary_date, parameter_type)
);

create index idx_daily_summaries_user_param_date on daily_health_summaries(user_id, parameter_type, summary_date);

create trigger trg_daily_summaries_updated_at
  before update on daily_health_summaries
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
create table sync_errors (
  id          uuid primary key default gen_random_uuid(),
  sync_job_id uuid not null references sync_jobs(id) on delete cascade,
  error_code  text not null,
  message     text not null,
  context     jsonb,
  occurred_at timestamptz not null default now()
);

create index idx_sync_errors_job on sync_errors(sync_job_id);
