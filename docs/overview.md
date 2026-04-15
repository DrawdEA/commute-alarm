# LoClock — Project Overview

LoClock is a React Native app that alerts you when you approach a saved destination. It is fully offline — no network requests, no API keys, no user accounts. All data lives on-device.

## What it does

1. You drop a pin on a map (tap or search)
2. You set a radius (100m–2000m)
3. The app watches your GPS in the foreground
4. When you enter the radius, an alarm sound plays and the phone vibrates

## What it does not do (yet)

- Background alarms — the app must be open and foregrounded
- Push notifications — uses `Alert.alert()` for now
- Cloud sync — all alarms stored locally in AsyncStorage

Both background features require a paid Apple Developer Account ($99/yr) and EAS Build.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React Native via Expo managed (~54) |
| Navigation | expo-router ~6 (file-based tabs) |
| Map | react-native-maps |
| Location | expo-location (GPS + geocoding) |
| Audio | expo-av |
| Storage | AsyncStorage |
| Fonts | Manrope, Plus Jakarta Sans (via expo-google-fonts) |

## Three screens

| Tab | Screen | Purpose |
|---|---|---|
| Set Alarm | MapScreen | Drop pins, search, set radius, manage pins on map |
| Alarms | AlarmsScreen | List of all saved alarms, toggle on/off, rename, delete |
| Settings | SettingsScreen | Alarm sound + volume, default radius, light/dark theme |
