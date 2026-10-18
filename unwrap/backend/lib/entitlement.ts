// Abonelik sunucuda doğrulanır: uygulamadaki "Pro" bilgisine güvenilmez.
// RevenueCat gizli anahtarı yalnız burada (Vercel ortam değişkeni) durur.
import { HttpError, requireEnv } from './http';
import { k, redis } from './redis';

const ENTITLEMENT = process.env.REVENUECAT_ENTITLEMENT_ID ?? 'pro';
const CACHE_SECONDS = 300;

type Subscriber = { subscriber?: { entitlements?: Record<string, { expires_date: string | null }> } };

export async function isPro(appUserId: string): Promise<boolean> {
  const cacheKey = k('pro', appUserId);
  const cached = await redis().get<string>(cacheKey);
  if (cached === '1' || cached === '0') return cached === '1';

  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${requireEnv('REVENUECAT_SECRET_KEY')}` },
  });
  if (!res.ok) throw new HttpError(502, 'entitlement_unavailable');
  const data = (await res.json()) as Subscriber;
  const ent = data.subscriber?.entitlements?.[ENTITLEMENT];
  const active = Boolean(ent && (ent.expires_date === null || Date.parse(ent.expires_date) > Date.now()));
  await redis().set(cacheKey, active ? '1' : '0', { ex: CACHE_SECONDS });
  return active;
}

export async function requirePro(appUserId: string) {
  if (!(await isPro(appUserId))) throw new HttpError(402, 'pro_required');
}
