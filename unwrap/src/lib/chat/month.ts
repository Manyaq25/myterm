// Aylık ilişki raporu: sohbetin son 30 günü, önceki 30 günle karşılaştırılır.
// Sohbet dökümü tüm geçmişi içerdiği için ayrı bir kayıt tutmaya gerek yok.
// Saf TypeScript (testte de çalışır).
import type { Message } from './parse';
import { LAUGH } from './stats';

const DAY = 86_400_000;
const MIN_MESSAGES = 20;

export type Period = { messages: number; days: number; laughs: number; night: number; words: number };

function measure(list: Message[]): Period {
  const days = new Set<string>();
  let laughs = 0;
  let night = 0;
  let words = 0;
  for (const m of list) {
    days.add(m.time.toDateString());
    laughs += (m.text.match(LAUGH) ?? []).length;
    if (m.time.getHours() < 5) night++;
    words += m.text.split(/\s+/).filter(Boolean).length;
  }
  return { messages: list.length, days: days.size, laughs, night, words };
}

/** Değişim yüzdesi (önceki 0 ise null). */
export const change = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : null);

export function monthCompare(messages: Message[]): { now: Period; before: Period } | null {
  const text = messages.filter((m) => !m.media);
  if (!text.length) return null;
  const end = text[text.length - 1].time.getTime();
  const now = text.filter((m) => m.time.getTime() > end - 30 * DAY);
  const before = text.filter((m) => m.time.getTime() <= end - 30 * DAY && m.time.getTime() > end - 60 * DAY);
  if (now.length < MIN_MESSAGES || before.length < MIN_MESSAGES) return null;
  return { now: measure(now), before: measure(before) };
}

