import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type Colors } from '../constants/colors';

export type ThemeMode = 'system' | 'dark' | 'light';

export const fonts = {
  headlineBold: 'Manrope_700Bold',
  headlineExtraBold: 'Manrope_800ExtraBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
};

type ThemeContextValue = {
  colors: Colors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  fontsLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  themeMode: 'system',
  setThemeMode: () => {},
  fontsLoaded: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  const [fontsLoaded] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then(val => {
      if (val === 'dark' || val === 'light' || val === 'system') {
        setThemeModeState(val);
      }
    });
  }, []);

  function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
    AsyncStorage.setItem('themeMode', mode);
  }

  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeMode, setThemeMode, fontsLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
