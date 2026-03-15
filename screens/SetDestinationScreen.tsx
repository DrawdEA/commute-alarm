import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, MapPressEvent, LatLng, Region } from 'react-native-maps';
import { useAlarm } from '../context/AlarmContext';

const DEFAULT_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function SetDestinationScreen() {
  const { setDestination, setRadius, saveDestination, radius: savedRadius } = useAlarm();
  const [localRadius, setLocalRadius] = useState(savedRadius);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [pinLabel, setPinLabel] = useState('Custom pin');
  const [placeName, setPlaceName] = useState('');
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function getLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
      setLoadingLocation(false);
    }
    getLocation();
  }, []);

  function handleMapPress(event: MapPressEvent) {
    setPin(event.nativeEvent.coordinate);
    setPinLabel('Custom pin');
    setPlaceName('');
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await Location.geocodeAsync(searchQuery);
    setIsSearching(false);
    if (results.length === 0) {
      Alert.alert('Location not found', 'Try a more specific search.');
      return;
    }
    const { latitude, longitude } = results[0];
    setPin({ latitude, longitude });
    setPinLabel(searchQuery);
    setPlaceName(searchQuery);
    setRegion(r => ({ ...r, latitude, longitude }));
  }

  return (
    <View style={styles.container}>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a place..."
          placeholderTextColor="#8e8e93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {isSearching && <ActivityIndicator style={styles.searchSpinner} color="#007aff" />}
      </View>

      {/* Map */}
      {loadingLocation ? (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#007aff" />
        </View>
      ) : (
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation
          onPress={handleMapPress}
        >
          {pin && <Marker coordinate={pin} />}
        {pin && (
          <Circle
            center={pin}
            radius={localRadius}
            fillColor="rgba(0, 122, 255, 0.1)"
            strokeColor="rgba(0, 122, 255, 0.4)"
            strokeWidth={2}
          />
        )}
        </MapView>
      )}

      {/* Radius slider */}
      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>Alert radius</Text>
        <Slider
          style={styles.slider}
          minimumValue={100}
          maximumValue={2000}
          step={50}
          value={localRadius}
          onValueChange={setLocalRadius}
          minimumTrackTintColor="#007aff"
          maximumTrackTintColor="#c7c7cc"
        />
        <Text style={styles.radiusValue}>{localRadius}m</Text>
      </View>

      {/* Place name input */}
      {pin && (
        <TextInput
          style={styles.nameInput}
          placeholder="Name this place (optional)"
          placeholderTextColor="#8e8e93"
          value={placeName}
          onChangeText={setPlaceName}
        />
      )}

      {/* Confirm button */}
      <TouchableOpacity
        style={[styles.confirmButton, !pin && styles.confirmButtonDisabled]}
        onPress={() => {
          if (pin) {
            const label = placeName.trim() || pinLabel;
            const dest = { id: String(Date.now()), latitude: pin.latitude, longitude: pin.longitude, label };
            setDestination(dest);
            saveDestination(dest);
            setRadius(localRadius);
          }
          router.back();
        }}
        disabled={!pin}
      >
        <Text style={styles.confirmButtonText}>Confirm Destination</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    padding: 16,
    paddingTop: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  searchSpinner: {
    marginLeft: 10,
  },
  map: {
    flex: 1,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  radiusLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007aff',
    textAlign: 'right',
  },
  nameInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#007aff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#a2c4f5',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
