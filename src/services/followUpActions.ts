import type { SQLiteDatabase } from 'expo-sqlite';
import type { FollowUp } from '../types';
import {
  deleteFollowUp,
  getPerson,
  listFollowUpReminderKinds,
  updateFollowUpSchedule,
  updateFollowUpStatus,
} from '../db/queries';
import { applyReminderLead } from '../utils/date';
import { removeFromReminderDay, scheduleMainReminder } from './reminderScheduler';
import { cancelExtraReminders, scheduleExtraReminders, type ExtraReminderChoice } from './smartReminders';
import { updateWidgetSummary } from './widget';

type ReminderRef = Pick<FollowUp, 'id' | 'remindAt'>;
type RescheduleRef = Pick<FollowUp, 'id' | 'remindAt' | 'title' | 'personId'>;

export async function completeFollowUp(db: SQLiteDatabase, item: ReminderRef): Promise<void> {
  await removeFromReminderDay(db, item.remindAt, item.id);
  await cancelExtraReminders(db, item.id);
  await updateFollowUpStatus(db, item.id, 'done');
  await updateWidgetSummary(db);
}

export async function removeFollowUp(db: SQLiteDatabase, item: ReminderRef): Promise<void> {
  await removeFromReminderDay(db, item.remindAt, item.id);
  await cancelExtraReminders(db, item.id);
  await deleteFollowUp(db, item.id);
  await updateWidgetSummary(db);
}

export async function removeFollowUps(db: SQLiteDatabase, items: ReminderRef[]): Promise<void> {
  for (const item of items) {
    await removeFromReminderDay(db, item.remindAt, item.id);
    await cancelExtraReminders(db, item.id);
    await deleteFollowUp(db, item.id);
  }
  await updateWidgetSummary(db);
}

function extraChoiceFromKinds(kinds: string[]): ExtraReminderChoice {
  const dayBefore = kinds.includes('day_before');
  const morning = kinds.includes('same_day_morning');
  if (dayBefore && morning) return 'both';
  if (dayBefore) return 'day_before';
  if (morning) return 'morning';
  return 'none';
}

/**
 * Takibin zamanını değiştirir: eski hatırlatmaları iptal edip yenisini
 * kişinin "ne kadar önce hatırlat" ayarına göre kurar. Kullanıcı daha önce
 * ek hatırlatma (1 gün önce / sabah) seçtiyse onlar da yeni zamana taşınır.
 */
export async function rescheduleFollowUp(db: SQLiteDatabase, item: RescheduleRef, dueAt: number): Promise<void> {
  const extraKinds = await listFollowUpReminderKinds(db, item.id);
  await removeFromReminderDay(db, item.remindAt, item.id);
  await cancelExtraReminders(db, item.id);

  const person = item.personId ? await getPerson(db, item.personId) : null;
  const remindAt = applyReminderLead(dueAt, person?.reminderLeadMinutes ?? 0);
  await updateFollowUpSchedule(db, item.id, dueAt, remindAt);
  await scheduleMainReminder(db, item.id, remindAt);
  await scheduleExtraReminders(db, item.id, item.title, dueAt, extraChoiceFromKinds(extraKinds));
  await updateWidgetSummary(db);
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * Bildirimdeki "1 saat ertele": yalnızca hatırlatmayı 1 saat sonraya alır,
 * takibin kendi tarihi değişmez (geç kalmışsa geç kalmış olarak görünmeye devam eder).
 */
export async function snoozeFollowUpReminder(db: SQLiteDatabase, item: RescheduleRef & Pick<FollowUp, 'dueAt'>): Promise<void> {
  const remindAt = Date.now() + HOUR_MS;
  await removeFromReminderDay(db, item.remindAt, item.id);
  await updateFollowUpSchedule(db, item.id, item.dueAt, remindAt);
  await scheduleMainReminder(db, item.id, remindAt);
  await updateWidgetSummary(db);
}

/**
 * Bildirimdeki "Yarın": takibi yarına, aynı saate taşır. Saat, takibin kendi
 * saatinden (yoksa hatırlatma saatinden) alınır; ikisi de yoksa sabah 9.
 */
export async function moveFollowUpToTomorrow(db: SQLiteDatabase, item: RescheduleRef & Pick<FollowUp, 'dueAt'>): Promise<void> {
  const source = item.dueAt ?? item.remindAt;
  const target = new Date();
  target.setDate(target.getDate() + 1);
  if (source !== null) {
    const time = new Date(source);
    target.setHours(time.getHours(), time.getMinutes(), 0, 0);
  } else {
    target.setHours(9, 0, 0, 0);
  }
  await rescheduleFollowUp(db, item, target.getTime());
}
