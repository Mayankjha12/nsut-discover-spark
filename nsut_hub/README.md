# NSUT Hub

**Discover. Save. Participate.**

A Flutter (Material 3) student discovery platform for Netaji Subhas University of Technology, Delhi. Not an attendance/timetable app — the product loop is:

```text
DISCOVER  ->  SAVE  ->  TRACK  ->  APPLY / PARTICIPATE
```

## Running it

```bash
cd nsut_hub
flutter pub get
flutter run                       # mock data, no backend needed
flutter test                      # calculator unit tests
```

Switch to a real backend without touching any widget:

```bash
flutter run \
  --dart-define=USE_MOCK_DATA=false \
  --dart-define=API_BASE_URL=https://api.nsuthub.app/v1
```

> Fonts: `pubspec.yaml` declares Inter under `assets/fonts/`. Drop the four
> Inter TTFs there, or comment out the `fonts:` block to fall back to Roboto.

## Architecture

Feature-based, with a hard separation between UI, domain logic and data.

```text
lib/
  core/
    config/app_config.dart        build flags + every REST route
    router/app_router.dart        GoRouter, shell route, deep-link paths
    theme/                        colours, typography, spacing, radii
    utils/deadline_utils.dart     urgency buckets + date formatting
  data/
    models/                       Opportunity, NewsItem, ResourceItem,
                                  SavedItem, UserProfile, enums
    datasources/
      api_client.dart             Dio wrapper + friendly ApiException
      mock_*.dart                 realistic demo dataset
    repositories/                 abstract contract + Mock + Api impls
  domain/services/
    recommendation_service.dart   explainable ranking
    grade_calculator.dart         pure SGPA/CGPA math (unit tested)
    search_service.dart           grouped global search
    notification_service.dart     FCM / local reminder abstraction
  presentation/
    providers/                    Riverpod state (saved, profile, behaviour)
    widgets/                      reusable cards, chips, sheets, skeletons
    screens/                      one folder per feature
```

Rules the codebase follows:

- Widgets never contain business logic, filtering math or API calls.
- Every colour, radius and duration comes from `core/theme` — no inline hex.
- Repositories are interfaces; `MockXRepository` and `ApiXRepository` are
  interchangeable via `AppConfig.useMockData`.
- The UI never renders a raw exception; `ApiException` produces human copy.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Home — greeting, deadlines, recommendations, trending, news, tools, recently saved |
| `/discover` | Search + category/mode/location filters + sort + infinite scroll |
| `/hackathons` | Closing Soon / Recommended / Popular / New, domain & team-size filters |
| `/opportunities` | Internships, Research, Scholarships, Fellowships, Competitions, Open Source, Programs |
| `/opportunity/:id` | Full detail, timeline, sticky Apply + Save, reminder & collections |
| `/saved` | Tabs by type, custom collections, swipe-to-unsave, reminders |
| `/deadlines` | This Week / This Month / Later with per-item reminder control |
| `/news` + `/news/:id` | NSUT news by category with AI-style Quick Summary blocks |
| `/resources` | Branch → Semester → Subject → type, Most Useful / Recently Added |
| `/tools` | SGPA calculator, CGPA calculator, CGPA predictor + target mode |
| `/search` | Global search grouped by category with recent searches |
| `/profile` | Stats, interests, settings |
| `/notifications` | Notification centre + per-category preferences |
| `/onboarding` | Optional personalization (year, branch, interests, skills) |

## Save & track system

`SavedNotifier` (Riverpod `StateNotifier`) is the single source of truth.
Toggling a bookmark updates state synchronously (optimistic), animates the
icon, then persists to `SharedPreferences`. Collections, reminders and
"opened" tracking all hang off the same `SavedItem` record, which maps 1:1 to
the planned `saved_items` table.

## Backend readiness

`ApiRoutes` already names every endpoint the app will call: users,
opportunities, hackathons, news, resources, saved items, collections,
deadlines, notifications, categories, tags and search. The `Opportunity`
model matches the agreed schema (`id, title, organization, description,
category, deadline, location, mode, eligibility, skills, tags, source,
applyUrl, createdAt, updatedAt`) plus a `duplicateGroupId` used by the
ingestion pipeline so the same hackathon listed on several platforms renders
as one card with its original source and registration URL intact.

Aggregation guidance for the backend: prefer official APIs and feeds, respect
`robots.txt`, site terms and rate limits, normalise and de-duplicate before
writing, and keep the source URL on every record.

## Firebase

Kept behind an abstraction so the app runs with zero Firebase setup:

1. `flutterfire configure`
2. Uncomment the Firebase dependencies in `pubspec.yaml`
3. Uncomment the bootstrap in `lib/main.dart`
4. Implement `FirebaseNotificationService` (skeleton in
   `domain/services/notification_service.dart`) and return it from
   `notificationServiceProvider`

Auth (Firebase Authentication), push (FCM topics per notification category)
and uploads (Firebase Storage for student-contributed resources) all plug in
at the repository/service layer only.

## Demo data

10 hackathons, 10 internships, 5 research programmes, 5 scholarships,
2 fellowships, 2 competitions, 2 open-source programmes, 10 NSUT news items
(with structured Quick Summaries) and 20 academic resources. All deadlines are
generated relative to today so the urgency colours always look live. Content
is realistic but demo-only.
