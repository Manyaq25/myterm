import type { SQLiteDatabase } from 'expo-sqlite';
import { listFollowUps } from '../db/queries';
import { FOLLOW_UP_STATUS_LABELS, FOLLOW_UP_TYPE_LABELS, type FollowUpWithPerson } from '../types';

const ALL_STATUSES = ['open', 'snoozed', 'done', 'cancelled'] as const;
// Asistana gönderilen bağlamı makul boyutta tutmak için üst sınır.
const MAX_ITEMS = 300;

function formatLine(item: FollowUpWithPerson): string {
  const parts = [
    `[${FOLLOW_UP_TYPE_LABELS[item.type]}] ${item.title}`,
    `Kişi: ${item.personName ?? 'yok'}`,
    `Durum: ${FOLLOW_UP_STATUS_LABELS[item.status]}`,
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
