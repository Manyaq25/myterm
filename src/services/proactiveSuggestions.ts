import type { SQLiteDatabase } from 'expo-sqlite';
import type { FollowUp, Person } from '../types';
import { listPeople, setPersonReminderLead, dismissLateSuggestion as dismissLateSuggestionQuery } from '../db/queries';

// Bu kadar üst üste geciken "birinden beklediğim" maddesi bulunursa öneri gösterilir.
const LATE_STREAK_THRESHOLD = 3;
// Kullanıcı "evet" derse hatırlatmayı bu kadar erkene çekiyoruz (1 gün).
export const DEFAULT_REMINDER_LEAD_MINUTES = 24 * 60;

export interface LatePersonSuggestion {
  person: Person;
  lateCount: number;
  latestCompletedAt: number;
}

/**
 * Tamamen yerel, deterministik bir sezgisel kural — Claude'a istek atmaz.
 * Bir kişiden "beklediğim" (waiting_on) son N maddenin hepsi zamanında değil,
 * son tarihinden SONRA tamamlanmışsa bunu bir örüntü sayar. Hiçbir şeyi
 * otomatik değiştirmez; yalnızca kullanıcıya sorulacak bir öneri üretir.
 *
 * Yalnızca doğru sınıflandırılmış "waiting_on" maddelerine bakar — bu,
 * extraction prompt'unun (backend/lib/extract.ts) öznesi başkası olan
 * eylemleri "task" değil "waiting_on" olarak sınıflandırmasına dayanır.
 */
export async function detectLatePersonSuggestions(db: SQLiteDatabase): Promise<LatePersonSuggestion[]> {
  const people = await listPeople(db);
  const suggestions: LatePersonSuggestion[] = [];

  for (const person of people) {
    if (person.reminderLeadMinutes > 0) continue; // zaten kullanıcı bir kez "evet" demiş

    const rows = await db.getAllAsync<FollowUp>(
      `SELECT * FROM follow_ups
       WHERE personId = ? AND type = 'waiting_on' AND status = 'done'
         AND dueAt IS NOT NULL AND completedAt IS NOT NULL
       ORDER BY completedAt DESC
       LIMIT ?`,
      [person.id, LATE_STREAK_THRESHOLD]
    );

    if (rows.length < LATE_STREAK_THRESHOLD) continue;
    const allLate = rows.every((r) => r.completedAt! > r.dueAt!);
    if (!allLate) continue;

    const latestCompletedAt = rows[0].completedAt!;
    if (person.lateSuggestionDismissedAt && person.lateSuggestionDismissedAt >= latestCompletedAt) continue;

    suggestions.push({ person, lateCount: rows.length, latestCompletedAt });
  }

  return suggestions;
}

export function acceptLateSuggestion(db: SQLiteDatabase, personId: string): Promise<void> {
  return setPersonReminderLead(db, personId, DEFAULT_REMINDER_LEAD_MINUTES);
}

export function dismissLateSuggestion(db: SQLiteDatabase, personId: string): Promise<void> {
  return dismissLateSuggestionQuery(db, personId);
}
