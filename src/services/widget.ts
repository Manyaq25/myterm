import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ExtensionStorage } from '@bacons/apple-targets';
import i18n from '../i18n';
import { listFollowUps } from '../db/queries';
import { isOverdue } from '../utils/date';
import { isPremiumNow } from './subscription';

// app.json'daki ios.entitlements ve targets/widget/expo-target.config.js ile
// aynı App Group olmalı.
const APP_GROUP = 'group.com.manyaq25.benimyerimetakipet';
const MAX_ITEMS = 4;

/**
 * iOS ana ekran widget'ının okuduğu veriyi App Group üzerinden paylaşılan
 * depoya JSON metni olarak yazar (anahtar: "widget"). Widget metinleri de burada, uygulamanın
 * dilinde hazırlanır; Swift tarafı yalnızca gösterir. Widget Premium özelliği:
 * Premium olmayanlarda yalnızca kilitli tanıtım görünümü için metinler yazılır,
 * gerçek veri yazılmaz. Expo Go'da veya widget'sız bir build'de no-op.
 */
export async function updateWidgetSummary(db: SQLiteDatabase): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const t = i18n.t.bind(i18n);
    const labels = {
      title: t('widget.title'),
      overdue: t('widget.overdue'),
      open: t('widget.open'),
      waiting: t('widget.waiting'),
      empty: t('widget.empty'),
      lockedTitle: t('widget.lockedTitle'),
      lockedBody: t('widget.lockedBody'),
      lockedCta: t('widget.lockedCta'),
    };
    const storage = new ExtensionStorage(APP_GROUP);

    if (!isPremiumNow()) {
      storage.set('widget', JSON.stringify({ premium: false, labels, overdue: 0, open: 0, waiting: 0, items: [] }));
      ExtensionStorage.reloadWidget();
      return;
    }

    const all = await listFollowUps(db, ['open', 'snoozed']);
    // Önce gecikenler, sonra tarihi en yakın olanlar, tarihsizler en sonda.
    const sorted = [...all].sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
    const items = sorted.slice(0, MAX_ITEMS).map((i) => ({
      id: i.id,
      title: i.title,
      person: i.personName ?? '',
      overdue: isOverdue(i.dueAt),
    }));
    storage.set(
      'widget',
      JSON.stringify({
        premium: true,
        labels,
        overdue: all.filter((i) => isOverdue(i.dueAt)).length,
        open: all.length,
        waiting: all.filter((i) => i.type === 'waiting_on').length,
        items,
      })
    );
    ExtensionStorage.reloadWidget();
  } catch {
    // Widget hedefi bu build'de yoksa (Expo Go vb.) sessizce geç.
  }
}
