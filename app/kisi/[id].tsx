import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { getPerson, listFollowUpsByPerson, updatePersonPhone } from '../../src/db/queries';
import { FOLLOW_UP_TYPE_LABELS, FOLLOW_UP_STATUS_LABELS, type FollowUp, type Person } from '../../src/types';
import { formatDueDate, isOverdue } from '../../src/utils/date';
import { Avatar } from '../../src/components/Avatar';
import { ContactOptions } from '../../src/components/ContactOptions';
import { LateSuggestionCard } from '../../src/components/LateSuggestionCard';
import { buildReminderMessage } from '../../src/services/contact';
import { buildPersonInsights, formatInsightText } from '../../src/services/personInsights';
import { CARD_MARGIN_BOTTOM, CARD_SURFACE, SCREEN_BACKGROUND } from '../../src/constants/cardStyle';
import {
  acceptLateSuggestion,
  detectLatePersonSuggestions,
  dismissLateSuggestion,
  type LatePersonSuggestion,
} from '../../src/services/proactiveSuggestions';

function isOpenOverdue(item: FollowUp): boolean {
  return (item.status === 'open' || item.status === 'snoozed') && isOverdue(item.dueAt);
}

function FollowUpRow({ item, phone }: { item: FollowUp; phone?: string | null }) {
  const router = useRouter();
  const overdue = isOpenOverdue(item);
  const showContactShortcut = overdue && item.type === 'waiting_on' && !!phone;
  const accessibilityLabel = [
    FOLLOW_UP_TYPE_LABELS[item.type],
    item.title,
    item.status === 'done' || item.status === 'cancelled' ? FOLLOW_UP_STATUS_LABELS[item.status] : null,
    item.dueAt !== null
      ? overdue
        ? `Gecikmiş, son tarih ${formatDueDate(item.dueAt)}`
        : `Son tarih ${formatDueDate(item.dueAt)}`
      : null,
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <Pressable
      style={[styles.row, overdue && styles.rowOverdue]}
      onPress={() => router.push(`/takip/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Detayları görmek için dokun"
    >
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
          <ContactOptions phone={phone!} message={buildReminderMessage(item.title)} compact />
        </View>
      )}
    </Pressable>
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
  const insights = buildPersonInsights(followUps);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
            accessibilityLabel="Telefon numarası"
          />
          <Pressable style={styles.phoneSaveButton} onPress={savePhone} accessibilityRole="button" accessibilityLabel="Kaydet">
            <Text style={styles.phoneSaveButtonText}>Kaydet</Text>
          </Pressable>
          <Pressable
            style={styles.phoneCancelButton}
            onPress={() => setEditingPhone(false)}
            accessibilityRole="button"
            accessibilityLabel="İptal"
          >
            <Text style={styles.phoneCancelButtonText}>İptal</Text>
          </Pressable>
        </View>
      ) : person.phone ? (
        <View style={styles.contactRow}>
          <ContactOptions phone={person.phone} />
          <Pressable
            style={styles.editPhoneIcon}
            onPress={() => {
              setPhoneInput(person.phone ?? '');
              setEditingPhone(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Telefon numarasını düzenle"
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
          accessibilityRole="button"
          accessibilityLabel="Telefon numarası ekle"
        >
          <Text style={styles.addPhoneButtonText}>+ Telefon numarası ekle</Text>
        </Pressable>
      )}

      {person.reminderLeadMinutes > 0 && (
        <Text style={styles.leadBadge}>⏱️ Hatırlatmalar bu kişi için daha erken gönderiliyor</Text>
      )}

      {insights.length > 0 && (
        <View style={styles.insightsCard}>
          <Text style={styles.insightsLabel}>📊 Örüntü gözlemi</Text>
          {insights.map((insight) => (
            <Text key={insight.type} style={styles.insightsText}>
              {formatInsightText(insight)}
            </Text>
          ))}
          <Text style={styles.insightsFootnote}>
            Bu, geçmiş verilerinden çıkarılan basit bir istatistik — gizli bir profil değil, sadece
            kendi kayıtlarının bir özeti.
          </Text>
        </View>
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
  screen: { backgroundColor: SCREEN_BACKGROUND },
  content: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText: { flex: 1 },
  name: { fontSize: 24, fontWeight: '700', color: '#111827' },
  note: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  leadBadge: { fontSize: 12, color: '#2563eb', fontWeight: '600', marginTop: 14 },
  insightsCard: {
    backgroundColor: '#f5f3ff',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  insightsLabel: { fontSize: 12, fontWeight: '700', color: '#7c3aed', marginBottom: 8 },
  insightsText: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 4 },
  insightsFootnote: { fontSize: 11, color: '#9ca3af', marginTop: 8, lineHeight: 15 },
  empty: { fontSize: 14, color: '#9ca3af', marginTop: 24, textAlign: 'center' },

  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' },
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
    ...CARD_SURFACE,
    marginBottom: CARD_MARGIN_BOTTOM,
  },
  rowOverdue: { borderWidth: 1.5, borderColor: '#fca5a5' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowType: { fontSize: 11, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' },
  rowStatus: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowMeta: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  rowMetaOverdue: { color: '#dc2626', fontWeight: '700' },
  contactShortcutRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
