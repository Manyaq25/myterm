import type { SQLiteDatabase } from 'expo-sqlite';
import type { FollowUp, FollowUpStatus, FollowUpType, FollowUpWithPerson, Person } from '../types';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function hasAnyFollowUp(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM follow_ups');
  return (row?.count ?? 0) > 0;
}

export async function listFollowUps(
  db: SQLiteDatabase,
  statuses: FollowUpStatus[] = ['open', 'snoozed']
): Promise<FollowUpWithPerson[]> {
  const placeholders = statuses.map(() => '?').join(',');
  return db.getAllAsync<FollowUpWithPerson>(
    `SELECT f.*, p.name as personName
     FROM follow_ups f
     LEFT JOIN people p ON p.id = f.personId
     WHERE f.status IN (${placeholders})
     ORDER BY
       CASE WHEN f.dueAt IS NULL THEN 1 ELSE 0 END,
       f.dueAt ASC,
       f.createdAt DESC`,
    statuses
  );
}

export async function listFollowUpsByType(
  db: SQLiteDatabase,
  type: FollowUpType,
  statuses: FollowUpStatus[] = ['open', 'snoozed']
): Promise<FollowUpWithPerson[]> {
  const placeholders = statuses.map(() => '?').join(',');
  return db.getAllAsync<FollowUpWithPerson>(
    `SELECT f.*, p.name as personName
     FROM follow_ups f
     LEFT JOIN people p ON p.id = f.personId
     WHERE f.type = ? AND f.status IN (${placeholders})
     ORDER BY
       CASE WHEN f.dueAt IS NULL THEN 1 ELSE 0 END,
       f.dueAt ASC,
       f.createdAt DESC`,
    [type, ...statuses]
  );
}

export async function getFollowUp(db: SQLiteDatabase, id: string): Promise<FollowUpWithPerson | null> {
  const row = await db.getFirstAsync<FollowUpWithPerson>(
    `SELECT f.*, p.name as personName
     FROM follow_ups f
     LEFT JOIN people p ON p.id = f.personId
     WHERE f.id = ?`,
    [id]
  );
  return row ?? null;
}

export interface CreateFollowUpInput {
  title: string;
  detail?: string | null;
  type: FollowUp['type'];
  personId?: string | null;
  dueAt?: number | null;
  remindAt?: number | null;
  source?: FollowUp['source'];
  confidence?: number | null;
}

export async function createFollowUp(db: SQLiteDatabase, input: CreateFollowUpInput): Promise<FollowUp> {
  const now = Date.now();
  const followUp: FollowUp = {
    id: newId(),
    title: input.title,
    detail: input.detail ?? null,
    type: input.type,
    status: 'open',
    personId: input.personId ?? null,
    dueAt: input.dueAt ?? null,
    remindAt: input.remindAt ?? null,
    source: input.source ?? 'manual',
    confidence: input.confidence ?? null,
    notificationId: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
  await db.runAsync(
    `INSERT INTO follow_ups
       (id, title, detail, type, status, personId, dueAt, remindAt, source, confidence, notificationId, createdAt, updatedAt, completedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      followUp.id,
      followUp.title,
      followUp.detail,
      followUp.type,
      followUp.status,
      followUp.personId,
      followUp.dueAt,
      followUp.remindAt,
      followUp.source,
      followUp.confidence,
      followUp.notificationId,
      followUp.createdAt,
      followUp.updatedAt,
      followUp.completedAt,
    ]
  );
  return followUp;
}

export async function updateFollowUpStatus(
  db: SQLiteDatabase,
  id: string,
  status: FollowUpStatus
): Promise<void> {
  const now = Date.now();
  const completedAt = status === 'done' ? now : null;
  await db.runAsync(
    `UPDATE follow_ups SET status = ?, updatedAt = ?, completedAt = ? WHERE id = ?`,
    [status, now, completedAt, id]
  );
}

export async function setFollowUpNotificationId(
  db: SQLiteDatabase,
  id: string,
  notificationId: string | null
): Promise<void> {
  await db.runAsync(`UPDATE follow_ups SET notificationId = ?, updatedAt = ? WHERE id = ?`, [
    notificationId,
    Date.now(),
    id,
  ]);
}

export async function deleteFollowUp(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM follow_ups WHERE id = ?`, [id]);
}

export async function listPeople(db: SQLiteDatabase): Promise<Person[]> {
  return db.getAllAsync<Person>(`SELECT * FROM people ORDER BY name ASC`);
}

export async function getPerson(db: SQLiteDatabase, id: string): Promise<Person | null> {
  const row = await db.getFirstAsync<Person>(`SELECT * FROM people WHERE id = ?`, [id]);
  return row ?? null;
}

export async function createPerson(db: SQLiteDatabase, name: string, note?: string | null): Promise<Person> {
  const person: Person = {
    id: newId(),
    name,
    note: note ?? null,
    phone: null,
    reminderLeadMinutes: 0,
    lateSuggestionDismissedAt: null,
    createdAt: Date.now(),
  };
  await db.runAsync(`INSERT INTO people (id, name, note, createdAt) VALUES (?, ?, ?, ?)`, [
    person.id,
    person.name,
    person.note,
    person.createdAt,
  ]);
  return person;
}

export async function listFollowUpsByPerson(db: SQLiteDatabase, personId: string): Promise<FollowUp[]> {
  return db.getAllAsync<FollowUp>(`SELECT * FROM follow_ups WHERE personId = ? ORDER BY dueAt ASC, createdAt DESC`, [
    personId,
  ]);
}

export async function setPersonReminderLead(db: SQLiteDatabase, personId: string, minutes: number): Promise<void> {
  await db.runAsync(`UPDATE people SET reminderLeadMinutes = ?, lateSuggestionDismissedAt = ? WHERE id = ?`, [
    minutes,
    Date.now(),
    personId,
  ]);
}

export async function dismissLateSuggestion(db: SQLiteDatabase, personId: string): Promise<void> {
  await db.runAsync(`UPDATE people SET lateSuggestionDismissedAt = ? WHERE id = ?`, [Date.now(), personId]);
}

export async function updatePersonPhone(db: SQLiteDatabase, personId: string, phone: string | null): Promise<void> {
  await db.runAsync(`UPDATE people SET phone = ? WHERE id = ?`, [phone, personId]);
}

export async function getFollowUpsByIds(db: SQLiteDatabase, ids: string[]): Promise<FollowUp[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  return db.getAllAsync<FollowUp>(`SELECT * FROM follow_ups WHERE id IN (${placeholders})`, ids);
}

// --- Akıllı hatırlatma önerisi (ek 1 gün önce / sabah hatırlatmaları) ---

export async function addFollowUpReminder(
  db: SQLiteDatabase,
  followUpId: string,
  notificationId: string,
  triggerAt: number,
  kind: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO follow_up_reminders (id, followUpId, notificationId, triggerAt, kind, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [newId(), followUpId, notificationId, triggerAt, kind, Date.now()]
  );
}

export async function deleteFollowUpReminders(
  db: SQLiteDatabase,
  followUpId: string
): Promise<{ notificationId: string }[]> {
  const rows = await db.getAllAsync<{ notificationId: string }>(
    `SELECT notificationId FROM follow_up_reminders WHERE followUpId = ?`,
    [followUpId]
  );
  await db.runAsync(`DELETE FROM follow_up_reminders WHERE followUpId = ?`, [followUpId]);
  return rows;
}

// --- Aynı güne denk gelen ana hatırlatmaları birleştirme ---

export async function addReminderDayItem(db: SQLiteDatabase, day: string, followUpId: string): Promise<void> {
  await db.runAsync(`INSERT OR IGNORE INTO reminder_day_items (day, followUpId) VALUES (?, ?)`, [day, followUpId]);
}

export async function removeReminderDayItem(db: SQLiteDatabase, day: string, followUpId: string): Promise<void> {
  await db.runAsync(`DELETE FROM reminder_day_items WHERE day = ? AND followUpId = ?`, [day, followUpId]);
}

export async function listReminderDayItems(db: SQLiteDatabase, day: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ followUpId: string }>(
    `SELECT followUpId FROM reminder_day_items WHERE day = ?`,
    [day]
  );
  return rows.map((r) => r.followUpId);
}

export async function getReminderDay(
  db: SQLiteDatabase,
  day: string
): Promise<{ day: string; notificationId: string | null } | null> {
  const row = await db.getFirstAsync<{ day: string; notificationId: string | null }>(
    `SELECT * FROM reminder_days WHERE day = ?`,
    [day]
  );
  return row ?? null;
}

export async function upsertReminderDay(
  db: SQLiteDatabase,
  day: string,
  notificationId: string | null
): Promise<void> {
  await db.runAsync(
    `INSERT INTO reminder_days (day, notificationId) VALUES (?, ?)
     ON CONFLICT(day) DO UPDATE SET notificationId = excluded.notificationId`,
    [day, notificationId]
  );
}

export async function deleteReminderDayRow(db: SQLiteDatabase, day: string): Promise<void> {
  await db.runAsync(`DELETE FROM reminder_days WHERE day = ?`, [day]);
}
