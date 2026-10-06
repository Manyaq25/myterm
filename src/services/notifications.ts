import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../i18n';

/** Tek bir takibe ait bildirimler: üzerinde "Tamamlandı / 1 saat ertele / Yarın" düğmeleri çıkar. */
export const FOLLOW_UP_CATEGORY = 'follow-up';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleNotification(
  title: string,
  body: string,
  triggerAt: Date,
  data: Record<string, unknown> = {},
  categoryIdentifier?: string
): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('follow-ups', {
      name: i18n.t('notifications.channelName'),
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true, ...(categoryIdentifier ? { categoryIdentifier } : {}) },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
      ...(Platform.OS === 'android' ? { channelId: 'follow-ups' } : {}),
    },
  });
}

export async function scheduleFollowUpReminder(
  followUpId: string,
  title: string,
  body: string,
  triggerAt: Date
): Promise<string | null> {
  return scheduleNotification(title, body, triggerAt, { followUpId }, FOLLOW_UP_CATEGORY);
}

export async function cancelFollowUpReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
