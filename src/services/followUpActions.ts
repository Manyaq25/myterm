import type { SQLiteDatabase } from 'expo-sqlite';
import type { FollowUp } from '../types';
import { deleteFollowUp, updateFollowUpStatus } from '../db/queries';
import { removeFromReminderDay } from './reminderScheduler';
import { cancelExtraReminders } from './smartReminders';
import { updateWidgetSummary } from './widget';

type ReminderRef = Pick<FollowUp, 'id' | 'remindAt'>;

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
