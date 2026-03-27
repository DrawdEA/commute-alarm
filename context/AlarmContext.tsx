import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SOUND_KEY } from '../constants/sounds';

export type Destination = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  radius: number;
  active: boolean;
};

type AlarmContextValue = {
  destinations: Destination[];
  addDestination: (d: Omit<Destination, 'id'>) => void;
  removeDestination: (id: string) => void;
  toggleDestination: (id: string) => void;
  updateDestination: (id: string, updates: Partial<Omit<Destination, 'id'>>) => void;
  selectedSound: string;
  setSelectedSound: (key: string) => void;
  alarmVolume: number;
  setAlarmVolume: (v: number) => void;
  defaultRadius: number;
  setDefaultRadius: (r: number) => void;
};

const AlarmContext = createContext<AlarmContextValue>({
  destinations: [],
  addDestination: () => {},
  removeDestination: () => {},
  toggleDestination: () => {},
  updateDestination: () => {},
  selectedSound: DEFAULT_SOUND_KEY,
  setSelectedSound: () => {},
  alarmVolume: 1,
  setAlarmVolume: () => {},
  defaultRadius: 500,
  setDefaultRadius: () => {},
});

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedSound, setSelectedSoundState] = useState(DEFAULT_SOUND_KEY);
  const [alarmVolume, setAlarmVolumeState] = useState(1);
  const [defaultRadius, setDefaultRadiusState] = useState(500);

  useEffect(() => {
    AsyncStorage.getItem('destinations').then(raw => {
      if (raw) setDestinations(JSON.parse(raw));
    });
    AsyncStorage.getItem('selectedSound').then(raw => {
      if (raw) setSelectedSoundState(raw);
    });
    AsyncStorage.getItem('alarmVolume').then(raw => {
      if (raw) setAlarmVolumeState(parseFloat(raw));
    });
    AsyncStorage.getItem('defaultRadius').then(raw => {
      if (raw) setDefaultRadiusState(parseInt(raw, 10));
    });
  }, []);

  function persist(updated: Destination[]) {
    AsyncStorage.setItem('destinations', JSON.stringify(updated));
  }

  function addDestination(d: Omit<Destination, 'id'>) {
    setDestinations(prev => {
      const updated = [...prev, { ...d, id: Date.now().toString() }];
      persist(updated);
      return updated;
    });
  }

  function removeDestination(id: string) {
    setDestinations(prev => {
      const updated = prev.filter(d => d.id !== id);
      persist(updated);
      return updated;
    });
  }

  function toggleDestination(id: string) {
    setDestinations(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, active: !d.active } : d);
      persist(updated);
      return updated;
    });
  }

  function updateDestination(id: string, updates: Partial<Omit<Destination, 'id'>>) {
    setDestinations(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, ...updates } : d);
      persist(updated);
      return updated;
    });
  }

  function setSelectedSound(key: string) {
    setSelectedSoundState(key);
    AsyncStorage.setItem('selectedSound', key);
  }

  function setAlarmVolume(v: number) {
    setAlarmVolumeState(v);
    AsyncStorage.setItem('alarmVolume', v.toString());
  }

  function setDefaultRadius(r: number) {
    setDefaultRadiusState(r);
    AsyncStorage.setItem('defaultRadius', r.toString());
  }

  return (
    <AlarmContext.Provider value={{ destinations, addDestination, removeDestination, toggleDestination, updateDestination, selectedSound, setSelectedSound, alarmVolume, setAlarmVolume, defaultRadius, setDefaultRadius }}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  return useContext(AlarmContext);
}
