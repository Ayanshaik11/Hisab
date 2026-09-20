# Hisab (React Native / Expo) - APK built by GitHub

## 1. Fill in three things
| What | Where |
|---|---|
| Firebase details + Google **Web client ID** | `src/config.js` (same values as your old `fb-init.js`) |
| **App icon** (1024 x 1024 PNG) | `assets/icon.png`  - replace the placeholder, keep the same name |
| Profile photo shown in the top bar | `assets/profile.webp` - replace with `IMG_20251116_215737_558.webp` renamed to `profile.webp` |

Icon tip: Android crops the icon into a circle/rounded shape, so keep your logo inside the centre ~66%.

Sounds are in `assets/sounds/` (`tap`, `success`, `error`, `delete` .wav). Replace them with your own files of the same names if you want.
Sounds and vibration can be switched off from the profile button in the app.

## 2. Push to GitHub
The repo root must contain `.github/`, `assets/`, `src/`, `keystore/`, `App.js`, `app.json`, `package.json` ...
Delete the old Capacitor files (`www/`, `capacitor.config.json`, `google-services.json`).

## 3. Get the APK
Actions -> **Build APK** -> latest run -> download **Hisab-apk** (bottom of the page).
The first build takes ~15-25 minutes.

## 4. Google login (one time)
1. Firebase console -> Project settings -> Your apps -> Android app `com.hisab.app`.
2. Add the **SHA-1** shown in the build's summary (Actions run page, "APK signing fingerprint"). Currently:
   `54:F8:5E:9D:B6:1E:77:B6:E7:68:D4:C6:0B:5F:F5:A0:8C:26:15:8A`
3. Authentication -> Sign-in method -> Google must be enabled.
4. Copy the **Web client ID** (Authentication -> Sign-in method -> Google -> Web SDK configuration) into `src/config.js`.
5. Wait a few minutes, uninstall the old app, install the new APK.

Error 10 / DEVELOPER_ERROR = the SHA-1 or Web client ID doesn't match. Compare the SHA-1 in the build summary with the one in Firebase.

## Your data
Data lives in Firebase Realtime Database (`users/<uid>/people/...`), not in the app. This app reads and writes exactly the
same paths and fields as the old web app, so your existing data appears when you log in with the same account.
`database_rules.json` is unchanged.
