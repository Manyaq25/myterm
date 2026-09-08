import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedSwitch } from '../../src/components/ThemedSwitch';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../../src/services/notifications';
import {
  isScreenshotSuggestionEnabled,
  setScreenshotSuggestionEnabled,
} from '../../src/services/screenshotSuggestion';
import { disableAppLock, enableAppLock, isAppLockEnabled } from '../../src/services/appLock';
import { deleteAllData, exportAllData } from '../../src/services/dataExport';
import {
  getStoredLanguage,
  LANGUAGE_NAMES,
  setAppLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '../../src/i18n';
import { restorePurchases, useSubscription, type SubscriptionStatus } from '../../src/services/subscription';
import { useTheme, fontFamily, fontSize, type ThemeColors } from '../../src/theme';

export default function AyarlarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { t } = useTranslation();
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [screenshotSuggestionsOn, setScreenshotSuggestionsOn] = useState(false);
  const [appLockOn, setAppLockOn] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { status: subscriptionStatus } = useSubscription();
  const [restoring, setRestoring] = useState(false);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportAllData(db);
    } catch (e) {
      Alert.alert(t('common.error'), t('ayarlar.exportError'));
    } finally {
      setExporting(false);
    }
  }

  function handleDeleteAll() {
    if (deleting) return;
    Alert.alert(
      t('ayarlar.deleteAllAlertTitle'),
      t('ayarlar.deleteAllAlertMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('ayarlar.deleteAllConfirm'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAllData(db);
              router.replace('/onboarding');
            } catch (e) {
              Alert.alert(t('common.error'), t('ayarlar.deleteAllError'));
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  async function handleSelectLanguage(language: SupportedLanguage | null) {
    await setAppLanguage(language);
    setSelectedLanguage(language);
    setLanguageModalVisible(false);
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      Alert.alert(
        restored ? t('premium.restoreSuccessTitle') : t('premium.restoreNoneTitle'),
        restored ? t('premium.restoreSuccessMessage') : t('premium.restoreNoneMessage')
      );
    } finally {
      setRestoring(false);
    }
  }

  const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
    free: t('ayarlar.subscriptionFree'),
    trial: t('ayarlar.subscriptionTrial'),
    active: t('ayarlar.subscriptionActive'),
    expired: t('ayarlar.subscriptionExpired'),
  };

  useEffect(() => {
    Notifications.getPermissionsAsync().then((res) => setNotificationsGranted(res.granted));
    isScreenshotSuggestionEnabled().then(setScreenshotSuggestionsOn);
    isAppLockEnabled().then(setAppLockOn);
    getStoredLanguage().then(setSelectedLanguage);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ayarlar.sectionNotifications')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('ayarlar.reminderNotifications')}</Text>
          <ThemedSwitch
            value={notificationsGranted}
            onValueChange={async (value) => {
              if (value) {
                const granted = await ensureNotificationPermission();
                setNotificationsGranted(granted);
              } else {
                setNotificationsGranted(false);
              }
            }}
            accessibilityLabel={t('ayarlar.reminderNotifications')}
          />
        </View>
        <Text style={styles.hint}>{t('ayarlar.notificationsHint')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ayarlar.sectionImageSuggestions')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('ayarlar.screenshotSuggestion')}</Text>
          <ThemedSwitch
            value={screenshotSuggestionsOn}
            onValueChange={async (value) => {
              const result = await setScreenshotSuggestionEnabled(value);
              setScreenshotSuggestionsOn(result);
              if (value && !result) {
                Alert.alert(t('ayarlar.permissionRequiredTitle'), t('ayarlar.permissionRequiredMessage'));
              }
            }}
            accessibilityLabel={t('ayarlar.screenshotSuggestion')}
          />
        </View>
        <Text style={styles.hint}>{t('ayarlar.screenshotHint')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ayarlar.sectionLanguage')}</Text>
        <Pressable
          style={styles.row}
          onPress={() => setLanguageModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('ayarlar.sectionLanguage')}
        >
          <Text style={styles.rowLabel}>{t('ayarlar.sectionLanguage')}</Text>
          <Text style={styles.languageValue}>
            {selectedLanguage ? LANGUAGE_NAMES[selectedLanguage] : t('ayarlar.languageSystemDefault')} ›
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ayarlar.sectionSubscription')}</Text>
        <Pressable
          style={styles.row}
          onPress={() => router.push('/premium')}
          accessibilityRole="button"
          accessibilityLabel={t('ayarlar.sectionSubscription')}
        >
          <Text style={styles.rowLabel}>{t('ayarlar.subscriptionPlan')}</Text>
          <Text style={styles.languageValue}>{subscriptionStatusLabel[subscriptionStatus]} ›</Text>
        </Pressable>
        <Pressable
          style={styles.dataButton}
          onPress={handleRestore}
          disabled={restoring}
          accessibilityRole="button"
          accessibilityLabel={t('premium.restoreButton')}
          accessibilityState={{ disabled: restoring, busy: restoring }}
        >
          {restoring ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.dataButtonText}>{t('premium.restoreButton')}</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ayarlar.sectionData')}</Text>
        <Pressable
          style={styles.dataButton}
          onPress={handleExport}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel={t('ayarlar.exportButton')}
          accessibilityState={{ disabled: exporting, busy: exporting }}
        >
          {exporting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.dataButtonText}>{t('ayarlar.exportButton')}</Text>
          )}
        </Pressable>
        <Text style={styles.hint}>{t('ayarlar.exportHint')}</Text>

        <Pressable
          style={[styles.dataButton, styles.dangerButton]}
          onPress={handleDeleteAll}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel={t('ayarlar.deleteAllButton')}
          accessibilityState={{ disabled: deleting, busy: deleting }}
        >
          {deleting ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={[styles.dataButtonText, styles.dangerButtonText]}>{t('ayarlar.deleteAllButton')}</Text>
          )}
        </Pressable>
        <Text style={styles.hint}>{t('ayarlar.deleteAllHint')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ayarlar.sectionSecurity')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('ayarlar.appLock')}</Text>
          <ThemedSwitch
            value={appLockOn}
            onValueChange={async (value) => {
              if (value) {
                const result = await enableAppLock();
                setAppLockOn(result);
                if (!result) {
                  Alert.alert(t('ayarlar.appLockFailedTitle'), t('ayarlar.appLockFailedMessage'));
                }
              } else {
                await disableAppLock();
                setAppLockOn(false);
              }
            }}
            accessibilityLabel={t('ayarlar.appLock')}
          />
        </View>
        <Text style={styles.hint}>{t('ayarlar.appLockHint')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('ayarlar.sectionAbout')}</Text>
        <Text style={styles.aboutText}>{t('ayarlar.aboutText')}</Text>

        <Text style={styles.aboutLabel}>{t('ayarlar.privacyLabel')}</Text>
        <Text style={styles.aboutText}>{t('ayarlar.privacyText')}</Text>

        <Text style={styles.aboutLabel}>{t('ayarlar.aiProvidersLabel')}</Text>
        <Text style={styles.aboutText}>{t('ayarlar.aiProvidersText')}</Text>

        <Text style={styles.aboutVersion}>{t('ayarlar.version')}</Text>
      </View>
      </ScrollView>

      <Modal visible={languageModalVisible} transparent animationType="fade" onRequestClose={() => setLanguageModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Pressable
                style={styles.languageOption}
                onPress={() => handleSelectLanguage(null)}
                accessibilityRole="button"
                accessibilityLabel={t('ayarlar.languageSystemDefault')}
              >
                <Text style={[styles.languageOptionText, selectedLanguage === null && styles.languageOptionTextActive]}>
                  {t('ayarlar.languageSystemDefault')}
                </Text>
              </Pressable>
              {SUPPORTED_LANGUAGES.map((language) => (
                <Pressable
                  key={language}
                  style={styles.languageOption}
                  onPress={() => handleSelectLanguage(language)}
                  accessibilityRole="button"
                  accessibilityLabel={LANGUAGE_NAMES[language]}
                >
                  <Text
                    style={[styles.languageOptionText, selectedLanguage === language && styles.languageOptionTextActive]}
                  >
                    {LANGUAGE_NAMES[language]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      shadowColor: colors.text,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    sectionTitle: {
      fontSize: fontSize.caption,
      fontFamily: fontFamily.bodyBold,
      color: colors.textMuted,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.text },
    languageValue: { fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.textMuted },
    hint: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, marginTop: 8, lineHeight: 18 },
    dataButton: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    dataButtonText: { color: colors.primary, fontSize: fontSize.small, fontFamily: fontFamily.bodyBold },
    dangerButton: { backgroundColor: colors.surfaceAlt },
    dangerButtonText: { color: colors.danger },
    aboutText: { fontSize: fontSize.small, fontFamily: fontFamily.body, color: colors.textMuted, lineHeight: 19, marginBottom: 12 },
    aboutLabel: { fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold, color: colors.text, marginBottom: 4 },
    aboutVersion: { fontSize: fontSize.caption, fontFamily: fontFamily.body, color: colors.textMuted, marginTop: 4 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxHeight: '70%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 8,
    },
    languageOption: { paddingVertical: 14, paddingHorizontal: 20 },
    languageOptionText: { fontSize: fontSize.base, fontFamily: fontFamily.body, color: colors.text },
    languageOptionTextActive: { fontFamily: fontFamily.bodyBold, color: colors.primary },
  });
}
