import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ExtensionStorage } from '@bacons/apple-targets';
import { listFollowUps } from '../db/queries';
import { isOverdue } from '../utils/date';
import { groupFollowUpsByPerson } from '../utils/grouping';
import type { FollowUpWithPerson } from '../types';

// app.json'daki ios.entitlements ve targets/widget/expo-target.config.js ile
// aynı App Group olmalı.
const APP_GROUP = 'group.com.manyaq25.benimyerimetakipet';

function buildTodaySummary(items: FollowUpWithPerson[]): string {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const relevant = items
    .filter((i) => i.dueAt !== null && i.dueAt <= endOfToday.getTime())
    .sort((a, b) => a.dueAt! - b.dueAt!);
  if (relevant.length === 0) return 'Bugün için unutman gereken bir şey yok, listen temiz.';

  const overdueCount = relevant.filter((i) => isOverdue(i.dueAt)).length;
  const lines = relevant.slice(0, 5).map((i) => (i.personName ? `${i.title} (${i.personName})` : i.title));
  const intro =
    overdueCount > 0
      ? `${relevant.length} maddeyi unutmamalısın, ${overdueCount} tanesi gecikmiş: `
      : `Bugün ${relevant.length} maddeyi unutmamalısın: `;
  return intro + lines.join(', ') + (relevant.length > 5 ? ' ve daha fazlası.' : '.');
}

function buildGroupedSummary(
  items: FollowUpWithPerson[],
  emptyText: string,
  introFor: (count: number) => string,
  unitLabel: string
): string {
  if (items.length === 0) return emptyText;
  const groups = groupFollowUpsByPerson(items);
  const lines = groups.map((g) => `${g.personName}: ${g.items.length} ${unitLabel}`);
  return introFor(groups.length) + lines.join(', ') + '.';
}

/**
 * iOS Home Screen widget'ının ve Siri App Intent'lerinin okuduğu özeti
 * App Group üzerinden paylaşılan depoya yazar. Expo Go'da veya native
 * modülün henüz derlenmediği bir build'de bu no-op olarak çalışır (hata
 * fırlatmaz).
 */
export async function updateWidgetSummary(db: SQLiteDatabase): Promise<void> {
  if (Platform.OS !== 'ios') return;

  const items = await listFollowUps(db, ['open', 'snoozed']);
  const critical = items.filter((i) => isOverdue(i.dueAt)).length;
  const waitingOnItems = items.filter((i) => i.type === 'waiting_on');
  const promisedItems = items.filter((i) => i.type === 'promise_made');

  const storage = new ExtensionStorage(APP_GROUP);
  storage.set('summary', { critical, total: items.length, waitingOn: waitingOnItems.length });
  storage.set('siriTodaySummary', buildTodaySummary(items));
  storage.set(
    'siriWaitingOnSummary',
    buildGroupedSummary(
      waitingOnItems,
      'Şu an kimseden bir şey beklemiyorsun.',
      (count) => `${count} kişiden bir şeyler bekliyorsun — `,
      'madde'
    )
  );
  storage.set(
    'siriPromisedSummary',
    buildGroupedSummary(
      promisedItems,
      'Şu an kimseye açık bir sözün yok.',
      (count) => `${count} kişiye söz verdin — `,
      'söz'
    )
  );
  ExtensionStorage.reloadWidget();
}
