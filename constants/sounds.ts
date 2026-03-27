export type AlarmSound = {
  key: string;
  label: string;
  file: any; // require() returns a number at runtime
};

export const ALARM_SOUNDS: AlarmSound[] = [
  { key: 'Default', label: 'Default', file: require('../assets/alarmsounds/Default.mp3') },
  { key: 'Chiptune', label: 'Chiptune', file: require('../assets/alarmsounds/Chiptune.mp3') },
  { key: 'Dreamscape', label: 'Dreamscape', file: require('../assets/alarmsounds/Dreamscape.mp3') },
  { key: 'Fever Dream', label: 'Fever Dream', file: require('../assets/alarmsounds/Fever Dream.mp3') },
  { key: 'Lo-Fi', label: 'Lo-Fi', file: require('../assets/alarmsounds/Lo-Fi.mp3') },
  { key: 'Morning Joy', label: 'Morning Joy', file: require('../assets/alarmsounds/Morning Joy.mp3') },
  { key: 'Physical', label: 'Physical', file: require('../assets/alarmsounds/Physical.mp3') },
  { key: 'Robotic', label: 'Robotic', file: require('../assets/alarmsounds/Robotic.mp3') },
  { key: 'Rush', label: 'Rush', file: require('../assets/alarmsounds/Rush.mp3') },
  { key: 'Softplucks', label: 'Softplucks', file: require('../assets/alarmsounds/Softplucks.mp3') },
  { key: 'Stardust', label: 'Stardust', file: require('../assets/alarmsounds/Stardust.mp3') },
  { key: 'Synapse', label: 'Synapse', file: require('../assets/alarmsounds/Synapse.mp3') },
];

export const DEFAULT_SOUND_KEY = 'Default';

export function getSoundByKey(key: string): AlarmSound {
  return ALARM_SOUNDS.find(s => s.key === key) ?? ALARM_SOUNDS[0];
}
