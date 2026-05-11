# Seen

Expo React Native app for discovering and tracking live events.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- For iOS: Xcode (Mac only) This also works with Expo app
- For Android: Android Studio + an emulator or physical device

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the `.env` file

Create a file named `.env` in the project root with the following contents.  
All values starting with `EXPO_PUBLIC_` are bundled into the client — do not put secrets here.

```env
# API
# Primary backend URL (Vercel deployment or your own)
EXPO_PUBLIC_API_BASE_URL=https://your-backend.vercel.app/

# Comma-separated fallback URLs tried if the primary is unreachable.
# Add your local machine's LAN IP (e.g. 192.168.x.x) if testing on a physical device.
EXPO_PUBLIC_API_BASE_URL_FALLBACKS=http://localhost:3000,http://127.0.0.1:3000,http://10.0.2.2:3000

# Firebase (create a project at https://console.firebase.google.com)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Google Sign-In (create OAuth 2.0 credentials in Google Cloud Console)
# Web client ID is required. iOS and Android IDs are needed for native builds.
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=

# Dev only — set to true to skip authentication during local development
EXPO_PUBLIC_DEV_AUTH_BYPASS=false
```

> **Where to get the Firebase values:** Go to your Firebase project → Project Settings → Your apps → SDK setup and configuration.
>
> **Where to get the Google client IDs:** Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client IDs (one for Web, one for Android, one for iOS).

### 3. Start the app

```bash
npm start          # opens Expo dev menu
npm run android    # runs on Android emulator / device
npm run ios        # runs on iOS simulator (Mac only)
```

### 4. Start the backend (optional, for local development)

The backend lives in a sibling directory `../seendb`. From this folder:

```bash
npm run backend
```

---

## Building for a physical device (required for calendar sync)

The "Add to Calendar" feature uses `expo-calendar`, which is a native module and **does not work in Expo Go**. You need a development build:

```bash
npx expo prebuild
npx expo run:android   # or run:ios
```

---

## Project structure

```
screens/       UI screens
Services/      API client, types, and service functions
assets/        Images and icons
app.json       Expo config (permissions, plugins, build settings)
.env           Environment variables (not committed to git)
```

---

## Environment variable reference

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Primary backend base URL |
| `EXPO_PUBLIC_API_BASE_URL_FALLBACKS` | No | Comma-separated fallback URLs |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase project API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Yes | Google OAuth web client ID |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | No | Google OAuth Android client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | No | Google OAuth iOS client ID |
| `EXPO_PUBLIC_DEV_AUTH_BYPASS` | No | Set `true` to skip auth in dev |
