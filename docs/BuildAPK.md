# Building an Android APK

CLAY is an Expo SDK 53 app (`mobile/`) with a native `android/` project already
generated (required for `expo-camera`, used by the barcode scanner). This means
you can build an APK locally with Gradle — no EAS account required — or use
EAS Build if you'd rather build in the cloud.

## Prerequisites (local build)

- **JDK 17** on `PATH`, `JAVA_HOME` set
- **Android SDK** installed, `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) set,
  with an SDK platform + build-tools matching what `android/build.gradle`
  expects (installed automatically via Android Studio's SDK Manager)
- Node deps installed: `npm install` from the repo root (or `mobile/`)

Verify:
```bash
java -version
echo $ANDROID_HOME        # or: echo $env:ANDROID_HOME in PowerShell
```

If `android/` is missing or out of sync with `app.json` (e.g. after changing
`app.json` plugins/permissions), regenerate it first:
```bash
cd mobile
npx expo prebuild --platform android
```
`expo prebuild` is destructive to hand-edits under `android/` — only run it
when you intend to regenerate that folder from config.

## Option A — Local Gradle build

**Debug APK** (fastest, for sideloading onto a test device — signed with the
default debug keystore, works for install but not Play Store):
```bash
cd mobile/android
./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
```
Output: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK** (also debug-signed unless you configure a real signing key
— see below):
```bash
cd mobile/android
./gradlew assembleRelease      # Windows: gradlew.bat assembleRelease
```
Output: `mobile/android/app/build/outputs/apk/release/app-release.apk`

Install directly to a connected/emulated device:
```bash
./gradlew installDebug          # or installRelease
# or manually:
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Signing a release build for real distribution

By default a release build falls back to the debug keystore. To produce a
properly signed release APK:

1. Generate a keystore (once):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore clay-release.keystore -alias clay -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Reference it in `mobile/android/gradle.properties` (keep this file out of
   git, or use environment variables instead of committing secrets):
   ```
   CLAY_RELEASE_STORE_FILE=clay-release.keystore
   CLAY_RELEASE_KEY_ALIAS=clay
   CLAY_RELEASE_STORE_PASSWORD=...
   CLAY_RELEASE_KEY_PASSWORD=...
   ```
3. Wire those properties into the `signingConfigs`/`buildTypes.release` block
   in `mobile/android/app/build.gradle` (not present yet — add it if you need
   a properly signed release build rather than a debug-signed one).

## Option B — EAS Build (cloud, no local Android SDK needed)

No `eas.json` exists in this repo yet, so this needs a one-time setup.

```bash
npm install -g eas-cli
cd mobile
eas login
eas build:configure            # creates eas.json
eas build -p android --profile preview   # produces a downloadable .apk
```

By default EAS's `production` profile builds an `.aab` (Play Store bundle),
not an `.apk`. To get a raw `.apk`, set the profile's build type explicitly
in `eas.json`:
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```

## Which to use

- **Local Gradle** — faster iteration, works offline, no account, but needs a
  working local Android SDK/JDK setup.
- **EAS Build** — no local SDK needed, consistent build environment, but
  requires an Expo account and network access; free tier has queue limits.
