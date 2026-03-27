import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { Alert, Vibration } from 'react-native';
import { useAlarm } from '../context/AlarmContext';
import { getSoundByKey } from '../constants/sounds';

function haversineDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

export default function AlarmMonitor() {
  const { destinations, toggleDestination, selectedSound, alarmVolume } = useAlarm();
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

  const activeDestinations = destinations.filter(d => d.active);

  useEffect(() => {
    if (activeDestinations.length === 0) {
      watcherRef.current?.remove();
      watcherRef.current = null;
      firedRef.current.clear();
      return;
    }

    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for alarms.');
        return;
      }

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
        async loc => {
          for (const dest of activeDestinations) {
            if (firedRef.current.has(dest.id)) continue;
            const dist = haversineDistance(loc.coords, dest);
            if (dist <= dest.radius) {
              firedRef.current.add(dest.id);
              await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
              const alarmSound = getSoundByKey(selectedSound);
              const { sound } = await Audio.Sound.createAsync(
                alarmSound.file,
                { shouldPlay: true, isLooping: true, volume: alarmVolume },
              );
              Vibration.vibrate([500, 500, 500, 500, 500]);
              Alert.alert(
                'You have arrived!',
                `You are within ${dest.radius}m of ${dest.label}.`,
                [{
                  text: 'OK',
                  onPress: () => {
                    sound.unloadAsync();
                    toggleDestination(dest.id);
                    firedRef.current.delete(dest.id);
                  },
                }],
              );
            }
          }
        },
      ).then(sub => {
        watcherRef.current = sub;
      });
    });

    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, [activeDestinations.map(d => d.id).join(',')]);

  return null;
}
