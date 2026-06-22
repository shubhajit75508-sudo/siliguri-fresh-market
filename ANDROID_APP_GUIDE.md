# Siliguri Fresh Mart — Android App Publishing Guide

## Method: PWABuilder (Easiest — No Coding Required)

### Step 1: Generate the Android App
1. Go to **https://www.pwabuilder.com**
2. Enter your URL: **https://www.siligurifreshmart.com**
3. Click **Start** — it will validate your PWA (should score 100+)
4. Under "Android", click **Package**
5. Fill in:
   - **App Name**: Siliguri Fresh Mart
   - **Package Name**: com.siliguri.freshmart
   - **App Version**: 1.0.0
   - **Signing Key**: Leave as "Generate new" (creates a keystore for you)
   - **Status Bar / Nav Bar**: #0a1f1c
   - **Splash Screen**: #0a1f1c
6. Click **Download Package** — you'll get an `.aab` file
7. **SAVE the signing key** — you'll need it for future updates

### Step 2: Register on Google Play Console
1. Go to **https://play.google.com/console**
2. Pay the **₹2,000** one-time developer registration fee
3. Fill in developer profile (name, email, phone)
4. Wait for verification (1-2 days)

### Step 3: Create App Listing
1. In Play Console, click **Create App**
2. App name: **Siliguri Fresh Mart**
3. Default language: English (India)
4. Choose "Free" app
5. Fill in:
   - **Short description**: "Fresh fish, meat & groceries delivered to your doorstep in Siliguri. Free delivery over ₹299."
   - **Full description**: Copy the full description from your website
   - **Screenshots**: Upload 4-6 screenshots of your app (1080px wide recommended)
   - **App icon**: Use your Cloudinary logo (512x512px)
   - **Category**: Shopping
   - **Content rating**: Fill the questionnaire

### Step 4: Upload & Publish
1. In **Production** tab, upload the `.aab` file
2. Click **Review Release**
3. Answer the content rating questions
4. Set pricing: **Free**
5. Select countries: **India**
6. Click **Start Rollout to Production**
7. Wait for Google review (2-24 hours)

### Step 5: Every Update
1. Make your website changes
2. Deploy to Vercel
3. Go back to PWABuilder, re-download a new `.aab`
4. Upload to Play Console as a new release

---

## Files Already Set Up in Your Project
- ✅ `public/manifest.json` — PWA manifest with Cloudinary icons
- ✅ `public/sw.js` — Service worker for offline support
- ✅ `public/offline.html` — Offline fallback page
- ✅ `src/app/layout.tsx` — SW registration + Apple Web App meta

---

## Total Cost
| Item | Cost |
|------|------|
| Google Play Developer account | ₹2,000 (one-time) |
| PWABuilder | Free |
| Everything else | Free |
| **TOTAL** | **₹2,000** |

---

## If You Need a Signed Keystore Manually
You can also generate your own signing key:
```bash
keytool -genkey -v -keystore sfm-release.keystore -alias sfm -keyalg RSA -keysize 2048 -validity 10000
```
Then upload `sfm-release.keystore` to PWABuilder or Bubblewrap.
