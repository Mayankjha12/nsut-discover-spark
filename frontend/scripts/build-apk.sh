#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${EXPO_PUBLIC_BACKEND_URL:?Set the deployed HTTPS backend URL}"
: "${ANDROID_HOME:?Set ANDROID_HOME}"
: "${APK_KEYSTORE:?Set the private release keystore path}"
: "${APK_KEY_ALIAS:?Set the release key alias}"
: "${APK_PASSWORD_FILE:?Set the path to the private keystore password file}"
node - <<'JS'
const url = new URL(process.env.EXPO_PUBLIC_BACKEND_URL);
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
  throw new Error('EXPO_PUBLIC_BACKEND_URL must be an HTTPS origin, without a path or credentials');
}
JS
curl --fail --silent --show-error --max-time 15 "${EXPO_PUBLIC_BACKEND_URL%/}/api/ready" | node -e '
let body = "";
process.stdin.on("data", chunk => body += chunk);
process.stdin.on("end", () => {
  const result = JSON.parse(body);
  if (result.ok !== true) throw new Error("Backend database is not ready");
});'
APK_OUTPUT="${APK_OUTPUT:-$PWD/dist/nsut-hub.apk}"
mkdir -p "$(dirname "$APK_OUTPUT")"
# Prebuild generates native code from app.json; do not hand-edit android/.
CI=1 yarn expo prebuild --platform android --no-install
(
  cd android
  ./gradlew :app:assembleRelease \
    -PreactNativeArchitectures="${APK_ARCHITECTURES:-armeabi-v7a,arm64-v8a,x86,x86_64}" \
    -Pexpo.useLegacyPackaging=true \
    -Pandroid.enableMinifyInReleaseBuilds=true \
    -Pandroid.enableShrinkResourcesInReleaseBuilds=true --max-workers=2 --console=plain
)
"$ANDROID_HOME/build-tools/36.0.0/apksigner" sign \
  --ks "$APK_KEYSTORE" --ks-key-alias "$APK_KEY_ALIAS" \
  --ks-pass "file:$APK_PASSWORD_FILE" \
  --out "$APK_OUTPUT" android/app/build/outputs/apk/release/app-release.apk
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --verbose "$APK_OUTPUT"
(
  cd "$(dirname "$APK_OUTPUT")"
  sha256sum "$(basename "$APK_OUTPUT")" > "$(basename "$APK_OUTPUT").sha256"
)
