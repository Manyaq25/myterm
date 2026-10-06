import type { IncomingMessage } from 'http';
import { getRedis } from './redis';
import { isPremiumCustomer } from './premium';
import { clientIp, isRateLimited } from './rateLimit';

/** Ücretsiz kullanıcının ayda kullanabileceği toplam AI isteği (çıkarım + asistan). */
export const FREE_MONTHLY_LIMIT = 6;

const PER_MINUTE_LIMIT = 30;
// Aynı internet bağlantısından günlük üst sınır. Mobil operatörlerde çok sayıda
// kullanıcı aynı IP'yi paylaşabildiği için cömert tutuluyor; amacı sahte cihaz
// kimlikleriyle aylık sınırı aşmaya çalışan tek bir kaynağı durdurmak.
const PER_IP_DAILY_LIMIT = 500;
// Cihaz kimliği göndermeyen eski uygulama sürümleri için (güncellemeyi henüz
// almamış olanlar) aynı IP'den günlük sınır ve son tarih.
const LEGACY_PER_IP_DAILY_LIMIT = 100;
const DEFAULT_LEGACY_CUTOFF = '2026-10-20T00:00:00Z';

const USAGE_TTL_SECONDS = 40 * 24 * 60 * 60;
const DEVICE_ID_PATTERN = /^[A-Za-z0-9:_.-]{8,128}$/;
const APP_USER_ID_PATTERN = /^[\x21-\x7e]{1,128}$/;

/** Geçerli bir cihaz kimliği yoksa null. */
export function deviceIdFrom(req: IncomingMessage): string | null {
  const raw = header(req, 'x-device-id');
  return raw && DEVICE_ID_PATTERN.test(raw) ? raw : null;
}

export interface UsageInfo {
  used: number;
  limit: number;
  premium: boolean;
  /** Davetle kazanılmış, aylık hak bitince kullanılan ek haklar (yalnızca 0'dan büyükse gönderilir). */
  bonus?: number;
}

export interface AiRequestContext {
  deviceId: string | null;
  premium: boolean;
  usageKey: string | null;
  /** Aylık hak bitmiş, bu istek davet bonusundan düşülecek. */
  useBonus?: boolean;
  usedBefore?: number;
}

/** Davetle kazanılan ek AI hakları; ay geçse de silinmez. */
export function bonusKey(deviceId: string): string {
  return `bonus:${deviceId}`;
}

export type GateResult =
  | { ok: true; ctx: AiRequestContext }
  | { ok: false; status: number; body: Record<string, unknown> };

export function header(req: IncomingMessage, name: string): string | null {
  const value = req.headers[name];
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' && first.length > 0 ? first : null;
}

function monthKey(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

export function dayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function legacyCutoff(): number {
  const parsed = Date.parse(process.env.AI_LEGACY_CLIENT_CUTOFF || DEFAULT_LEGACY_CUTOFF);
  return Number.isNaN(parsed) ? Date.parse(DEFAULT_LEGACY_CUTOFF) : parsed;
}

export async function incrWithExpiry(key: string, ttlSeconds: number): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  const [count] = await redis.pipeline().incr(key).expire(key, ttlSeconds).exec<[number, number]>();
  return count;
}

/**
 * Her AI isteğinden önce çağrılır: hız sınırı, cihaz kimliği, premium ve
 * aylık ücretsiz hak kontrolü. Hak düşümü burada değil, AI başarılı
 * döndükten sonra commitAiUsage ile yapılır — başarısız bir istek kullanıcının
 * hakkını yemesin.
 *
 * Redis'e ulaşılamazsa istek reddedilmez (sadece IP hız sınırı uygulanır):
 * sayaç altyapısındaki bir arıza bütün kullanıcıları kilitlemesin.
 */
export async function openAiGate(req: IncomingMessage): Promise<GateResult> {
  const redis = getRedis();
  const ip = clientIp(req);
  const now = new Date();

  try {
    if (redis) {
      const perMinute = await incrWithExpiry(`rl:${ip}:${now.toISOString().slice(0, 16)}`, 120);
      if (perMinute > PER_MINUTE_LIMIT) return { ok: false, status: 429, body: { error: 'rate_limited' } };
    } else if (isRateLimited(req)) {
      return { ok: false, status: 429, body: { error: 'rate_limited' } };
    }

    const deviceId = deviceIdFrom(req);

    if (!deviceId) {
      if (Date.now() >= legacyCutoff()) {
        return { ok: false, status: 426, body: { error: 'upgrade_required' } };
      }
      if (redis) {
        const legacyToday = await incrWithExpiry(`legacy:${ip}:${dayKey(now)}`, 2 * 24 * 60 * 60);
        if (legacyToday > LEGACY_PER_IP_DAILY_LIMIT) {
          return { ok: false, status: 429, body: { error: 'rate_limited' } };
        }
      }
      return { ok: true, ctx: { deviceId: null, premium: false, usageKey: null } };
    }

    const rawAppUserId = header(req, 'x-rc-app-user-id');
    const appUserId = rawAppUserId && APP_USER_ID_PATTERN.test(rawAppUserId) ? rawAppUserId : null;
    let premium = false;
    if (appUserId) {
      const claimsPremium = header(req, 'x-client-premium') === '1';
      // Uygulama premium olduğunu söylüyorsa önbelleği atlayıp RevenueCat'e yeniden
      // soruyoruz: az önce satın alan biri önbellekteki eski "premium değil"
      // bilgisi yüzünden engellenmesin. İddia tek başına yeterli değil.
      const verified = await isPremiumCustomer(appUserId, { skipCache: claimsPremium });
      // RevenueCat'e ulaşılamadıysa uygulamanın bildirdiği duruma geçici olarak
      // güveniyoruz; ödeme yapmış biri dış servis arızası yüzünden engellenmesin.
      premium = verified ?? claimsPremium;
    }

    const usageKey = `usage:${deviceId}:${monthKey(now)}`;
    if (premium || !redis) {
      return { ok: true, ctx: { deviceId, premium, usageKey: redis ? usageKey : null } };
    }

    const perIpToday = await incrWithExpiry(`ipd:${ip}:${dayKey(now)}`, 2 * 24 * 60 * 60);
    if (perIpToday > PER_IP_DAILY_LIMIT) return { ok: false, status: 429, body: { error: 'rate_limited' } };

    const used = Number((await redis.get<number>(usageKey)) ?? 0);
    if (used >= FREE_MONTHLY_LIMIT) {
      const bonus = Number((await redis.get<number>(bonusKey(deviceId))) ?? 0);
      if (bonus > 0) {
        return { ok: true, ctx: { deviceId, premium, usageKey, useBonus: true, usedBefore: used } };
      }
      return {
        ok: false,
        status: 402,
        body: { error: 'limit_reached', usage: { used, limit: FREE_MONTHLY_LIMIT, premium: false } },
      };
    }
    return { ok: true, ctx: { deviceId, premium, usageKey } };
  } catch (error) {
    console.warn(JSON.stringify({ event: 'quota_gate_error', message: (error as Error).message }));
    return { ok: true, ctx: { deviceId: null, premium: false, usageKey: null } };
  }
}

function withBonus(usage: UsageInfo, bonus: number): UsageInfo {
  return bonus > 0 ? { ...usage, bonus } : usage;
}

/** AI başarılı döndükten sonra hakkı düşer ve güncel kullanımı döndürür. */
export async function commitAiUsage(ctx: AiRequestContext): Promise<UsageInfo | undefined> {
  if (!ctx.usageKey) return undefined;
  if (ctx.premium) return { used: 0, limit: FREE_MONTHLY_LIMIT, premium: true };
  try {
    const redis = getRedis();
    if (ctx.useBonus && ctx.deviceId && redis) {
      let bonus = await redis.decr(bonusKey(ctx.deviceId));
      if (bonus < 0) {
        // Aynı anda gelen iki istek son hakkı paylaştı: geri al. SET 0 yerine INCR,
        // çünkü o arada davetle eklenen hakları silmesin.
        await redis.incr(bonusKey(ctx.deviceId));
        bonus = 0;
      }
      return withBonus({ used: ctx.usedBefore ?? FREE_MONTHLY_LIMIT, limit: FREE_MONTHLY_LIMIT, premium: false }, bonus);
    }
    const used = await incrWithExpiry(ctx.usageKey, USAGE_TTL_SECONDS);
    const bonus = ctx.deviceId && redis ? Number((await redis.get<number>(bonusKey(ctx.deviceId))) ?? 0) : 0;
    return withBonus({ used, limit: FREE_MONTHLY_LIMIT, premium: false }, bonus);
  } catch (error) {
    console.warn(JSON.stringify({ event: 'quota_commit_error', message: (error as Error).message }));
    return undefined;
  }
}
