import type { IncomingMessage, ServerResponse } from 'http';
import { getRedis } from '../lib/redis';
import { dayKey, deviceIdFrom, incrWithExpiry } from '../lib/quota';
import { clientIp } from '../lib/rateLimit';
import { getReferralStatus, redeemCode } from '../lib/referral';

const PER_MINUTE_LIMIT = 30;
// Aynı bağlantıdan günde girilebilecek davet kodu: sahte cihaz kimlikleriyle
// kendi kodunu doldurmaya çalışan tek bir kaynağı yavaşlatır.
const REDEEMS_PER_IP_PER_DAY = 5;

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 2048) throw new Error('too_large');
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function send(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

/**
 * Arkadaşını davet et.
 *   { action: "status" }               → kendi kodun, davet sayın, kalan ek hakların
 *   { action: "redeem", code: "ABC234" } → arkadaşının kodunu gir (davet eden kazanır)
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });

  const appSecret = process.env.APP_SHARED_SECRET;
  if (appSecret && req.headers['x-app-secret'] !== appSecret) return send(res, 401, { error: 'unauthorized' });

  const deviceId = deviceIdFrom(req);
  if (!deviceId) return send(res, 400, { error: 'device_id_required' });

  const redis = getRedis();
  if (!redis) return send(res, 503, { error: 'unavailable' });

  let body: { action?: unknown; code?: unknown };
  try {
    body = ((await readJsonBody(req)) ?? {}) as typeof body;
  } catch {
    return send(res, 400, { error: 'invalid_json' });
  }

  try {
    const ip = clientIp(req);
    const now = new Date();
    const perMinute = await incrWithExpiry(`rl:${ip}:${now.toISOString().slice(0, 16)}`, 120);
    if (perMinute > PER_MINUTE_LIMIT) return send(res, 429, { error: 'rate_limited' });

    if (body.action === 'status') {
      return send(res, 200, { ...(await getReferralStatus(redis, deviceId)) });
    }

    if (body.action === 'redeem') {
      if (typeof body.code !== 'string') return send(res, 400, { error: 'invalid_code' });
      const today = await incrWithExpiry(`ref:ip:${ip}:${dayKey(now)}`, 2 * 24 * 60 * 60);
      if (today > REDEEMS_PER_IP_PER_DAY) return send(res, 429, { error: 'rate_limited' });
      const result = await redeemCode(redis, deviceId, body.code);
      if (!result.ok) return send(res, result.error === 'already_redeemed' ? 409 : 400, { error: result.error });
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: 'unknown_action' });
  } catch (error) {
    console.warn(JSON.stringify({ event: 'referral_error', message: (error as Error).message }));
    return send(res, 500, { error: 'referral_failed' });
  }
}
