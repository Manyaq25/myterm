// Ücretsiz kartların sayıları: tamamen telefonda, yapay zekâ olmadan hesaplanır.
import trStory from '../../i18n/locales/tr/story';
import type { Message, ParsedChat } from './parse';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
/** Bu kadar sessizlikten sonra ilk yazan sohbeti "başlatmış" sayılır. */
const NEW_CONVERSATION_GAP = 4 * HOUR;
/** Başkasının mesajına bundan uzun sürede verilen yanıt cevap süresine katılmaz. */
const MAX_REPLY_GAP = 48 * HOUR;

const EMOJI = /\p{Extended_Pictographic}/gu;
// Kahkaha: emoji + dillere göre yazımlar (haha, jaja, kkkk, rsrs, хаха, wkwk, ههه, mdr, xD…)
const LAUGH = /(😂|🤣|😆|😹|(?<!\p{L})(?:a?ha(?:ha)+h?|he(?:he)+|ks(?:ks)+k?|sj(?:sj)+|js(?:js)+|ja(?:ja)+|je(?:je)+|k{4,}|rs(?:rs)+|lol|lmao|asdf\p{L}*|ahah\p{L}*|xd+|mdr|ptdr|wk(?:wk)+|х[аa](?:х[аa])+|а?ха(?:ха)+|ه{3,}|خخخ+)(?!\p{L}))/giu;
const AYNEN = /\baynen\b/giu;
const COLD_TAMAM = /^tamam\.$/iu;

export type PersonStats = {
  name: string;
  messages: number;
  words: number;
  avgWords: number;
  emojis: number;
  topEmoji: string | null;
  laughs: number;
  aynen: number;
  coldTamam: number;
  initiations: number;
  medianReplyMs: number | null;
  doubleTexts: number;
  nightMessages: number;
  busiestHour: number | null;
  media: number;
};

export type ChatStats = {
  totalMessages: number;
  firstMessage: Date;
  lastMessage: Date;
  /** İlk ve son mesaj arasındaki gün sayısı (Narya'daki "kaç gün konuştunuz") */
  spanDays: number;
  /** En az bir mesaj atılan gün sayısı */
  activeDays: number;
  isGroup: boolean;
  people: PersonStats[];
  longestSilence: { ms: number; brokenBy: string; at: Date } | null;
  fastestReply: { ms: number; by: string } | null;
  longestStreak: { count: number; by: string } | null;
  totalLaughs: number;
};

export function computeStats(chat: ParsedChat): ChatStats {
  const msgs = chat.messages;
  const people = new Map<string, PersonStats & { _replies: number[]; _hours: number[]; _emoji: Map<string, number> }>();
  const get = (name: string) => {
    let p = people.get(name);
    if (!p) {
      p = {
        name, messages: 0, words: 0, avgWords: 0, emojis: 0, topEmoji: null, laughs: 0, aynen: 0, coldTamam: 0,
        initiations: 0, medianReplyMs: null, doubleTexts: 0, nightMessages: 0, busiestHour: null, media: 0,
        _replies: [], _hours: new Array(24).fill(0), _emoji: new Map(),
      };
      people.set(name, p);
    }
    return p;
  };

  let longestSilence: ChatStats['longestSilence'] = null;
  let fastestReply: ChatStats['fastestReply'] = null;
  let longestStreak: ChatStats['longestStreak'] = null;
  let streak = 0;
  const days = new Set<string>();

  msgs.forEach((m: Message, i) => {
    const p = get(m.author);
    p.messages++;
    const hour = m.time.getHours();
    p._hours[hour]++;
    if (hour < 5) p.nightMessages++;
    days.add(m.time.toDateString());
    if (m.media) p.media++;
    else {
      p.words += m.text.split(/\s+/).filter(Boolean).length;
      for (const e of m.text.match(EMOJI) ?? []) {
        p.emojis++;
        p._emoji.set(e, (p._emoji.get(e) ?? 0) + 1);
      }
      p.laughs += (m.text.match(LAUGH) ?? []).length;
      p.aynen += (m.text.match(AYNEN) ?? []).length;
      if (COLD_TAMAM.test(m.text.trim())) p.coldTamam++;
    }

    const prev = msgs[i - 1];
    if (!prev) {
      p.initiations++;
      streak = 1;
      return;
    }
    const gap = m.time.getTime() - prev.time.getTime();
    if (!longestSilence || gap > longestSilence.ms) longestSilence = { ms: gap, brokenBy: m.author, at: m.time };

    if (prev.author === m.author) {
      streak++;
      if (gap > 10 * MIN) p.doubleTexts++;
      if (gap > NEW_CONVERSATION_GAP) p.initiations++;
    } else {
      streak = 1;
      // Başkasının mesajına geç verilen yanıt "başlatma" değil, cevap süresidir.
      if (gap > MAX_REPLY_GAP) p.initiations++;
      else {
        p._replies.push(gap);
        if (gap > 0 && (!fastestReply || gap < fastestReply.ms)) fastestReply = { ms: gap, by: m.author };
      }
    }
    if (!longestStreak || streak > longestStreak.count) longestStreak = { count: streak, by: m.author };
  });

  const list: PersonStats[] = [...people.values()]
    .sort((a, b) => b.messages - a.messages)
    .map(({ _replies, _hours, _emoji, ...p }) => {
      const sorted = [..._replies].sort((a, b) => a - b);
      const textMessages = p.messages - p.media;
      const busiest = _hours.indexOf(Math.max(..._hours));
      const topEmoji = [..._emoji.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        ...p,
        avgWords: textMessages ? Math.round((p.words / textMessages) * 10) / 10 : 0,
        medianReplyMs: sorted.length ? sorted[Math.floor(sorted.length / 2)] : null,
        busiestHour: p.messages ? busiest : null,
        topEmoji,
      };
    });

  const first = msgs[0].time;
  const last = msgs[msgs.length - 1].time;
  return {
    totalMessages: msgs.length,
    firstMessage: first,
    lastMessage: last,
    spanDays: Math.max(1, Math.round((last.getTime() - first.getTime()) / DAY) + 1),
    activeDays: days.size,
    isGroup: list.length > 2,
    people: list,
    longestSilence,
    fastestReply,
    longestStreak,
    totalLaughs: list.reduce((n, p) => n + p.laughs, 0),
  };
}

// Süre birimleri dil dosyasından gelir. i18n React Native'e bağlı olduğu için
// tembel yüklenir; yüklenemezse (Node testleri) Türkçe metin kullanılır.
type DurationKey = keyof typeof trStory.duration;
let translate: typeof import('../../i18n').t | null | undefined;
function dur(key: DurationKey, params: Record<string, number>): string {
  if (translate === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      translate = (require('../../i18n') as typeof import('../../i18n')).t;
    } catch {
      translate = null;
    }
  }
  if (translate) return translate(`story.duration.${key}`, params);
  return trStory.duration[key].replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''));
}

/** "3 sa 12 dk" gibi okunur süre (birim her zaman yazılır). */
export function formatDuration(ms: number): string {
  if (ms < MIN) return dur('sec', { n: Math.max(1, Math.round(ms / 1000)) });
  if (ms < HOUR) return dur('min', { n: Math.round(ms / MIN) });
  if (ms < DAY) {
    const h = Math.floor(ms / HOUR);
    const m = Math.round((ms % HOUR) / MIN);
    return m ? dur('hourMin', { h, m }) : dur('hour', { h });
  }
  const d = Math.floor(ms / DAY);
  const h = Math.round((ms % DAY) / HOUR);
  return h ? dur('dayHour', { d, h }) : dur('day', { d });
}
