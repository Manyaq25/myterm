import * as SecureStore from 'expo-secure-store';

// Ücretsiz katmanda ayda toplam (metin+ses+görsel+PDF) izin verilen AI
// çıkarım sayısı. Tek yerden değiştirilebilir sabit.
export const AI_USAGE_FREE_LIMIT = 6;

const COUNT_KEY = 'aiUsageCount';
const MONTH_KEY = 'aiUsageResetMonth';
// Davetle kazanılan ek haklar: aylık hak bitince kullanılır, ay geçince silinmez.
// Asıl değer sunucuda; burada son bilinen değer tutuluyor.
const BONUS_KEY = 'aiBonusRemaining';

export async function getAiBonus(): Promise<number> {
  const raw = await SecureStore.getItemAsync(BONUS_KEY);
  const value = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export async function setAiBonus(bonus: number): Promise<void> {
  await SecureStore.setItemAsync(BONUS_KEY, String(Math.max(0, Math.floor(bonus))));
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7); // '2026-09'
}

export async function getAiUsageCount(): Promise<number> {
  const storedMonth = await SecureStore.getItemAsync(MONTH_KEY);
  if (storedMonth !== currentMonthKey()) return 0;
  const raw = await SecureStore.getItemAsync(COUNT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export async function hasAiUsageRemaining(): Promise<boolean> {
  const count = await getAiUsageCount();
  return count < AI_USAGE_FREE_LIMIT || (await getAiBonus()) > 0;
}

export async function incrementAiUsageCount(): Promise<number> {
  const nowMonth = currentMonthKey();
  const current = await getAiUsageCount();
  const next = current + 1;
  await SecureStore.setItemAsync(MONTH_KEY, nowMonth);
  await SecureStore.setItemAsync(COUNT_KEY, String(next));
  return next;
}

export interface ServerAiUsage {
  used: number;
  limit: number;
  premium: boolean;
  /** Yalnızca 0'dan büyükse gönderilir. */
  bonus?: number;
}

// Sunucu her başarılı AI isteğinden sonra güncel kullanımı döndürüyor; o
// istekle ilgili ekran kaydı tamamlandığında recordAiUsage ile yazılıyor.
let pendingServerUsage: ServerAiUsage | null = null;

export function reportServerAiUsage(usage: unknown): void {
  if (
    usage &&
    typeof usage === 'object' &&
    typeof (usage as ServerAiUsage).used === 'number' &&
    typeof (usage as ServerAiUsage).limit === 'number'
  ) {
    pendingServerUsage = usage as ServerAiUsage;
  }
}

async function setAiUsageCount(count: number): Promise<void> {
  await SecureStore.setItemAsync(MONTH_KEY, currentMonthKey());
  await SecureStore.setItemAsync(COUNT_KEY, String(count));
}

/**
 * Başarılı bir AI isteğinden sonra çağrılır. Sunucunun saydığı değer varsa
 * onu esas alır (asıl sınır sunucuda); yoksa (eski sunucu, ağ sorunu) yerel
 * sayacı bir artırır.
 */
export async function recordAiUsage(): Promise<number> {
  const server = pendingServerUsage;
  pendingServerUsage = null;
  if (server && !server.premium) {
    await setAiUsageCount(server.used);
    await setAiBonus(server.bonus ?? 0);
    return server.used;
  }
  const current = await getAiUsageCount();
  if (current >= AI_USAGE_FREE_LIMIT) {
    const bonus = await getAiBonus();
    if (bonus > 0) {
      await setAiBonus(bonus - 1);
      return current;
    }
  }
  return incrementAiUsageCount();
}

/** Sunucu "hak doldu" dediğinde yerel sayacı da sınıra eşitler. */
export async function markAiUsageLimitReached(): Promise<number> {
  const server = pendingServerUsage;
  pendingServerUsage = null;
  const used = Math.max(server?.used ?? 0, AI_USAGE_FREE_LIMIT);
  await setAiUsageCount(used);
  await setAiBonus(0);
  return used;
}
