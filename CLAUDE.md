# Commute Alarm

A React Native app that alerts you when you're approaching a set destination.

## Stack

- **Expo** managed workflow (~54)
- **expo-router** (~6) for navigation
- **React Native** with TypeScript
- **react-native-maps** for the map
- **expo-location** for GPS + geocoding (no API key needed)
- **AsyncStorage** for local persistence

## Folder structure

- `screens/` — actual screen components
- `app/` — thin expo-router re-exports (one file per screen)
- `context/` — React context (AlarmContext for shared state)
- `assets/` — icons and images

## Rules

- Only use packages installable via `npx expo install` (managed workflow — no bare RN)
- Geocoding uses `expo-location`'s built-in geocoder — no paid API keys
- No background location or notifications yet — requires paid Apple Developer account

## Running

```
npm start        # Expo Go
npm run ios      # iOS simulator
npm run android  # Android emulator/device
```

## Deferred features

- Background proximity alarm — needs paid Apple Developer account ($99/yr) + EAS Build
- User accounts + cloud sync (Convex + auth) — post-MVP
