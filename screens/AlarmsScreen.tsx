import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, LayoutAnimation, Pressable, StyleSheet, Switch, Text, UIManager, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Destination, useAlarm } from '../context/AlarmContext';
import { useTheme, fonts } from '../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AlarmsScreen() {
  const { colors } = useTheme();
  const { destinations, toggleDestination, removeDestination, updateDestination } = useAlarm();
  const insets = useSafeAreaInsets();
  const { expandId } = useLocalSearchParams<{ expandId?: string }>();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expandId) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedId(expandId);
    }
  }, [expandId]);

  useEffect(() => {
    destinations.forEach(async dest => {
      if (addresses[dest.id]) return;
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: dest.latitude,
          longitude: dest.longitude,
        });
        if (results.length > 0) {
          const r = results[0];
          const parts = [r.street, r.city, r.region].filter(Boolean);
          setAddresses(prev => ({ ...prev, [dest.id]: parts.join(', ') || 'Unknown location' }));
        }
      } catch {
        setAddresses(prev => ({ ...prev, [dest.id]: 'Unknown location' }));
      }
    });
  }, [destinations]);

  function handleDelete(dest: Destination) {
    Alert.alert('Remove Alarm', `Remove "${dest.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          if (expandedId === dest.id) setExpandedId(null);
          removeDestination(dest.id);
        },
      },
    ]);
  }

  function handleRename(dest: Destination) {
    Alert.prompt(
      'Rename Alarm',
      'Enter a new name for this alarm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newName?: string) => {
            if (newName?.trim()) {
              updateDestination(dest.id, { label: newName.trim() });
            }
          },
        },
      ],
      'plain-text',
      dest.label,
    );
  }

  function toggleExpand(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => (prev === id ? null : id));
  }

  function renderItem({ item }: { item: Destination }) {
    const isExpanded = expandedId === item.id;
    const address = addresses[item.id];

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isExpanded ? colors.primary + '40' : colors.outlineVariant + '1A',
          },
        ]}
      >
        {/* Compact row: name + location + toggle */}
        <Pressable style={styles.cardRow} onPress={() => toggleExpand(item.id)}>
          <View style={styles.cardInfo}>
            <Text
              style={[styles.cardLabel, { color: colors.text, fontFamily: fonts.headlineBold }]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={13} color={colors.textMuted} />
              <Text
                style={[styles.locationText, { color: colors.textMuted, fontFamily: fonts.body }]}
                numberOfLines={1}
              >
                {address || 'Loading...'}
              </Text>
            </View>
          </View>
          <Switch
            value={item.active}
            onValueChange={() => toggleDestination(item.id)}
            trackColor={{ false: colors.secondaryContainer, true: colors.primary }}
            thumbColor={item.active ? colors.onPrimaryContainer : colors.textMuted}
          />
        </Pressable>

        {/* Expanded detail view */}
        {isExpanded && (
          <View style={[styles.expandedSection, { borderTopColor: colors.outlineVariant + '33' }]}>
            {/* View on map / edit */}
            <Pressable
              style={[styles.viewMapButton, { backgroundColor: colors.surfaceHigh }]}
              onPress={() => router.navigate({ pathname: '/', params: { focusId: item.id, t: Date.now().toString() } })}
            >
              <MaterialIcons name="map" size={18} color={colors.primary} />
              <Text style={[styles.viewMapText, { color: colors.primary, fontFamily: fonts.bodySemiBold }]}>
                View on Map
              </Text>
              <Text style={[styles.radiusBadge, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {item.radius}m radius
              </Text>
            </Pressable>

            {/* Action buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.surfaceHigh }]}
                onPress={() => handleRename(item)}
              >
                <MaterialIcons name="edit" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary, fontFamily: fonts.bodySemiBold }]}>
                  Rename
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.errorContainer + '30' }]}
                onPress={() => handleDelete(item)}
              >
                <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error, fontFamily: fonts.bodySemiBold }]}>
                  Remove
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <MaterialIcons name="account-circle" size={24} color={colors.primary} />
        <Text style={[styles.brandName, { color: colors.primary, fontFamily: fonts.headlineExtraBold }]}>
          LoClock
        </Text>
        <Pressable onPress={() => router.navigate('/')}>
          <MaterialIcons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={destinations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
              My Alarms
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="alarm" size={48} color={colors.textDim} />
            <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: fonts.headlineBold }]}>
              No alarms yet
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textDim, fontFamily: fonts.body }]}>
              Go to the Set Alarm tab to add one
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  brandName: {
    fontSize: 16,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 24,
    gap: 12,
  },
  header: {
    marginBottom: 16,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 30,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardLabel: {
    fontSize: 17,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  viewMapText: {
    fontSize: 13,
    flex: 1,
  },
  radiusBadge: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
  },
  emptyHint: {
    fontSize: 14,
  },
});
