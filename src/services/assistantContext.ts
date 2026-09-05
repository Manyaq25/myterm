import type { SQLiteDatabase } from 'expo-sqlite';
import { listFollowUps } from '../db/queries';
import type { FollowUpWithPerson } from '../types';
import { followUpStatusLabel, followUpTypeLabel } from '../i18n/labels';
import i18n from '../i18n';

const ALL_STATUSES = ['open', 'snoozed', 'done', 'cancelled'] as const;
// Asistana gönderilen bağlamı makul boyutta tutmak için üst sınır.
const MAX_ITEMS = 300;

function formatLine(item: FollowUpWithPerson): string {
  const parts = [
    `[${followUpTypeLabel(item.type, i18n.t)}] ${item.title}`,
    `Kişi: ${item.personName ?? 'yok'}`,
    `Durum: ${followUpStatusLabel(item.status, i18n.t)}`,
    `Son tarih: ${item.dueAt !== null ? new Date(item.dueAt).toISOString() : 'yok'}`,
  ];
  if (item.status === 'done' && item.completedAt !== null) {
    parts.push(`Tamamlanma: ${new Date(item.completedAt).toISOString()}`);
  }
  return `- ${parts.join(' | ')}`;
}

/** AI Asistan'a gönderilecek, kullanıcının güncel takip listesinin düz metin özeti. */
export async function buildAssistantContext(db: SQLiteDatabase): Promise<string> {
  const items = await listFollowUps(db, [...ALL_STATUSES]);
  return items
    .slice(0, MAX_ITEMS)
    .map(formatLine)
    .join('\n');
}
