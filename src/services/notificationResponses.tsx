import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, type Router } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import i18n from '../i18n';
import { getFollowUp } from '../db/queries';
import { FOLLOW_UP_CATEGORY } from './notifications';
import { completeFollowUp, moveFollowUpToTomorrow, snoozeFollowUpReminder } from './followUpActions';
import { notifyDataChanged } from './dataEvents';
import { rebuildUpcomingReminders } from './reminderScheduler';
import { showToast } from '../components/Toast';

const ACTION_COMPLETE = 'complete';
const ACTION_SNOOZE_HOUR = 'snooze-hour';
const ACTION_TOMORROW = 'tomorrow';

/**
 * Takip bildirimlerindeki düğmeleri, uygulamanın o anki diliyle kaydeder.
 * Düğmeler uygulamayı açar: uygulama tamamen kapalıyken arka planda çalışan
 * düğmelere iOS/Android cevap iletmiyor, işlem sessizce kaybolurdu.
 */
export async function registerFollowUpNotificationActions(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync(FOLLOW_UP_CATEGORY, [
      { identifier: ACTION_COMPLETE, buttonTitle: i18n.t('notifications.actionComplete') },
      { identifier: ACTION_SNOOZE_HOUR, buttonTitle: i18n.t('notifications.actionSnoozeHour') },
      { identifier: ACTION_TOMORROW, buttonTitle: i18n.t('notifications.actionTomorrow') },
    ]);
  } catch {
    // Düğmeler kaydedilemezse bildirim yine gelir, yalnızca düğmesiz olur.
  }
}

const ACTIONS_MIGRATION_KEY = 'notificationActionsMigrated';

// Düğmeler gelmeden önce kurulmuş hatırlatmalar düğmesizdi; bir kez yeniden kurulur.
async function migrateExistingReminders(db: SQLiteDatabase): Promise<void> {
  try {
    if (await SecureStore.getItemAsync(ACTIONS_MIGRATION_KEY)) return;
    await rebuildUpcomingReminders(db);
    await SecureStore.setItemAsync(ACTIONS_MIGRATION_KEY, '1');
  } catch {
    // Bir sonraki açılışta yeniden denenir.
  }
}

// Aynı cevabın hem "son cevap" hem dinleyici üzerinden iki kez işlenmesini önler.
const handledResponses = new Set<string>();

async function handleResponse(db: SQLiteDatabase, router: Router, response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data ?? {};
  const action = response.actionIdentifier;

  if (data.kind === 'screenshot-suggestion') {
    const assetId = typeof data.assetId === 'string' ? `&assetId=${encodeURIComponent(data.assetId)}` : '';
    router.push(`/takip/ai-cikar?mode=image&autoScreenshot=1${assetId}`);
    return;
  }

  const followUpId = typeof data.followUpId === 'string' ? data.followUpId : null;
  if (!followUpId) return;

  if (action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    router.push(`/takip/${followUpId}`);
    return;
  }

  const item = await getFollowUp(db, followUpId);
  if (!item || (item.status !== 'open' && item.status !== 'snoozed')) return;

  if (action === ACTION_COMPLETE) {
    await completeFollowUp(db, item);
    showToast(i18n.t('notifications.toastCompleted'));
  } else if (action === ACTION_SNOOZE_HOUR) {
    await snoozeFollowUpReminder(db, item);
    showToast(i18n.t('notifications.toastSnoozed'));
  } else if (action === ACTION_TOMORROW) {
    await moveFollowUpToTomorrow(db, item);
    showToast(i18n.t('notifications.toastTomorrow'));
  } else {
    return;
  }
  notifyDataChanged();
}

/**
 * Bildirim dokunuşlarını ve düğmelerini işler. Veritabanına eriştiği için
 * DatabaseProvider'ın içinde durur. Uygulama kilidi açıksa işlem yine yapılır
 * (kullanıcı düğmeye kendisi bastı); açılan ekran kilidin arkasında kalır.
 */
export function NotificationResponseHandler() {
  const db = useSQLiteContext();
  const router = useRouter();

  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse) => {
      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handledResponses.has(key)) return;
      handledResponses.add(key);
      Notifications.clearLastNotificationResponse();
      handleResponse(db, router, response).catch(() => {});
    };

    // Uygulama bir bildirimle açıldıysa o cevap dinleyici kurulmadan gelmiş olabilir.
    const last = Notifications.getLastNotificationResponse();
    if (last) handle(last);

    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [db, router]);

  useEffect(() => {
    void migrateExistingReminders(db);
  }, [db]);

  return null;
}
