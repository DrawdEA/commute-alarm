import { Stack } from 'expo-router';
import { AlarmProvider } from '../context/AlarmContext';

export default function RootLayout() {
  return (
    <AlarmProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Commute Alarm' }} />
        <Stack.Screen name="set-destination" options={{ title: 'Set Destination' }} />
        <Stack.Screen name="saved-destinations" options={{ title: 'Saved Places' }} />
      </Stack>
    </AlarmProvider>
  );
}
