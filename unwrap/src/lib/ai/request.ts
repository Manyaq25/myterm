// Yapay zekâya gidecek isteği telefonda hazırlar: kişisel veriler maskelenir,
// sohbetin tamamı değil seçilmiş mesajlar gönderilir (maliyet ve gizlilik).
// Saf TypeScript; React Native'e bağlı değil (sunucu testi de kullanır).
import { maskPersonalData } from '../chat/mask';
import type { Message } from '../chat/parse';
import { formatDuration, type ChatStats } from '../chat/stats';

/** Testte 400 mesaj ≈ 12 bin token; maliyet hesabı buna göre yapıldı. */
export const MAX_MESSAGES = 400;
const RECENT_SHARE = 0.5;
const MAX_CHARS_PER_MESSAGE = 300;

/** Son mesajların yarısı + öncesinden eşit aralıklı örnek (sohbetin tüm dönemi görünsün). */
export function sampleMessages(messages: Message[], max = MAX_MESSAGES): Message[] {
  const text = messages.filter((m) => !m.media && m.text.trim());
  if (text.length <= max) return text;
  const recentCount = Math.floor(max * RECENT_SHARE);
  const recent = text.slice(-recentCount);
  const earlier = text.slice(0, -recentCount);
  const step = earlier.length / (max - recentCount);
  const picked: Message[] = [];
  for (let i = 0; i < max - recentCount; i++) picked.push(earlier[Math.floor(i * step)]);
  return [...picked, ...recent];
}

const two = (n: number) => String(n).padStart(2, '0');

export function formatMessages(messages: Message[]): string {
  return messages
    .map((m) => {
      const t = m.time;
      const body = maskPersonalData(m.text.replace(/\s+/g, ' ').slice(0, MAX_CHARS_PER_MESSAGE));
      return `${two(t.getDate())}.${two(t.getMonth() + 1)} ${two(t.getHours())}:${two(t.getMinutes())} ${m.author}: ${body}`;
    })
    .join('\n');
}

export function formatStats(s: ChatStats): string {
  const lines = [
    `Toplam ${s.totalMessages} mesaj, ${s.spanDays} gün (${s.activeDays} aktif gün).`,
    s.longestSilence ? `En uzun sessizlik: ${formatDuration(s.longestSilence.ms)} (bozan: ${s.longestSilence.brokenBy}).` : '',
    ...s.people.slice(0, 12).map(
      (p) =>
        `${p.name}: ${p.messages} mesaj, ort. ${p.avgWords} kelime, sohbeti ${p.initiations} kez başlatmış, ortanca cevap ${p.medianReplyMs == null ? '-' : formatDuration(p.medianReplyMs)}, ${p.doubleTexts} cevapsız art arda mesaj, ${p.laughs} kahkaha, ${p.emojis} emoji${p.topEmoji ? ` (en çok ${p.topEmoji})` : ''}, ${p.coldTamam} noktalı "Tamam.", gece ${p.nightMessages} mesaj.`,
    ),
  ];
  return lines.filter(Boolean).join('\n');
}

export type ReportPayload = {
  relation: string;
  me: string | null;
  participants: string[];
  stats: string;
  messages: string;
};

export function buildReportPayload(a: {
  relation: string | null;
  me: string | null;
  participants: string[];
  stats: ChatStats;
  messages: Message[];
}): ReportPayload {
  return {
    relation: a.relation ?? 'diger',
    me: a.me,
    participants: a.participants.slice(0, 30),
    stats: formatStats(a.stats),
    messages: formatMessages(sampleMessages(a.messages)),
  };
}
