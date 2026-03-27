import { Tabs } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import FloatingTabBar from '../../components/FloatingTabBar';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="alarms" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
