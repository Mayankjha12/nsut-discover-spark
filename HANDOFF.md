# NSUT Hub — Handoff Prompt for Next Emergent Session

## 🎯 Original User Vision (verbatim)
> App to track IMS NSUT attendance (login with roll no + password), show instantly which classrooms are vacant at current time (via IMS room timetable), NSUT trending news (coming soon), aur web-scrape resulthubnsut.com for semester results. Also pull functionalities inspired by CampusSphere app. UI must be "bhot tagda" (very premium/sick), make it fun aur delightful. Reference IMS Flutter app: https://github.com/Ahmedazim7804/imsnsit_app

## ✅ User Choices Already Confirmed
1. **IMS integration**: Real scraping via WebView (not mock)
2. **News**: Just a "Coming Soon" screen for MVP
3. **Design**: Design agent decides → produced **"6 Glass / Luxe DARK"** personality with NSUT crimson (#D32F2F) accent
4. **Auth**: IMS roll number + password (stored in SecureStore, used to autofill WebView)
5. **GitHub**: User will push manually via Emergent "Save to GitHub" button
6. Target GitHub repo: `https://github.com/Mayankjha12/nsut-discover-spark`

## 📦 Tech Stack (already installed)
- Expo SDK 57 + expo-router (file-based routing)
- `react-native-webview` 13.16.1 — for IMS portal rendering + JS injection
- `expo-blur`, `expo-linear-gradient`, `expo-haptics`, `expo-image`
- `@react-native-vector-icons/feather` 13.1.4 (Phosphor not published yet for RNVI; Feather is premium replacement)
- Backend: FastAPI + Motor (MongoDB) + BeautifulSoup4 + requests
- No LLM/3rd-party keys needed. No Emergent LLM key needed.

## 🧱 Current Architecture

### Backend — `/app/backend/server.py` ✅ COMPLETE
All endpoints prefixed with `/api`:
- `GET  /api/health` → `{ok, ts}`
- `POST /api/profile` → upsert `{roll_number, name, branch, year, section}`
- `GET  /api/profile/{roll}` → fetch profile
- `POST /api/attendance` → cache scraped attendance `{roll_number, overall_percent, subjects[]}`
- `GET  /api/attendance/{roll}` → fetch cached
- `GET  /api/vacant-rooms?slot=<idx>` → **IST-aware** returns `{weekday, weekday_name, current_slot, ist_time, slots:[{index,start,end,vacant_count,total,rooms[],is_current}]}` — 36 NSUT rooms × 10 time slots, deterministic-hash occupancy
- `GET  /api/results/{roll}` → scrapes resulthubnsut.com (CGPA, SGPA list, name)
- `GET  /api/news` → `{status: "coming_soon"}`

### Frontend `/app/frontend/`

**Shared modules** (all ✅ done):
- `src/theme.ts` — dark palette (`surface #0F1115`, `brandPrimary #E53935`), `spacing`, `radius`, `fonts`, `useTheme()`, `makeStyles()`, exported `colors`
- `src/storage.ts` — SecureStore (native) / AsyncStorage (web) wrapper with `getRollAndPassword`, `setProfile`, `setAttendance`, `clear`
- `src/api.ts` — typed fetch client against `EXPO_PUBLIC_BACKEND_URL`
- `src/ims-scraper.ts` — 3 JS snippets injected into IMS WebView:
  - `ATTENDANCE_SCRAPE_JS` — walks `<table>` elements, picks rows with subject + percent columns, posts `{type:"ATTENDANCE_RESULT", subjects[], overall_percent}` via `window.ReactNativeWebView.postMessage`
  - `PROFILE_SCRAPE_JS` — regex on body text for Roll/Name/Branch/Year/Section
  - `DETECT_LOGIN_JS` — fires `URL_CHANGED` events to detect post-login state
- `src/components/ui.tsx` — `GlassCard` (BlurView + fallback), `Pill`, `SectionTitle`

**Screens built** (✅):
- `app/_layout.tsx` — SafeAreaProvider + QueryClient + KeyboardProvider + icon prewarm
- `app/index.tsx` — splash; redirects to `/login` or `/(tabs)` based on stored roll
- `app/login.tsx` — **premium glassmorphic login**: hero image + 3-stop LinearGradient scrim + glass form card + "Continue" CTA + "Skip" demo link
- `app/ims-login.tsx` — **WebView to IMS portal**: autofills roll/password, listens for login-success URL change, scrapes profile via injected JS, calls backend to persist, then redirects to `/(tabs)`. On web shows "open on mobile" fallback.
- `app/(tabs)/_layout.tsx` — 4-tab layout (Home / Attendance / Rooms / More) with `BlurView` tab-bar background

## 🚧 Status: ALL SCREENS BUILT & TESTED ✅ (see /app/memory/PRD.md)
The sections below were the original TODO — all are now complete.

## ~~TODO~~ (done)

### 1. `/app/frontend/app/(tabs)/index.tsx` — Home Dashboard
Hero section with:
- Background: `expo-image` loading `design_guidelines.json → images.home_hero_bg` (abstract crimson shape)
- LinearGradient scrim fading to `colors.surface`
- Large glass card showing **overall attendance %** from `storage.getAttendance()` with a circular progress ring (brandPrimary). Fall back to "Open IMS to sync" if no data.
Below hero, 2-column quick action grid:
- "Vacant Rooms Now" → routes to `/rooms`
- "Attendance" → routes to `/attendance`
- "My Results" → routes to `/results`
- "Trending" → routes to `/news`
Use `useSafeAreaInsets()` for top padding. Floating elements: `bottom: insets.bottom + 16` (NativeTabs rules). All interactive elements need kebab-case `testID`.

### 2. `/app/frontend/app/(tabs)/attendance.tsx` — Attendance
- Sticky glass header with chip row: `All | Theory | Practical` (follow P0 chip rules — horizontal ScrollView, `flexShrink:0`, 36pt height, `contentContainerStyle` gap)
- Fetches `storage.getAttendance()` on mount
- If missing/stale, show CTA "Sync from IMS" → routes to `/ims-login` with existing roll/pw
- List of `surfaceSecondary` cards: subject name + code + linear progress bar
  - green (`#22C55E`) if ≥ 75
  - warning (`#F59E0B`) if 65-74
  - error (`#EF4444`) if < 65
- Pull-to-refresh triggers re-sync

### 3. `/app/frontend/app/(tabs)/rooms.tsx` — Vacant Classrooms
- Fetch `api.vacantRooms()` on mount with `useQuery`
- Sticky header: current IST time + weekday name
- Horizontal chip row for time slots (10 slots) — highlight current, selected changes color only
- Below: 2-3 column grid of pill cards for vacant rooms in selected slot
- Empty state uses `design_guidelines.json → images.empty_state`
- Weekend shows "All rooms free - no classes"

### 4. `/app/frontend/app/(tabs)/more.tsx` — More Menu
List of glass rows (each has FeatherIcon + title + chevron-right):
- Profile → show stored profile card
- Results → routes to `/results`
- Trending (Coming Soon) → routes to `/news`
- Resync IMS → routes to `/ims-login` with stored creds
- Logout → `storage.clear()` + `router.replace("/login")`

### 5. `/app/frontend/app/results.tsx` — Results detail
- Reads stored roll from `storage.getRollAndPassword()`
- Calls `api.results(roll)` 
- Shows CGPA big number card + list of per-semester SGPAs
- If `ok:false`, show WebView fallback to `https://www.resulthubnsut.com/student/{roll}`

### 6. `/app/frontend/app/news.tsx` — Coming Soon
Full-screen empty state using `home_hero_bg` crimson image + "Trending Soon" display text + muted sub.

### 7. Testing (MANDATORY)
After screens are built:
1. Restart expo: `sudo supervisorctl restart expo`
2. First take **1 screenshot** of `/` (login screen) to verify boot
3. Call `testing_agent_v3_expo` for e2e testing — provide:
   - All endpoints to curl
   - Test the auth flow (web fallback branch is OK since IMS WebView can't be tested in web preview)
   - Test vacant rooms list rendering
   - Verify no overlapping tab bar

### 8. GitHub Push
Tell user to click **"Save to GitHub"** button in Emergent UI (top-right). Target repo: `https://github.com/Mayankjha12/nsut-discover-spark`. Do NOT attempt `git push` from backend.

## 🎨 Design Tokens (filled in `src/theme.ts` already)
```
surface:          #0F1115    (canvas)
surfaceSecondary: #1A1D24    (cards)
surfaceTertiary:  #252932    (inputs/chips)
brandPrimary:     #E53935    (CTA, active)
brand:            #D32F2F    (NSUT crimson)
success:          #22C55E    (good attendance)
warning:          #F59E0B    (65-74%)
error:            #EF4444    (<65%)
border:           #2A2D35
muted:            #9CA3AF
```
Spacing: `xs:4 sm:8 md:12 lg:16 xl:24 xxl:32 xxxl:48`
Radius: `sm:6 md:12 lg:20 pill:999`

## ⚠️ Critical Rules Reminder
- NEVER modify `.env`, `metro.config.js`, `EXPO_PACKAGER_*`
- Every interactive element needs `testID` (kebab-case by role)
- Chip rows: horizontal ScrollView + `flexShrink:0` + 36pt height
- Floating elements in tab screens: `bottom: insets.bottom + 16`, never literal 16
- Use `useSafeAreaInsets()`, never `SafeAreaView`
- MongoDB queries must exclude `_id` (already done in server.py)
- `datetime.now(timezone.utc)`, never `datetime.utcnow()`

## 🔗 Reference Links
- IMS portal (requires real Chrome for anti-bot JS): https://www.imsnsit.org/imsnsit/student.htm
- Flutter reference app: https://github.com/Ahmedazim7804/imsnsit_app
- Results source: https://www.resulthubnsut.com/

## 📝 Next Session Starter Prompt (paste this)

> "Main NSUT Hub app ko complete karna chahta hu — pichli session me backend + login + ims-webview + tabs layout ban chuka hai. Ab mujhe 4 tab screens banwane hain (Home dashboard, Attendance list, Rooms list, More menu), results screen, aur news coming-soon screen — sab kuch `/app/HANDOFF.md` me documented hai. UI 'bhot tagda' hona chahiye — premium dark glassmorphic with NSUT crimson accent. Pehle `/app/HANDOFF.md` padh ke phir implementation shuru kar. Testing ke baad GitHub push ke liye bata dena, mai 'Save to GitHub' button use karunga."
