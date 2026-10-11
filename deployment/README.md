# Public hosting and APK distribution

This directory is a deployable Caddy + FastAPI + MongoDB setup, not evidence of an existing hosted service. You need a Linux Docker host, domain, and DNS control. No hosting account/server connection was available in this task.

1. Install Docker with Compose on your server; point the domain's A/AAAA record to it. Allow inbound TCP 80/443. Keep MongoDB and the API off public ports.
2. Clone this branch. Copy `deployment/.env.example` to `deployment/.env` and set `APP_DOMAIN`. Generate a private random `SCHEDULE_ADMIN_TOKEN` (at least 32 characters). Keep it on the API host; never include it in the APK.
3. From `deployment`, run `docker compose up -d --build`. Caddy obtains HTTPS certificates. Persistent volumes retain Mongo data and Caddy state.
4. Check `https://YOUR_DOMAIN/api/health` and `/api/ready`. The latter pings the actual configured MongoDB. `GET /api/rooms` starts empty until an authorized administrator publishes a complete schedule.
5. Build the Android release on a machine with Node24/Yarn1, Java17 and Android SDK36 (build-tools36, NDK27.1.12297006, CMake3.22.1). Install frontend dependencies first. Set:
   - `EXPO_PUBLIC_BACKEND_URL=https://YOUR_DOMAIN`
   - `ANDROID_HOME` to your SDK
   - `APK_KEYSTORE` to your private release keystore
   - `APK_KEY_ALIAS` to its alias
   - `APK_PASSWORD_FILE` to a privately readable password file
   - optionally `APK_ARCHITECTURES=arm64-v8a` for a smaller build; default includes supported Android ABIs.
6. Run `bash frontend/scripts/build-apk.sh`. It checks HTTPS backend readiness, generates native code, builds, signs, verifies and writes a SHA256 checksum.
7. Copy the resulting `frontend/dist/nsut-hub.apk` and `.sha256` to `deployment/site/` with those filenames. The page enables Download only when the APK exists. Anyone with the public HTTPS link can download it; sideload installation requires allowing installs from their browser. Test the APK on a physical device before broad distribution.
8. For a full web app, deploy `frontend/dist` separately using the Vercel instructions in `docs/CONFIGURATION.md`. The default Caddy site serves the download landing page and API. Expo exports use root-relative assets; do not move a root build into a URL subdirectory without configuring Expo for that base path.

External MongoDB: replace `api.environment.MONGO_URL`/`DB_NAME` with secret environment injection for your provider and remove the unused `mongo` service/dependency/volume. Do not publish Mongo ports. Back up Mongo data and the private APK signing key separately. The task's signing key is private runtime material and must be transferred to the owner through a private channel for future updates; it is never in the repository or downloadable outputs.

The app contains no public student-data API. Shared schedule import requires the administrator token. Only authorized, non-personal schedule information should be published. See `docs/CONFIGURATION.md` for exact schema, freshness rules, database verification and integration limitations.
