import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter, type Href } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import i18n from '../i18n';
import { getFollowUp } from '../db/queries';
import { FOLLOW_UP_CATEGORY } from './notifications';
import { completeFollowUp, moveFollowUpToTomorrow, snoozeFollowUpReminder } from './followUpActions';
import { notifyDataChanged } from './dataEvents';
import { rebuildUpcomingReminders, restoreMissingReminders } from './reminderScheduler';
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
    // İzin yoksa yeniden kurmanın anlamı yok; açılışta izin penceresi de çıkmasın.
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await rebuildUpcomingReminders(db);
    await SecureStore.setItemAsync(ACTIONS_MIGRATION_KEY, '1');
  } catch {
    // Bir sonraki açılışta yeniden denenir.
  }
}

// Aynı cevabın hem "son cevap" hem dinleyici üzerinden iki kez işlenmesini önler.
const handledResponses = new Set<string>();

/** Bildirime göre yapılacak işlemi yapar; açılması gereken ekran varsa onu döndürür. */
async function handleResponse(db: SQLiteDatabase, response: Notifications.NotificationResponse): Promise<Href | null> {
  const data = response.notification.request.content.data ?? {};
  const action = response.actionIdentifier;

  if (data.kind === 'screenshot-suggestion') {
    const assetId = typeof data.assetId === 'string' ? `&assetId=${encodeURIComponent(data.assetId)}` : '';
    return `/takip/ai-cikar?mode=image&autoScreenshot=1${assetId}` as Href;
  }

  const followUpId = typeof data.followUpId === 'string' ? data.followUpId : null;
  if (!followUpId) return null;

  if (action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return `/takip/${followUpId}` as Href;
  }

  const item = await getFollowUp(db, followUpId);
  if (!item || (item.status !== 'open' && item.status !== 'snoozed')) return null;

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
    return null;
  }
  notifyDataChanged();
  return null;
}

/**
 * Bildirim dokunuşlarını ve düğmelerini işler. Veritabanına eriştiği için
 * DatabaseProvider'ın içinde durur. Uygulama kilidi açıksa işlem yine yapılır
 * (kullanıcı düğmeye kendisi bastı); açılan ekran kilidin arkasında kalır.
 */
export function NotificationResponseHandler() {
  const db = useSQLiteContext();
  const router = useRouter();
  // Uygulama bildirimle soğuk açıldığında gezinme yapısı henüz hazır olmayabilir;
  // açılacak ekran hazır olana kadar bekletilir.
  const navigationReady = !!useRootNavigationState()?.key;
  const [pendingRoute, setPendingRoute] = useState<Href | null>(null);

  useEffect(() => {
    if (!pendingRoute || !navigationReady) return;
    router.push(pendingRoute);
    setPendingRoute(null);
  }, [pendingRoute, navigationReady, router]);

  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse) => {
      const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handledResponses.has(key)) return;
      handledResponses.add(key);
      Notifications.clearLastNotificationResponse();
      handleResponse(db, response)
        .then((route) => route && setPendingRoute(route))
        .catch(() => {});
    };

    // Uygulama bir bildirimle açıldıysa o cevap dinleyici kurulmadan gelmiş olabilir.
    const last = Notifications.getLastNotificationResponse();
    if (last) handle(last);

    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [db]);

  useEffect(() => {
    (async () => {
      await migrateExistingReminders(db);
      try {
        await restoreMissingReminders(db);
      } catch {
        // Bir sonraki açılışta yeniden denenir.
      }
    })();
  }, [db]);

  return null;
}
