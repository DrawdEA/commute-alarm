# Architecture

## Folder structure

```
app/                        # expo-router entry points
  _layout.tsx               # Root layout — wraps all providers, mounts AlarmMonitor + FloatingTabBar
  (tabs)/
    _layout.tsx             # Tab navigator — passes FloatingTabBar as tabBar prop
    index.tsx               # Re-exports MapScreen
    alarms.tsx              # Re-exports AlarmsScreen
    settings.tsx            # Re-exports SettingsScreen

screens/                    # All actual screen logic lives here
  MapScreen.tsx
  AlarmsScreen.tsx
  SettingsScreen.tsx

components/
  AlarmMonitor.tsx          # Headless proximity watcher (renders null, lives in root layout)
  FloatingTabBar.tsx        # Pill-shaped floating tab bar

context/
  AlarmContext.tsx          # Destinations + preferences state, AsyncStorage sync
  ThemeContext.tsx          # Dark/light/system theme + font loading

constants/
  colors.ts                 # Material Design 3 color tokens (dark + light palettes)
  sounds.ts                 # Bundled alarm sound registry

assets/
  alarmsounds/              # 12 MP3 alarm sounds
  icon.png
  splash-icon.png
  android-icon-*.png
```

## Provider tree

```
ThemeProvider               # loads fonts, resolves dark/light colors
  AlarmProvider             # loads destinations + settings from AsyncStorage
    Stack / Tabs
      AlarmMonitor          # headless, watches GPS
      FloatingTabBar        # rendered as custom tabBar
      <Screen />
```

## Navigation

expo-router with a bottom tab group `(tabs)`. Three tabs:

| Route | File | Screen |
|---|---|---|
| `/` | `app/(tabs)/index.tsx` | MapScreen |
| `/alarms` | `app/(tabs)/alarms.tsx` | AlarmsScreen |
| `/settings` | `app/(tabs)/settings.tsx` | SettingsScreen |

### Cross-screen deep links

**AlarmsScreen → MapScreen** (view a destination on the map):
```ts
router.navigate({ pathname: '/', params: { focusId: item.id, t: Date.now().toString() } })
```
MapScreen reads `focusId` from `useLocalSearchParams`, animates the map to that destination, and opens its bottom sheet. `t` is a timestamp used to force the effect to re-run even if `focusId` hasn't changed.

**MapScreen → AlarmsScreen** (view alarm in list):
```ts
router.navigate({ pathname: '/alarms', params: { expandId: id } })
```
AlarmsScreen reads `expandId` and auto-expands that card.

## State management

No external state library. Two React contexts cover everything:

- **AlarmContext** — destinations array + alarm preferences (sound, volume, default radius). Every mutation immediately persists to AsyncStorage.
- **ThemeContext** — active color palette, theme mode preference (system/dark/light), font load status.

All components consume context via `useAlarm()` and `useTheme()` hooks.

## Alarm firing logic

`AlarmMonitor` is a renderless component mounted once at the root layout. It owns the GPS subscription lifecycle:

1. If there are no active destinations → stop watching, clear the subscription
2. If there are active destinations → start `Location.watchPositionAsync` (Balanced accuracy, 20m distance interval)
3. On each location update → run haversine distance against every active destination
4. On first entry into a destination's radius → play sound, vibrate, show alert
5. On "OK" in alert → unload sound, toggle destination off, remove from fired set
6. `firedRef` (a `Set<string>`) prevents re-firing while inside the same radius

The dependency array for the effect is `activeDestinations.map(d => d.id).join(',')` — only restarts when the set of active destination IDs changes, not on every render.
