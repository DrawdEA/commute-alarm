// Defines the background geofence task before anything else loads, so iOS can
// relaunch LoClock in the background and deliver arrival events.
import './lib/arrival';
import 'expo-router/entry';
