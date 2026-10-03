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

## Backlog / ideas
- Real IMS attendance validation on a device (needs user's IMS creds; Expo Go)
- Trending news real feed
- Results caching in Mongo
- Attendance "bunk calculator" (classes you can skip / must attend to hit 75%)
- Room timetable from real IMS data instead of deterministic hash
