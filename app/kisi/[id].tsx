import { useCallback, useState } from 'react';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { getPerson, listFollowUpsByPerson, updatePersonPhone } from '../../src/db/queries';
import { FOLLOW_UP_TYPE_LABELS, FOLLOW_UP_STATUS_LABELS, type FollowUp, type Person } from '../../src/types';
import { formatDueDate, isOverdue } from '../../src/utils/date';
import { Avatar } from '../../src/components/Avatar';
import { LateSuggestionCard } from '../../src/components/LateSuggestionCard';
import {
  acceptLateSuggestion,
  detectLatePersonSuggestions,
  dismissLateSuggestion,
  type LatePersonSuggestion,
} from '../../src/services/proactiveSuggestions';

function isOpenOverdue(item: FollowUp): boolean {
  return (item.status === 'open' || item.status === 'snoozed') && isOverdue(item.dueAt);
}

async function callPerson(phone: string) {
  try {
    await Linking.openURL(`tel:${phone}`);
  } catch {
    Alert.alert('Hata', 'Arama başlatılamadı.');
  }
}

async function messagePerson(phone: string) {
  try {
    await Linking.openURL(`sms:${phone}`);
  } catch {
    Alert.alert('Hata', 'Mesaj uygulaması açılamadı.');
  }
}

function FollowUpRow({ item, phone }: { item: FollowUp; phone?: string | null }) {
  const overdue = isOpenOverdue(item);
  const showContactShortcut = overdue && item.type === 'waiting_on' && !!phone;
  return (
    <Link href={`/takip/${item.id}`} asChild>
      <Pressable style={[styles.row, overdue && styles.rowOverdue]}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowType}>{FOLLOW_UP_TYPE_LABELS[item.type]}</Text>
          {(item.status === 'done' || item.status === 'cancelled') && (
            <Text style={styles.rowStatus}>{FOLLOW_UP_STATUS_LABELS[item.status]}</Text>
          )}
        </View>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {item.dueAt !== null && (
          <Text style={[styles.rowMeta, overdue && styles.rowMetaOverdue]}>⏰ {formatDueDate(item.dueAt)}</Text>
        )}
        {showContactShortcut && (
          <View style={styles.contactShortcutRow}>
            <Pressable style={styles.contactShortcut} onPress={() => callPerson(phone!)}>
              <Text style={styles.contactShortcutText}>📞 Ara</Text>
            </Pressable>
            <Pressable style={styles.contactShortcut} onPress={() => messagePerson(phone!)}>
              <Text style={styles.contactShortcutText}>💬 Mesaj At</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

function Section({ title, items, phone }: { title: string; items: FollowUp[]; phone?: string | null }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title} ({items.length})
      </Text>
      {items.map((item) => (
        <FollowUpRow key={item.id} item={item} phone={phone} />
      ))}
    </View>
  );
}

export default function KisiProfiliScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [person, setPerson] = useState<Person | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [suggestion, setSuggestion] = useState<LatePersonSuggestion | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [p, items, suggestions] = await Promise.all([
      getPerson(db, id),
      listFollowUpsByPerson(db, id),
      detectLatePersonSuggestions(db),
    ]);
    setPerson(p);
    setFollowUps(items);
    setSuggestion(suggestions.find((s) => s.person.id === id) ?? null);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!person) {
    return (
      <View style={styles.centered}>
        <Text>Yükleniyor…</Text>
      </View>
    );
  }

  async function savePhone() {
    if (!person) return;
    await updatePersonPhone(db, person.id, phoneInput.trim() || null);
    setEditingPhone(false);
    await load();
  }

  const overdue = followUps.filter(isOpenOverdue);
  const overdueIds = new Set(overdue.map((i) => i.id));
  const waitingOn = followUps.filter(
    (i) => (i.status === 'open' || i.status === 'snoozed') && i.type === 'waiting_on' && !overdueIds.has(i.id)
  );
  const given = followUps.filter(
    (i) => (i.status === 'open' || i.status === 'snoozed') && i.type !== 'waiting_on' && !overdueIds.has(i.id)
  );
  const history = followUps
    .filter((i) => i.status === 'done' || i.status === 'cancelled')
    .sort((a, b) => (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar name={person.name} size={56} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{person.name}</Text>
          {person.note && <Text style={styles.note}>{person.note}</Text>}
        </View>
      </View>

      {editingPhone ? (
        <View style={styles.phoneEditRow}>
          <TextInput
            style={styles.phoneInput}
            placeholder="ör. 05XX XXX XX XX"
            value={phoneInput}
            onChangeText={setPhoneInput}
            keyboardType="phone-pad"
            autoFocus
          />
          <Pressable style={styles.phoneSaveButton} onPress={savePhone}>
            <Text style={styles.phoneSaveButtonText}>Kaydet</Text>
          </Pressable>
          <Pressable style={styles.phoneCancelButton} onPress={() => setEditingPhone(false)}>
            <Text style={styles.phoneCancelButtonText}>İptal</Text>
          </Pressable>
        </View>
      ) : person.phone ? (
        <View style={styles.contactRow}>
          <Pressable style={styles.contactButton} onPress={() => callPerson(person.phone!)}>
            <Text style={styles.contactButtonText}>📞 Ara</Text>
          </Pressable>
          <Pressable style={styles.contactButton} onPress={() => messagePerson(person.phone!)}>
            <Text style={styles.contactButtonText}>💬 Mesaj Gönder</Text>
          </Pressable>
          <Pressable
            style={styles.editPhoneIcon}
            onPress={() => {
              setPhoneInput(person.phone ?? '');
              setEditingPhone(true);
            }}
          >
            <Text style={styles.editPhoneIconText}>✏️</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.addPhoneButton}
          onPress={() => {
            setPhoneInput('');
            setEditingPhone(true);
          }}
        >
          <Text style={styles.addPhoneButtonText}>+ Telefon numarası ekle</Text>
        </Pressable>
      )}

      {person.reminderLeadMinutes > 0 && (
        <Text style={styles.leadBadge}>⏱️ Hatırlatmalar bu kişi için daha erken gönderiliyor</Text>
      )}

      {suggestion && (
        <LateSuggestionCard
          suggestion={suggestion}
          onAccept={async () => {
            await acceptLateSuggestion(db, person.id);
            await load();
          }}
          onDismiss={async () => {
            await dismissLateSuggestion(db, person.id);
            await load();
          }}
        />
      )}

      <Section title="Gecikenler" items={overdue} phone={person.phone} />
      <Section title="Ondan beklediklerim" items={waitingOn} />
      <Section title="Ona verdiklerim" items={given} />
      <Section title="Geçmiş" items={history} />

      {followUps.length === 0 && <Text style={styles.empty}>Bu kişiyle ilgili henüz bir takip yok.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText: { flex: 1 },
  name: { fontSize: 24, fontWeight: '700', color: '#111827' },
  note: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  leadBadge: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 14 },
  empty: { fontSize: 14, color: '#9ca3af', marginTop: 24, textAlign: 'center' },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  contactButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  contactButtonText: { color: '#2563eb', fontSize: 13, fontWeight: '700' },
  editPhoneIcon: { padding: 8 },
  editPhoneIconText: { fontSize: 15 },
  addPhoneButton: { marginTop: 16, alignSelf: 'flex-start' },
  addPhoneButtonText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  phoneEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  phoneSaveButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  phoneSaveButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  phoneCancelButton: { paddingHorizontal: 6, paddingVertical: 9 },
  phoneCancelButtonText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },

  section: { marginTop: 22 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase' },
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowOverdue: { borderWidth: 1.5, borderColor: '#fca5a5' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowType: { fontSize: 11, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' },
  rowStatus: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowMeta: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  rowMetaOverdue: { color: '#dc2626', fontWeight: '700' },
  contactShortcutRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  contactShortcut: { backgroundColor: '#fef2f2', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  contactShortcutText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
});
