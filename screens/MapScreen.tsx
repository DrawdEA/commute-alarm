import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlarm } from '../context/AlarmContext';
import { useTheme, fonts } from '../context/ThemeContext';

const BOTTOM_SHEET_HEIGHT = 300;

type SelectedPin = {
  latitude: number;
  longitude: number;
  label: string;
  existingId?: string;
  radius: number;
  active: boolean;
};

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const { destinations, addDestination, toggleDestination, updateDestination, defaultRadius } = useAlarm();
  const insets = useSafeAreaInsets();
  const { focusId, t } = useLocalSearchParams<{ focusId?: string; t?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPin, setSelectedPin] = useState<SelectedPin | null>(null);
  const [tempRadius, setTempRadius] = useState(500);

  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);

  // Use both state (for re-renders/pointerEvents) and ref (for closures)
  const [sheetVisible, setSheetVisible] = useState(false);
  const sheetOpenRef = useRef(false);
  // Track marker press to prevent map onPress from also firing
  const markerPressedRef = useRef(false);

  const initialRegion: Region = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Get current location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 500);
      }
    })();
  }, []);

  // Handle focusId from alarms list "View on Map"
  useEffect(() => {
    if (focusId) {
      const dest = destinations.find(d => d.id === focusId);
      if (dest) {
        mapRef.current?.animateToRegion({
          latitude: dest.latitude,
          longitude: dest.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
        openSheet({
          latitude: dest.latitude,
          longitude: dest.longitude,
          label: dest.label,
          existingId: dest.id,
          radius: dest.radius,
          active: dest.active,
        }, dest.radius);
      }
    }
  }, [focusId, t]);

  function animateIn() {
    Animated.parallel([
      Animated.spring(bottomSheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function animateOut(onDone?: () => void) {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(bottomSheetAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(onDone);
  }

  // Open sheet with pin data — seamlessly swaps if already open
  function openSheet(pin: SelectedPin, radius: number) {
    setSelectedPin(pin);
    setTempRadius(radius);
    if (!sheetOpenRef.current) {
      sheetOpenRef.current = true;
      setSheetVisible(true);
      animateIn();
    }
  }

  // Close sheet
  function closeSheet() {
    if (!sheetOpenRef.current) return;
    sheetOpenRef.current = false;
    setSelectedPin(null);
    animateOut(() => {
      setSheetVisible(false);
    });
  }

  // Tap on map — place new pin, or dismiss if sheet is open
  async function handleMapPress(e: any) {
    // If a marker was just pressed, skip — the marker handler will handle it
    if (markerPressedRef.current) {
      markerPressedRef.current = false;
      return;
    }

    // If sheet is open, just close it
    if (sheetOpenRef.current) {
      closeSheet();
      return;
    }

    const { latitude, longitude } = e.nativeEvent.coordinate;

    // Reverse geocode for a label
    let label = 'Dropped Pin';
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.name, r.street, r.city].filter(Boolean);
        if (parts.length > 0) label = parts.join(', ');
      }
    } catch {
      // keep default
    }

    openSheet({ latitude, longitude, label, radius: defaultRadius, active: false }, defaultRadius);
  }

  // Tap on an existing marker
  const handleMarkerPress = useCallback((dest: typeof destinations[0]) => {
    // Flag so handleMapPress knows to skip
    markerPressedRef.current = true;

    openSheet({
      latitude: dest.latitude,
      longitude: dest.longitude,
      label: dest.label,
      existingId: dest.id,
      radius: dest.radius,
      active: dest.active,
    }, dest.radius);
  }, []);

  // Search for a location
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        mapRef.current?.animateToRegion({
          latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02,
        }, 500);
        openSheet({ latitude, longitude, label: searchQuery, radius: defaultRadius, active: false }, defaultRadius);
      } else {
        Alert.alert('Not Found', 'Could not find that location.');
      }
    } catch {
      Alert.alert('Error', 'Failed to search for location.');
    }
  }

  // Set alarm (new pin) or save radius (existing pin)
  function handleActivate() {
    if (!selectedPin) return;
    if (selectedPin.existingId) {
      updateDestination(selectedPin.existingId, { radius: tempRadius });
      closeSheet();
    } else {
      addDestination({
        latitude: selectedPin.latitude,
        longitude: selectedPin.longitude,
        label: selectedPin.label,
        radius: tempRadius,
        active: true,
      });
      closeSheet();
    }
  }

  function handleRename() {
    if (!selectedPin) return;
    Alert.prompt(
      'Rename',
      'Enter a new name.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newName?: string) => {
            if (!newName?.trim()) return;
            setSelectedPin({ ...selectedPin, label: newName.trim() });
            if (selectedPin.existingId) {
              updateDestination(selectedPin.existingId, { label: newName.trim() });
            }
          },
        },
      ],
      'plain-text',
      selectedPin.label,
    );
  }

  function handleToggle() {
    if (!selectedPin?.existingId) return;
    toggleDestination(selectedPin.existingId);
    setSelectedPin({ ...selectedPin, active: !selectedPin.active });
  }

  function handleRecenter() {
    Location.getCurrentPositionAsync({}).then(loc => {
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    });
  }

  const isNewPin = selectedPin != null && !selectedPin.existingId;
  const isActive = selectedPin?.active ?? false;

  const translateY = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BOTTOM_SHEET_HEIGHT + 80, 0],
  });

  const sheetScale = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsCompass={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        {/* Saved destinations */}
        {destinations.map(dest => {
          const isSelected = selectedPin?.existingId === dest.id;
          const pinColor = isSelected ? colors.tertiary : dest.active ? colors.primary : colors.textDim;
          return (
            <React.Fragment key={dest.id}>
              <Marker
                coordinate={{ latitude: dest.latitude, longitude: dest.longitude }}
                onPress={() => handleMarkerPress(dest)}
                tracksViewChanges={true}
              >
                <View style={[
                  styles.customPin,
                  {
                    backgroundColor: pinColor,
                    transform: [{ scale: isSelected ? 1.3 : 1 }],
                  },
                ]}>
                  <MaterialIcons name="location-on" size={isSelected ? 20 : 16} color="#fff" />
                </View>
              </Marker>
              {(dest.active || isSelected) && (
                <Circle
                  center={{ latitude: dest.latitude, longitude: dest.longitude }}
                  radius={isSelected ? tempRadius : dest.radius}
                  fillColor={isSelected ? colors.locationMuted : colors.accentMuted}
                  strokeColor={isSelected ? colors.tertiary : colors.primary}
                  strokeWidth={2}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* New pin (from tap or search) */}
        {isNewPin && (
          <>
            <Marker
              coordinate={{ latitude: selectedPin.latitude, longitude: selectedPin.longitude }}
              tracksViewChanges={true}
            >
              <View style={[styles.customPin, { backgroundColor: colors.tertiary, transform: [{ scale: 1.3 }] }]}>
                <MaterialIcons name="location-on" size={20} color="#fff" />
              </View>
            </Marker>
            <Circle
              center={{ latitude: selectedPin.latitude, longitude: selectedPin.longitude }}
              radius={tempRadius}
              fillColor={colors.locationMuted}
              strokeColor={colors.tertiary}
              strokeWidth={2}
            />
          </>
        )}
      </MapView>

      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surfaceHighest + '99',
            top: insets.top + 12,
          },
        ]}
      >
        <MaterialIcons name="search" size={22} color={colors.primary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: fonts.bodyMedium }]}
          placeholder="Search for a destination..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Map Controls */}
      <View style={[styles.mapControls, { bottom: 120 }]}>
        <Pressable
          style={[styles.mapButton, { backgroundColor: colors.surfaceHigh + 'E6', borderColor: colors.outlineVariant + '33' }]}
          onPress={() => {
            mapRef.current?.animateCamera({ heading: 0 }, { duration: 300 });
          }}
        >
          <MaterialIcons name="explore" size={22} color={colors.primary} />
        </Pressable>
        <Pressable
          style={[styles.mapButton, { backgroundColor: colors.surfaceHigh + 'E6', borderColor: colors.outlineVariant + '33' }]}
          onPress={handleRecenter}
        >
          <MaterialIcons name="my-location" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        pointerEvents={sheetVisible ? 'auto' : 'none'}
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.surfaceHigh + 'E6',
            borderColor: colors.outlineVariant + '33',
            transform: [{ translateY }, { scale: sheetScale }],
            paddingBottom: 100 + insets.bottom,
            opacity: bottomSheetAnim,
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <View style={styles.sheetInfo}>
            <Text style={[styles.sheetTag, { color: colors.primary, fontFamily: fonts.bodySemiBold }]}>
              {isNewPin ? 'NEW ALARM' : 'EDIT ALARM'}
            </Text>
            <Pressable onPress={handleRename}>
              <Text
                style={[styles.sheetTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}
                numberOfLines={1}
              >
                {selectedPin?.label || 'Selected Location'}
              </Text>
            </Pressable>
            <Text style={[styles.sheetSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
              {selectedPin
                ? `${selectedPin.latitude.toFixed(4)}, ${selectedPin.longitude.toFixed(4)}`
                : ''}
            </Text>
          </View>
          <Pressable
            style={[styles.sheetIconButton, { backgroundColor: colors.secondaryContainer }]}
            onPress={closeSheet}
          >
            <MaterialIcons name="close" size={20} color={colors.onSecondaryContainer} />
          </Pressable>
        </View>

        {/* Toggle for existing alarms */}
        {selectedPin?.existingId && (
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text, fontFamily: fonts.bodyMedium }]}>
              Alarm {isActive ? 'Active' : 'Off'}
            </Text>
            <Switch
              value={isActive}
              onValueChange={handleToggle}
              trackColor={{ false: colors.secondaryContainer, true: colors.primary }}
              thumbColor={isActive ? colors.onPrimaryContainer : colors.textMuted}
            />
          </View>
        )}

        <Text style={[styles.radiusLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
          Alert Radius: {tempRadius}m
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={100}
          maximumValue={2000}
          step={50}
          value={tempRadius}
          onValueChange={setTempRadius}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.surfaceHighest}
          thumbTintColor={colors.accentLight}
        />

        <Pressable
          style={[
            styles.activateButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleActivate}
        >
          <MaterialIcons
            name={isNewPin ? 'alarm-add' : 'save'}
            size={22}
            color={colors.onPrimary}
          />
          <Text
            style={[
              styles.activateText,
              { color: colors.onPrimary, fontFamily: fonts.headlineBold },
            ]}
          >
            {isNewPin ? 'Set Alarm' : 'Save Radius'}
          </Text>
        </Pressable>

        {selectedPin?.existingId && (
          <Pressable
            style={[styles.viewAlarmsButton, { backgroundColor: colors.surfaceHighest }]}
            onPress={() => {
              const id = selectedPin?.existingId;
              closeSheet();
              router.navigate({ pathname: '/alarms', params: { expandId: id } });
            }}
          >
            <MaterialIcons name="alarm" size={18} color={colors.primary} />
            <Text style={[styles.viewAlarmsText, { color: colors.primary, fontFamily: fonts.bodySemiBold }]}>
              View in Alarms List
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  mapControls: {
    position: 'absolute',
    right: 24,
    gap: 12,
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetInfo: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  sheetTag: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    fontSize: 22,
    flex: 1,
  },
  sheetSub: {
    fontSize: 13,
    marginTop: 2,
  },
  sheetIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 15,
  },
  radiusLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 9999,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  activateText: {
    fontSize: 17,
  },
  viewAlarmsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 9999,
    gap: 8,
    marginTop: 10,
  },
  viewAlarmsText: {
    fontSize: 14,
  },
  customPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
