# Implementation audit and reference research

## Original architecture

Expo Router / React Native 0.86 / Expo 57 / TypeScript with React Query, SecureStore, AsyncStorage, WebView and SVG; FastAPI with Motor/PyMongo/MongoDB. The original app had tabs for dashboard, attendance, rooms and more, plus news/results/login. There was no trustworthy personal timetable flow.

The audit found fake browser login, password/session persistence, unauthenticated private-data endpoints, hardcoded portal destinations, fabricated room estimates and misleading missing-attendance calculations. These were replaced with explicit local data boundaries, validated academic models, safe missing states, a protected shared schedule publisher and Coming Soon results. Existing navigation, UI libraries and framework remain.

## Reference products (public research, 11 October 2026)

- **Campus Sphere for NSUT**: developer portfolio source at https://github.com/Akshat-kacodia/portfolio/blob/main/src/data/projects.ts identifies Android app https://play.google.com/store/apps/details?id=com.akshatkacodia.campussphere . Developer describes attendance, timetable, results/transcript, notices, calendar, projects and search. This is distinct from the unrelated `com.gcek.sphere` app returned by a broad Play search. Features are developer-described, not independently exercised with a student account.
- **IMS NSIT app**: https://github.com/Ahmedazim7804/imsnsit_app documents attendance, profile, APJ room schedule gaps, faculty timetable and offline caches. Public parser structure informed support for transposed attendance summaries. Its automated CAPTCHA workflow is not used.
- **Another IMS project**: https://github.com/punitr2007/ims_app describes notice search and attendance planning. Its OCR CAPTCHA automation is not used.
- **ResultsHub NSUT**: https://www.resulthubnsut.com public landing describes result analytics, comparisons and rankings. Results in this project are intentionally Coming Soon.
- **Official portal**: https://www.imsnsit.org/imsnsit/student.htm is a public frameset. The fetched login frame returned an access-protection script, not a usable server login contract. No CAPTCHA/protection bypass or authenticated scraping was performed.

No reference app UI or code was copied. No unverified external API endpoint was invented.

## Implementation status

| Area | Implemented | Outstanding |
|---|---|---|
| Dashboard/design | Responsive shell, mobile tabs, desktop sidebar, honest empty/loading/error states, next classes and attendance summary | Live student data requires capture/import |
| Attendance | Weighted counts, missing vs zero, targets, per-subject planning and real snapshot trend | Live authenticated IMS comparison |
| Timetable | Daily/weekly, IST, ordering, cancellations, gaps/conflicts, faculty/room fields, timestamps | Current live IMS layout may require another parser |
| Rooms | Validated authorized import, atomic Mongo storage, overlaps/gaps/coverage/staleness, filters, refresh | Authorized complete campus schedule needed |
| Authentication | Official-portal user-assisted Android session; no stored raw passwords or app fake login | No verified supported server integration; no cloud student accounts |
| Results | Coming Soon screen and API contract | All result retrieval/analytics intentionally future work |
| Notices | HTTPS fetch, centralized cache/lease, stale/error states, search/exam filter | Source TLS/layout needs successful live verification |
| Profile | Displays optional user-provided backup fields; labeled local data | Official profile extraction not implemented |
| Hosting/APK | Docker/Caddy/download page, release script and automatic GitHub Actions APK workflow; downloadable preview APK | Permanent host/domain connection and production API origin; actual Android install/login test |

## Main files

- `frontend/src/domain/academic.ts`, `portal.ts`: validation, provenance, attendance math, time handling, account isolation.
- `frontend/src/ims-scraper.ts`, `app/login.tsx`: explicit portal reads and secure browser boundary.
- `frontend/src/storage.ts`, `use-academic.ts`: local cache, legacy cleanup, refresh.
- `frontend/assets/images/brand-mark.svg`, `scripts/generate-brand.cjs`: original geometric campus/spark icon and reproducible Android/web assets.
- `frontend/src/components/campus.tsx`: reusable layout, accessible controls and status components.
- `frontend/app/(tabs)/*`, `results.tsx`, `news.tsx`: redesigned screens.
- `backend/server.py`, `schedules.py`: public API, cache/lease, admin import and availability.
- `frontend/tests/academic.cjs`, `backend/tests/test_nsut_hub_api.py`: focused fixtures and database/API regressions.
- `.env.example` files, `deployment/*`, `frontend/scripts/build-apk.sh`: reproducible configuration and distribution.

No production database connection or permanent public deployment has been established. Local tests use disposable MongoDB and clearly synthetic fixtures.
