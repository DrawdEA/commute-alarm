import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AlarmProvider } from '../context/AlarmContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import AlarmMonitor from '../components/AlarmMonitor';

function InnerLayout() {
  const { isDark, fontsLoaded, colors } = useTheme();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AlarmMonitor />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlarmProvider>
        <InnerLayout />
      </AlarmProvider>
    </ThemeProvider>
  );
}
