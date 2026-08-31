import type { FollowUp, FollowUpType } from '../types';

// En az bu kadar madde olmadan bir "genellikle" örüntüsü çıkarmıyoruz —
// tek bir maddeden istatistik üretmek yanıltıcı olur.
const MIN_ITEMS_FOR_PATTERN = 2;
// Ortak konu kelimesi çıkarmak için bir kelimenin en az bu kadar farklı
// maddede geçmesi gerekiyor.
const MIN_TOPIC_OCCURRENCES = 2;

const STOPWORDS = new Set([
  've', 'ile', 'için', 'bir', 'bu', 'şu', 'de', 'da', 'ki', 'mi', 'mı', 'mu', 'mü',
  'ama', 'fakat', 'ya', 'veya', 'çok', 'daha', 'en', 'her', 'gibi', 'kadar', 'diye',
  'olan', 'olarak', 'göre', 'sonra', 'önce', 'ise', 'ne', 'hep', 'hiç', 'yine',
  'artık', 'tekrar', 'ona', 'onu', 'ondan', 'onun', 'bana', 'beni', 'benim',
]);

export interface PersonInsight {
  type: Extract<FollowUpType, 'waiting_on' | 'promise_made'>;
  count: number;
  /** Gecikmeli tamamlanan maddelerin ortalama gecikme günü — hiç gecikme yoksa null. */
  averageDelayDays: number | null;
  /** Maddelerin çoğunda tekrar eden anahtar kelime — yoksa null. */
  commonTopic: string | null;
}

function extractCommonTopic(items: FollowUp[]): string | null {
  const counts = new Map<string, number>();
  for (const item of items) {
    const words = item.title
      .toLocaleLowerCase('tr-TR')
      .replace(/[^a-zçğıöşü0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
    for (const word of new Set(words)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = MIN_TOPIC_OCCURRENCES - 1;
  for (const [word, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = word;
    }
  }
  return best;
}

function averageDelayDays(items: FollowUp[]): number | null {
  const late = items.filter(
    (i) => i.dueAt !== null && i.completedAt !== null && i.completedAt > i.dueAt
  );
  if (late.length === 0) return null;
  const totalDays = late.reduce((sum, i) => sum + (i.completedAt! - i.dueAt!) / 86400000, 0);
  return Math.max(1, Math.round(totalDays / late.length));
}

function buildInsightForType(
  items: FollowUp[],
  type: PersonInsight['type']
): PersonInsight | null {
  const filtered = items.filter((i) => i.type === type);
  if (filtered.length < MIN_ITEMS_FOR_PATTERN) return null;
  return {
    type,
    count: filtered.length,
    averageDelayDays: averageDelayDays(filtered),
    commonTopic: extractCommonTopic(filtered),
  };
}

/**
 * Bir kişiyle ilgili tamamen yerel, deterministik örüntü özetleri üretir —
 * AI çağrısı yapmaz, kullanıcının kendi geçmiş verisinin basit bir istatistik
 * özetidir (madde sayısı, ortalama gecikme, tekrar eden konu kelimesi).
 */
export function buildPersonInsights(items: FollowUp[]): PersonInsight[] {
  const waiting = buildInsightForType(items, 'waiting_on');
  const promised = buildInsightForType(items, 'promise_made');
  return [waiting, promised].filter((i): i is PersonInsight => i !== null);
}

export function formatInsightText(insight: PersonInsight): string {
  const topicPart = insight.commonTopic ? ` (çoğunlukla "${insight.commonTopic}" ile ilgili)` : '';
  if (insight.type === 'waiting_on') {
    const delayPart =
      insight.averageDelayDays !== null
        ? ` Genelde ortalama ${insight.averageDelayDays} gün gecikiyor.`
        : ' Genelde zamanında geliyor.';
    return `Ondan şimdiye kadar ${insight.count} kez bir şey bekledin${topicPart}.${delayPart}`;
  }
  const delayPart =
    insight.averageDelayDays !== null
      ? ` Sözlerini ortalama ${insight.averageDelayDays} gün geç tutuyorsun.`
      : ' Sözlerini genelde zamanında tutuyorsun.';
  return `Ona şimdiye kadar ${insight.count} kez söz verdin${topicPart}.${delayPart}`;
}
