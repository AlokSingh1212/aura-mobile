# AURA Mobile — Expo Application Services (EAS) Build Guide

This handbook details the steps required to compile, sign, build, and submit the AURA React Native mobile application for Android and iOS using Expo Application Services (EAS).

---

## 1. Prerequisites

Before starting, ensure you have the necessary accounts and command-line tools configured:

1. **Expo Developer Account**: Register at [expo.dev](https://expo.dev).
2. **EAS CLI**: Install the EAS command-line tools globally:
   ```bash
   npm install -g eas-cli
   ```
3. **Login to EAS**: Authenticate with your Expo credentials in your terminal:
   ```bash
   eas login
   ```
4. **Project Initialization & Linking**: Link the local directory to your Expo developer project:
   ```bash
   eas project:init
   ```

---

## 2. Environment Configuration & Secret Credentials

The application uses dynamic parameters (such as the WebRTC API host and Agora App ID). These should not be hardcoded in client source control.

Configure these values in the Expo Dashboard under **Project Settings → Secrets**, or define them in your local `eas.json` build profiles:

### Required Secrets
- `EXPO_PUBLIC_API_HOST`: The base URL of the AURA marketplace backend (e.g. `https://aura.luxury`).
- `NEXT_PUBLIC_AGORA_APP_ID`: Your production Agora App ID.
- `AGORA_APP_CERTIFICATE`: Agora primary App Certificate (used on backend server nodes for secure tokens).

Example `eas.json` configuration snippet:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_HOST": "https://staging.aura.luxury"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_HOST": "https://staging.aura.luxury"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_HOST": "https://aura.luxury"
      }
    }
  }
}
```

---

## 3. Push Notification Setup

To send real-time push alerts (e.g., brand deal proposals, follow alerts), you must link Apple and Google credentials to Expo's push gateway:

### Android (Google FCM)
1. Go to the [Firebase Console](https://console.firebase.google.com) and create/select your project.
2. Navigate to **Project Settings → Service Accounts**.
3. Click **Generate New Private Key** to download the JSON service account key.
4. Upload this key to EAS using:
   ```bash
   eas credentials
   ```
   Select **Android → production → Push Notifications Key** and upload the JSON file.

### iOS (Apple APNs)
1. Go to the [Apple Developer Portal](https://developer.apple.com).
2. Navigate to **Certificates, Identifiers & Profiles → Keys** and create an **APNs Key** (.p8).
3. Run `eas credentials` in the terminal:
   ```bash
   eas credentials
   ```
   Select **iOS → production**, log in with your Apple Developer Account, and upload the APNs key. Expo will manage the signing profiles automatically.

---

## 4. Android Build Workflows

Ensure you have configured the scripts in `package.json`. Compile using the following workflows:

### A. Development Build (APK)
Used for local testing on a physical device or emulator. Includes the Expo Dev Menu.
```bash
npm run build:android:dev
```

### B. Preview Build (APK)
Used for internal team testing, QA, and sharing with stakeholders.
```bash
npm run build:android:preview
```

### C. Production Build (AAB)
Compiles a production-ready Android App Bundle (`.aab`) ready for submission to the Google Play Console.
```bash
npm run build:android:prod
```

---

## 5. iOS Build Workflows

### A. Preview Build (Ad-Hoc / TestFlight)
Generates a signed build for Apple TestFlight or ad-hoc distribution to registered UDIDs.
```bash
npm run build:ios:preview
```

### B. Production App Store Build (.ipa)
Generates the final signed production build for submission to the Apple App Store.
```bash
npm run build:ios:prod
```

---

## 6. App Store Submission Workflow

Once the production builds are completed, you can submit them to the respective stores:

### Submit to Google Play Store
Sends the latest production `.aab` to Google Play Console (internal test track or production):
```bash
npm run submit:android
```

### Submit to Apple App Store
Sends the latest production `.ipa` to App Store Connect / TestFlight:
```bash
npm run submit:ios
```

---

## 7. Over-The-Air (OTA) Updates

To deploy styling tweaks, copy fixes, or client logic without compiling a new native binary, use **EAS Update**:

1. Initialize updates in the project:
   ```bash
   eas update:configure
   ```
2. Publish a live update to the `production` or `preview` branch:
   ```bash
   eas update --branch production --message "Optimize LiveShowroom join latency"
   ```
   Devices running the corresponding release channel will pull and load the new javascript bundle automatically on the next launch.
