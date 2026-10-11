# Code changes → Android updates

The `Android APK` GitHub Actions workflow builds a signed APK after frontend changes are pushed to `main` (also builds an artifact on this task branch). On `main`, a successful build publishes a GitHub Release automatically. The public download address then stays:

https://github.com/Mayankjha12/nsut-discover-spark/releases/latest/download/nsut-discover-spark.apk

**This link starts working only after a configured workflow succeeds. No release has been published by this task.** Builds on the task branch are downloadable from Actions artifacts by signed-in users; public Releases are published from `main` only. `workflow_dispatch` also allows a manual build from the Actions tab once the workflow is on the default branch.

## One-time setup

1. Give this Coding Agent's GitHub connection write access to this repository. The current push attempt is rejected with HTTP403. Once allowed, the reviewed workspace changes can be pushed to the assigned branch and merged into `main`.
2. Deploy the FastAPI backend and MongoDB following `deployment/README.md`. An APK build is not a backend deployment.
3. In GitHub → repository **Settings → Secrets and variables → Actions**, add:

| Type | Name | Value |
|---|---|---|
| Variable | `EXPO_PUBLIC_BACKEND_URL` | Deployed HTTPS API origin, e.g. `https://campus.example.com` |
| Secret | `ANDROID_KEYSTORE_BASE64` | Base64 of the private APK signing keystore |
| Secret | `ANDROID_KEY_ALIAS` | Alias of the signing key |
| Secret | `ANDROID_KEYSTORE_PASSWORD` | Signing keystore/key password |

The current signing script expects the keystore and key to share the same password (as the retained preview key does). Use the **same signing key as the APK already installed**. The task's preview signing material is retained privately in its runtime, not in Git or public downloads. A repository connection with Actions-secrets permission can configure these secrets; ordinary Git push permission alone is not sufficient. Do not paste secrets in chat. If you deliberately choose a new key, Android requires uninstalling the old app first; export personal data before uninstalling.

If setting secrets from your own trusted computer, `gh secret set ANDROID_KEYSTORE_BASE64 < private-keystore.base64` uploads the file without placing its contents in the command line. Use GitHub's secret UI for the alias/password. Keep a private backup of the original keystore and password.

4. Ensure GitHub Actions is enabled and repository policy permits the release job's `contents: write` permission. The workflow only triggers on pushes/manual runs, not untrusted pull requests. Production credentials never go into the APK; only the public API origin is included.
5. Merge the changes into `main`. Check **Actions → Android APK**. A green build publishes the APK and SHA256 checksum under **Releases**. Builds validate TypeScript, lint and domain/storage/parser fixtures, verify HTTPS database readiness, compile, sign and verify the APK.

## Every future change

Edit code → push/merge to `main` → wait for the workflow → download the latest APK → open it on the phone and choose Update.

An installed APK does **not** rewrite itself when GitHub changes. This setup delivers a new signed APK; users install each update. Native changes also require installation. Backend-only changes need deployment on the backend host and usually do not require a new APK if the API contract stays compatible.

The workflow keeps the package ID and signing key stable, and sets versionCode to `1000 + GITHUB_RUN_NUMBER`. Keep the workflow/run history intact. If migrating/resetting the workflow, choose a version-code offset above the last distributed build before publishing. Local manual builds must also use a higher versionCode to replace a CI release. Do not rotate the signing key casually.

The workflow writes temporary signing files under `RUNNER_TEMP`, removes them after signing, and uploads only APK/checksum files. Task branch artifacts expire after30 days; published release files remain until explicitly deleted.

## Current verification status

The workflow is prepared locally. It cannot be executed or publish a release until GitHub write access, the three signing secrets and a live HTTPS API origin are configured. Local workflow syntax/versioning checks are separate from a successful hosted Actions run. The APK's live IMS authentication/device checks remain outstanding as documented in `docs/IMPLEMENTATION.md`.
