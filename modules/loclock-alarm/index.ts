import { requireOptionalNativeModule } from 'expo';

type AlarmKitStatus = 'authorized' | 'denied' | 'notDetermined' | 'unavailable';

type LoclockAlarmNative = {
  isAvailable(): boolean;
  getAuthorizationStatus(): AlarmKitStatus;
  requestAuthorization(): Promise<AlarmKitStatus>;
  fireNow(title: string, soundFile: string | null): Promise<boolean>;
};

// Null in Expo Go, on Android, and on any build without the native module.
const native = requireOptionalNativeModule<LoclockAlarmNative>('LoclockAlarm');

export function alarmKitStatus(): AlarmKitStatus {
  return native?.isAvailable() ? native.getAuthorizationStatus() : 'unavailable';
}

export async function requestAlarmKitAuthorization(): Promise<AlarmKitStatus> {
  return native?.isAvailable() ? native.requestAuthorization() : 'unavailable';
}

/** Rings a real system alarm (iOS 26+). Resolves false if AlarmKit can't be used. */
export async function fireSystemAlarm(title: string, soundFile: string | null): Promise<boolean> {
  if (!native?.isAvailable()) return false;
  try {
    return await native.fireNow(title, soundFile);
  } catch {
    return false;
  }
}
