import * as SecureStore from 'expo-secure-store';
import { isPremiumNow } from './subscription';

export type SuggestionKind = 'first-extraction' | 'premium';

const COUNT_KEY = 'successfulExtractionCount';
const SHOWN_PREFIX = 'suggestionShown_';
const PREMIUM_AFTER = 3;

// Bu oturumda gösterilecek kart. Kart görüldüğü anda "gösterildi" diye
// işaretlenir; kapatılmasa da bir daha açılışta çıkmaz.
let pending: SuggestionKind | null = null;

async function wasShown(kind: SuggestionKind): Promise<boolean> {
  return (await SecureStore.getItemAsync(SHOWN_PREFIX + kind)) === '1';
}

/**
 * AI çıkarımından gelen takipler kaydedildiğinde çağrılır. İlk seferde davet
 * kartı, 3. seferde bir kez premium önerisi sıraya girer. Premium
 * kullanıcılara hiçbir öneri gösterilmez; çıkarım sırasında değil, kayıt
 * bittikten sonra ana ekranda görünür.
 */
export async function recordSuccessfulExtraction(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(COUNT_KEY);
    const count = (raw ? parseInt(raw, 10) || 0 : 0) + 1;
    await SecureStore.setItemAsync(COUNT_KEY, String(count));
    if (isPremiumNow()) return;
    if (count === 1 && !(await wasShown('first-extraction'))) pending = 'first-extraction';
    else if (count >= PREMIUM_AFTER && !(await wasShown('premium'))) pending = 'premium';
  } catch {
    // Öneri kartı hiçbir zaman kaydı bozmamalı.
  }
}

/** Ana ekranın göstereceği kart (varsa). Okunduğunda gösterildi sayılır. */
export async function takePendingSuggestion(): Promise<SuggestionKind | null> {
  const kind = pending;
  pending = null;
  if (!kind || isPremiumNow()) return null;
  try {
    await SecureStore.setItemAsync(SHOWN_PREFIX + kind, '1');
  } catch {
    // işaretlenemezse bir sonraki çıkarımda tekrar denenmez; sorun değil
  }
  return kind;
}
