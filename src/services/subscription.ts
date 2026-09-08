import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

export const PREMIUM_ENTITLEMENT_ID = 'premium';

export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired';

interface SubscriptionSnapshot {
  isPremium: boolean;
  status: SubscriptionStatus;
}

const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const apiKey = Platform.OS === 'ios' ? iosApiKey : Platform.OS === 'android' ? androidApiKey : undefined;

export const isRevenueCatConfigured = !!apiKey;

let snapshot: SubscriptionSnapshot = { isPremium: false, status: 'free' };
const listeners = new Set<() => void>();

function setSnapshot(next: SubscriptionSnapshot) {
  if (snapshot.isPremium === next.isPremium && snapshot.status === next.status) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function statusFromCustomerInfo(info: CustomerInfo): SubscriptionSnapshot {
  const active = info.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  if (active) {
    const status: SubscriptionStatus = active.periodType === 'TRIAL' ? 'trial' : 'active';
    return { isPremium: true, status };
  }
  const everHad = info.entitlements.all[PREMIUM_ENTITLEMENT_ID];
  return { isPremium: false, status: everHad ? 'expired' : 'free' };
}

let configured = false;
let readyResolve: () => void;
export const subscriptionReady: Promise<void> = new Promise((resolve) => {
  readyResolve = resolve;
});

export async function configureRevenueCat(): Promise<void> {
  if (configured) return;
  configured = true;

  if (!isRevenueCatConfigured) {
    readyResolve();
    return;
  }

  try {
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: apiKey! });
    Purchases.addCustomerInfoUpdateListener((info) => setSnapshot(statusFromCustomerInfo(info)));
    // İlk kurulumda önbellek yoksa getCustomerInfo() ağa çıkabilir — açılışı
    // asla birkaç saniyeden fazla bloklamamak için bir zaman aşımıyla yarıştırıyoruz.
    // Bilgi daha sonra gelirse yukarıdaki listener zaten durumu güncelleyecek.
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
    const info = await Promise.race([Purchases.getCustomerInfo(), timeout]);
    if (info) setSnapshot(statusFromCustomerInfo(info));
  } catch {
    // Expo Go veya native modülün derlenmediği bir build — sessizce ücretsiz kal.
  } finally {
    readyResolve();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SubscriptionSnapshot {
  return snapshot;
}

export function useSubscription(): SubscriptionSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useIsPremium(): boolean {
  return useSubscription().isPremium;
}

/** Non-hook, synchronous access for service/module code outside React components. */
export function isPremiumNow(): boolean {
  return snapshot.isPremium;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isRevenueCatConfigured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<{ ok: true } | { ok: false; userCancelled: boolean }> {
  try {
    const result = await Purchases.purchasePackage(pkg);
    setSnapshot(statusFromCustomerInfo(result.customerInfo));
    return { ok: true };
  } catch (e) {
    const userCancelled = !!(e as { userCancelled?: boolean })?.userCancelled;
    return { ok: false, userCancelled };
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    const next = statusFromCustomerInfo(info);
    setSnapshot(next);
    return next.isPremium;
  } catch {
    return false;
  }
}
