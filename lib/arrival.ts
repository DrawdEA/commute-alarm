import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';
import { DEFAULT_SOUND_KEY, iosSoundFile } from '../constants/sounds';
import type { Destination } from '../context/AlarmContext';
import {
  alarmKitStatus,
  fireSystemAlarm,
  requestAlarmKitAuthorization,
} from '../modules/loclock-alarm';

export const GEOFENCE_TASK = 'loclock-geofence';
const MAX_REGIONS = 20; // iOS monitors at most 20 regions per app

type ArrivalListener = (dest: Destination) => void;
type DeactivatedListener = (id: string) => void;

const arrivalListeners = new Set<ArrivalListener>();
const deactivatedListeners = new Set<DeactivatedListener>();

/** In-app alarm UI (sound + alert) for arrivals while the app is on screen. */
export function onForegroundArrival(listener: ArrivalListener) {
  arrivalListeners.add(listener);
  return () => {
    arrivalListeners.delete(listener);
  };
}

/** Lets AlarmContext mirror the "fired → switched off" change into React state. */
export function onDestinationDeactivated(listener: DeactivatedListener) {
  deactivatedListeners.add(listener);
  return () => {
    deactivatedListeners.delete(listener);
  };
}

let queue: Promise<void> = Promise.resolve();

/**
 * Single entry point for "user reached a destination", called by both the
 * foreground GPS watcher and the background geofence task. Runs serially and
 * switches the destination off first, so each alarm fires exactly once.
 */
export function handleArrival(id: string): Promise<void> {
  const run = queue.then(() => arrive(id));
  queue = run.catch(() => {});
  return run;
}

async function arrive(id: string) {
  const raw = await AsyncStorage.getItem('destinations');
  const destinations: Destination[] = raw ? JSON.parse(raw) : [];
  const dest = destinations.find(d => d.id === id);
  if (!dest?.active) return;

  const updated = destinations.map(d => (d.id === id ? { ...d, active: false } : d));
  await AsyncStorage.setItem('destinations', JSON.stringify(updated));
  deactivatedListeners.forEach(l => l(id));
  await syncGeofences(updated);

  if (AppState.currentState === 'active' && arrivalListeners.size > 0) {
    arrivalListeners.forEach(l => l(dest));
    return;
  }

  const sound = iosSoundFile((await AsyncStorage.getItem('selectedSound')) ?? DEFAULT_SOUND_KEY);
  const title = `Almost at ${dest.label}`;
  if (await fireSystemAlarm(title, sound)) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: `You're within ${dest.radius}m. Time to get ready.`,
      sound,
      interruptionLevel: 'timeSensitive',
    },
    trigger: null,
  });
}

/** Points iOS region monitoring at the currently active destinations. */
export async function syncGeofences(destinations: Destination[]) {
  try {
    const active = destinations.filter(d => d.active).slice(0, MAX_REGIONS);
    if (active.length === 0) {
      if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK);
      }
      return;
    }
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== 'granted') return;
    await Location.startGeofencingAsync(
      GEOFENCE_TASK,
      active.map(d => ({
        identifier: d.id,
        latitude: d.latitude,
        longitude: d.longitude,
        radius: d.radius,
        notifyOnEnter: true,
        notifyOnExit: false,
      })),
    );
  } catch {
    // Geofencing isn't available in Expo Go; the foreground watcher still works.
  }
}

/** Asks for everything alarms need. Returns whether locked-phone alarms will work. */
export async function requestAlarmPermissions(): Promise<{ foreground: boolean; background: boolean }> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { foreground: false, background: false };

  const bg = await Location.requestBackgroundPermissionsAsync();

  if (alarmKitStatus() === 'notDetermined') await requestAlarmKitAuthorization();
  if (alarmKitStatus() !== 'authorized') await Notifications.requestPermissionsAsync();

  return { foreground: true, background: bg.status === 'granted' };
}

// Must be defined at bundle load (see index.ts) so iOS can relaunch the app
// in the background and deliver geofence events.
TaskManager.defineTask<{ eventType: Location.GeofencingEventType; region: Location.LocationRegion }>(
  GEOFENCE_TASK,
  async ({ data, error }) => {
    if (error || data.eventType !== Location.GeofencingEventType.Enter || !data.region.identifier) return;
    await handleArrival(data.region.identifier);
  },
);
