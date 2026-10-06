import { requireOptionalNativeModule } from 'expo';
import * as SecureStore from 'expo-secure-store';
import type * as StoreReviewModule from 'expo-store-review';

type StoreReview = typeof StoreReviewModule;

const STATE_KEY = 'reviewPromptState';
const COMPLETIONS_NEEDED = 3;
const MIN_DAYS_SINCE_FIRST = 2;
const MIN_DAYS_BETWEEN_ASKS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

type State = { completions: number; firstAt: number; lastAskedAt: number | null };

let cachedModule: StoreReview | null | undefined;

// expo-store-review 1.1.1 build'iyle geliyor. Modülün olmadığı bir build'de
// require açılışta fırlatır ve Metro bunu ölümcül hata sayar (bkz. imageUpload),
// bu yüzden önce yerel modülün varlığına bakılıyor.
function loadStoreReview(): StoreReview | null {
  if (cachedModule !== undefined) return cachedModule;
  if (!requireOptionalNativeModule('ExpoStoreReview')) {
    cachedModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-store-review') as StoreReview;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

async function readState(): Promise<State> {
  try {
    const raw = await SecureStore.getItemAsync(STATE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    // bozuk kayıt: baştan başla
  }
  return { completions: 0, firstAt: Date.now(), lastAskedAt: null };
}

/**
 * Kullanıcı bir takibi kendisi tamamladığında çağrılır ("mutlu an"). Yeterince
 * tamamlama birikmiş, uygulama birkaç gündür kullanılıyor ve uzun süredir
 * sorulmamışsa Apple/Google'ın kendi değerlendirme penceresini ister. Pencerenin
 * gerçekten çıkıp çıkmayacağına sistem karar verir (Apple yılda en fazla 3 kez
 * gösterir); uygulama kendi ekranını göstermez, puan istemez.
 */
export async function recordCompletionForReview(): Promise<void> {
  try {
    const state = await readState();
    state.completions += 1;
    const now = Date.now();
    const ready =
      state.completions >= COMPLETIONS_NEEDED &&
      now - state.firstAt >= MIN_DAYS_SINCE_FIRST * DAY_MS &&
      (state.lastAskedAt === null || now - state.lastAskedAt >= MIN_DAYS_BETWEEN_ASKS * DAY_MS);

    const storeReview = ready ? loadStoreReview() : null;
    if (storeReview && (await storeReview.isAvailableAsync())) {
      state.completions = 0;
      state.lastAskedAt = now;
      await SecureStore.setItemAsync(STATE_KEY, JSON.stringify(state));
      // Kartın kaybolma animasyonu bitsin, pencere işlemin üstüne binmesin.
      setTimeout(() => {
        storeReview.requestReview().catch(() => {});
      }, 800);
      return;
    }
    await SecureStore.setItemAsync(STATE_KEY, JSON.stringify(state));
  } catch {
    // Değerlendirme isteği hiçbir zaman asıl işlemi bozmamalı.
  }
}
