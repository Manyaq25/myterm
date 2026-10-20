// Ücretsiz hikâye kartları: telefondaki istatistiklerden, yapay zekâsız.
// Altyazılar sayıya göre seçilir; veriyle çelişen hazır cümle yok.
import { lang, locale, t, tl } from '@/i18n';
import { colors } from '@/theme';

import { formatDuration, type ChatStats, type PersonStats } from '../chat/stats';
import { isRomantic } from '../relations';
import type { Relation } from '../store';

export type Row = { name: string; value: number; display: string; note?: string };

export type Card =
  | { id: string; kind: 'rows'; title: string; bg: string; rows: Row[]; caption: string; unit?: string }
  | { id: string; kind: 'big'; title: string; bg: string; value: string; unit: string; caption: string }
  | { id: string; kind: 'awards'; title: string; bg: string; awards: { emoji: string; title: string; name: string }[]; caption: string }
  | { id: string; kind: 'teaser'; title: string; bg: string; items: string[] }
  | { id: string; kind: 'karne'; title: string; bg: string; names: string[]; subjects: { subject: string; grades: (number | null)[] }[]; caption: string };

const pct = (a: number, total: number) => (total ? Math.round((a / total) * 100) : 0);

// Yüzdeleri 100'e tamamlayarak dağıtır (en büyük kalan yöntemi).
export function percentages(values: number[]): number[] {
  const total = values.reduce((s, v) => s + v, 0);
  if (!total) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floor = raw.map(Math.floor);
  let rest = 100 - floor.reduce((s, v) => s + v, 0);
  const order = raw.map((v, i) => [v - floor[i], i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest-- <= 0) break;
    floor[i]++;
  }
  return floor;
}

const top = (people: PersonStats[], key: (p: PersonStats) => number) =>
  [...people].sort((a, b) => key(b) - key(a));

function initiationCard(s: ChatStats): Card {
  const people = top(s.people, (p) => p.initiations).slice(0, 4);
  const total = people.reduce((n, p) => n + p.initiations, 0);
  const lead = people[0];
  const share = pct(lead.initiations, total);
  const caption =
    total < 2 ? t('story.initiation.captionNew')
    : share >= 70 ? t('story.initiation.captionLead', { name: lead.name })
    : share >= 55 ? t('story.initiation.captionKeen', { name: lead.name })
    : t('story.initiation.captionBalanced');
  return {
    id: 'baslatma', kind: 'rows', title: t('story.initiation.title'), bg: colors.cardPeach, caption, unit: t('story.initiation.unit'),
    rows: people.map((p) => ({ name: p.name, value: p.initiations, display: String(p.initiations) })),
  };
}

function messageCountCard(s: ChatStats): Card {
  const people = s.people.slice(0, 5);
  const shares = percentages(people.map((p) => p.messages));
  const lead = people[0];
  const caption = s.isGroup
    ? t('story.messages.captionGroup', { name: lead.name })
    : shares[0] >= 65 ? t('story.messages.captionLead', { name: lead.name })
    : t('story.messages.captionBalanced');
  return {
    id: 'mesaj', kind: 'rows', title: t('story.messages.title'), bg: colors.cardLilac, caption,
    rows: people.map((p, i) => ({ name: p.name, value: p.messages, display: (shares[i] / 100).toLocaleString(locale(), { style: 'percent' }), note: t('story.messages.note', { count: p.messages.toLocaleString(locale()) }) })),
  };
}

function replyCard(s: ChatStats): Card | null {
  const people = s.people.filter((p) => p.medianReplyMs != null).slice(0, 4);
  if (people.length < 2) return null;
  const sorted = [...people].sort((a, b) => a.medianReplyMs! - b.medianReplyMs!);
  const fast = sorted[0];
  const slow = sorted[sorted.length - 1];
  const ratio = slow.medianReplyMs! / Math.max(fast.medianReplyMs!, 1000);
  const caption =
    ratio < 2 ? t('story.reply.captionClose')
    : ratio < 10 ? t('story.reply.captionFaster', { fast: fast.name, slow: slow.name })
    : t('story.reply.captionSlow', { name: slow.name });
  return {
    id: 'cevap', kind: 'rows', title: t('story.reply.title'), bg: colors.cardButter, caption,
    rows: sorted.map((p) => ({ name: p.name, value: -p.medianReplyMs!, display: formatDuration(p.medianReplyMs!) })),
  };
}

function daysCard(s: ChatStats, relation: Relation | null): Card {
  const seasons = Math.floor(s.spanDays / 91);
  const caption =
    s.spanDays < 30 ? t('story.days.captionNew')
    : seasons >= 4 ? t('story.days.captionSeasons', { seasons })
    : t('story.days.captionActive', { days: s.activeDays.toLocaleString(locale()) });
  return {
    id: 'gun', kind: 'big', title: isRomantic(relation) ? t('story.days.titleRomantic') : t('story.days.title'),
    bg: colors.cardCoral, value: s.spanDays.toLocaleString(locale()), unit: t('story.days.unit'), caption,
  };
}

function laughCard(s: ChatStats): Card | null {
  if (s.totalLaughs < 3) return null;
  const people = top(s.people, (p) => p.laughs).slice(0, 4);
  return {
    id: 'gulme', kind: 'rows', title: t('story.laugh.title'), bg: colors.cardButter, unit: t('story.laugh.unit'),
    caption: t('story.laugh.caption', { total: s.totalLaughs.toLocaleString(locale()), name: people[0].name }),
    rows: people.map((p) => ({ name: p.name, value: p.laughs, display: String(p.laughs) })),
  };
}

function silenceCard(s: ChatStats): Card | null {
  const sil = s.longestSilence;
  if (!sil || sil.ms < 6 * 60 * 60 * 1000) return null;
  const date = sil.at.toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  return {
    id: 'sessizlik', kind: 'big', title: t('story.silence.title'), bg: colors.cardLilac,
    value: formatDuration(sil.ms), unit: '',
    caption: t('story.silence.caption', { name: sil.brokenBy, date }),
  };
}

function emojiCard(s: ChatStats): Card | null {
  const people = s.people.filter((p) => p.topEmoji).slice(0, 4);
  if (!people.length) return null;
  return {
    id: 'emoji', kind: 'rows', title: t('story.emoji.title'), bg: colors.cardMint,
    caption: t('story.emoji.caption'),
    rows: people.map((p) => ({ name: p.name, value: p.emojis, display: p.topEmoji!, note: t('story.emoji.note', { count: p.emojis.toLocaleString(locale()) }) })),
  };
}

function nightCard(s: ChatStats): Card | null {
  const people = top(s.people, (p) => p.nightMessages).filter((p) => p.nightMessages > 0).slice(0, 3);
  if (!people.length) return null;
  return {
    id: 'gece', kind: 'rows', title: t('story.night.title'), bg: colors.cardLilac, unit: t('story.night.unit'),
    caption: t('story.night.caption'),
    rows: people.map((p) => ({ name: p.name, value: p.nightMessages, display: String(p.nightMessages) })),
  };
}

function wordsCard(s: ChatStats): Card {
  const people = top(s.people, (p) => p.avgWords).slice(0, 4);
  return {
    id: 'kelime', kind: 'rows', title: t('story.words.title'), bg: colors.cardPeach,
    caption: people[0].avgWords >= 8 ? t('story.words.captionLong', { name: people[0].name }) : t('story.words.captionShort'),
    rows: people.map((p) => ({ name: p.name, value: p.avgWords, display: p.avgWords.toLocaleString(locale()) })),
  };
}

// "aynen" ve noktalı "Tamam." Türkçe sözcükler: kart yalnız Türkçe arayüzde.
function signalsCard(s: ChatStats): Card | null {
  if (lang() !== 'tr') return null;
  const people = s.people.slice(0, 4).filter((p) => p.aynen > 0 || p.coldTamam > 0);
  if (!people.length) return null;
  const anyTamam = people.some((p) => p.coldTamam > 0);
  return {
    id: 'aynen', kind: 'rows', title: t('story.signals.title'), bg: colors.cardCoral,
    rows: people.map((p) => ({
      name: p.name, value: p.aynen + p.coldTamam, display: String(p.aynen + p.coldTamam),
      note: t('story.signals.note', { aynen: p.aynen, tamam: p.coldTamam }),
    })),
    caption: anyTamam ? t('story.signals.captionTamam') : t('story.signals.captionAynen'),
  };
}

// Telefonda, istatistikten hesaplanan karne (yapay zekâ karnesi Pro'da).
const clampGrade = (n: number) => Math.min(5, Math.max(1, Math.round(n)));
const per100 = (n: number, total: number) => (total ? (n / total) * 100 : 0);

function karneCard(s: ChatStats): Card | null {
  if (s.isGroup || s.people.length < 2) return null;
  const people = s.people.slice(0, 2);
  const totalMsg = people.reduce((n, p) => n + p.messages, 0);
  const totalInit = people.reduce((n, p) => n + p.initiations, 0) || 1;
  const ilgi = people.map((p) => clampGrade(((p.messages / totalMsg) * 0.5 + (p.initiations / totalInit) * 0.5) * 5 + 0.5));
  const hiz = people.map((p) => {
    const m = p.medianReplyMs;
    if (m == null) return null;
    return m < 2 * 60e3 ? 5 : m < 10 * 60e3 ? 4 : m < 60 * 60e3 ? 3 : m < 4 * 3600e3 ? 2 : 1;
  });
  const espri = people.map((p) => {
    const r = per100(p.laughs, p.messages);
    return r >= 15 ? 5 : r >= 8 ? 4 : r >= 4 ? 3 : r >= 1 ? 2 : 1;
  });
  const trip = people.map((p) => {
    const r = per100(p.coldTamam, p.messages);
    return r >= 3 ? 5 : r >= 1.5 ? 4 : r >= 0.7 ? 3 : r > 0 ? 2 : 1;
  });
  const best = people[ilgi[0] >= ilgi[1] ? 0 : 1].name;
  return {
    id: 'karne', kind: 'karne', title: t('story.karne.title'), bg: colors.cardButter,
    names: people.map((p) => p.name),
    subjects: [
      { subject: t('story.karne.interest'), grades: ilgi },
      { subject: t('story.karne.replySpeed'), grades: hiz },
      { subject: t('story.karne.humor'), grades: espri },
      { subject: t('story.karne.trip'), grades: trip },
    ],
    caption: t('story.karne.caption', { name: best }),
  };
}

function streakCard(s: ChatStats): Card | null {
  const st = s.longestStreak;
  if (!st || st.count < 4) return null;
  return {
    id: 'seri', kind: 'big', title: t('story.streak.title'), bg: colors.cardMint,
    value: st.count.toLocaleString(locale()), unit: t('story.streak.unit'), caption: t('story.streak.caption', { name: st.by }),
  };
}

function groupAwardsCard(s: ChatStats): Card | null {
  if (!s.isGroup) return null;
  const awards: { emoji: string; title: string; name: string }[] = [];
  const by = (k: (p: PersonStats) => number) => top(s.people, k)[0];
  awards.push({ emoji: '🎤', title: t('story.awards.talker'), name: s.people[0].name });
  awards.push({ emoji: '🚂', title: t('story.awards.organizer'), name: by((p) => p.initiations).name });
  const emoji = by((p) => p.emojis);
  if (emoji.emojis > 0) awards.push({ emoji: '🎨', title: t('story.awards.emoji'), name: emoji.name });
  const laugh = by((p) => p.laughs);
  if (laugh.laughs > 0) awards.push({ emoji: '😂', title: t('story.awards.joy'), name: laugh.name });
  const night = by((p) => p.nightMessages);
  if (night.nightMessages > 0) awards.push({ emoji: '🦉', title: t('story.awards.night'), name: night.name });
  const quiet = [...s.people].sort((a, b) => a.messages - b.messages)[0];
  awards.push({ emoji: '🤫', title: t('story.awards.quiet'), name: quiet.name });
  return { id: 'odul', kind: 'awards', title: t('story.awards.title'), bg: colors.cardButter, awards, caption: t('story.awards.caption') };
}

export function buildFreeCards(s: ChatStats, relation: Relation | null): Card[] {
  const cards = [
    karneCard(s),
    initiationCard(s),
    messageCountCard(s),
    replyCard(s),
    daysCard(s, relation),
    laughCard(s),
    silenceCard(s),
    emojiCard(s),
    nightCard(s),
    wordsCard(s),
    signalsCard(s),
    streakCard(s),
    groupAwardsCard(s),
  ].filter((c): c is Card => c !== null);

  const romantic = isRomantic(relation);
  cards.push({
    id: 'pro', kind: 'teaser', title: t('story.teaser.title'), bg: colors.cardLilac,
    items: tl(romantic ? 'story.teaser.romantic' : 'story.teaser.other'),
  });
  return cards;
}
