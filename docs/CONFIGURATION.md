# Database, environment and integrations

## Existing architecture and database

The original backend uses Motor/PyMongo and MongoDB. MongoDB remains sufficient for public schedules and notice caching; no SQL/Neon replacement was introduced. The old unauthenticated profile/attendance API is removed. Personal academic data stays on the student's device. App browsing is not an authenticated IMS session.

### Variables

| Variable | Location | Purpose |
|---|---|---|
| `MONGO_URL` | backend `.env` or host secret settings | Real MongoDB connection string, including private authentication if required |
| `DB_NAME` | backend | Database name |
| `CORS_ORIGINS` | backend | Comma-separated explicit web origins; wildcard rejected |
| `SCHEDULE_ADMIN_TOKEN` | backend secret settings | Random bearer token, at least 32 characters, for trusted schedule administrators |
| `SCHEDULE_MAX_AGE_SECONDS` | backend | Schedule freshness; default 86400, bounded 60–604800 |
| `EXPO_PUBLIC_BACKEND_URL` | frontend `.env` / build host | Public API origin; compiled into web/APK; never a secret |
| `APP_DOMAIN` | deployment `.env` | DNS hostname for Caddy HTTPS |

Copy the corresponding `.env.example`. Never commit real `.env` files. Expo public variables are visible to everyone who downloads the app.

### Connecting your MongoDB

1. Provision MongoDB 7 (Atlas or your own server). Create a database user with access only to your app database; configure network access for the API host.
2. Set `MONGO_URL` and `DB_NAME` in the backend host's secret/environment settings. Use the provider's TLS connection string for remote databases.
3. Start the API. `/api/health` checks the process; **`/api/ready` pings the configured MongoDB** and returns 503 if unreachable.
4. Startup creates a TTL index on `notices_cache.expires_at`. MongoDB creates collections on first write; no separate SQL migration command is required.
5. With administrator authorization, publish a verified schedule. Confirm the returned revision and `_id: current` in your chosen database's `room_schedules` collection, then query `/api/rooms`. This verifies the data path uses your database, not a mock. Readiness alone does not prove you selected the intended database name.

Collections:

- `room_schedules`: singleton `_id: current`, normalized schedule and SHA256 revision. Atomic replacement avoids partial semester updates; identical input is safe to retry.
- `notices_cache`: singleton `_id: official`, fetched/refresh/expiry timestamps and public notices; TTL expiry after seven days.
- `sync_leases`: short ownership lease to suppress duplicate upstream notice refreshes across workers. Release requires the same owner.

Existing old `profiles`, `attendance`, or room collections are not served or migrated into the new API. Back up and review any old production collections for previously stored personal information; apply your retention policy deliberately. The app removes its legacy device password, cookie and unvalidated cache keys on startup.

## Publishing verified shared room schedules

No broad IMS timetable feed has been verified. A trusted administrator must obtain an authorized, complete schedule and normalize it. **Do not infer complete coverage from a student's personal timetable.** The following schema example is synthetic documentation only; it is not loaded automatically:

```json
{
  "source": "verified_schedule",
  "source_url": "https://www.imsnsit.org/imsnsit/",
  "observed_at": "2026-10-11T00:00:00Z",
  "valid_from": "2026-10-11",
  "valid_until": "2026-10-17",
  "rooms": [{
    "id": "EXAMPLE-101", "building": "Example", "room_type": "Classroom",
    "coverage": [{"day": 0, "start": "08:00", "end": "18:00"}],
    "bookings": [{"day": 0, "start": "09:00", "end": "10:00", "title": "Example class", "cancelled": false}]
  }]
}
```

Days are Monday=0 through Sunday=6; all times are IST. End times are exclusive. Split overnight windows. Coverage means all allocations for that window were checked, including cancellations where known. Never put names/roll numbers or sensitive session URLs into shared schedules. Observation dates must be genuine, not updated simply to make stale data appear fresh.

Send a `PUT /api/admin/room-schedule` with `Authorization: Bearer <private token>` and JSON content. Use a trusted administrator script or API client with secret injection; never expose the token in frontend JavaScript or shell history. There is no browser admin editor. Missing/short configured token returns 503; absent/wrong caller token returns 401; invalid data returns sanitized 422; requests over 1 MB return 413. Authenticated imports are atomic. Protect the endpoint additionally with hosting rate limits/network restrictions as appropriate.

The app fetches room status every minute; this reads MongoDB and calculates local schedule status, **not repeated IMS scraping**. Manual refresh is available. Fresh bookings prove scheduled occupation even outside complete coverage. Missing/stale/expired schedules yield unknown. Sensor occupancy is not available.

## IMS authentication and synchronization

No official API, permitted server-to-server login flow, or authenticated data contract has been verified. Therefore no server stores credentials, cookies or student sessions. The Android flow uses an incognito WebView restricted to HTTPS IMS hosts. The student completes portal login/CAPTCHA and navigates to a report. Read-page performs a local DOM read without network requests, form submission or credential-field access. A request nonce and origin validation guard bridge messages. Failed validation retains prior data.

Supported attendance: row tables with explicit subject-code/count/percentage headers; the public IMS app's documented transposed summary with `Overall Class`, `Overall Present`, and `Overall (%)`. Supported timetable: rows with Day, Subject, Start, End and optional Room/Faculty. Other layouts are rejected. Parser fixtures are synthetic, not proof of current live portal compatibility. IMS profiles and faculty timetable retrieval are not implemented. A visible labeled roll number links reports; without a matching identity, a successful capture replaces earlier records rather than mixing accounts.

On web, use the official portal separately and import only a personal Discover Spark backup. Opening the portal does not authenticate the web app. Backups are explicitly marked as user-provided records; they do not become verified IMS data. Personal cache freshness is 24 hours; refresh is explicit. There is no background student scraping or server account login.

To verify live sync: use an authorized student account on an Android device, complete CAPTCHA manually, open the current report, capture and compare each subject count against the portal; repeat for timetable and confirm roll linking. Test session expiry and unsupported pages preserve previous data. Do not send credentials or portal cookies to developers. Redacted table structure can be used to extend a parser after permission is confirmed.

## Notices and failures

The public NSUT HTTPS homepage is fetched at most hourly when requested, with a Mongo lease, bounded response size and network timeouts. Failure backs off five minutes and preserves only records less than seven days old, marked stale. No TLS bypass is used. The current source has failed certificate verification in this sandbox, so live notices are not certified working. The UI provides an official-site link.

## Vercel

Vercel can host the Expo web export. Set `EXPO_PUBLIC_BACKEND_URL` in Vercel build environment, build with `cd frontend && yarn install --frozen-lockfile && yarn expo export --platform web`, and publish `frontend/dist` with an SPA rewrite to `/index.html`. Add the Vercel origin to the API's `CORS_ORIGINS`. Host this FastAPI process separately using the Docker setup; it is not configured as a Vercel serverless function. Mongo URI and admin token belong only on the API host, never in the web build.
