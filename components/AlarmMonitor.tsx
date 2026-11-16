import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { Alert, Linking, Vibration } from 'react-native';
import { getSoundByKey } from '../constants/sounds';
import { useAlarm } from '../context/AlarmContext';
import {
  handleArrival,
  onForegroundArrival,
  requestAlarmPermissions,
  syncGeofences,
} from '../lib/arrival';

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

let warnedForegroundOnly = false;

/**
 * Headless. Two paths into handleArrival():
 * - background: iOS geofences (lib/arrival.ts) ring an AlarmKit alarm or notification
 * - foreground: precise GPS watcher here, plus the in-app looping sound + alert
 */
export default function AlarmMonitor() {
  const { destinations, selectedSound, alarmVolume } = useAlarm();
  const activeDestinations = destinations.filter(d => d.active);
  const activeKey = activeDestinations
    .map(d => `${d.id}:${d.latitude}:${d.longitude}:${d.radius}`)
    .join(',');

  const latest = useRef({ activeDestinations, selectedSound, alarmVolume });
  latest.current = { activeDestinations, selectedSound, alarmVolume };

  useEffect(
    () =>
      onForegroundArrival(async dest => {
        const { selectedSound, alarmVolume } = latest.current;
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(getSoundByKey(selectedSound).file, {
          shouldPlay: true,
          isLooping: true,
          volume: alarmVolume,
        });
        Vibration.vibrate([500, 500, 500, 500, 500]);
        Alert.alert('You have arrived!', `You are within ${dest.radius}m of ${dest.label}.`, [
          { text: 'OK', onPress: () => sound.unloadAsync() },
        ]);
      }),
    [],
  );

  useEffect(() => {
    if (!activeKey) {
      syncGeofences([]);
      return;
    }

    let cancelled = false;
    let watcher: Location.LocationSubscription | null = null;

    (async () => {
      const { foreground, background } = await requestAlarmPermissions();
      if (cancelled) return;

      if (!foreground) {
        Alert.alert('Location needed', 'LoClock needs your location to know when you arrive.');
        return;
      }
      if (!background && !warnedForegroundOnly) {
        warnedForegroundOnly = true;
        Alert.alert(
          'Alarms only work with LoClock open',
          'To get woken up with your phone locked, set Location to "Always" in Settings.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }

      await syncGeofences(latest.current.activeDestinations);

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 },
        loc => {
          for (const dest of latest.current.activeDestinations) {
            if (haversineDistance(loc.coords, dest) <= dest.radius) handleArrival(dest.id);
          }
        },
      );
      if (cancelled) sub.remove();
      else watcher = sub;
    })();

    return () => {
      cancelled = true;
      watcher?.remove();
    };
  }, [activeKey]);

  return null;
}
