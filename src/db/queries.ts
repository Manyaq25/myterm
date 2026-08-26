import type { SQLiteDatabase } from 'expo-sqlite';
import type { FollowUp, FollowUpStatus, FollowUpType, FollowUpWithPerson, Person } from '../types';

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
