# Release

## Running locally

```bash
npm start          # Expo Go (scan QR)
npm run ios        # iOS simulator
npm run android    # Android emulator or device
```

## Building for production (EAS)

Requires a paid Apple Developer Account ($99/yr) for iOS.

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

The production profile uses `autoIncrement: true` and `appVersionSource: remote` — EAS manages the build number automatically. Do not set `ios.buildNumber` manually in `app.json`.

After the iOS build completes:

```bash
eas submit --platform ios
```

## App Store checklist

### Blockers

- [ ] Paid Apple Developer Account enrolled
- [ ] EAS Build produces a valid .ipa
- [ ] Privacy policy hosted at a public URL (`PRIVACY_POLICY.md` exists, needs a hosted page)
- [ ] `NSLocationWhenInUseUsageDescription` in `infoPlist` (already set via expo-location plugin)
- [ ] App Store Connect listing: name, subtitle, description, keywords, category
- [ ] Screenshots for all required device sizes

### Nice-to-haves

- [ ] Onboarding flow on first launch
- [ ] Replace `Vibration.vibrate` with `expo-haptics`
- [ ] App Store review prompt after successful alarms
- [ ] Error state for denied location permission

## Version bumping

The `version` field in `app.json` is the user-facing version (e.g. `1.0.1`). Android `versionCode` must be incremented for each Play Store submission. iOS build number is managed by EAS automatically.

## What's deferred (needs Apple Developer Account)

- **Background location** — alarms only fire while the app is foregrounded
- **Push notifications** — currently uses `Alert.alert()` which only works in foreground

Both require EAS Build (not just Expo Go) and provisioning profiles from Apple.
