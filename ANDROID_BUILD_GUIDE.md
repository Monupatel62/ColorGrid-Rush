# Android Packaging & Release Guide — ColorGrid Rush

This guide details the complete process for packaging **ColorGrid Rush** into a native Android app using **Capacitor** and preparing a production-signed Android App Bundle (`.aab`) for the **Google Play Store**.

---

## 1. Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: v18+ or v22+
- **Android Studio**: Ladybug, Koala, or Iguana with Android SDK Platform 34 (Android 14) and SDK Build-Tools.
- **Java Development Kit (JDK)**: JDK 17 or JDK 21 (configured in Android Studio).
- **Android Device or Emulator**: Enabled for USB Debugging.

---

## 2. Initial Setup (One-Time)

From the project root (`d:/ColorGrid Rush`):

1. Install the Capacitor Android platform dependency:
   ```bash
   npm install @capacitor/android@^6.2.0
   ```

2. Add the Android platform project:
   ```bash
   npx cap add android
   ```
   This generates the native `android/` directory with the native Gradle wrapper, manifest, and activity.

---

## 3. Building and Syncing Web Code to Android

Whenever you update TypeScript, scenes, or assets, sync the compiled web bundle to the Android native directory:

```bash
npm run android:build
```
*(This automatically runs `npm run build` to output to `dist/`, followed by `npx cap sync android` to copy assets into `android/app/src/main/assets/public/`)*

---

## 4. Testing Locally in Android Studio

To open the project in Android Studio:

```bash
npm run android:open
```

Once Android Studio finishes indexing:
1. Select your connected Android phone or Android Virtual Device (AVD).
2. Click **Run 'app'** (or press `Shift + F10`).
3. The app will launch in fullscreen portrait orientation with hardware acceleration.

---

## 5. Production Release & Play Store Signing

Google Play requires all production apps to be uploaded as signed **Android App Bundles (`.aab`)**.

### Step 5.1: Generate a Secure Release Keystore

Run the following command in terminal (replace with your secure password and company details):

```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias colorgrid
```

Store `release-key.jks` securely outside public repositories.

### Step 5.2: Configure Signing in `android/app/build.gradle`

In `android/app/build.gradle`, locate the `android` block and add the release signing configuration:

```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file("path/to/release-key.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "YOUR_KEYSTORE_PASSWORD"
            keyAlias "colorgrid"
            keyPassword System.getenv("KEY_PASSWORD") ?: "YOUR_KEY_PASSWORD"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 5.3: Generate Release Bundle (.aab)

From inside the `android/` folder:

```bash
# Windows PowerShell
.\gradlew.bat bundleRelease

# Linux / macOS
./gradlew bundleRelease
```

The output bundle will be located at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 6. Google Play Store Submission Checklist

- [x] **Target API Level**: Android 14 (API 34) or higher.
- [x] **App Identity**: `com.colorgrid.rush` (configured in `capacitor.config.ts`).
- [x] **Orientation**: Fixed portrait in `AndroidManifest.xml` (`android:screenOrientation="portrait"`).
- [x] **Data Safety**: ColorGrid Rush saves all player progress locally on the device using browser LocalStorage; no user telemetry or personally identifiable information (PII) is transmitted.
- [x] **Permissions**: Minimal permissions required (No dangerous permissions requested).
