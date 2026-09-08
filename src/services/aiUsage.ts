import * as SecureStore from 'expo-secure-store';

// Ücretsiz katmanda ayda toplam (metin+ses+görsel+PDF) izin verilen AI
// çıkarım sayısı. Tek yerden değiştirilebilir sabit.
export const AI_USAGE_FREE_LIMIT = 18;

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
