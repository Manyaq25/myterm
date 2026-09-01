import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getFollowUp } from '../../src/db/queries';
import { FOLLOW_UP_TYPE_LABELS, type FollowUpWithPerson } from '../../src/types';
import { formatDueDate, isOverdue } from '../../src/utils/date';
import { completeFollowUp, removeFollowUp } from '../../src/services/followUpActions';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { useTheme, getTypeColor, fontFamily, fontSize, type ThemeColors } from '../../src/theme';

export default function TakipDetayScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
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

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.detail}>Yükleniyor…</Text>
      </View>
    );
  }

  const overdue = isOverdue(item.dueAt) && item.status === 'open';

  async function markDone() {
    if (!item) return;
    await completeFollowUp(db, item);
    router.back();
  }

  async function handleDelete() {
    if (!item) return;
    Alert.alert('Sil', 'Bu takip kalıcı olarak silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await removeFollowUp(db, item);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={[styles.badge, { backgroundColor: getTypeColor(item.type, colors) }]}>
          <Text style={styles.badgeText}>{FOLLOW_UP_TYPE_LABELS[item.type]}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>

        {item.personName && item.personId && (
          <Pressable
            style={styles.personRow}
            onPress={() => router.push(`/kisi/${item.personId}`)}
            accessibilityRole="button"
            accessibilityLabel={`${item.personName} profilini aç`}
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
          <Button label="Tamamlandı olarak işaretle" variant="success" onPress={markDone} />
        </View>
      )}

      <Button label="Sil" variant="ghostDanger" onPress={handleDelete} />
    </ScrollView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    content: { padding: 20, backgroundColor: colors.background, flexGrow: 1 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 20,
      shadowColor: colors.text,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
    badgeText: { color: colors.onPrimary, fontSize: fontSize.caption, fontFamily: fontFamily.bodyBold },
    title: { fontSize: fontSize.title, fontFamily: fontFamily.displaySemiBold, color: colors.text, lineHeight: 28 },
    personRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
    personText: { fontSize: fontSize.small, fontFamily: fontFamily.bodySemiBold, color: colors.text },
    meta: { fontSize: fontSize.base, color: colors.textMuted, marginTop: 10, fontFamily: fontFamily.body },
    metaOverdue: { color: colors.danger, fontFamily: fontFamily.bodyBold },
    detail: { fontSize: fontSize.base, color: colors.text, marginTop: 14, lineHeight: 22, fontFamily: fontFamily.body },
    doneButtonWrap: { marginTop: 20 },
  });
}
