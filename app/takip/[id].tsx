import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { deleteFollowUp, getFollowUp, updateFollowUpStatus } from '../../src/db/queries';
import { FOLLOW_UP_TYPE_LABELS, type FollowUpWithPerson } from '../../src/types';
import { formatDueDate } from '../../src/utils/date';
import { cancelFollowUpReminder } from '../../src/services/notifications';

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

  async function markDone() {
    if (!item) return;
    if (item.notificationId) await cancelFollowUpReminder(item.notificationId);
    await updateFollowUpStatus(db, item.id, 'done');
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
          if (item.notificationId) await cancelFollowUpReminder(item.notificationId);
          await deleteFollowUp(db, item.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.type}>{FOLLOW_UP_TYPE_LABELS[item.type]}</Text>
      <Text style={styles.title}>{item.title}</Text>
      {item.personName && <Text style={styles.meta}>👤 {item.personName}</Text>}
      {item.dueAt !== null && <Text style={styles.meta}>⏰ {formatDueDate(item.dueAt)}</Text>}
      {item.detail && <Text style={styles.detail}>{item.detail}</Text>}

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
  type: { fontSize: 13, fontWeight: '700', color: '#2563eb', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 14 },
  meta: { fontSize: 14, color: '#4b5563', marginBottom: 6 },
  detail: { fontSize: 15, color: '#374151', marginTop: 12, lineHeight: 22 },
  doneButton: {
    marginTop: 28,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteButton: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  deleteButtonText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
