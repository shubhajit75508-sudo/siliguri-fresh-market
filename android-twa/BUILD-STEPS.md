# Siliguri Fresh Mart — Build & Upload Guide (API 36 fix)

This fixes the Play Store rejection: **"App must target Android 16 (API level 36) or higher."**
The project is already set to target API 36. You just need to build it and upload it.
Estimated time: **20–40 minutes** (most of it waiting for downloads/builds).

---

## PART 1 — Install Android Studio (only once)

If you already have Android Studio, skip to Part 2.

1. Go to **https://developer.android.com/studio** and download **Android Studio** (Windows, ~1.2 GB).
2. Run the installer. Accept defaults.
3. On the "SDK Components" screen, keep the default selection ticked and click **Next → Install**.
4. Launch Android Studio. It may take a few minutes on first launch.

---

## PART 2 — Open the project

1. In Android Studio: **File → Open**.
2. Navigate to your project folder:
   `D:\Freshmart\prototype no.1 - Copy\siliguri-fresh-market\android-twa\android`
3. Select the `android` folder (the one containing `build.gradle`, `settings.gradle`, `gradlew.bat`).
4. Click **OK**. Android Studio will ask to trust the project — click **Trust Project**.
5. Wait for **Gradle sync** to finish (bottom bar stops spinning). On first run it downloads
   Gradle 8.13 + dependencies — this can take 5–15 minutes.

### If it says "SDK Platform 36 not found" / "Install missing SDK platforms"
1. Click the **"Install missing SDK"** / **"Sync now"** prompt, or go to
   **File → Settings → Languages & Frameworks → Android SDK → SDK Platforms**.
2. Tick **"Android 16 (API 36)"**.
3. Click **Apply → OK** and wait for it to download, then resync.

---

## PART 3 — Verify signing is set (already done for you)

The signing files are already in place and gitignored:

- `android-twa\android\signing.keystore` — your registered upload key (I verified its
  fingerprint matches the previously published app, so Play Console will accept it)
- `android-twa\android\key.properties` — contains:
  ```
  storeFile=signing.keystore
  storePassword=H3Z8V64SNb7f
  keyAlias=my-key-alias
  keyPassword=H3Z8V64SNb7f
  ```

> ⚠️ These two files are **local only** — never commit them to Git or share them.

---

## PART 4 — Build the signed AAB

1. In Android Studio menu: **Build → Generate Signed Bundle / APK…**
2. Choose **Android App Bundle**. Click **Next**.
3. **Key store path**: click **Choose existing…** and select
   `D:\Freshmart\prototype no.1 - Copy\siliguri-fresh-market\android-twa\android\signing.keystore`
   - **Key store password:** `H3Z8V64SNb7f`
   - **Key alias:** select `my-key-alias` from the dropdown
   - **Key password:** `H3Z8V64SNb7f`
   - Click **Next**.
4. Select the **release** variant. Click **Finish**.
5. When the build completes, a notification appears. Click **"locate"** in the popup.
   The file is at:
   `android-twa\android\app\release\app-release.aab`

> If you ever re-build and it uses different values, Android Studio remembers the last
> keystore you used, so you can just confirm them.

---

## PART 5 — Upload to Google Play Console

1. Go to **https://play.google.com/console** and sign in.
2. Select the app **Siliguri Fresh Mart**.
3. Left menu → **Production** (or start with **Testing → Closed testing** if you want a
   staged rollout).
4. Click **Create new release**.
5. Under **App bundle**, click **Upload** and select:
   `android-twa\android\app\release\app-release.aab`
6. Under **Release notes**, write:
   ```
   - Updated to target Android 16 (API level 36) to meet the latest Play Store requirement.
   - App is a fresh-produce delivery app for Siliguri, West Bengal.
   ```
7. Click **Next → Review release → Start rollout to Production**.

### If you get "version code X must be higher than N"
Tell me the number `N` (or just bump it yourself):
- Open `android-twa\android\app\build.gradle`
- Change `versionCode 10` to `N + 1` (e.g., if it says 10, use 11)
- Re-run **Part 4** (Android Studio will rebuild with the new number).

---

## PART 6 — After Google reviews (1–3 days)

1. You'll get an email when the update is **approved** and live.
2. Google will send a confirmation that the app is no longer affected by the target-API issue.

### How to check it's really API 36
After the new version is live, on the app's Play Console listing go to
**App bundle explorer** → newest version → it will show **Target API 36**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Gradle sync hangs | Check internet. Reboot Android Studio. **File → Invalidate Caches → Invalidate and Restart**. |
| "SDK location not found" | Install SDK Platform 36 (Part 2 note). |
| `failed to resolve com.google.androidbrowserhelper` | Internet blocked to mavenCentral — retry, or run once with VPN. |
| Build error "Execution failed for task ':app:packageReleaseBundle'" | Usually a signing path issue — check Part 4 step 3 keystore path. |
| Upload says wrong signature | You selected the wrong keystore — make sure it's the one from Part 4 (the one in `android-twa\android\`). |
| versionCode rejected | See Part 5 note — bump and rebuild. |

---

## Files that matter

- `android-twa\android\app\build.gradle` — targetSdk 36, versionCode 10, versionName 3.0.0
- `android-twa\android\app\src\main\AndroidManifest.xml` — package `com.siligurifreshmart`, launcher URL `https://www.siligurifreshmart.com/`
- `android-twa\android\signing.keystore` — your upload key (LOCAL, gitignored)
- `android-twa\android\key.properties` — signing passwords (LOCAL, gitignored)
- `public\.well-known\assetlinks.json` — app-links verification (already correct, deployed)

**Do not** upload any `.apk` from the old `D:\Freshmart\` folders — those are the API-35
builds that caused the rejection. Only use the new `app-release.aab` from this project.
