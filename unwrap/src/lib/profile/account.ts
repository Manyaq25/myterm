// Apple ile giriş: aboneliği (RevenueCat) ve profili telefon değişse de taşır.
// Sohbetler ve raporlar sunucuya hiç gitmez; yalnız ad, avatar ve elle yazılanlar.
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

import { config } from '../config';
import { initPurchases } from '../purchases';
import { clearAccount, clearProfile, getAccount, getProfile, saveAccount, writeProfile, type Account, type Profile } from './store';

/** Apple girişi bu cihazda var mı (Android/web'de yok). */
export async function appleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

const authed = (a: Account, extra?: Record<string, string>) => ({ Authorization: `Bearer ${a.token}`, ...extra });

// Sunucu 401 derse anahtar geçersiz: giriş yapılmamış sayılır.
async function checkAuth(res: Response) {
  if (res.status === 401) await clearAccount();
  return res;
}

// Sunucu sınırları: ad ≤40, elle yazılan ≤30 adet, anahtar/değer ≤80 karakter.
const LIMIT = { name: 40, overrides: 30, text: 80 };
function forServer(p: Profile) {
  const overrides = Object.fromEntries(
    Object.entries(p.overrides)
      .filter(([k]) => k.length <= LIMIT.text)
      .slice(0, LIMIT.overrides)
      .map(([k, v]) => [k, v.slice(0, LIMIT.text)]),
  );
  return { name: p.name ? p.name.slice(0, LIMIT.name) : null, avatar: p.avatar, overrides };
}

async function pushProfile(a: Account, p: Profile) {
  const res = await fetch(`${config.apiUrl}/api/profil`, {
    method: 'PUT',
    headers: authed(a, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(forServer(p)),
  });
  await checkAuth(res);
}

/** Profili kaydeder; giriş yapıldıysa sunucuya da gönderir (hata yok sayılır). */
export function saveProfile(p: Profile) {
  writeProfile(p);
  getAccount()
    .then((a) => (a ? pushProfile(a, p) : undefined))
    .catch(() => {});
}

// Girişten sonra: sunucuda profil varsa ad/avatar ondan, elle yazılanlar birleşir.
async function pullProfile(a: Account) {
  const local = getProfile();
  try {
    const res = await checkAuth(await fetch(`${config.apiUrl}/api/profil`, { headers: authed(a) }));
    if (!res.ok) return;
    const { profile: remote } = (await res.json()) as { profile: Profile | null };
    if (remote) {
      writeProfile({
        name: remote.name ?? local.name,
        avatar: remote.avatar ?? local.avatar,
        overrides: { ...local.overrides, ...(remote.overrides ?? {}) },
      });
      // Yerelde fazladan olan elle yazılanlar varsa sunucu da öğrensin.
      if (Object.keys(local.overrides).some((k) => !(k in (remote.overrides ?? {})))) await pushProfile(a, getProfile());
    } else {
      await pushProfile(a, local);
    }
  } catch {
    // ağ yoksa yerel profil kalır; sonraki kayıtta gönderilir
  }
}

/** Apple ile giriş. Vazgeçilirse false; başka hatada fırlatır. */
export async function signIn(): Promise<boolean> {
  let cred: AppleAuthentication.AppleAuthenticationCredential;
  try {
    cred = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
    throw e;
  }
  if (!cred.identityToken) throw new Error('no_identity_token');

  const res = await fetch(`${config.apiUrl}/api/hesap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identityToken: cred.identityToken }),
  });
  if (!res.ok) throw new Error(`hesap_${res.status}`);
  const { uid, token } = (await res.json()) as Account;
  if (!uid || !token) throw new Error('hesap_bad_response');
  const account = { uid, token };
  await saveAccount(account);

  // Abonelik bu kimliğe bağlanır; telefon değişse de geri gelir.
  if (await initPurchases()) {
    try {
      await Purchases.logIn(uid);
    } catch {
      // abonelik bağlanamazsa giriş yine geçerli
    }
  }

  // Apple adı yalnız ilk girişte verir; yerelde ad yoksa onu kullan.
  const given = cred.fullName?.givenName?.trim();
  const local = getProfile();
  if (given && !local.name) writeProfile({ ...local, name: given });

  await pullProfile(account);
  return true;
}

/** Çıkış: hesap anahtarı silinir; yerel profil ve sohbetler kalır. */
export async function signOut() {
  if (await initPurchases()) {
    try {
      await Purchases.logOut();
    } catch {
      // zaten anonimse hata verir; önemsiz
    }
  }
  await clearAccount();
}

/** Hesabı sunucudan siler, çıkış yapar, yerel profili temizler. Sohbetler telefonda kalır. */
export async function deleteAccount() {
  const a = await getAccount();
  if (a) {
    const res = await fetch(`${config.apiUrl}/api/hesap`, { method: 'DELETE', headers: authed(a) });
    // 401: anahtar zaten geçersiz, sunucuda silinecek oturum yok sayılır
    if (!res.ok && res.status !== 404 && res.status !== 401) throw new Error(`hesap_sil_${res.status}`);
  }
  await signOut();
  clearProfile();
}
