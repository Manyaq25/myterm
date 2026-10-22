// Profil: ad, avatar ve elle yazılan istatistikler. Telefonda dosya olarak durur;
// Apple ile giriş yapıldıysa sunucuya da kopyalanır (sohbetler asla gitmez).
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';

import { parseAvatar, parseFrame, parseGender, type Avatar, type Frame, type Gender } from './avatar';

export type { Avatar, Frame, Gender } from './avatar';
// shareKeys/shareColor: paylaşım kartı seçimi; frame ve gender de yalnız telefonda (sunucuya gitmez).
export type Profile = {
  name: string | null;
  avatar: Avatar | null;
  frame: Frame | null;
  gender: Gender;
  overrides: Record<string, string>;
  shareKeys: string[];
  shareColor: string | null;
};
export type Account = { uid: string; token: string };

/** Karta ilk seferde konan eğlenceli istatistikler (kişi adı yok). */
export const DEFAULT_SHARE_KEYS = ['ghosting', 'favoriteWord', 'favoriteEmoji', 'nightOwl', 'happiestMoment', 'laughs', 'medianReply', 'messages'];

const empty = (): Profile => ({ name: null, avatar: null, frame: null, gender: 'notr', overrides: {}, shareKeys: [...DEFAULT_SHARE_KEYS], shareColor: null });
const profileFile = () => new File(Paths.document, 'profil.json');

export function getProfile(): Profile {
  const f = profileFile();
  if (!f.exists) return empty();
  try {
    const p = JSON.parse(f.textSync()) as Partial<Profile>;
    return {
      name: p.name ?? null,
      // Eski {emoji, color} biçimi 'emoji' türüne çevrilir.
      avatar: parseAvatar(p.avatar),
      frame: parseFrame(p.frame),
      gender: parseGender(p.gender),
      overrides: p.overrides ?? {},
      shareKeys: Array.isArray(p.shareKeys) ? p.shareKeys.filter((k) => typeof k === 'string') : [...DEFAULT_SHARE_KEYS],
      shareColor: typeof p.shareColor === 'string' ? p.shareColor : null,
    };
  } catch {
    return empty();
  }
}

/** Hitap (rozet unvanları için): 'kadin' | 'erkek' | 'notr'. */
export const getGender = (): Gender => getProfile().gender;

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
