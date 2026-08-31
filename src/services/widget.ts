import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ExtensionStorage } from '@bacons/apple-targets';
import { listFollowUps } from '../db/queries';
import { isOverdue } from '../utils/date';

// app.json'daki ios.entitlements ve targets/widget/expo-target.config.js ile
// aynı App Group olmalı.
const APP_GROUP = 'group.com.manyaq25.benimyerimetakipet';

/**
 * iOS Home Screen widget'ının okuduğu özeti (kritik/toplam/beklenen kişi
 * sayısı) App Group üzerinden paylaşılan depoya yazar. Expo Go'da veya
 * widget'ın henüz derlenmediği bir build'de native modül bulunmadığından
 * bu no-op olarak çalışır (hata fırlatmaz).
 */
export async function updateWidgetSummary(db: SQLiteDatabase): Promise<void> {
  if (Platform.OS !== 'ios') return;

  const items = await listFollowUps(db, ['open', 'snoozed']);
  const critical = items.filter((i) => isOverdue(i.dueAt)).length;
  const waitingOn = items.filter((i) => i.type === 'waiting_on').length;

  const storage = new ExtensionStorage(APP_GROUP);
  storage.set('summary', { critical, total: items.length, waitingOn });
  ExtensionStorage.reloadWidget();
}
