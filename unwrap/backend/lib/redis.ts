import { Redis } from '@upstash/redis';

// Unwrap'in kendi Upstash veritabanı (Synvia'nınkinden ayrı). Tüm anahtarlar
// "uw:" ile başlar.
let client: Redis | null | undefined;

export function redis(): Redis {
  if (client === undefined) {
    const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
    client = url && token ? new Redis({ url, token }) : null;
  }
  if (!client) throw new Error('Redis is not configured');
  return client;
}

export const k = (...parts: (string | number)[]) => ['uw', ...parts].join(':');

export async function incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
  const [n] = await redis().pipeline().incr(key).expire(key, ttlSeconds).exec<[number, number]>();
  return n;
}

export const monthKey = (d = new Date()) => d.toISOString().slice(0, 7);
export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

/** ISO hafta: "2026-W42" */
export function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
