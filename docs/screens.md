# Screens

## MapScreen (`screens/MapScreen.tsx`)

The home tab. Full-screen map where users create and manage alarms.

### Layout

- **MapView** — fills the screen, dark/light mode via `userInterfaceStyle`, shows user location dot
- **Search bar** — floating pill anchored below the safe area top, always visible
- **Map controls** — two buttons (compass reset, recenter) anchored bottom-right above the tab bar
- **Bottom sheet** — animated overlay that slides up from the bottom when a pin is selected

### Interactions

| Action | Result |
|---|---|
| Tap map | Reverse-geocodes the coordinate, opens bottom sheet for a new pin |
| Tap existing marker | Opens bottom sheet in edit mode for that destination |
| Tap map while sheet is open | Dismisses the sheet |
| Type in search bar + submit | Forward-geocodes query, animates map to result, opens sheet for new pin |
| Drag radius slider | Updates the circle on the map in real time |
| Tap "Set Alarm" | Saves new destination (active = true), closes sheet |
| Tap "Save Radius" | Updates radius on existing destination, closes sheet |
| Toggle switch (existing) | Toggles destination active/inactive in place |
| Tap pin label | Opens `Alert.prompt` to rename |
| Tap "View in Alarms List" | Deep-links to AlarmsScreen with `expandId` |

### Bottom sheet states

The sheet has two modes determined by whether `selectedPin.existingId` is set:

- **New pin** — shows "NEW ALARM" tag, "Set Alarm" CTA, no toggle
- **Existing pin** — shows "EDIT ALARM" tag, "Save Radius" CTA, active/inactive toggle, "View in Alarms List" button

### Animation

Uses `Animated.spring` (tension 65, friction 11) for the slide-up and `Animated.timing` for a dimming overlay. Both run in parallel via `Animated.parallel`. The sheet and overlay are tracked by a `sheetOpenRef` (ref, not state) to avoid stale closure issues in press handlers.

---

## AlarmsScreen (`screens/AlarmsScreen.tsx`)

The alarms list tab. Shows all saved destinations as expandable cards.

### Layout

- **Header bar** — LoClock brand name, + button (navigates to MapScreen)
- **FlatList** — one card per destination, sorted by insertion order
- **Empty state** — alarm icon + hint text when no destinations exist

### Card behavior

Each card has two states:

**Collapsed** — label, reverse-geocoded address, active toggle  
**Expanded** — adds a "View on Map" button (with radius badge), Rename button, Remove button

Tapping anywhere on the collapsed row toggles expand. The `expandId` URL param (from MapScreen deep-link) auto-expands a specific card on arrival.

Expand/collapse uses `LayoutAnimation.Presets.easeInEaseOut`. On Android, `UIManager.setLayoutAnimationEnabledExperimental(true)` is called at module level.

### Address resolution

Addresses are reverse-geocoded lazily using `Location.reverseGeocodeAsync` and cached in a local `addresses` state map (`Record<string, string>`). Already-resolved addresses are skipped on re-render.

---

## SettingsScreen (`screens/SettingsScreen.tsx`)

The settings tab. Three sections + three bottom sheet modals.

### Sections

**Alerts card** — default radius slider (100–2000m, step 50). Persisted via `AlarmContext.setDefaultRadius`. Applied to new pins when first opened.

**Appearance card** — 3-column grid: Light / Dark / System. Persisted via `ThemeContext.setThemeMode`.

**Settings rows** — tappable rows that open modals:
- Alarm Sound & Volume
- Support & Help
- Privacy & Data

### Modals

All three modals use `Modal` with `animationType="slide"` and a backdrop `Pressable` that dismisses on outside tap.

**Sound picker**
- Volume slider at the top (0–100%, step 5%). Changing volume while a preview is playing updates the playing sound immediately via `sound.setVolumeAsync`.
- Sound list: tap a row to select + close; tap the play/stop icon to preview in a loop without selecting.
- `previewRef` holds the active `Audio.Sound` instance. Cleaned up on close and on new selection.

**Support & Help** — static FAQ content (5 questions) + Contact section placeholder.

**Privacy & Data** — four sections: Location Data, Local Storage, No Network Requests, Permissions. Includes an "Open Device Settings" button via `Linking.openSettings()`.
