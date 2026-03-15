import { router } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Destination, useAlarm } from '../context/AlarmContext';

export default function SavedDestinationsScreen() {
  const { savedDestinations, setDestination, removeDestination } = useAlarm();

  function handleSelect(dest: Destination) {
    setDestination(dest);
    router.back();
  }

  function handleDelete(dest: Destination) {
    Alert.alert(
      'Remove place',
      `Remove "${dest.label}" from saved places?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeDestination(dest.id) },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {savedDestinations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No saved places yet.</Text>
          <Text style={styles.emptySubtext}>Set a destination and it'll appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={savedDestinations}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TouchableOpacity style={styles.rowMain} onPress={() => handleSelect(item)}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowCoords}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/set-destination')}>
        <Text style={styles.addButtonText}>+ Add New Place</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  list: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  rowMain: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowCoords: {
    fontSize: 12,
    color: '#8e8e93',
  },
  deleteBtn: {
    paddingLeft: 12,
  },
  deleteText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
  },
  addButton: {
    margin: 16,
    backgroundColor: '#007aff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
