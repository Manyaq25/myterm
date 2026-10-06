import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import type * as ContactsModule from 'expo-contacts';

type Contacts = typeof ContactsModule;

let cached: Contacts | null | undefined;

// expo-contacts 1.1.1 build'iyle geliyor; modülün olmadığı bir build'de require
// açılışta fırlatır ve Metro bunu ölümcül hata sayar (bkz. imageUpload).
function loadContacts(): Contacts | null {
  if (cached !== undefined) return cached;
  if (!requireOptionalNativeModule('ExpoContacts')) {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-contacts') as Contacts;
  } catch {
    cached = null;
  }
  return cached;
}

type PhonePickerModule = {
  pickPhoneAsync(): Promise<{ number: string; name: string | null } | null>;
};

// Android'de expo-contacts'in seçicisi rehberin tamamını okuma izni istiyor.
// Onun yerine kendi küçük modülümüz (modules/phone-picker) sistemin "telefon
// numarası seç" ekranını açıyor: izin gerekmez, yalnızca seçilen numara gelir.
// Modül Android build'iyle gelir; eski build'lerde yoksa numara elle girilir.
function loadAndroidPicker(): PhonePickerModule | null {
  if (Platform.OS !== 'android') return null;
  return requireOptionalNativeModule<PhonePickerModule>('PhonePicker');
}

/**
 * Sistemin kişi seçicisi rehber izni istemeden kullanılabiliyor mu: iPhone'da
 * expo-contacts, Android'de kendi telefon numarası seçicimiz. Uygulama
 * rehberin tamamını görmez, yalnızca seçilen kişiyi/numarayı.
 */
export function canPickFromContacts(): boolean {
  if (Platform.OS === 'ios') return loadContacts() !== null;
  return loadAndroidPicker() !== null;
}

export type PickResult =
  | { status: 'picked'; numbers: string[] }
  | { status: 'cancelled' }
  | { status: 'no_phone' }
  | { status: 'unavailable' };

/** Seçilen kişinin telefon numaralarını döndürür (birden fazlaysa seçimi çağıran yapar). */
export async function pickPhoneNumbersFromContacts(): Promise<PickResult> {
  const androidPicker = loadAndroidPicker();
  if (androidPicker) {
    try {
      const picked = await androidPicker.pickPhoneAsync();
      if (!picked) return { status: 'cancelled' };
      const number = picked.number.trim();
      return number ? { status: 'picked', numbers: [number] } : { status: 'no_phone' };
    } catch {
      return { status: 'unavailable' };
    }
  }

  const contacts = Platform.OS === 'ios' && canPickFromContacts() ? loadContacts() : null;
  if (!contacts) return { status: 'unavailable' };
  try {
    const contact = await contacts.presentContactPickerAsync();
    if (!contact) return { status: 'cancelled' };
    const numbers = Array.from(
      new Set((contact.phoneNumbers ?? []).map((p) => (p.number ?? p.digits ?? '').trim()).filter(Boolean))
    );
    return numbers.length > 0 ? { status: 'picked', numbers } : { status: 'no_phone' };
  } catch {
    return { status: 'unavailable' };
  }
}
