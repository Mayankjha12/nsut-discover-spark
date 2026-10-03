# NSUT Hub — PRD

## Vision
All-in-one campus utility app for NSUT Delhi students: IMS attendance tracking, real-time vacant classrooms, semester results (resulthubnsut.com), trending campus news (coming soon). Premium dark glassmorphic UI with NSUT crimson accent.

## User choices
- IMS: real scraping via WebView (native only; web preview shows fallback → demo/guest dashboard)
- News: "Coming Soon" screen for MVP
- Auth: IMS roll no + password stored in SecureStore; autofilled in WebView, user solves captcha
- GitHub: user pushes manually via "Save to GitHub" → `Mayankjha12/nsut-discover-spark`

## Status — ✅ MVP COMPLETE (tested, iteration 1: backend 11/11, all frontend flows pass)

### Backend (`/app/backend/server.py`)
- `GET /api/health`, `POST/GET /api/profile`, `POST/GET /api/attendance`, `GET /api/vacant-rooms?slot=`, `GET /api/results/{roll}`, `GET /api/news`
- Vacant rooms uses `ZoneInfo("Asia/Kolkata")` for IST.

### Frontend (`/app/frontend`)
- `app/login.tsx` — glass login; Skip → guest mode
- `app/ims-login.tsx` — IMS WebView: autofill (params or stored creds), login detection, profile scrape, **attendance scrape on every page load post-login** (user opens Attendance page in IMS), "Continue" button turns green when captured
- `app/(tabs)/index.tsx` — Home: hero bg, attendance ring (react-native-svg), live rooms strip, 4 quick-action tiles
- `app/(tabs)/attendance.tsx` — chips All/Theory/Practical, color-coded progress bars, empty state + sync CTA, pull-to-refresh → resync
- `app/(tabs)/rooms.tsx` — IST header, 10 slot chips (current highlighted), rooms grouped by block, weekend banner, empty/error states
- `app/(tabs)/more.tsx` — profile card, Results / Trending / Resync / Logout rows
- `app/results.tsx` — CGPA card + SGPA list; roll input for guests; WebView fallback to ResultHub
- `app/news.tsx` — Coming Soon hero
- `src/components/progress-ring.tsx` — SVG ring + `attendanceColor()`

## Session 2 additions (done)
- Unified login: roll/pw inputs + IMS WebView (captcha) on ONE screen; auto-detects login, runs `FULL_SYNC_JS` (fetch-based: My Activities → courses → attendance form POST → table) → saves profile + attendance → auto-opens dashboard. `ims-login.tsx` deleted; resync = `/login?resync=1`.
- Bunk calculator per subject + overall (`bunkInfo` in progress-ring.tsx) using present/total from IMS.
- Results: backend now uses ResultHub JSON API (api.resulthubnsut.com) cached in Mongo `results_cache` (6h) + device cache; full detail (rank, percentile, credits, SGPA trend, grade distribution, per-semester subjects). Source name hidden from UI (user request: confidential).
- Trending = live notices scraped from nsut.ac.in home marquee (`/api/notices`, Mongo cache 1h); Drive links open as direct PDF preview.
- Backdrop component (SVG radial crimson glow) replaces Unsplash hero images. Campus quick links on More.
- NOT done: real IMS room timetable (needs on-device IMS session; vacant rooms still deterministic placeholder).
- IMS FULL_SYNC_JS untested on real device — user to verify on phone (APK).

## Session 3 additions (done)
- Bunk Planner: per-subject ✓/✗ stepper (planned attends/bunks) → live projected % + overall projection card; persisted in storage (`nsut_hub_bunk_plan`).
- Target CGPA tool on results (equal-weight semesters: need = target*(n+1) − cgpa*n).
- Real room timetable: `FULL_SYNC_JS` also scrapes IMS room timetables (best-effort, Flutter-app URL fallback) → `POST /api/room-timetable` (Mongo `room_timetable`, merged) → `/api/vacant-rooms` uses real data when present (`source: ims|estimate`). Unverified on device.
- User asked for Vercel deploy + APK: must use Emergent Publish button (agent cannot deploy).

## Backlog / ideas
- Real IMS attendance validation on a device (needs user's IMS creds; Expo Go)
- Trending news real feed
- Results caching in Mongo
- Attendance "bunk calculator" (classes you can skip / must attend to hit 75%)
- Room timetable from real IMS data instead of deterministic hash
