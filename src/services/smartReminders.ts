import type { SQLiteDatabase } from 'expo-sqlite';
import type { FollowUpType } from '../types';
import { addFollowUpReminder, deleteFollowUpReminders } from '../db/queries';
import { scheduleNotification, cancelFollowUpReminder } from './notifications';

const NEAR_TERM_MS = 3 * 24 * 60 * 60 * 1000; // 3 gün

function isNearTerm(dueAt: number): boolean {
  const diff = dueAt - Date.now();
  return diff >= 0 && diff <= NEAR_TERM_MS;
}

/**
 * Bir kişinin tamamlanan son maddelerinin çoğu son tarihinden SONRA
 * bitirilmişse "sık gecikme geçmişi" sayılır. Tamamen yerel bir sezgisel
 * kural — Claude'a istek atmaz.
 */
export async function hasFrequentLateHistory(db: SQLiteDatabase, personId: string): Promise<boolean> {
  const rows = await db.getAllAsync<{ dueAt: number; completedAt: number }>(
    `SELECT dueAt, completedAt FROM follow_ups
     WHERE personId = ? AND status = 'done' AND dueAt IS NOT NULL AND completedAt IS NOT NULL
     ORDER BY completedAt DESC LIMIT 3`,
    [personId]
  );
  if (rows.length < 2) return false;
  const lateCount = rows.filter((r) => r.completedAt > r.dueAt).length;
  return lateCount >= 2;
}

export interface ImportanceInput {
  type: FollowUpType;
  dueAt: number | null;
  personId: string | null;
}

/**
 * "Önemli" görünen bir takip mi? Kriterler kullanıcının kendi tarif ettiği
 * sezgisel kurallar — Yapılacak iş/Verdiğim söz türünde VE (yakın tarihli
 * VEYA kişi bazlı sık gecikme geçmişi olan). Tamamen yerel, deterministik.
 */
export async function isImportantFollowUp(db: SQLiteDatabase, input: ImportanceInput): Promise<boolean> {
  if (input.dueAt === null) return false;
  if (input.type !== 'task' && input.type !== 'promise_made') return false;
  if (isNearTerm(input.dueAt)) return true;
  if (input.personId) return hasFrequentLateHistory(db, input.personId);
  return false;
}

export type ExtraReminderChoice = 'day_before' | 'morning' | 'both' | 'none';

function dayBeforeDate(dueAt: number): Date {
  return new Date(dueAt - 24 * 60 * 60 * 1000);
}

function sameDayMorningDate(dueAt: number): Date {
  const d = new Date(dueAt);
  d.setHours(9, 0, 0, 0);
  return d;
}

/**
 * Kullanıcının seçimine göre ek hatırlatma(lar) planlar. Hiçbir şey
 * kullanıcı onayı olmadan buraya kadar gelmez — bu fonksiyon yalnızca
 * kullanıcı "1 gün önce/sabah/ikisi" seçtiğinde çağrılır.
 */
export async function scheduleExtraReminders(
  db: SQLiteDatabase,
  followUpId: string,
  title: string,
  dueAt: number,
  choice: ExtraReminderChoice
): Promise<void> {
  if (choice === 'none') return;

  const targets: { date: Date; kind: string; body: string }[] = [];
  if (choice === 'day_before' || choice === 'both') {
    targets.push({ date: dayBeforeDate(dueAt), kind: 'day_before', body: 'Yarın zamanı geliyor' });
  }
  if (choice === 'morning' || choice === 'both') {
    targets.push({ date: sameDayMorningDate(dueAt), kind: 'same_day_morning', body: 'Bugün zamanı geliyor' });
  }

  for (const target of targets) {
    if (target.date.getTime() <= Date.now()) continue;
    const notificationId = await scheduleNotification(title, target.body, target.date, {
      followUpId,
      kind: target.kind,
    });
    if (notificationId) {
      await addFollowUpReminder(db, followUpId, notificationId, target.date.getTime(), target.kind);
    }
  }
}

export async function cancelExtraReminders(db: SQLiteDatabase, followUpId: string): Promise<void> {
  const rows = await deleteFollowUpReminders(db, followUpId);
  for (const row of rows) {
    await cancelFollowUpReminder(row.notificationId);
  }
}
