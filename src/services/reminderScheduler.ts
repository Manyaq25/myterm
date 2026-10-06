import type { SQLiteDatabase } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import {
  addReminderDayItem,
  removeReminderDayItem,
  listReminderDayItems,
  getReminderDay,
  upsertReminderDay,
  deleteReminderDayRow,
  getFollowUpsByIds,
  listReminderDaysFrom,
} from '../db/queries';
import { FOLLOW_UP_CATEGORY, scheduleNotification, cancelFollowUpReminder } from './notifications';
import i18n from '../i18n';
import { isOverdue } from '../utils/date';

function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Bir takibin ANA hatırlatmasını planlar. Aynı takvim gününe denk gelen
 * başka açık hatırlatma(lar) varsa, tekil bildirimler yerine tek bir
 * birleştirilmiş bildirimde toplanır (ör. "Bugün 4 takip var") — gecikmiş/
 * kritik olanlar önce sayılır. Yalnızca ANA hatırlatmalar birleştirilir; akıllı
 * öneriyle eklenen ek hatırlatmalar (1 gün önce/sabah) bu birleştirmenin
 * dışındadır.
 */
export async function scheduleMainReminder(db: SQLiteDatabase, followUpId: string, remindAt: number): Promise<void> {
  if (remindAt <= Date.now()) return;
  const day = dayKey(remindAt);
  await addReminderDayItem(db, day, followUpId);
  await rebuildDayNotification(db, day);
}

/** Bir takip silindiğinde/durumu değiştiğinde (tamamlandı/iptal) gün grubundan çıkarır. */
export async function removeFromReminderDay(
  db: SQLiteDatabase,
  remindAt: number | null,
  followUpId: string
): Promise<void> {
  if (remindAt === null) return;
  const day = dayKey(remindAt);
  await removeReminderDayItem(db, day, followUpId);
  await rebuildDayNotification(db, day);
}

/**
 * Bugünden sonraki bütün günlerin bildirimlerini yeniden kurar. Bildirim
 * düğmeleri gelmeden önce kurulmuş hatırlatmaların da düğmeli olması için
 * bir kez çalıştırılır.
 */
export async function rebuildUpcomingReminders(db: SQLiteDatabase): Promise<void> {
  const days = await listReminderDaysFrom(db, dayKey(Date.now()));
  for (const day of days) {
    await rebuildDayNotification(db, day);
  }
}

/**
 * Yedekten geri yüklenen bir telefonda takipler gelir ama planlanmış
 * bildirimler gelmez (iOS/Android bunları yedeğe almıyor). Açılışta,
 * veritabanında kayıtlı olup telefonda planlı olmayan günleri yeniden kurar.
 * Bildirim izni yoksa hiçbir şey yapmaz (açılışta izin penceresi çıkmasın).
 */
export async function restoreMissingReminders(db: SQLiteDatabase): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  const scheduled = new Set((await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier));
  const days = await listReminderDaysFrom(db, dayKey(Date.now()));
  for (const day of days) {
    const row = await getReminderDay(db, day);
    if (!row?.notificationId || !scheduled.has(row.notificationId)) {
      await rebuildDayNotification(db, day);
    }
  }
}

async function rebuildDayNotification(db: SQLiteDatabase, day: string): Promise<void> {
  const existing = await getReminderDay(db, day);
  if (existing?.notificationId) {
    await cancelFollowUpReminder(existing.notificationId);
  }

  const followUpIds = await listReminderDayItems(db, day);
  if (followUpIds.length === 0) {
    await deleteReminderDayRow(db, day);
    return;
  }

  const items = (await getFollowUpsByIds(db, followUpIds)).filter(
    (i) => (i.status === 'open' || i.status === 'snoozed') && i.remindAt !== null && i.remindAt > Date.now()
  );
  if (items.length === 0) {
    await deleteReminderDayRow(db, day);
    return;
  }

  if (items.length === 1) {
    const only = items[0];
    const notificationId = await scheduleNotification(
      only.title,
      i18n.t('notifications.dueNow'),
      new Date(only.remindAt!),
      { followUpId: only.id },
      FOLLOW_UP_CATEGORY
    );
    await upsertReminderDay(db, day, notificationId);
    return;
  }

  // Birden fazla — tek birleştirilmiş bildirim. Gecikmiş/kritik olanlar önce.
  const sorted = [...items].sort((a, b) => {
    const priority = (i: (typeof items)[number]) => (isOverdue(i.dueAt) ? 0 : i.type === 'promise_made' || i.type === 'task' ? 1 : 2);
    return priority(a) - priority(b);
  });
  const earliest = Math.min(...sorted.map((i) => i.remindAt!));
  const preview = sorted.slice(0, 2).map((i) => i.title).join(', ');
  const extra = sorted.length > 2 ? i18n.t('notifications.digestMore', { count: sorted.length - 2 }) : '';
  const notificationId = await scheduleNotification(
    i18n.t('notifications.digestTitle', { count: sorted.length }),
    `${preview}${extra}`,
    new Date(earliest),
    { kind: 'daily-digest', day }
  );
  await upsertReminderDay(db, day, notificationId);
}
