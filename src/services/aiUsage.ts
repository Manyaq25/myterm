import * as SecureStore from 'expo-secure-store';

// Ücretsiz katmanda ayda toplam (metin+ses+görsel+PDF) izin verilen AI
// çıkarım sayısı. Tek yerden değiştirilebilir sabit.
export const AI_USAGE_FREE_LIMIT = 6;

const COUNT_KEY = 'aiUsageCount';
const MONTH_KEY = 'aiUsageResetMonth';

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
  return count < AI_USAGE_FREE_LIMIT;
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
    return server.used;
  }
  return incrementAiUsageCount();
}

/** Sunucu "hak doldu" dediğinde yerel sayacı da sınıra eşitler. */
export async function markAiUsageLimitReached(): Promise<number> {
  const server = pendingServerUsage;
  pendingServerUsage = null;
  const used = Math.max(server?.used ?? 0, AI_USAGE_FREE_LIMIT);
  await setAiUsageCount(used);
  return used;
}
