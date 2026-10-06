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

/**
 * iPhone'da sistemin kişi seçicisi rehber izni istemez: pencereyi telefon
 * gösterir, uygulama yalnızca seçilen kişiyi görür. Android'de aynı seçici
 * rehberin tamamını okuma izni istediği için orada şimdilik kapalı; numara
 * elle girilir.
 */
export function canPickFromContacts(): boolean {
  return Platform.OS === 'ios' && loadContacts() !== null;
}

export type PickResult =
  | { status: 'picked'; numbers: string[] }
  | { status: 'cancelled' }
  | { status: 'no_phone' }
  | { status: 'unavailable' };

/** Seçilen kişinin telefon numaralarını döndürür (birden fazlaysa seçimi çağıran yapar). */
export async function pickPhoneNumbersFromContacts(): Promise<PickResult> {
  const contacts = canPickFromContacts() ? loadContacts() : null;
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
