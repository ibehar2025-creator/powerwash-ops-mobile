# PowerWash Ops Mobile

Native Expo app for The Powerwashing Pros operations dashboard.

Download page:

https://ibehar2025-creator.github.io/powerwash-ops-mobile/

## Local preview

```bash
npm install
npm run start
```

Open it in Expo Go, or run native builds with:

```bash
npm run android
npm run ios
```

## Build real install files

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
eas build --profile production --platform ios
```

Android preview builds produce an APK you can install directly. iPhone installation outside Expo Go requires an Apple Developer account and either TestFlight or an App Store build.
