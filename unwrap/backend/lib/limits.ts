// Adil kullanım ve kötüye kullanım sınırları (kullanıcıya kilit gösterilmez).
import { HttpError } from './http';
import { dayKey, incrWithTtl, k, monthKey } from './redis';

/** Ayda bu kadar rapor Sonnet ile; sonrası Haiku ile sürer. */
export const SONNET_REPORTS_PER_MONTH = 45;
const REPORTS_PER_DAY = 40;
const COACH_PER_DAY = 300;
/** Ücretsiz kullanıcının günlük genel soru hakkı. */
export const FREE_COACH_PER_DAY = 5;
const PER_MINUTE = 20;

export async function perMinute(appUserId: string) {
  const n = await incrWithTtl(k('rpm', appUserId, Math.floor(Date.now() / 60000)), 120);
  if (n > PER_MINUTE) throw new HttpError(429, 'slow_down');
}

/** Rapor sayacını artırır; hangi modelin kullanılacağını döner. */
export async function countReport(appUserId: string): Promise<'sonnet' | 'haiku'> {
  const day = await incrWithTtl(k('rep:d', appUserId, dayKey()), 2 * 86400);
  if (day > REPORTS_PER_DAY) throw new HttpError(429, 'daily_limit');
  const month = await incrWithTtl(k('rep:m', appUserId, monthKey()), 40 * 86400);
  return month <= SONNET_REPORTS_PER_MONTH ? 'sonnet' : 'haiku';
}

export async function countCoach(appUserId: string) {
  const day = await incrWithTtl(k('coach:d', appUserId, dayKey()), 2 * 86400);
  if (day > COACH_PER_DAY) throw new HttpError(429, 'daily_limit');
}

export async function countFreeCoach(appUserId: string) {
  const day = await incrWithTtl(k('coach:free', appUserId, dayKey()), 2 * 86400);
  if (day > FREE_COACH_PER_DAY) throw new HttpError(402, 'free_limit');
}
