// Ayarlar: abonelik (iki dokunuşta iptal), dil, veri silme, değerlendirme.
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { LANGUAGES, lang, langInfo, saveLanguage, t, type LangCode } from '@/i18n';
import { config } from '@/lib/config';
import { isPro, managementUrl, restore } from '@/lib/purchases';
import { disableReminder, enableReminder, reminderOn } from '@/lib/reminder';
import { deleteAllAnalyses, deleteCoachHistory } from '@/lib/store';
import { colors, fonts, space, type } from '@/theme';

function Row({ title, subtitle, onPress, danger }: { title: string; subtitle?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card>
        <Text style={[type.title, { color: danger ? colors.primary : colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[type.bodySm, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </Card>
    </Pressable>
  );
}

export default function Ayarlar() {
  const [pro, setPro] = useState<boolean | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [reminder, setReminder] = useState(reminderOn);

  const toggleReminder = async () => {
    if (reminder) {
      await disableReminder();
      setReminder(false);
      return;
    }
    const ok = await enableReminder().catch(() => false);
    setReminder(ok);
    if (!ok) Alert.alert(t('settings.reminder.deniedTitle'), t('settings.reminder.deniedText'));
  };

  useFocusEffect(
    useCallback(() => {
      isPro().then(setPro);
    }, []),
  );

  const manage = async () => Linking.openURL(await managementUrl());

  const restorePurchases = async () => {
    try {
      const ok = await restore();
      setPro(ok);
      Alert.alert(
        t(ok ? 'settings.restore.okTitle' : 'settings.restore.noneTitle'),
        t(ok ? 'settings.restore.okText' : 'settings.restore.noneText'),
      );
    } catch {
      Alert.alert(t('settings.restore.failTitle'), t('settings.restore.failText'));
    }
  };

  // Dili kaydedip uygulamayı yeniden başlatır; olmazsa elle açmasını ister.
  const chooseLanguage = async (code: LangCode) => {
    setLangOpen(false);
    if (code === lang()) return;
    saveLanguage(code);
    try {
      await Updates.reloadAsync();
    } catch {
      Alert.alert(t('settings.language.reloadFailTitle'), t('settings.language.reloadFailText'));
    }
  };

  const confirmDelete = () =>
    Alert.alert(t('settings.deleteAll.confirmTitle'), t('settings.deleteAll.confirmText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteAllAnalyses() },
    ]);

  const confirmDeleteCoach = () =>
    Alert.alert(t('settings.deleteCoach.confirmTitle'), t('settings.deleteCoach.confirmText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCoachHistory() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings.title')}</Text>

        <Text style={styles.section}>{t('settings.sections.subscription')}</Text>
        {pro ? (
          <Row title={t('settings.manage.title')} subtitle={t('settings.manage.subtitle')} onPress={manage} />
        ) : (
          <Row title={t('settings.goPro.title')} subtitle={t('settings.goPro.subtitle')} onPress={() => router.push('/pro')} />
        )}
        <Row title={t('settings.restore.title')} subtitle={t('settings.restore.subtitle')} onPress={restorePurchases} />

        <Text style={styles.section}>{t('settings.sections.language')}</Text>
        <Row title={t('settings.language.title')} subtitle={langInfo().name} onPress={() => setLangOpen((o) => !o)} />
        {langOpen ? (
          <Card style={styles.langList}>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.code}
                accessibilityRole="button"
                accessibilityState={{ selected: l.code === lang() }}
                onPress={() => chooseLanguage(l.code)}
                style={({ pressed }) => [styles.langItem, pressed && { backgroundColor: colors.surfaceMid }]}>
                <Text style={[type.body, { color: l.code === lang() ? colors.primary : colors.text }]}>{l.name}</Text>
                {l.code === lang() ? <Text style={[type.body, { color: colors.primary }]}>✓</Text> : null}
              </Pressable>
            ))}
          </Card>
        ) : null}

        <Text style={styles.section}>{t('settings.notificationsSection')}</Text>
        <Row
          title={`${reminder ? '🔔' : '🔕'} ${t('settings.reminder.title')}`}
          subtitle={t(reminder ? 'settings.reminder.on' : 'settings.reminder.off')}
          onPress={toggleReminder}
        />

        <Text style={styles.section}>{t('settings.sections.data')}</Text>
        <Row title={t('settings.deleteCoach.title')} subtitle={t('settings.deleteCoach.subtitle')} onPress={confirmDeleteCoach} danger />
        <Row title={t('settings.deleteAll.title')} subtitle={t('settings.deleteAll.subtitle')} onPress={confirmDelete} danger />
        <Card>
          <Text style={[type.bodySm, { color: colors.textMuted }]}>{t('settings.privacyNote')}</Text>
        </Card>

        <Text style={styles.section}>{t('settings.sections.other')}</Text>
        <Card>
          <Text style={[type.title, { color: colors.text }]}>{t('settings.rate')}</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>⭐⭐⭐⭐⭐  – –</Text>
        </Card>
        {config.privacyUrl ? <Row title={t('settings.privacy')} onPress={() => WebBrowser.openBrowserAsync(config.privacyUrl)} /> : null}
        <Row title={t('settings.terms')} onPress={() => WebBrowser.openBrowserAsync(config.termsUrl)} />

        <View style={{ alignItems: 'center', marginTop: space.lg }}>
          <Text style={[type.caption, { color: colors.textMuted }]}>Unwrap {Constants.expoConfig?.version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  langList: { paddingVertical: space.sm, paddingHorizontal: space.sm },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: space.sm, borderRadius: 12 },
  section: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1, color: colors.primary, marginTop: space.md },
});
