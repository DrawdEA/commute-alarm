# Commute Alarm

A React Native app (branded **LoClock**) that alerts you when you're approaching a set destination. Fully offline — no network requests, no API keys, no user accounts. All data lives on-device via AsyncStorage.

## Stack

| Package | Purpose |
|---|---|
| Expo ~54 (managed) | Build toolchain + native module access |
| expo-router ~6 | File-based tab navigation |
| react-native-maps | Interactive map with custom markers + radius circles |
| expo-location | GPS watcher, background geofencing, reverse/forward geocoding |
| expo-task-manager | Background geofence task |
| expo-notifications | Fallback arrival notification (pre-iOS 26) |
| expo-av | Alarm sound playback (loops until dismissed) |
| @react-native-async-storage/async-storage | Persistent local storage |
| @react-native-community/slider | Radius and volume sliders |
| @expo-google-fonts/manrope | Headline font (Bold, ExtraBold) |
| @expo-google-fonts/plus-jakarta-sans | Body font (Regular, Medium, SemiBold) |
| @expo/vector-icons (MaterialIcons) | All icons throughout the UI |

## Folder structure

```
app/                    # expo-router entry points (thin re-exports + layout)
  _layout.tsx           # Root layout: wraps providers, renders AlarmMonitor + FloatingTabBar
  (tabs)/               # Tab group
    _layout.tsx         # Tab navigator config
    index.tsx           # → MapScreen
    alarms.tsx          # → AlarmsScreen
    settings.tsx        # → SettingsScreen

screens/                # Actual screen components (all logic lives here)
  MapScreen.tsx         # Map, pin drop, search, bottom sheet
  AlarmsScreen.tsx      # Alarm list with expand/collapse cards
  SettingsScreen.tsx    # Theme picker, sound picker, radius, modals

components/
  AlarmMonitor.tsx      # Headless proximity watcher (renders null)
  FloatingTabBar.tsx    # Pill-shaped floating tab bar overlay

context/
  AlarmContext.tsx      # Destinations + sound/volume/radius state + AsyncStorage sync
  ThemeContext.tsx      # Dark/light/system theme + font loading

constants/
  colors.ts             # Material Design 3 color tokens (darkColors, lightColors, Colors type)
  sounds.ts             # ALARM_SOUNDS registry, DEFAULT_SOUND_KEY, getSoundByKey()

assets/
  alarmsounds/          # 12 bundled MP3 alarm sounds
  icon.png, splash-icon.png, android-icon-*.png, favicon.png
```

## Key data types

```ts
// context/AlarmContext.tsx
type Destination = {
  id: string;          // Date.now().toString()
  latitude: number;
  longitude: number;
  label: string;       // reverse-geocoded or user-renamed
  radius: number;      // metres, 100–2000
  active: boolean;     // toggled on/off
};
```

## How the alarm fires

Everything funnels into `handleArrival(id)` in `lib/arrival.ts`. It runs calls one at a time, switches the destination off in storage first (so each alarm fires once), then rings.

- **Background / locked phone:** iOS geofences (`Location.startGeofencingAsync`, task `loclock-geofence`, defined at bundle load via `index.ts`). On enter, it rings a system alarm through AlarmKit (`modules/loclock-alarm`, iOS 26+, rings through silent mode). If AlarmKit is unavailable or denied, it sends a time-sensitive notification instead (silent when the ringer is off). Needs "Always" location. iOS monitors at most 20 regions per app.
- **Foreground:** `components/AlarmMonitor.tsx` runs a precise GPS watcher (`watchPositionAsync`, haversine). When the app is active, `handleArrival` plays the in-app looping sound and shows an `Alert` instead of using AlarmKit.
- `AlarmMonitor` also requests permissions (location → Always → AlarmKit → notifications) and keeps the geofences in sync with the active destinations.
- Background sounds are in `assets/alarmsounds-ios/*.caf` (≤30s, bundled by the expo-notifications plugin). `iosSoundFile(key)` maps a sound key to its file. If you add a sound, add both the mp3 and the caf.
- `modules/loclock-alarm` is a local Expo module, so it needs a dev or EAS build. In Expo Go, only the foreground path works.

## Screens

### MapScreen (`screens/MapScreen.tsx`)

- Full-screen `MapView` with `showsUserLocation`, dark/light mode via `userInterfaceStyle`
- **Search bar** (floating pill, top): calls `Location.geocodeAsync`, animates map + opens bottom sheet
- **Tap to pin**: `Location.reverseGeocodeAsync` for label, opens bottom sheet for new alarm
- **Marker tap**: opens bottom sheet in edit mode for existing alarm
- **Bottom sheet** (spring animated): shows label, lat/lng, radius slider (100–2000m), Set Alarm / Save Radius button, toggle for active/inactive, "View in Alarms List" deep-link
- **Map controls** (bottom-right): compass reset, recenter-to-location
- Cross-screen deep-link: navigated to via `router.navigate({ pathname: '/', params: { focusId, t } })` from AlarmsScreen — animates map to destination and opens its sheet

### AlarmsScreen (`screens/AlarmsScreen.tsx`)

- `FlatList` of destination cards with expand/collapse (`LayoutAnimation`)
- Each card: label, reverse-geocoded address (lazy, cached in local state), active toggle (`Switch`)
- Expanded card: "View on Map" button (deep-links to MapScreen with `focusId`), Rename (`Alert.prompt`), Remove (`Alert.alert` confirm)
- `expandId` search param: automatically expands the card when navigating back from MapScreen

### SettingsScreen (`screens/SettingsScreen.tsx`)

- **Alerts card**: default radius slider (persisted to `AlarmContext`)
- **Appearance card**: Light / Dark / System theme picker (3-column grid)
- **Alarm Sound & Volume**: opens a bottom sheet modal with volume slider + sound list; supports live preview (tap play/stop per sound)
- **Support & Help modal**: FAQ accordion (static content)
- **Privacy & Data modal**: explains on-device-only storage, no network, foreground-only permission; "Open Device Settings" button via `Linking.openSettings()`

## Context

### `AlarmContext` (`context/AlarmContext.tsx`)

Exposes via `useAlarm()`:

| Value | Type | AsyncStorage key |
|---|---|---|
| `destinations` | `Destination[]` | `"destinations"` |
| `addDestination` | fn | — |
| `removeDestination` | fn | — |
| `toggleDestination` | fn | — |
| `updateDestination` | fn | — |
| `selectedSound` | string (key) | `"selectedSound"` |
| `setSelectedSound` | fn | — |
| `alarmVolume` | number (0–1) | `"alarmVolume"` |
| `setAlarmVolume` | fn | — |
| `defaultRadius` | number (metres) | `"defaultRadius"` |
| `setDefaultRadius` | fn | — |

All mutations immediately persist via `AsyncStorage`. State is loaded from storage on mount.

### `ThemeContext` (`context/ThemeContext.tsx`)

Exposes via `useTheme()`:

| Value | Type | Notes |
|---|---|---|
| `colors` | `Colors` | Active palette (dark or light) |
| `isDark` | boolean | Derived from `themeMode` + system scheme |
| `themeMode` | `'system' \| 'dark' \| 'light'` | Persisted to `"themeMode"` |
| `setThemeMode` | fn | — |
| `fontsLoaded` | boolean | False until expo-font resolves |

Font aliases via `fonts` export:

```ts
fonts.headlineBold       // Manrope_700Bold
fonts.headlineExtraBold  // Manrope_800ExtraBold
fonts.body               // PlusJakartaSans_400Regular
fonts.bodyMedium         // PlusJakartaSans_500Medium
fonts.bodySemiBold       // PlusJakartaSans_600SemiBold
```

## Constants

### `constants/colors.ts`

Material Design 3 tokens. Two palettes: `darkColors` (ocean blue primary `#87d0f4`) and `lightColors` (ocean blue primary `#006686`). Export `Colors` type = `typeof darkColors`. Always apply colors via `useTheme().colors` — never hardcode hex values.

### `constants/sounds.ts`

12 bundled MP3s in `assets/alarmsounds/`. Registry: `ALARM_SOUNDS: AlarmSound[]`. Use `getSoundByKey(key)` to resolve a sound object for playback. Default: `DEFAULT_SOUND_KEY = 'Default'`.

## App config

- Bundle ID: `com.loclock.app` (iOS + Android)
- EAS project ID: `3553e511-c296-48d3-84dd-870418f56c1c`
- Version: `1.0.0` / Android `versionCode: 1`
- EAS production profile uses `autoIncrement: true` + `appVersionSource: remote` — **do not manually set `ios.buildNumber`**
- `ITSAppUsesNonExemptEncryption: false` already set in `infoPlist`

## Rules

- Only install packages via `npx expo install` (managed workflow — no bare RN)
- Geocoding uses `expo-location`'s built-in geocoder — no paid API keys
- No `.env` file — no secrets anywhere in this project
- Colors always come from `useTheme().colors` — never hardcode hex
- Fonts always from the `fonts` object exported from `ThemeContext` — never hardcode font family strings

## Running

```
npm start        # Expo Go
npm run ios      # iOS simulator
npm run android  # Android emulator/device
```

## Shipping

EAS Build is configured. To build for production:

```
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios   # after build completes
```

## App Store release checklist

**Requires paid Apple Developer Account ($99/yr) first:**
- [ ] EAS Build — needed to produce the .ipa for App Store submission
- [x] Background location monitoring (geofences)
- [x] Locked-phone alarm (AlarmKit, notification fallback)

**App Store requirements:**
- [ ] Privacy policy hosted at a public URL (`PRIVACY_POLICY.md` exists but needs hosting)
- [ ] App Store listing — screenshots, description, keywords, category
- [ ] App icons meeting Apple's exact size specs
- [x] Location + AlarmKit usage strings (via plugins / infoPlist in app.json)

**Nice-to-haves before release:**
- Onboarding flow on first launch
- Haptic feedback (replace `Vibration.vibrate`)
- App Store review prompt after a few successful alarms
- Error handling polish for denied permissions

## Deferred features (post-MVP)

- User accounts + cloud sync (Convex + auth)
