// Rozet testi: npx tsx scripts/test-badges.ts
import assert from 'node:assert/strict';
import { badgeTitleKey, bestBadge, computeBadges, rankBadges, toGender, type Badge, type BadgeInput } from '../src/lib/profile/badges';
import { localDay, normalizeActivity, streaks, withBump, withOpenDay, emptyActivity, MAX_DAYS } from '../src/lib/profile/days';
import type { MyStats } from '../src/lib/profile/stats';
import tr from '../src/i18n/locales/tr/badges';
import en from '../src/i18n/locales/en/badges';

const get = (bs: Badge[], id: string) => {
  const b = bs.find((x) => x.id === id);
  assert.ok(b, `${id} yok`);
  return b;
};

// Ardışık günler (ay ve yıl geçişi)
const range = (start: string, n: number) => {
  const [y, m, d] = start.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => localDay(new Date(y, m - 1, d + i)));
};

// --- seri hesabı
assert.deepEqual(streaks([]), { longest: 0, last: 0 });
assert.deepEqual(streaks(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']), { longest: 4, last: 4 });
assert.deepEqual(streaks(['2025-12-30', '2025-12-31', '2026-01-01']), { longest: 3, last: 3 });
// artık yıl: 28 Şubat → 29 Şubat → 1 Mart
assert.deepEqual(streaks(['2024-02-28', '2024-02-29', '2024-03-01']), { longest: 3, last: 3 });
// 2026'da 29 Şubat yok: 28 Şubat → 1 Mart ardışık
assert.equal(streaks(['2026-02-28', '2026-03-01']).longest, 2);
// boşluk seriyi böler; tekrarlar ve sıra fark etmez
assert.deepEqual(streaks(['2026-03-05', '2026-03-01', '2026-03-02', '2026-03-02', '2026-03-03']), { longest: 3, last: 1 });
// yaz saati geçişi (Avrupa: 29 Mart 2026)
assert.equal(streaks(range('2026-03-27', 5)).longest, 5);
assert.deepEqual(range('2026-10-30', 4), ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);

// --- etkinlik kaydı
let act = emptyActivity();
act = withOpenDay(act, new Date(2026, 9, 22, 9));
const same = withOpenDay(act, new Date(2026, 9, 22, 23, 59));
assert.equal(same, act, 'aynı gün ikinci kez yazılmaz');
act = withOpenDay(act, new Date(2026, 9, 23, 0, 1));
assert.deepEqual(act.days, ['2026-10-22', '2026-10-23']);
act = withBump(withBump(act, 'mila_question'), 'mila_question');
assert.equal(act.counts.mila_question, 2);
const many = normalizeActivity({ days: [...range('2020-01-01', MAX_DAYS + 50), 'bozuk', 5], counts: { a: 3, b: 'x', c: -1 } });
assert.equal(many.days.length, MAX_DAYS);
assert.equal(many.days[0], localDay(new Date(2020, 0, 51)), 'en eski günler atılır');
assert.deepEqual(many.counts, { a: 3 });
assert.deepEqual(normalizeActivity(null), emptyActivity());

// --- rozetler
const stats: MyStats = {
  chats: 3, messages: 12_345, topPerson: null, favoriteWord: null, favoriteEmoji: { emoji: '😂', count: 40 },
  happiestMoment: null, mostEmotionalDay: null, ghosting: { ms: 4 * 86_400_000, chat: 'x' }, medianReplyMs: 90_000,
  nightOwlPct: 35, doubleTexts: 12, initiationPct: 59, laughs: 620, longestMessageWords: 100, busiestHour: 2,
  firstMessageDate: null, ai: [], karneAvg: null,
};
const base: BadgeInput = {
  activity: { days: range('2026-09-28', 8), counts: { mila_question: 11, card_shared: 1, report_opened: 4 } },
  stats,
  analysesCount: 26,
  relationCounts: { sevgili: 2, eski: 1, grup: 1, arkadas: 1, bestie: 1 },
  gender: 'kadin',
};
const bs = computeBadges(base);
assert.ok(bs.length >= 30, `en az 30 rozet: ${bs.length}`);
assert.equal(new Set(bs.map((b) => b.id)).size, bs.length, 'kimlikler tekil');

const expectEarned: [string, boolean][] = [
  ['days_3', true], ['days_7', true], ['days_30', false],
  ['streak_3', true], ['streak_7', true], ['streak_30', false],
  ['analyses_1', true], ['analyses_10', true], ['analyses_25', true], ['analyses_50', false],
  ['laughs_100', true], ['laughs_500', true], ['messages_1000', true], ['messages_10000', true],
  ['night_owl', true], ['speed_demon', true], ['ghosting_master', true], ['wordsmith', true],
  ['emoji_artist', false], ['starter', false], ['double_texter', false], ['midnight', true], ['early_bird', false],
  ['romantic', true], ['social_butterfly', false], ['bestie', true], ['family', false], ['past_facer', true],
  ['mila_10', true], ['mila_50', false], ['share_1', true], ['share_10', false], ['reports_5', false], ['profile_share', false],
];
for (const [id, e] of expectEarned) assert.equal(get(bs, id).earned, e, `${id} earned=${e}`);

// ilerleme: değer hedefte durur
assert.deepEqual(get(bs, 'days_30').progress, { value: 8, target: 30 });
assert.deepEqual(get(bs, 'days_3').progress, { value: 3, target: 3 });
assert.deepEqual(get(bs, 'analyses_50').progress, { value: 26, target: 50 });
assert.deepEqual(get(bs, 'reports_5').progress, { value: 4, target: 5 });
assert.deepEqual(get(bs, 'starter').progress, { value: 59, target: 60 });
assert.deepEqual(get(bs, 'social_butterfly').progress, { value: 1, target: 3 });
assert.equal(get(bs, 'analyses_25').tier, 'gold');
assert.equal(get(bs, 'days_365').tier, 'legend');

// veri yoksa istatistik rozetleri açılmaz
const empty = computeBadges({ activity: emptyActivity(), stats: null, analysesCount: 0, relationCounts: {}, gender: 'notr' });
assert.equal(empty.filter((b) => b.earned).length, 0);
assert.equal(bestBadge(empty), null);
assert.ok(empty.every((b) => b.progress.value === 0));
// 2 dakika sınırı
const slow = computeBadges({ ...base, stats: { ...stats, medianReplyMs: 120_000 } });
assert.equal(get(slow, 'speed_demon').earned, false);

// --- cinsiyetli unvanlar
const queen = get(bs, 'analyses_25');
assert.equal(queen.gendered, true);
assert.equal(badgeTitleKey(queen, 'kadin'), 'badges.items.analyses_25.title.f');
assert.equal(badgeTitleKey(queen, 'erkek'), 'badges.items.analyses_25.title.m');
assert.equal(badgeTitleKey(queen, 'notr'), 'badges.items.analyses_25.title.n');
assert.equal(badgeTitleKey(get(bs, 'days_7'), 'kadin'), 'badges.items.days_7.title');
assert.equal(toGender('erkek'), 'erkek');
assert.equal(toGender(undefined), 'notr');
assert.equal(toGender('baska'), 'notr');

// her rozetin metni tr ve en'de var; cinsiyetliler f/m/n taşır
const lookup = (d: unknown, key: string) => key.split('.').slice(1).reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined), d);
for (const b of bs) {
  for (const [name, dict] of [['tr', tr], ['en', en]] as const) {
    assert.equal(typeof lookup(dict, b.descKey), 'string', `${name} ${b.descKey}`);
    for (const g of ['kadin', 'erkek', 'notr'] as const) assert.equal(typeof lookup(dict, badgeTitleKey(b, g)), 'string', `${name} ${badgeTitleKey(b, g)}`);
  }
}
assert.equal(lookup(tr, 'badges.items.analyses_25.title.f'), 'Analiz Kraliçesi');
assert.equal(lookup(tr, 'badges.items.analyses_25.title.m'), 'Analiz Kralı');

// --- en iyi rozet: en yüksek seviye; eşitlikte analiz rozeti
// legend yokken altınlar: analyses_25 (analiz) > laughs_500 / messages_10000 / speed_demon (eğlenceli)
assert.equal(bestBadge(bs)?.id, 'analyses_25');
const ranked = rankBadges(bs);
assert.ok(ranked.every((b) => b.earned));
assert.equal(ranked[0].id, 'analyses_25');
const legend = computeBadges({ ...base, analysesCount: 50 });
assert.equal(bestBadge(legend)?.id, 'analyses_50');
const daysOnly = computeBadges({ activity: { days: range('2026-01-01', 8), counts: {} }, stats: null, analysesCount: 0, relationCounts: {}, gender: 'notr' });
assert.equal(bestBadge(daysOnly)?.id, 'days_7', 'gümüşlerde kullanım > seri');

console.log(`${bs.length} rozet, ${bs.filter((b) => b.earned).length} kazanıldı`);
console.log('ROZET TESTLERI GEÇTİ');
