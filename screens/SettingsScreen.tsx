import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { useRef, useState, useCallback } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlarm } from '../context/AlarmContext';
import { useTheme, fonts, type ThemeMode } from '../context/ThemeContext';
import { ALARM_SOUNDS, getSoundByKey } from '../constants/sounds';

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const { selectedSound, setSelectedSound, alarmVolume, setAlarmVolume, defaultRadius, setDefaultRadius } = useAlarm();
  const insets = useSafeAreaInsets();
  const [soundPickerVisible, setSoundPickerVisible] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const previewRef = useRef<Audio.Sound | null>(null);

  async function stopPreview() {
    if (previewRef.current) {
      await previewRef.current.unloadAsync();
      previewRef.current = null;
    }
    setPlayingKey(null);
  }

  async function previewSound(key: string) {
    // If tapping the same sound that's playing, stop it
    if (playingKey === key) {
      await stopPreview();
      return;
    }
    await stopPreview();
    const alarmSound = getSoundByKey(key);
    const { sound } = await Audio.Sound.createAsync(alarmSound.file, {
      shouldPlay: true,
      isLooping: true,
      volume: alarmVolume,
    });
    previewRef.current = sound;
    setPlayingKey(key);
  }

  async function selectSound(key: string) {
    setSelectedSound(key);
    await stopPreview();
    setSoundPickerVisible(false);
  }

  async function closePicker() {
    await stopPreview();
    setSoundPickerVisible(false);
  }

  function SettingRow({
    icon,
    label,
    subtitle,
    onPress,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    subtitle: string;
    onPress?: () => void;
  }) {
    return (
      <Pressable
        style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '1A' }]}
        onPress={onPress}
      >
        <View style={[styles.settingIcon, { backgroundColor: colors.surfaceHighest }]}>
          <MaterialIcons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: colors.text, fontFamily: fonts.headlineBold }]}>
            {label}
          </Text>
          <Text style={[styles.settingSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {subtitle}
          </Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={14} color={colors.textDim} />
      </Pressable>
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
        <MaterialIcons name="add" size={24} color={colors.primary} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.primary, fontFamily: fonts.headlineBold }]}>
            Settings
          </Text>
          <Text style={[styles.headerSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Configure your navigation experience and preferences.
          </Text>
        </View>

        {/* Alerts Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '1A' }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="notifications-active" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
              Alerts
            </Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.alertRow}>
              <Text style={[styles.alertLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                Default Radius
              </Text>
              <Text style={[styles.alertValue, { color: colors.primary, fontFamily: fonts.headlineBold }]}>
                {defaultRadius}m
              </Text>
            </View>
            <Slider
              style={styles.radiusSlider}
              minimumValue={100}
              maximumValue={2000}
              step={50}
              value={defaultRadius}
              onSlidingComplete={setDefaultRadius}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.surfaceHighest}
              thumbTintColor={colors.primary}
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '1A' }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="palette" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
              Appearance
            </Text>
          </View>
          <View style={styles.themeGrid}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => {
              const isSelected = themeMode === mode;
              const icon = mode === 'light' ? 'light-mode' : mode === 'dark' ? 'dark-mode' : 'brightness-auto';
              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected ? colors.surfaceHighest : colors.surfaceHigh,
                      borderColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setThemeMode(mode)}
                >
                  <MaterialIcons
                    name={icon}
                    size={22}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: isSelected ? colors.text : colors.textMuted,
                        fontFamily: fonts.bodyMedium,
                      },
                    ]}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Additional Settings */}
        <View style={styles.settingsList}>
          <SettingRow
            icon="volume-up"
            label="Alarm Sound & Volume"
            subtitle={`Selected: ${getSoundByKey(selectedSound).label}`}
            onPress={() => setSoundPickerVisible(true)}
          />
          <SettingRow
            icon="help-center"
            label="Support & Help"
            subtitle="FAQs, Guides, and Contact"
            onPress={() => setSupportVisible(true)}
          />
          <SettingRow
            icon="policy"
            label="Privacy & Data"
            subtitle="Location permissions and logs"
            onPress={() => setPrivacyVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Sound Picker Modal */}
      <Modal
        visible={soundPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHandle}>
                <View style={[styles.handleBar, { backgroundColor: colors.outlineVariant }]} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                Alarm Sound
              </Text>

              {/* Volume Slider */}
              <View style={styles.volumeRow}>
                <MaterialIcons
                  name={alarmVolume === 0 ? 'volume-off' : alarmVolume < 0.5 ? 'volume-down' : 'volume-up'}
                  size={20}
                  color={colors.textMuted}
                />
                <Slider
                  style={styles.volumeSlider}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.05}
                  value={alarmVolume}
                  onSlidingComplete={(v) => {
                    setAlarmVolume(v);
                    if (previewRef.current) {
                      previewRef.current.setVolumeAsync(v);
                    }
                  }}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.surfaceHighest}
                  thumbTintColor={colors.primary}
                />
                <Text style={[styles.volumeLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  {Math.round(alarmVolume * 100)}%
                </Text>
              </View>

              <ScrollView style={styles.soundList} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {ALARM_SOUNDS.map(s => {
                  const isSelected = s.key === selectedSound;
                  const isPlaying = s.key === playingKey;
                  return (
                    <Pressable
                      key={s.key}
                      style={[
                        styles.soundRow,
                        {
                          backgroundColor: isSelected ? colors.primaryContainer : 'transparent',
                          borderColor: isPlaying ? colors.primary : isSelected ? colors.primary : colors.outlineVariant + '33',
                        },
                      ]}
                      onPress={() => selectSound(s.key)}
                    >
                      <MaterialIcons
                        name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={22}
                        color={isSelected ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.soundLabel,
                          {
                            color: isSelected ? colors.text : colors.textMuted,
                            fontFamily: isSelected ? fonts.headlineBold : fonts.body,
                          },
                        ]}
                      >
                        {s.label}
                      </Text>
                      {isPlaying && (
                        <MaterialIcons name="graphic-eq" size={20} color={colors.primary} />
                      )}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          previewSound(s.key);
                        }}
                        hitSlop={8}
                      >
                        <MaterialIcons
                          name={isPlaying ? 'stop-circle' : 'play-circle-outline'}
                          size={24}
                          color={colors.primary}
                        />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Support & Help Modal */}
      <Modal
        visible={supportVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSupportVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSupportVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle}>
              <View style={[styles.handleBar, { backgroundColor: colors.outlineVariant }]} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
              Support & Help
            </Text>
            <ScrollView style={styles.infoList} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.faqHeading, { color: colors.primary, fontFamily: fonts.headlineBold }]}>
                Frequently Asked Questions
              </Text>

              <View style={[styles.faqItem, { borderColor: colors.outlineVariant + '33' }]}>
                <Text style={[styles.faqQuestion, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                  How does the alarm work?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  LoClock uses your phone's GPS to track your location in real-time. When you enter the radius you set around a destination, the alarm triggers with your chosen sound and vibration.
                </Text>
              </View>

              <View style={[styles.faqItem, { borderColor: colors.outlineVariant + '33' }]}>
                <Text style={[styles.faqQuestion, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                  Does it work in the background?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Currently, alarms only work while the app is open and in the foreground. Background location monitoring is a planned feature for a future update.
                </Text>
              </View>

              <View style={[styles.faqItem, { borderColor: colors.outlineVariant + '33' }]}>
                <Text style={[styles.faqQuestion, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                  How accurate is the location?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Location accuracy depends on your device's GPS and environment. In open areas, accuracy is typically within 10-20 meters. Indoors or in dense urban areas, it may be less precise.
                </Text>
              </View>

              <View style={[styles.faqItem, { borderColor: colors.outlineVariant + '33' }]}>
                <Text style={[styles.faqQuestion, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                  Can I set multiple alarms?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Yes! You can set as many destination alarms as you like. Each one can have its own radius and can be individually toggled on or off.
                </Text>
              </View>

              <View style={[styles.faqItem, { borderColor: colors.outlineVariant + '33' }]}>
                <Text style={[styles.faqQuestion, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                  Why isn't my alarm going off?
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Make sure the alarm is toggled on (switch is active), your location permission is granted, and the app is open. Also check that your alarm volume isn't set to 0% in the sound settings.
                </Text>
              </View>

              <Text style={[styles.faqHeading, { color: colors.primary, fontFamily: fonts.headlineBold, marginTop: 12 }]}>
                Contact
              </Text>
              <Text style={[styles.faqAnswer, { color: colors.textMuted, fontFamily: fonts.body, paddingHorizontal: 16, paddingBottom: 8 }]}>
                Have a question or found a bug? Reach out and we'll get back to you as soon as possible.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Privacy & Data Modal */}
      <Modal
        visible={privacyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPrivacyVisible(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle}>
              <View style={[styles.handleBar, { backgroundColor: colors.outlineVariant }]} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
              Privacy & Data
            </Text>
            <ScrollView style={styles.infoList} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.privacySection, { borderColor: colors.outlineVariant + '33' }]}>
                <View style={styles.privacyHeader}>
                  <MaterialIcons name="location-on" size={20} color={colors.primary} />
                  <Text style={[styles.privacySectionTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                    Location Data
                  </Text>
                </View>
                <Text style={[styles.privacyText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  LoClock uses your device's GPS to determine your position and trigger proximity alarms. Your location data is processed entirely on-device and is never sent to any server or third party.
                </Text>
              </View>

              <View style={[styles.privacySection, { borderColor: colors.outlineVariant + '33' }]}>
                <View style={styles.privacyHeader}>
                  <MaterialIcons name="storage" size={20} color={colors.primary} />
                  <Text style={[styles.privacySectionTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                    Local Storage
                  </Text>
                </View>
                <Text style={[styles.privacyText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  Your alarms, settings, and preferences are stored locally on your device using AsyncStorage. No data is uploaded to the cloud. Uninstalling the app will delete all stored data.
                </Text>
              </View>

              <View style={[styles.privacySection, { borderColor: colors.outlineVariant + '33' }]}>
                <View style={styles.privacyHeader}>
                  <MaterialIcons name="wifi-off" size={20} color={colors.primary} />
                  <Text style={[styles.privacySectionTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                    No Network Requests
                  </Text>
                </View>
                <Text style={[styles.privacyText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  LoClock works completely offline. The app does not make any network requests, track analytics, or collect any usage data. Geocoding is handled by your device's built-in services.
                </Text>
              </View>

              <View style={[styles.privacySection, { borderColor: colors.outlineVariant + '33' }]}>
                <View style={styles.privacyHeader}>
                  <MaterialIcons name="security" size={20} color={colors.primary} />
                  <Text style={[styles.privacySectionTitle, { color: colors.text, fontFamily: fonts.headlineBold }]}>
                    Permissions
                  </Text>
                </View>
                <Text style={[styles.privacyText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                  The only permission LoClock requires is foreground location access, used solely to monitor your proximity to saved destinations. You can revoke this at any time in your device settings.
                </Text>
                <Pressable
                  style={[styles.permissionButton, { backgroundColor: colors.surfaceHighest }]}
                  onPress={() => Linking.openSettings()}
                >
                  <MaterialIcons name="settings" size={16} color={colors.primary} />
                  <Text style={[styles.permissionButtonText, { color: colors.primary, fontFamily: fonts.bodySemiBold }]}>
                    Open Device Settings
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  scroll: {
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 30,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
  },
  cardBody: {
    gap: 16,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLabel: {
    fontSize: 14,
  },
  alertValue: {
    fontSize: 16,
  },
  radiusSlider: {
    width: '100%',
    height: 40,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginLeft: -8,
  },
  switchTrack: {
    width: 48,
    height: 24,
    borderRadius: 12,
    position: 'relative',
  },
  switchThumb: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  switchThumbOn: {
    right: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  themeLabel: {
    fontSize: 12,
  },
  settingsList: {
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 18,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  soundList: {
    paddingHorizontal: 16,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  soundLabel: {
    flex: 1,
    fontSize: 15,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  volumeLabel: {
    fontSize: 13,
    width: 38,
    textAlign: 'right',
  },
  infoList: {
    paddingHorizontal: 16,
  },
  faqHeading: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  faqQuestion: {
    fontSize: 14,
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
  },
  privacySection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  privacySectionTitle: {
    fontSize: 15,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  permissionButtonText: {
    fontSize: 13,
  },
});
