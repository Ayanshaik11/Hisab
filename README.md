# Hisab APK (Capacitor + GitHub Actions)

Repo root must contain: `.github/`, `www/`, `keystore/`, `package.json`, `capacitor.config.json`, `google-services.json`.

1. Put your real `fb-init.js` **and `IMG_20251116_215737_558.webp`** in `www/`.
2. Firebase console -> Project settings -> Add app -> Android:
   - Package name: `com.hisab.app`
   - SHA-1: `54:F8:5E:9D:B6:1E:77:B6:E7:68:D4:C6:0B:5F:F5:A0:8C:26:15:8A`
   - Download `google-services.json` and put it in the repo root.
   - Authentication -> Sign-in method -> Google must be enabled.
   (If you already added the app before adding the SHA-1, add it, then re-download the file.)
3. Push to GitHub. Actions -> "Build APK" -> download **Hisab-apk**.

Database rules are in `database_rules.json`.
