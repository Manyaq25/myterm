import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { FollowUp, Person } from '../types';
import { updateWidgetSummary } from './widget';

interface DataExport {
  exportedAt: string;
  people: Person[];
  followUps: FollowUp[];
}

async function collectExportData(db: SQLiteDatabase): Promise<DataExport> {
  const people = await db.getAllAsync<Person>('SELECT * FROM people ORDER BY createdAt ASC');
  const followUps = await db.getAllAsync<FollowUp>('SELECT * FROM follow_ups ORDER BY createdAt ASC');
  return { exportedAt: new Date().toISOString(), people, followUps };
}

/**
 * Tüm kişi ve takip verilerini okunabilir bir JSON dosyası olarak sistemin
 * paylaşım sayfası üzerinden dışa aktarır (AirDrop, Dosyalar, e-posta vb.).
 */
export async function exportAllData(db: SQLiteDatabase): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Bu cihazda paylaşım kullanılamıyor.');
  }

  const data = await collectExportData(db);
  const json = JSON.stringify(data, null, 2);
  const fileName = `benim-yerime-takip-et-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  const fileUri = FileSystem.cacheDirectory + fileName;
  await FileSystem.writeAsStringAsync(fileUri, json, { encoding: 'utf8' });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Verilerini dışa aktar',
    UTI: 'public.json',
  });
}

/**
 * Tüm yerel verileri (kişiler, takipler, hatırlatıcılar) ve ilgili uygulama
 * ayarlarını (onboarding, uygulama kilidi, ekran görüntüsü önerisi) geri
 * dönüşü olmadan siler; uygulama ilk kurulum durumuna döner. Sunucu
 * tarafında saklanan bir şey yok (bkz. Ayarlar > Hakkında), bu yüzden bu
 * işlem tek başına "hesabı silmek" ile eşdeğer.
 */
export async function deleteAllData(db: SQLiteDatabase): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await db.execAsync(`
    DELETE FROM follow_up_reminders;
    DELETE FROM reminder_day_items;
    DELETE FROM reminder_days;
    DELETE FROM follow_ups;
    DELETE FROM people;
  `);
  await Promise.all([
    SecureStore.deleteItemAsync('onboardingSeen'),
    SecureStore.deleteItemAsync('appLockEnabled'),
    SecureStore.deleteItemAsync('screenshotSuggestionsEnabled'),
  ]);
  await updateWidgetSummary(db);
}
