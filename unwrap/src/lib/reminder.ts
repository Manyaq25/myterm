// Aylık ilişki raporu hatırlatıcısı: her ayın 1'inde akşam, telefonun kendi
// bildirimiyle. Sunucuya hiçbir şey gitmez; Ayarlar'dan açılıp kapatılır.
import * as Notifications from 'expo-notifications';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { t } from '@/i18n';

const ID = 'unwrap-aylik';
const pref = () => new File(Paths.document, '.aylik-hatirlatici');

export function reminderOn(): boolean {
  try {
    return pref().exists && pref().textSync().trim() === '1';
  } catch {
    return false;
  }
}

/** Açar: izin ister, bildirimi kurar. İzin verilmezse false. */
export async function enableReminder(): Promise<boolean> {
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('aylik', { name: t('settings.reminder.channel'), importance: Notifications.AndroidImportance.DEFAULT });
  }
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title: t('settings.reminder.pushTitle'), body: t('settings.reminder.pushBody') },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: 1, hour: 20, minute: 0, channelId: 'aylik' },
  });
  pref().write('1');
  return true;
}

export async function disableReminder() {
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => undefined);
  pref().write('0');
}

/** Dil değişince bildirim metni yeni dille yeniden kurulur. */
export async function refreshReminder() {
  if (reminderOn()) await enableReminder().catch(() => undefined);
}
