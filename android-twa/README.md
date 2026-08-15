# Siliguri Fresh Mart — Android TWA (API 36)

Trusted Web Activity wrapper for the Siliguri Fresh Mart PWA. Fixes the Play Console
rejection by targeting **Android 16 (API 36)**, keeps the existing package name
`com.siligurifreshmart` (so this **updates** the live listing — it is not a new app),
and ships the brand launcher icon + "Siliguri Fresh Mart" name.

| Setting | Value |
|---|---|
| Package / applicationId | `com.siligurifreshmart` |
| App name | `Siliguri Fresh Mart` |
| Launcher URL | `https://www.siligurifreshmart.com/` |
| compileSdk / targetSdk | **36 / 36** |
| minSdk | 24 |
| Gradle / AGP | 8.13 / 8.13.0 |

## Requirements

- **Android Studio** (current stable — it bundles JDK 17 and the SDK manager)
- Android SDK Platform 36 + Build-Tools (Android Studio will prompt to install)
- This PC has **no Java/SDK**, so building is done on your machine via Android Studio.

## Build & sign

1. Open the `android` folder in Android Studio (File → Open → `android-twa/android`).
   Wait for the Gradle sync to finish.
2. `android/key.properties` is already set up and `android/signing.keystore` is
   already in the folder. **They are gitignored** (secrets stay local). The keystore
   is the one registered as the app's upload key in Play Console:
   - Keystore: `android/signing.keystore` (alias `my-key-alias`)
   - Verified: its SHA-256 cert fingerprint `CA:A4:B9:61:88:5A:D0:B8:...` matches the
     cert embedded in the previously published AAB (`MY-KEY-A.RSA`).
   If Play ever rejects the signature on upload, request an upload-key reset in
   Play Console → Setup → App integrity → App signing.
3. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**,
   select the release variant (signing values come from `key.properties`).
   Output: `android/app/release/app-release.aab`.

## Upload to Play

1. Play Console → your app → **Production** (or Testing) → **Create new release**.
2. Upload `app-release.aab`. Current build is **versionCode 10 / versionName 3.0.0**
   (bumped from the old API-35 build). If Play says "version code X must be higher",
   bump `versionCode` in `android/app/build.gradle` above X and rebuild.
3. Release notes: mention *"Updated to target Android 16 (API 36)."* Submit.

## Verify App Links (so it opens standalone, no URL bar)

The TWA must be verified against `https://www.siligurifreshmart.com/.well-known/assetlinks.json`.

1. Get the **app signing** SHA-256 (Play Console → Setup → App integrity → App signing —
   use the *App signing key certificate*, not the upload key).
2. Run the helper to print a fingerprint from any local keystore:
   ```
   powershell -File android-twa/compute-fingerprint.ps1 -Path C:\path\to\keystore.p12 -Password <pwd>
   ```
3. Put that fingerprint into `public/.well-known/assetlinks.json` (package
   `com.siligurifreshmart`), deploy to Vercel, then confirm:
   - `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.siligurifreshmart.com/&relation=delegate_permission/common.handle_all_urls`
   - or use the [Statement List Tester](https://developers.google.com/digital-asset-links/tools/generator).

The current live file already declares `com.siligurifreshmart` — only the fingerprint
needs to match the newly signed build.

## Troubleshooting

- **SDK 36 not found**: SDK Manager → install "Android SDK Platform 36".
- **`failed to resolve com.google.androidbrowserhelper`**: check internet / mavenCentral.
- **Version rejected on upload**: Play reports the minimum versionCode — bump
  `versionCode` in `android/app/build.gradle` to that + 1 and rebuild.
- **Icon looks cropped**: the adaptive foreground uses the maskable `icon-512x512.png`
  scaled to 60% (safe zone). Regenerate with `C:\Users\Pikachu\AppData\Local\Temp\opencode\gen-icons.ps1`.
