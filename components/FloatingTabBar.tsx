import { MaterialIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, fonts } from '../context/ThemeContext';

const TAB_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  alarms: 'alarm',
  index: 'map',
  settings: 'settings',
};

const TAB_LABELS: Record<string, string> = {
  alarms: 'Alarms',
  index: 'Set Alarm',
  settings: 'Settings',
};

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, { backgroundColor: colors.surfaceHigh + 'E6', borderColor: colors.outlineVariant + '1A' }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const icon = TAB_ICONS[route.name] || 'circle';
          const label = TAB_LABELS[route.name] || route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[
                styles.tab,
                isFocused && styles.tabActive,
              ]}
            >
              <MaterialIcons
                name={icon}
                size={24}
                color={isFocused ? colors.primary : colors.textDim}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.textDim,
                    fontFamily: fonts.bodyMedium,
                  },
                ]}
              >
                {label}
              </Text>
              {isFocused && (
                <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
    paddingVertical: 4,
  },
  tabActive: {
    transform: [{ scale: 1.08 }],
  },
  tabLabel: {
    fontSize: 11,
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
