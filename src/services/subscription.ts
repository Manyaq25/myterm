import { useEffect, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

import { REVENUECAT_ANDROID_KEY, REVENUECAT_IOS_KEY } from '../config/publicConfig';

export const PREMIUM_ENTITLEMENT_ID = 'premium';

export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired';

interface SubscriptionSnapshot {
  isPremium: boolean;
  status: SubscriptionStatus;
}

const iosApiKey = REVENUECAT_IOS_KEY;
const androidApiKey = REVENUECAT_ANDROID_KEY;
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

let lastOfferingError: string | null = null;
export function getLastOfferingError(): string | null {
  return lastOfferingError;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isRevenueCatConfigured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    lastOfferingError = offerings.current
      ? null
      : `no current offering (all: ${Object.keys(offerings.all).join(', ') || 'none'})`;
    return offerings.current;
  } catch (e) {
    lastOfferingError = (e as { message?: string })?.message ?? String(e);
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

/**
 * Sunucunun premium durumunu RevenueCat'ten kendisinin doğrulayabilmesi için
 * AI isteklerine eklenen RevenueCat kullanıcı kimliği. RevenueCat ayarlı
 * değilse ya da zamanında hazır olmazsa null döner.
 */
export async function getRevenueCatAppUserId(): Promise<string | null> {
  if (!isRevenueCatConfigured) return null;
  try {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
    const ready = await Promise.race([subscriptionReady.then(() => true), timeout]);
    if (!ready) return null;
    return await Promise.race([Purchases.getAppUserID(), timeout]);
  } catch {
    return null;
  }
}

/** Ücretsiz denemenin gün cinsinden süresi, paket kimliğine göre. */
export type FreeTrialDays = Record<string, number>;

function trialDaysFromPeriod(unit: string, count: number): number | null {
  if (unit === 'DAY') return count;
  if (unit === 'WEEK') return count * 7;
  return null;
}

/**
 * Kullanıcının gerçekten yararlanabileceği ücretsiz denemeleri bulur. Daha önce
 * deneme kullanmış birine "ücretsiz" yazmak yanıltıcı olur ve satın alma hemen
 * ücretlendirir; bu yüzden iOS'ta uygunluk sorulur, emin olunamazsa deneme
 * gösterilmez. Google Play denemeyi zaten yalnızca uygun kullanıcıya sunar.
 */
export async function getEligibleFreeTrials(packages: PurchasesPackage[]): Promise<FreeTrialDays> {
  const result: FreeTrialDays = {};
  if (Platform.OS === 'android') {
    for (const pkg of packages) {
      const phase = pkg.product.defaultOption?.freePhase;
      const days = phase ? trialDaysFromPeriod(phase.billingPeriod.unit, phase.billingPeriod.value) : null;
      if (days) result[pkg.identifier] = days;
    }
    return result;
  }

  const withTrial = packages.filter((pkg) => pkg.product.introPrice?.price === 0);
  if (withTrial.length === 0) return result;
  try {
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(
      withTrial.map((pkg) => pkg.product.identifier)
    );
    for (const pkg of withTrial) {
      if (eligibility[pkg.product.identifier]?.status !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE) {
        continue;
      }
      const intro = pkg.product.introPrice!;
      const days = trialDaysFromPeriod(intro.periodUnit, intro.periodNumberOfUnits * Math.max(intro.cycles, 1));
      if (days) result[pkg.identifier] = days;
    }
  } catch {
    // Uygunluk öğrenilemezse deneme gösterilmez.
  }
  return result;
}

let freeTrialDaysCache: Promise<number | null> | null = null;

/** Kullanıcının yararlanabileceği en uzun ücretsiz deneme (gün); yoksa null. Oturum boyunca saklanır. */
export function loadFreeTrialDays(): Promise<number | null> {
  if (!freeTrialDaysCache) {
    freeTrialDaysCache = (async () => {
      const offering = await getCurrentOffering();
      if (!offering) {
        freeTrialDaysCache = null; // bağlantı yoksa sonra yeniden denensin
        return null;
      }
      const days = Object.values(await getEligibleFreeTrials(offering.availablePackages));
      return days.length > 0 ? Math.max(...days) : null;
    })().catch(() => {
      freeTrialDaysCache = null;
      return null;
    });
  }
  return freeTrialDaysCache;
}

export function useFreeTrialDays(): number | null {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadFreeTrialDays().then((value) => !cancelled && setDays(value));
    return () => {
      cancelled = true;
    };
  }, []);
  return days;
}
