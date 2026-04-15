# Adding Features

Practical guide for common extension patterns in this codebase.

## Adding a new alarm sound

1. Drop the MP3 into `assets/alarmsounds/`
2. Add an entry to `ALARM_SOUNDS` in `constants/sounds.ts`:

```ts
{ key: 'MySoundKey', label: 'My Sound', file: require('../assets/alarmsounds/MySoundKey.mp3') }
```

That's it. The sound picker in SettingsScreen reads `ALARM_SOUNDS` dynamically.

---

## Adding a new setting

1. Add the state + setter + AsyncStorage key to `AlarmContext`:

```ts
// In AlarmContextValue type:
mySetting: number;
setMySetting: (v: number) => void;

// In AlarmProvider:
const [mySetting, setMySettingState] = useState(0);

useEffect(() => {
  AsyncStorage.getItem('mySetting').then(raw => {
    if (raw) setMySettingState(parseInt(raw, 10));
  });
}, []);

function setMySetting(v: number) {
  setMySettingState(v);
  AsyncStorage.setItem('mySetting', v.toString());
}
```

2. Expose it in the context value object
3. Consume with `useAlarm()` wherever needed

---

## Adding a new color token

Add the same key to both `darkColors` and `lightColors` in `constants/colors.ts`. The `Colors` type is inferred from `darkColors`, so TypeScript will catch any missing keys automatically.

---

## Adding a new screen

1. Create `screens/MyScreen.tsx` with the component
2. Create `app/(tabs)/myscreen.tsx`:

```ts
export { default } from '../../screens/MyScreen';
```

3. Add the icon and label to `FloatingTabBar.tsx`:

```ts
const TAB_ICONS = { ..., myscreen: 'icon-name' };
const TAB_LABELS = { ..., myscreen: 'My Screen' };
```

4. The tab navigator in `app/(tabs)/_layout.tsx` picks it up automatically via expo-router's file-based routing.

---

## Background location (deferred)

When the Apple Developer Account is available:

1. Switch to `expo-task-manager` + `Location.startLocationUpdatesAsync` with a registered background task
2. Replace `Alert.alert` with `expo-notifications` (requires EAS Build + provisioning profile)
3. Update `app.json` to add `NSLocationAlwaysUsageDescription` to `infoPlist`
4. Add `UIBackgroundModes: ["location"]` to `infoPlist`
5. Update the FAQ answer in SettingsScreen's Support modal

The `AlarmMonitor` component is the right place to swap out the foreground watcher for a background task — everything else (context, screens) stays the same.

---

## Haptic feedback

Replace `Vibration.vibrate` in `AlarmMonitor.tsx` with `expo-haptics`:

```ts
import * as Haptics from 'expo-haptics';
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

Install: `npx expo install expo-haptics`

---

## Rules

- Only install packages via `npx expo install` — this pins to the Expo SDK-compatible version
- Do not eject to bare workflow — this project is managed Expo only
- No hardcoded hex colors — always use `useTheme().colors`
- No hardcoded font family strings — always use the `fonts` object from `ThemeContext`
