import { getRedis } from './redis';

const RC_API_BASE = process.env.REVENUECAT_API_BASE || 'https://api.revenuecat.com';
const PREMIUM_CACHE_SECONDS = 600;
const FREE_CACHE_SECONDS = 60;

/**
 * Kullanıcının premium olup olmadığını RevenueCat'e sunucudan sorar —
 * uygulamanın "ben premium'um" demesine güvenmiyoruz. Projede tek bir
 * yetki (entitlement) olduğu için herhangi bir aktif yetki premium sayılır.
 * Sonuç kısa süre Redis'te tutulur ki her AI isteği RevenueCat'e gitmesin.
 *
 * RevenueCat'e ulaşılamazsa null döner; çağıran bu durumda kararı kendisi
 * verir (ödeme yapmış birini geçici bir arıza yüzünden engellememek için).
 */
export async function isPremiumCustomer(
  appUserId: string,
  options: { skipCache?: boolean } = {}
): Promise<boolean | null> {
  const secret = process.env.REVENUECAT_SECRET_KEY;
  const projectId = process.env.REVENUECAT_PROJECT_ID;
  if (!secret || !projectId) return null;

  const redis = getRedis();
  const cacheKey = `prem:${appUserId}`;
  if (redis && !options.skipCache) {
    // Upstash istemcisi kayıtlı değeri JSON olarak çözer: '1' sayı 1 olarak döner.
    const cached = await redis.get<string | number>(cacheKey).catch(() => null);
    if (cached !== null && String(cached) === '1') return true;
    if (cached !== null && String(cached) === '0') return false;
  }

  let premium: boolean;
  try {
    const url = `${RC_API_BASE}/v2/projects/${encodeURIComponent(projectId)}/customers/${encodeURIComponent(appUserId)}/active_entitlements`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) {
      premium = false;
    } else if (!response.ok) {
      console.warn(JSON.stringify({ event: 'revenuecat_error', status: response.status }));
      return null;
    } else {
      const body = (await response.json()) as { items?: unknown[] };
      premium = Array.isArray(body.items) && body.items.length > 0;
    }
  } catch (error) {
    console.warn(JSON.stringify({ event: 'revenuecat_unreachable', message: (error as Error).message }));
    return null;
  }

  if (redis) {
    await redis
      .set(cacheKey, premium ? '1' : '0', { ex: premium ? PREMIUM_CACHE_SECONDS : FREE_CACHE_SECONDS })
      .catch(() => undefined);
  }
  return premium;
}
