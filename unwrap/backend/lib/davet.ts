// "Arkadaşını getir": her kullanıcının kısa bir davet kodu olur. Kodu yeni bir
// kullanıcı girince ikisine de 1 hafta Pro (RevenueCat promosyon yetkisi) verilir.
// Kötüye kullanıma karşı: kod sahibi en fazla MAX_REWARDS kez ödül alır, bir
// kullanıcı yalnız bir kez kod girebilir, kendi kodunu giremez; istekler gerçek
// uygulamadan gelmelidir (App Attest / Play Integrity, api/davet.ts).
import { randomInt } from 'node:crypto';

import { HttpError, requireEnv } from './http';
import { k, redis } from './redis';

export const MAX_REWARDS = 10;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışan harfler (0/O, 1/I) yok
export const CODE = /^[A-HJ-NP-Z2-9]{6}$/;
const ENTITLEMENT = process.env.REVENUECAT_ENTITLEMENT_ID || 'unwrap_pro';

const codeKey = (code: string) => k('ref', 'code', code);
const userKey = (uid: string) => k('ref', 'user', uid);
const usedKey = (uid: string) => k('ref', 'used', uid);
const rewardsKey = (code: string) => k('ref', 'rewards', code);

export function newCode(rand: (n: number) => number = randomInt): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[rand(ALPHABET.length)];
  return s;
}

/** Kullanıcının kalıcı davet kodu (yoksa oluşturur) ve kaç arkadaş getirdiği. */
export async function myCode(uid: string): Promise<{ code: string; rewards: number; max: number; redeemed: boolean }> {
  const r = redis();
  let code = await r.get<string>(userKey(uid));
  for (let i = 0; !code && i < 5; i++) {
    const c = newCode();
    // Kod başka kullanıcıda değilse sahiplen (NX: yarışta iki kişi aynı kodu alamaz).
    if (await r.set(codeKey(c), uid, { nx: true })) {
      await r.set(userKey(uid), c);
      code = c;
    }
  }
  if (!code) throw new HttpError(503, 'try_again');
  const [rewards, used] = await Promise.all([r.get<number>(rewardsKey(code)), r.get<string>(usedKey(uid))]);
  return { code, rewards: Number(rewards ?? 0), max: MAX_REWARDS, redeemed: !!used };
}

async function grantWeek(uid: string) {
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}/entitlements/${encodeURIComponent(ENTITLEMENT)}/promotional`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${requireEnv('REVENUECAT_SECRET_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 'weekly' }),
    },
  );
  if (!res.ok) throw new HttpError(502, 'grant_failed');
  await redis().del(k('pro', uid)); // abonelik önbelleği hemen yenilensin
}

export type RedeemResult = 'ok' | 'invalid' | 'own' | 'already';

export async function redeem(uid: string, raw: string): Promise<{ result: RedeemResult; inviterRewarded: boolean }> {
  const code = raw.trim().toUpperCase();
  if (!CODE.test(code)) return { result: 'invalid', inviterRewarded: false };
  const r = redis();
  const owner = await r.get<string>(codeKey(code));
  if (!owner) return { result: 'invalid', inviterRewarded: false };
  if (owner === uid) return { result: 'own', inviterRewarded: false };
  // Bir kullanıcı yalnız bir kez kod girebilir (NX ile yarış güvenli).
  if (!(await r.set(usedKey(uid), code, { nx: true }))) return { result: 'already', inviterRewarded: false };
  try {
    await grantWeek(uid);
  } catch (e) {
    await r.del(usedKey(uid)); // ödül verilemediyse tekrar denenebilsin
    throw e;
  }
  const count = await r.incr(rewardsKey(code));
  let inviterRewarded = false;
  if (count <= MAX_REWARDS) {
    await grantWeek(owner).then(() => (inviterRewarded = true), () => undefined);
  }
  return { result: 'ok', inviterRewarded };
}
