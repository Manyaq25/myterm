import type { IncomingMessage } from 'http';

// Serverless fonksiyonlar birden fazla instance'a ölçeklenebilir (her biri
// kendi sayacına sahip olur) ve cold start'ta sıfırlanır — yani bu kesin bir
// garanti değil. Yine de tek bir istemcinin uç noktayı art arda bombalamasına
// karşı, ek altyapı/maliyet olmadan anlamlı bir eşik koyuyor.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

function clientKey(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

export function isRateLimited(req: IncomingMessage): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }

  return false;
}
