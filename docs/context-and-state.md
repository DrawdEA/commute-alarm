# Context & State

## AlarmContext (`context/AlarmContext.tsx`)

Manages all alarm data and user preferences. Wrap with `<AlarmProvider>`. Consume with `useAlarm()`.

### State

| Field | Type | Default | AsyncStorage key |
|---|---|---|---|
| `destinations` | `Destination[]` | `[]` | `"destinations"` |
| `selectedSound` | `string` | `"Default"` | `"selectedSound"` |
| `alarmVolume` | `number` (0–1) | `1` | `"alarmVolume"` |
| `defaultRadius` | `number` (metres) | `500` | `"defaultRadius"` |

All state is loaded from AsyncStorage on mount. Every mutation persists immediately — no explicit save step needed.

### API

```ts
const {
  destinations,
  addDestination,       // (d: Omit<Destination, 'id'>) => void
  removeDestination,    // (id: string) => void
  toggleDestination,    // (id: string) => void   — flips active
  updateDestination,    // (id: string, updates: Partial<Omit<Destination, 'id'>>) => void
  selectedSound,
  setSelectedSound,     // (key: string) => void
  alarmVolume,
  setAlarmVolume,       // (v: number) => void
  defaultRadius,
  setDefaultRadius,     // (r: number) => void
} = useAlarm();
```

### Destination type

```ts
type Destination = {
  id: string;          // Date.now().toString() — set on addDestination
  latitude: number;
  longitude: number;
  label: string;       // reverse-geocoded name or user-supplied via rename
  radius: number;      // metres, 100–2000
  active: boolean;     // whether AlarmMonitor watches this destination
};
```

---

## ThemeContext (`context/ThemeContext.tsx`)

Manages color palette, theme preference, and font loading. Wrap with `<ThemeProvider>`. Consume with `useTheme()`.

### API

```ts
const {
  colors,       // Colors — active palette (light or dark)
  isDark,       // boolean
  themeMode,    // 'system' | 'dark' | 'light' — persisted to "themeMode" in AsyncStorage
  setThemeMode, // (mode: ThemeMode) => void
  fontsLoaded,  // boolean — false until expo-font resolves all fonts
} = useTheme();
```

`isDark` is derived:
- `themeMode === 'system'` → `useColorScheme() !== 'light'`
- `themeMode === 'dark'` → `true`
- `themeMode === 'light'` → `false`

### Font aliases

Import `fonts` from `ThemeContext` and use as `fontFamily` values:

```ts
import { fonts } from '../context/ThemeContext';

// Available keys:
fonts.headlineBold       // 'Manrope_700Bold'
fonts.headlineExtraBold  // 'Manrope_800ExtraBold'
fonts.body               // 'PlusJakartaSans_400Regular'
fonts.bodyMedium         // 'PlusJakartaSans_500Medium'
fonts.bodySemiBold       // 'PlusJakartaSans_600SemiBold'
```

Always use the `fonts` object — never hardcode font family strings.

---

## Color tokens (`constants/colors.ts`)

Material Design 3 token set. Two palettes: `darkColors` and `lightColors`. The `Colors` type is `typeof darkColors`.

Always access colors via `useTheme().colors` — never hardcode hex values.

Key tokens:

| Token | Dark | Light | Usage |
|---|---|---|---|
| `bg` | `#181c1e` | `#f7f9fc` | Screen background |
| `surface` | `#1c2022` | `#ffffff` | Cards, modals |
| `surfaceHigh` | `#272a2c` | `#e8eaed` | Elevated surfaces, tab bar |
| `surfaceHighest` | `#333537` | `#dfe1e4` | Input backgrounds |
| `primary` | `#87d0f4` | `#006686` | Buttons, active icons, accents |
| `text` | `#e2e2e6` | `#181c1e` | Primary text |
| `textMuted` | `#bfc8ce` | `#3f484d` | Secondary text |
| `textDim` | `#899297` | `#899297` | Placeholder, inactive icons |
| `error` | `#ffb4ab` | `#ba1a1a` | Delete actions |
| `accentMuted` | rgba blue ~15% | rgba blue ~10% | Circle fill on map |
| `locationMuted` | rgba teal ~15% | rgba teal ~10% | Selected pin circle fill |
