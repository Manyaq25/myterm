import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { getFollowUp } from '../../src/db/queries';
import type { FollowUpWithPerson } from '../../src/types';
import { formatDueDate, isOverdue } from '../../src/utils/date';
import { completeFollowUp, removeFollowUp } from '../../src/services/followUpActions';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { TypeBadge } from '../../src/components/TypeBadge';
import { getCardSurface } from '../../src/constants/cardStyle';
import { useTheme, fontFamily, fontSize, letterSpacing, type ThemeColors } from '../../src/theme';

export default function TakipDetayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [item, setItem] = useState<FollowUpWithPerson | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const row = await getFollowUp(db, id);
    setItem(row);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Native stack başlığındaki geri tuşu bu ekranda iOS'ta yanıt vermiyordu;
  // Yeni Takip / AI ile Çıkar'daki gibi kendi başlığımızı kullanıyoruz.
  // Geçmiş yoksa (ör. derin bağlantıyla açıldıysa) ana sayfaya dönülür.
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={goBack}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={8}
      >
        <ArrowLeft color={colors.text} size={20} strokeWidth={2.2} />
      </Pressable>
      <Text style={styles.headerTitle}>{t('stackTitles.takipDetay')}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {header}
        <View style={styles.container}>
          <Text style={styles.detail}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const overdue = isOverdue(item.dueAt) && item.status === 'open';

  async function markDone() {
    if (!item) return;
    await completeFollowUp(db, item);
    goBack();
  }

  async function handleDelete() {
    if (!item) return;
    Alert.alert(t('takipDetay.deleteAlertTitle'), t('takipDetay.deleteAlertMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await removeFollowUp(db, item);
          goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    {header}
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <TypeBadge type={item.type} style={styles.badge} />
        <Text style={styles.title}>{item.title}</Text>

        {item.personName && item.personId && (
          <Pressable
            style={styles.personRow}
            onPress={() => router.push(`/kisi/${item.personId}`)}
            accessibilityRole="button"
            accessibilityLabel={t('takipDetay.personProfileA11y', { name: item.personName })}
          >
            <Avatar name={item.personName} size={26} />
            <Text style={styles.personText}>{item.personName}</Text>
          </Pressable>
        )}

        {item.dueAt !== null && (
          <Text style={[styles.meta, overdue && styles.metaOverdue]}>⏰ {formatDueDate(item.dueAt)}</Text>
        )}
        {item.detail && <Text style={styles.detail}>{item.detail}</Text>}
      </View>

      {item.status === 'open' && (
        <View style={styles.doneButtonWrap}>
          <Button label={t('takipDetay.markDone')} variant="success" onPress={markDone} />
        </View>
      )}

      <Button label={t('common.delete')} variant="ghostDanger" onPress={handleDelete} />
    </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glassBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    headerTitle: {
      fontSize: fontSize.title,
      fontFamily: fontFamily.bodyBold,
      color: colors.text,
      letterSpacing: letterSpacing.title,
    },
    headerSpacer: { width: 40, height: 40 },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
    card: {
      ...getCardSurface(colors),
      padding: 20,
    },
    badge: { marginBottom: 10 },
    title: { fontSize: fontSize.title, fontFamily: fontFamily.displaySemiBold, color: colors.text, lineHeight: 28 },
    personRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
    personText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    meta: { fontSize: fontSize.base, color: colors.textMuted, marginTop: 10, fontFamily: fontFamily.body },
    metaOverdue: { color: colors.danger, fontFamily: fontFamily.bodyBold },
    detail: { fontSize: fontSize.base, color: colors.text, marginTop: 14, lineHeight: 22, fontFamily: fontFamily.body },
    doneButtonWrap: { marginTop: 20 },
  });
}
