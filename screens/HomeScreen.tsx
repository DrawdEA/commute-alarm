import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useAlarm } from '../context/AlarmContext';

function haversineDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = sinDLat * sinDLat + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

export default function HomeScreen() {
  const { destination, radius } = useAlarm();
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const firedRef = useRef(false);
  const destinationLabel = destination ? destination.label : 'No destination set';

  useEffect(() => {
    if (alarmEnabled && destination) {
      Location.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required.');
          setAlarmEnabled(false);
          return;
        }
        Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
          async (loc) => {
            const dist = haversineDistance(loc.coords, destination);
            if (dist <= radius && !firedRef.current) {
              firedRef.current = true;
              // Play sound (routes to headphones if connected, speaker if not)
              await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
              const { sound } = await Audio.Sound.createAsync(
                require('../assets/alarm.mp3'),
                { shouldPlay: true, isLooping: true }
              );
              // Vibrate as well
              Vibration.vibrate([500, 500, 500, 500, 500]);
              Alert.alert(
                'You have arrived!',
                `You are within ${radius}m of ${destination.label}.`,
                [{ text: 'OK', onPress: () => sound.unloadAsync() }]
              );
              setAlarmEnabled(false);
            }
          }
        ).then(sub => { watcherRef.current = sub; });
      });
    } else {
      watcherRef.current?.remove();
      watcherRef.current = null;
      firedRef.current = false;
    }

    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, [alarmEnabled, destination, radius]);

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Commute Alarm</Text>

      {/* Destination card */}
      <View style={styles.card}>
        <Text style={styles.label}>Destination</Text>
        <Text style={styles.destinationText}>{destinationLabel}</Text>
        <Text style={styles.radiusText}>Alert radius: {radius}m</Text>
      </View>

      {/* Alarm toggle */}
      <TouchableOpacity
        style={[styles.toggleButton, alarmEnabled ? styles.toggleOn : styles.toggleOff]}
        onPress={() => {
          if (!destination) {
            Alert.alert('No destination set', 'Set a destination first.');
            return;
          }
          setAlarmEnabled(e => !e);
        }}
      >
        <Text style={styles.toggleText}>
          {alarmEnabled ? 'Alarm ON' : 'Alarm OFF'}
        </Text>
      </TouchableOpacity>

      {/* Navigate to Set Destination */}
      <TouchableOpacity style={styles.setButton} onPress={() => router.push('/set-destination')}>
        <Text style={styles.setButtonText}>Set Destination</Text>
      </TouchableOpacity>

      {/* Saved places */}
      <TouchableOpacity style={styles.savedButton} onPress={() => router.push('/saved-destinations')}>
        <Text style={styles.savedButtonText}>Saved Places</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  destinationText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  radiusText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  toggleButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleOn: {
    backgroundColor: '#34c759',
  },
  toggleOff: {
    backgroundColor: '#ff3b30',
  },
  toggleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  setButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#007aff',
    marginBottom: 12,
  },
  setButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  savedButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  savedButtonText: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '600',
  },
});
