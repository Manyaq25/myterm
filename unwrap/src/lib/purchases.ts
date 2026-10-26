// Abonelik (RevenueCat). Uygulamadaki "Pro" bilgisi yalnız ekranı göstermek
// içindir; yapay zekâ isteklerinde sunucu aboneliği yeniden doğrular.
import { Platform } from 'react-native';
import Purchases, { PRODUCT_CATEGORY, type CustomerInfo, type PurchasesPackage, type PurchasesStoreProduct } from 'react-native-purchases';

import { config } from './config';

let ready: Promise<boolean> | null = null;

/** RevenueCat'i bir kez başlatır. Anahtar yoksa (henüz mağaza bağlanmadıysa) false. */
export function initPurchases(): Promise<boolean> {
  ready ??= (async () => {
    const apiKey = Platform.OS === 'ios' ? config.revenueCatIosKey : config.revenueCatAndroidKey;
    if (!apiKey || Platform.OS === 'web') return false;
    Purchases.configure({ apiKey });
    return true;
  })();
  return ready;
}

/** Sunucunun aboneliği sorduğu kimlik (RevenueCat'in anonim kullanıcı kimliği). */
export async function appUserId(): Promise<string | null> {
  if (!(await initPurchases())) return null;
  return Purchases.getAppUserID();
}

export const hasPro = (info: CustomerInfo) => Object.keys(info.entitlements.active).length > 0;

export async function isPro(): Promise<boolean> {
  if (!(await initPurchases())) return false;
  try {
    return hasPro(await Purchases.getCustomerInfo());
  } catch {
    return false;
  }
}

export type Plans = { monthly: PurchasesPackage | null; yearly: PurchasesPackage | null; lifetime?: PurchasesPackage | null };

export async function getPlans(): Promise<Plans> {
  if (!(await initPurchases())) return { monthly: null, yearly: null, lifetime: null };
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  // Ömür boyu paket mağazada onaylanana kadar gelmez; o zaman gösterilmez.
  return { monthly: current?.monthly ?? null, yearly: current?.annual ?? null, lifetime: current?.lifetime ?? null };
}

/** "1 ay Pro hediyesi" (tek seferlik ürün; mağazada yoksa null). */
export const GIFT_PRODUCT = 'unwrap_gift_month';
export async function giftProduct(): Promise<PurchasesStoreProduct | null> {
  if (!(await initPurchases())) return null;
  const list = await Purchases.getProducts([GIFT_PRODUCT], PRODUCT_CATEGORY.NON_SUBSCRIPTION).catch(() => []);
  return list[0] ?? null;
}

/** Hediyeyi satın alır; iptal edilirse false. */
export async function buyGift(product: PurchasesStoreProduct): Promise<boolean> {
  try {
    await Purchases.purchaseStoreProduct(product);
    return true;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasPro(customerInfo);
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  if (!(await initPurchases())) return false;
  return hasPro(await Purchases.restorePurchases());
}

/** Mağazanın abonelik yönetim sayfası (iptal burada, iki dokunuşta). */
export async function managementUrl(): Promise<string> {
  const fallback =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions?package=com.aydinapp.unwrap';
  if (!(await initPurchases())) return fallback;
  try {
    return (await Purchases.getCustomerInfo()).managementURL ?? fallback;
  } catch {
    return fallback;
  }
}
