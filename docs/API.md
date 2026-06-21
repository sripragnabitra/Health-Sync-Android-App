# API Reference

Base URL: `/api/v1`. All responses are wrapped as `{ "data": ... }` on
success or `{ "error": { "code", "message", "requestId", "details?" } }`
on failure. Authenticated routes require `Authorization: Bearer <token>`.

## Auth

### `POST /auth/signup`
```json
// Request
{ "email": "demo@independenceos.ai", "password": "DemoPass123!", "fullName": "Demo User" }

// Response 201
{ "data": { "token": "eyJ...", "user": { "id": "...", "email": "...", "fullName": "Demo User" } } }
```

### `POST /auth/login`
Same response shape as signup. Returns `401 UNAUTHORIZED` with an
identical message for "no such email" and "wrong password" — distinguishing
them would let a caller enumerate registered emails.

### `GET /auth/me`
Returns the current user's profile from the JWT.

## Devices

### `POST /devices`
Registers or updates a device. Idempotent on `clientDeviceId` — call this
every app launch without worrying about creating duplicates.
```json
// Request
{ "clientDeviceId": "<uuid generated once by the app>", "platform": "ANDROID",
  "deviceModel": "Pixel 8", "osVersion": "Android 15", "appVersion": "1.0.0" }

// Response 200
{ "data": { "id": "<server device id, use this for /sync calls>", "clientDeviceId": "...", "platform": "ANDROID" } }
```

### `GET /devices`
Lists all devices for the current user.

## Sync

### `POST /sync/health-records`
This *is* manual re-sync — there's no separate trigger endpoint. The
client always has fresh Health Connect data in hand by the time it calls
this, whether that's because the user tapped a button or a background
job woke up.

```json
// Request
{
  "deviceId": "<from POST /devices>",
  "trigger": "MANUAL",
  "records": [
    {
      "sourceRecordId": "hc-abc123",
      "parameterType": "STEPS",
      "value": 8421,
      "recordedAt": "2026-06-15T14:00:00Z",
      "recordedEndAt": "2026-06-15T15:00:00Z",
      "localDate": "2026-06-15"
    }
  ]
}
```
Note what's *not* in the payload: `unit`. The server assigns the
canonical unit per `parameterType` (see `core/types.ts`) rather than
trusting the client to send a consistent one. `parameterType` is one of
`STEPS | DISTANCE_METERS | ACTIVE_CALORIES | HEART_RATE | SLEEP_DURATION`.
1-5000 records per request; split larger uploads into multiple calls.

```json
// Response 200
{
  "data": {
    "syncJobId": "...",
    "status": "SUCCESS",
    "recordsReceived": 42,
    "recordsInserted": 40,
    "recordsSkippedAsDuplicate": 2,
    "daysRecalculated": 3,
    "startedAt": "...",
    "completedAt": "..."
  }
}
```
`recordsSkippedAsDuplicate` is the number that hit the
`(userId, sourceRecordId)` unique constraint — re-running the exact same
request twice returns `recordsInserted: 0` the second time, not an error.

### `GET /sync/status`
```json
{
  "data": {
    "latestJob": { "id": "...", "status": "SUCCESS", "...": "..." },
    "lastSuccessfulSyncAt": "2026-06-15T14:05:00Z",
    "recentJobs": [ /* last 10 sync_jobs rows */ ]
  }
}
```

## Summary

### `GET /summary/daily?date=YYYY-MM-DD`
Defaults to today (server's UTC "today" if `date` is omitted). Returns
all 5 parameters for that day, with `null` values for any parameter with
no data yet — the dashboard renders each card's empty state individually
rather than the whole section disappearing.

### `GET /summary/latest`
The single most recent raw reading per parameter — distinct from the
daily aggregate. "Latest heart rate: 78 bpm at 2:14 PM" rather than
"today's average."

### `GET /summary/trend/weekly?parameterType=STEPS&from=2026-05-01&to=2026-06-15`
### `GET /summary/trend/monthly?parameterType=HEART_RATE&from=2026-01-01&to=2026-06-15`
### `GET /summary/trend/daily?parameterType=STEPS&from=2026-06-08&to=2026-06-15`

Max 366-day range per request. Response:
```json
{
  "data": {
    "parameterType": "STEPS",
    "granularity": "weekly",
    "points": [
      { "bucketStart": "2026-06-08", "bucketEnd": "2026-06-14",
        "totalValue": 58420, "avgValue": 8345.7, "minValue": 6100, "maxValue": 11200,
        "recordCount": 7, "hasData": true }
    ]
  }
}
```
For `HEART_RATE`, `totalValue` is always `null` and `avgValue` is a
record-count-weighted average across the days in the bucket (a day with
40 readings counts more than a day with 2) — see
`core/rollup.test.ts` for the test that pins this behavior down.
`hasData: false` on a bucket means no synced data fell in that range at
all, which the chart renders as a gap rather than a misleading zero.

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/query failed schema validation |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired token, or bad credentials |
| `FORBIDDEN` | 403 | Reserved for future role-based access; unused today |
| `NOT_FOUND` | 404 | Resource doesn't exist, or doesn't belong to this user |
| `CONFLICT` | 409 | Unique constraint violation (e.g. email already registered) |
| `INTERNAL_ERROR` | 500 | Unexpected failure — check `sync_errors` for sync-specific ones |
