import { randomInt } from 'crypto';
import type { Redis } from '@upstash/redis';
import { bonusKey } from './quota';

/** Her başarılı davet için davet edene verilen ek AI hakkı. */
export const REFERRAL_REWARD = 3;
/** Bir kişinin ödül alabileceği en fazla davet sayısı (kötüye kullanıma karşı). */
export const MAX_REWARDED_INVITES = 10;

// Karışan karakterler (0/O, 1/I/L) yok; elle yazılması kolay olsun. "E" de yok:
// Upstash istemcisi okunan değerleri JSON olarak çözüyor, "234E56" gibi bir kod
// üslü sayıya dönüşüp bozuluyordu.
const CODE_ALPHABET = 'ABCDFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
export const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

const codeOwnerKey = (code: string) => `ref:code:${code}`;
const myCodeKey = (deviceId: string) => `ref:mine:${deviceId}`;
const invitesKey = (deviceId: string) => `ref:invites:${deviceId}`;
const redeemedKey = (deviceId: string) => `ref:redeemed:${deviceId}`;

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function randomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** Cihazın davet kodunu döndürür; yoksa oluşturur. Kod cihaza kalıcı olarak bağlıdır. */
export async function getOrCreateCode(redis: Redis, deviceId: string): Promise<string> {
  const existing = await redis.get<string>(myCodeKey(deviceId));
  if (existing) return String(existing);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const reserved = await redis.set(codeOwnerKey(code), deviceId, { nx: true });
    if (!reserved) continue;
    const assigned = await redis.set(myCodeKey(deviceId), code, { nx: true });
    if (assigned) return code;
    // Aynı anda gelen başka bir istek bu cihaza kod atamış: ayırdığımızı bırak.
    await redis.del(codeOwnerKey(code));
    return String(await redis.get<string>(myCodeKey(deviceId)));
  }
  throw new Error('code_generation_failed');
}

export interface ReferralStatus {
  code: string;
  invites: number;
  rewardedInvites: number;
  maxRewardedInvites: number;
  reward: number;
  bonus: number;
  redeemed: boolean;
}

export async function getReferralStatus(redis: Redis, deviceId: string): Promise<ReferralStatus> {
  const code = await getOrCreateCode(redis, deviceId);
  const [invites, bonus, redeemed] = await Promise.all([
    redis.get<number>(invitesKey(deviceId)),
    redis.get<number>(bonusKey(deviceId)),
    redis.get<string>(redeemedKey(deviceId)),
  ]);
  const count = Number(invites ?? 0);
  return {
    code,
    invites: count,
    rewardedInvites: Math.min(count, MAX_REWARDED_INVITES),
    maxRewardedInvites: MAX_REWARDED_INVITES,
    reward: REFERRAL_REWARD,
    bonus: Math.max(Number(bonus ?? 0), 0),
    redeemed: redeemed !== null && redeemed !== undefined,
  };
}

export type RedeemResult =
  | { ok: true }
  | { ok: false; error: 'invalid_code' | 'own_code' | 'already_redeemed' };

/**
 * Davet edilen kişi kodu girdiğinde: davet edene ödül verir. Davet edilen
 * kişi ödül almaz; her cihaz yalnızca bir kez kod girebilir.
 */
export async function redeemCode(redis: Redis, inviteeDeviceId: string, rawCode: string): Promise<RedeemResult> {
  const code = normalizeCode(rawCode);
  if (!CODE_PATTERN.test(code)) return { ok: false, error: 'invalid_code' };
  const inviter = await redis.get<string>(codeOwnerKey(code));
  if (!inviter) return { ok: false, error: 'invalid_code' };
  if (String(inviter) === inviteeDeviceId) return { ok: false, error: 'own_code' };

  const first = await redis.set(redeemedKey(inviteeDeviceId), code, { nx: true });
  if (!first) return { ok: false, error: 'already_redeemed' };

  const invites = await redis.incr(invitesKey(String(inviter)));
  if (invites <= MAX_REWARDED_INVITES) {
    await redis.incrby(bonusKey(String(inviter)), REFERRAL_REWARD);
  }
  return { ok: true };
}
