import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { getFollowUp } from '../../src/db/queries';
import { FOLLOW_UP_TYPE_LABELS, type FollowUpWithPerson } from '../../src/types';
import { formatDueDate, isOverdue } from '../../src/utils/date';
import { completeFollowUp, removeFollowUp } from '../../src/services/followUpActions';
import { TYPE_COLORS } from '../../src/constants/typeColors';
import { Avatar } from '../../src/components/Avatar';

export default function TakipDetayScreen() {
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
        <Text>Yükleniyor…</Text>
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
        <View style={[styles.badge, { backgroundColor: TYPE_COLORS[item.type] ?? '#666' }]}>
          <Text style={styles.badgeText}>{FOLLOW_UP_TYPE_LABELS[item.type]}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>

        {item.personName && item.personId && (
          <Pressable style={styles.personRow} onPress={() => router.push(`/kisi/${item.personId}`)}>
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
        <Pressable style={styles.doneButton} onPress={markDone}>
          <Text style={styles.doneButtonText}>Tamamlandı olarak işaretle</Text>
        </Pressable>
      )}

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Sil</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', lineHeight: 28 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  personText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 14, color: '#6b7280', marginTop: 10 },
  metaOverdue: { color: '#dc2626', fontWeight: '700' },
  detail: { fontSize: 15, color: '#374151', marginTop: 14, lineHeight: 22 },
  doneButton: {
    marginTop: 20,
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteButton: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  deleteButtonText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
