import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

export type Destination = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
};

type AlarmContextValue = {
  destination: Destination | null;
  radius: number;
  savedDestinations: Destination[];
  setDestination: (d: Destination | null) => void;
  setRadius: (r: number) => void;
  saveDestination: (d: Destination) => void;
  removeDestination: (id: string) => void;
};

const AlarmContext = createContext<AlarmContextValue>({
  destination: null,
  radius: 500,
  savedDestinations: [],
  setDestination: () => {},
  setRadius: () => {},
  saveDestination: () => {},
  removeDestination: () => {},
});

export function AlarmProvider({ children }: { children: React.ReactNode }) {
  const [destination, setDestinationState] = useState<Destination | null>(null);
  const [radius, setRadiusState] = useState(500);
  const [savedDestinations, setSavedDestinationsState] = useState<Destination[]>([]);

  useEffect(() => {
    async function load() {
      const [destRaw, radiusRaw, savedRaw] = await AsyncStorage.multiGet(['destination', 'radius', 'savedDestinations']);
      if (destRaw[1]) setDestinationState(JSON.parse(destRaw[1]));
      if (radiusRaw[1]) setRadiusState(Number(radiusRaw[1]));
      if (savedRaw[1]) setSavedDestinationsState(JSON.parse(savedRaw[1]));
    }
    load();
  }, []);

  function setDestination(d: Destination | null) {
    setDestinationState(d);
    if (d) AsyncStorage.setItem('destination', JSON.stringify(d));
    else AsyncStorage.removeItem('destination');
  }

  function setRadius(r: number) {
    setRadiusState(r);
    AsyncStorage.setItem('radius', String(r));
  }

  function saveDestination(d: Destination) {
    setSavedDestinationsState(prev => {
      const updated = [...prev.filter(s => s.id !== d.id), d];
      AsyncStorage.setItem('savedDestinations', JSON.stringify(updated));
      return updated;
    });
  }

  function removeDestination(id: string) {
    setSavedDestinationsState(prev => {
      const updated = prev.filter(s => s.id !== id);
      AsyncStorage.setItem('savedDestinations', JSON.stringify(updated));
      return updated;
    });
  }

  return (
    <AlarmContext.Provider value={{ destination, radius, savedDestinations, setDestination, setRadius, saveDestination, removeDestination }}>
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm() {
  return useContext(AlarmContext);
}
