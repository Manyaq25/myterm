// Rozetler: kullanım günleri, analizler, eğlenceli istatistikler ve etkinliklerden kazanılır.
// Saf modül (React Native ve i18n yok); Node testlerinde de çalışır. Metinler badges.* anahtarlarında.
import { streaks, type Activity } from './days';
import type { MyStats } from './stats';

export type Gender = 'kadin' | 'erkek' | 'notr';
export type Tier = 'bronze' | 'silver' | 'gold' | 'legend';
export type BadgeCategory = 'days' | 'streak' | 'analyses' | 'fun' | 'engagement';
export type Badge = {
  id: string;
  emoji: string;
  tier: Tier;
  category: BadgeCategory;
  earned: boolean;
  progress: { value: number; target: number };
  /** Cinsiyete göre .f/.m/.n uzantısı alır mı (badgeTitleKey çözer). */
  gendered: boolean;
  titleKey: string;
  descKey: string;
};

export type BadgeInput = {
  activity: Activity;
  stats: MyStats | null;
  analysesCount: number;
  /** İlişki türüne göre analiz sayısı ("sevgili": 2, "grup": 1 …). */
  relationCounts: Record<string, number>;
  gender: Gender;
};

export const TIER_RANK: Record<Tier, number> = { bronze: 1, silver: 2, gold: 3, legend: 4 };
// Aynı seviyede hangi rozet unvan olur: önce analiz, sonra kullanım …
const CATEGORY_RANK: Record<BadgeCategory, number> = { analyses: 5, days: 4, streak: 3, fun: 2, engagement: 1 };

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
// relations.ts ile aynı küme (o dosya i18n yüklediği için içe aktarılmaz).
const ROMANTIC = ['sevgili', 'es', 'nisanli', 'flort', 'crush', 'situationship', 'eski'];

type Ctx = BadgeInput & { longestStreak: number; distinctDays: number };
type Def = {
  id: string;
  emoji: string;
  tier: Tier;
  category: BadgeCategory;
  target: number;
  gendered?: boolean;
  /** Mevcut değer; veri yoksa 0. */
  value: (c: Ctx) => number;
  /** Varsayılan: value >= target. */
  earned?: (c: Ctx) => boolean;
};

const count = (c: Ctx, k: string) => c.activity.counts[k] ?? 0;
const rel = (c: Ctx, ...keys: string[]) => keys.reduce((n, k) => n + (c.relationCounts[k] ?? 0), 0);
const ladder = (
  category: BadgeCategory,
  value: (c: Ctx) => number,
  steps: [id: string, emoji: string, tier: Tier, target: number, gendered?: boolean][],
): Def[] => steps.map(([id, emoji, tier, target, gendered]) => ({ id, emoji, tier, category, target, gendered, value }));
// Saatin aralıkta olması gibi evet/hayır rozetleri
const flag = (ok: (c: Ctx) => boolean) => (c: Ctx) => (ok(c) ? 1 : 0);

export const BADGE_DEFS: Def[] = [
  // Kaç farklı günde açıldı
  ...ladder('days', (c) => c.distinctDays, [
    ['days_3', '🌱', 'bronze', 3],
    ['days_7', '📅', 'silver', 7],
    ['days_30', '💎', 'gold', 30],
    ['days_100', '🌟', 'legend', 100],
    ['days_365', '🏆', 'legend', 365],
  ]),
  // Arka arkaya günler (en uzun seri)
  ...ladder('streak', (c) => c.longestStreak, [
    ['streak_3', '🔥', 'bronze', 3],
    ['streak_7', '🔥', 'silver', 7],
    ['streak_30', '☄️', 'gold', 30, true],
  ]),
  // Analizler
  ...ladder('analyses', (c) => c.analysesCount, [
    ['analyses_1', '👣', 'bronze', 1],
    ['analyses_5', '🔍', 'silver', 5],
    ['analyses_10', '🕵️', 'silver', 10],
    ['analyses_25', '👑', 'gold', 25, true],
    ['analyses_50', '🎓', 'legend', 50],
  ]),
  // Eğlenceli istatistikler (yalnız veri varsa)
  ...ladder('fun', (c) => c.stats?.laughs ?? 0, [
    ['laughs_100', '😄', 'bronze', 100],
    ['laughs_500', '😂', 'gold', 500],
  ]),
  ...ladder('fun', (c) => c.stats?.messages ?? 0, [
    ['messages_1000', '🗣️', 'bronze', 1000],
    ['messages_10000', '⌨️', 'gold', 10000, true],
  ]),
  { id: 'night_owl', emoji: '🦉', tier: 'silver', category: 'fun', target: 30, value: (c) => c.stats?.nightOwlPct ?? 0 },
  {
    id: 'speed_demon', emoji: '⚡', tier: 'gold', category: 'fun', target: 1,
    value: flag((c) => c.stats?.medianReplyMs != null && c.stats.medianReplyMs < 2 * MIN),
  },
  { id: 'ghosting_master', emoji: '👻', tier: 'silver', category: 'fun', target: 3, value: (c) => Math.floor((c.stats?.ghosting?.ms ?? 0) / DAY) },
  { id: 'wordsmith', emoji: '📜', tier: 'silver', category: 'fun', target: 100, value: (c) => c.stats?.longestMessageWords ?? 0 },
  { id: 'emoji_artist', emoji: '🎨', tier: 'silver', category: 'fun', target: 100, value: (c) => c.stats?.favoriteEmoji?.count ?? 0 },
  { id: 'starter', emoji: '🚀', tier: 'silver', category: 'fun', target: 60, value: (c) => c.stats?.initiationPct ?? 0 },
  { id: 'double_texter', emoji: '📲', tier: 'silver', category: 'fun', target: 50, value: (c) => c.stats?.doubleTexts ?? 0 },
  {
    id: 'midnight', emoji: '🌙', tier: 'bronze', category: 'fun', target: 1,
    value: flag((c) => c.stats?.busiestHour != null && c.stats.busiestHour >= 0 && c.stats.busiestHour < 5),
  },
  {
    id: 'early_bird', emoji: '🐦', tier: 'bronze', category: 'fun', target: 1,
    value: flag((c) => c.stats?.busiestHour != null && c.stats.busiestHour >= 5 && c.stats.busiestHour < 10),
  },
  // İlişki türleri
  { id: 'romantic', emoji: '💘', tier: 'silver', category: 'fun', target: 3, value: (c) => rel(c, ...ROMANTIC) },
  { id: 'social_butterfly', emoji: '🦋', tier: 'silver', category: 'fun', target: 3, value: (c) => rel(c, 'grup') },
  { id: 'bestie', emoji: '👯', tier: 'bronze', category: 'fun', target: 2, value: (c) => rel(c, 'bestie', 'arkadas') },
  { id: 'family', emoji: '🏡', tier: 'bronze', category: 'fun', target: 2, value: (c) => rel(c, 'aile') },
  { id: 'past_facer', emoji: '💔', tier: 'bronze', category: 'fun', target: 1, value: (c) => rel(c, 'eski') },
  // Etkinlik
  ...ladder('engagement', (c) => count(c, 'mila_question'), [
    ['mila_10', '🤗', 'bronze', 10],
    ['mila_50', '💬', 'gold', 50],
  ]),
  ...ladder('engagement', (c) => count(c, 'card_shared'), [
    ['share_1', '📤', 'bronze', 1],
    ['share_10', '📣', 'silver', 10],
  ]),
  ...ladder('engagement', (c) => count(c, 'report_opened'), [
    ['reports_5', '📖', 'bronze', 5],
    ['reports_20', '📚', 'silver', 20],
  ]),
  { id: 'profile_share', emoji: '🪪', tier: 'bronze', category: 'engagement', target: 1, value: (c) => count(c, 'profile_shared') },
];

export function computeBadges(input: BadgeInput): Badge[] {
  const ctx: Ctx = { ...input, longestStreak: streaks(input.activity.days).longest, distinctDays: new Set(input.activity.days).size };
  return BADGE_DEFS.map((d) => {
    const raw = d.value(ctx);
    const value = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    const earned = d.earned ? d.earned(ctx) : value >= d.target;
    return {
      id: d.id,
      emoji: d.emoji,
      tier: d.tier,
      category: d.category,
      earned,
      // Çubuk hedefte durur
      progress: { value: Math.min(value, d.target), target: d.target },
      gendered: !!d.gendered,
      titleKey: `badges.items.${d.id}.title`,
      descKey: `badges.items.${d.id}.desc`,
    };
  });
}

/** Son i18n anahtarı: cinsiyetli unvanlarda .f (kadın) / .m (erkek) / .n (nötr). */
export function badgeTitleKey(badge: Pick<Badge, 'titleKey' | 'gendered'>, gender: Gender): string {
  if (!badge.gendered) return badge.titleKey;
  return `${badge.titleKey}.${gender === 'kadin' ? 'f' : gender === 'erkek' ? 'm' : 'n'}`;
}

const score = (b: Badge) => TIER_RANK[b.tier] * 10_000 + CATEGORY_RANK[b.category] * 1_000 + Math.min(b.progress.target, 999);

/** Kazanılmış rozetler, en değerliden başlayarak. */
export const rankBadges = (badges: Badge[]) => badges.filter((b) => b.earned).sort((x, y) => score(y) - score(x));

/** Ad altında gösterilecek unvan: en yüksek seviyeli kazanılmış rozet. */
export const bestBadge = (badges: Badge[]): Badge | null => rankBadges(badges)[0] ?? null;

/** Profilden okunan cinsiyet; bilinmeyen değer nötr sayılır. */
export const toGender = (g: unknown): Gender => (g === 'kadin' || g === 'erkek' ? g : 'notr');
