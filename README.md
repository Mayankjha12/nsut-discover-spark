# NSUT Hub

An independent campus companion built with **Expo / React Native / TypeScript**, **FastAPI**, and **MongoDB**. Android is the supported sign-in target; the browser preview has no IMS login bridge. This is not an official NSUT service.

## What works

- Responsive Today dashboard, attendance, daily/weekly timetable, rooms, preferences and official-notice screens.
- Weighted attendance, missing-data handling, per-subject target planning, and saved snapshot history. The default 75% target is a **personal preference**, not a verified institutional rule.
- IST timetable ordering, ongoing/upcoming classes, gaps, cancellations, conflicts and cache timestamps.
- Device-local, validated personal backup import/export; native storage uses Expo SecureStore. No passwords or IMS session cookies enter the API or academic cache.
- Android IMS login: credentials and CAPTCHA stay on the official portal. After a visible authenticated identity is verified, supported attendance/timetable reports load automatically using links from that session. No guest entry. A fixed 90-day local session unlocks encrypted cached reports; IMS can expire its own cookies sooner. **Live authenticated IMS loading has not been verified.** Unsupported layouts preserve valid records.
- Conservative room availability from administrator-published schedules. No complete schedule coverage means **unknown**. Stale schedules cannot report availability.
- Results is intentionally **Coming Soon**, without fabricated marks.

There is no seeded student data or fake login. Until real records/schedules are provided, empty states are expected. Public notice retrieval can fail when the university's TLS certificate or page structure is unavailable; cached notices are labeled stale.

## Local development

Use Node 24, Yarn 1.22.22, Python 3.12 and MongoDB 7. Frontend dependencies are locked in `frontend/yarn.lock`.

```bash
cd frontend
yarn install --frozen-lockfile
cp .env.example .env
```

In another terminal, start MongoDB (or supply your own MongoDB URI), then:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-test.txt
cp .env.example .env
uvicorn server:app --host 0.0.0.0 --port 8001 --no-access-log
```

Run `cd frontend && yarn web`. Open `http://localhost:8081`. Android requires an HTTPS API origin reachable from the device; `localhost` on a phone refers to that phone.

## Validation

```bash
cd frontend
yarn tsc --noEmit
yarn lint
node tests/academic.cjs
CI=1 yarn expo export --platform web --output-dir dist
```

```bash
cd backend
# Use a disposable MongoDB deployment. Tests create/drop unique nsut_test_* databases.
MONGO_URL=mongodb://127.0.0.1:27017 python -m pytest -q
```

`backend/pytest.ini` requires two xdist workers. The tests exercise real database writes, authorization, cache/lease behavior, room boundaries and invalid input. `API_URL=http://localhost:8001 python backend/tests/smoke_public.py` checks a running deployment without importing sample data.

## Deployment and Android

See [deployment guide](deployment/README.md), [database and integrations](docs/CONFIGURATION.md), and [feature audit and external references](docs/IMPLEMENTATION.md).

`frontend/scripts/build-apk.sh` creates a signed release after checking the configured HTTPS backend. Retain your private signing key for all future updates. The APK generated in this task is a **preview** without a deployed API URL; room/notices service access and live device verification remain outstanding. Permanent public hosting requires access to a hosting account/server and domain.

## Automatic APK updates

[GitHub Actions setup and update instructions](docs/APK-UPDATES.md): frontend pushes to `main` build a signed APK and publish a public GitHub Release after signing secrets and the HTTPS API origin are configured. Phone users install the new APK to update.
