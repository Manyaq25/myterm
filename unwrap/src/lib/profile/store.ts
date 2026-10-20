// Profil: ad, avatar ve elle yazılan istatistikler. Telefonda dosya olarak durur;
// Apple ile giriş yapıldıysa sunucuya da kopyalanır (sohbetler asla gitmez).
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';

export type Avatar = { emoji: string; color: string };
export type Profile = { name: string | null; avatar: Avatar | null; overrides: Record<string, string> };
export type Account = { uid: string; token: string };

const EMPTY: Profile = { name: null, avatar: null, overrides: {} };
const profileFile = () => new File(Paths.document, 'profil.json');

export function getProfile(): Profile {
  const f = profileFile();
  if (!f.exists) return { ...EMPTY, overrides: {} };
  try {
    const p = JSON.parse(f.textSync()) as Partial<Profile>;
    return { name: p.name ?? null, avatar: p.avatar ?? null, overrides: p.overrides ?? {} };
  } catch {
    return { ...EMPTY, overrides: {} };
  }
}

export function writeProfile(p: Profile) {
  const f = profileFile();
  if (!f.exists) f.create();
  f.write(JSON.stringify(p));
}

export function clearProfile() {
  const f = profileFile();
  if (f.exists) f.delete();
}

// Hesap anahtarı güvenli depoda (anahtar zinciri / Keystore).
const ACCOUNT_KEY = 'unwrap-hesap';

export async function getAccount(): Promise<Account | null> {
  try {
    const raw = await SecureStore.getItemAsync(ACCOUNT_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Partial<Account>;
    return a.uid && a.token ? { uid: a.uid, token: a.token } : null;
  } catch {
    return null;
  }
}

export async function saveAccount(a: Account) {
  await SecureStore.setItemAsync(ACCOUNT_KEY, JSON.stringify(a));
}

export async function clearAccount() {
  await SecureStore.deleteItemAsync(ACCOUNT_KEY);
}
