// Kullanım günleri ve sayaçlar için saf yardımcılar (React Native yok; Node testlerinde çalışır).
// Dosya okuma/yazma activity.ts'te.

export type ActivityEvent = 'analysis_created' | 'report_opened' | 'mila_question' | 'card_shared' | 'profile_shared';
export type Activity = { days: string[]; counts: Record<string, number> };

/** En çok bu kadar gün saklanır (en yeniler). */
export const MAX_DAYS = 1000;

const pad = (n: number) => String(n).padStart(2, '0');
/** Yerel tarih: YYYY-AA-GG */
export const localDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** "2026-10-22" → gün numarası (UTC; yaz saati ve ay geçişleri sorun olmaz). */
export function dayNumber(day: string): number | null {
  const m = DAY_RE.exec(day);
  if (!m) return null;
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000);
}

export const emptyActivity = (): Activity => ({ days: [], counts: {} });

/** Bozuk/eksik veriyi temizler: geçerli, tekil, sıralı günler; sayı olan sayaçlar. */
export function normalizeActivity(raw: unknown): Activity {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<Activity>;
  const days = Array.isArray(o.days) ? o.days.filter((d): d is string => typeof d === 'string' && dayNumber(d) != null) : [];
  const counts: Record<string, number> = {};
  if (o.counts && typeof o.counts === 'object') {
    for (const [k, v] of Object.entries(o.counts)) if (typeof v === 'number' && Number.isFinite(v) && v > 0) counts[k] = Math.floor(v);
  }
  return { days: [...new Set(days)].sort().slice(-MAX_DAYS), counts };
}

/** Bugünü (yerel) ekler; zaten varsa aynı nesneyi döner. */
export function withOpenDay(a: Activity, now: Date): Activity {
  const day = localDay(now);
  if (a.days.includes(day)) return a;
  return { ...a, days: [...a.days, day].sort().slice(-MAX_DAYS) };
}

export function withBump(a: Activity, event: ActivityEvent, by = 1): Activity {
  return { ...a, counts: { ...a.counts, [event]: (a.counts[event] ?? 0) + by } };
}

/** Ardışık günlerin en uzun serisi ve son günde biten seri. */
export function streaks(days: string[]): { longest: number; last: number } {
  const nums = [...new Set(days.map(dayNumber).filter((n): n is number => n != null))].sort((x, y) => x - y);
  let longest = 0;
  let run = 0;
  for (let i = 0; i < nums.length; i++) {
    run = i > 0 && nums[i] - nums[i - 1] === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  return { longest, last: run };
}
