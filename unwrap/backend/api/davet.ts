// POST /api/davet — { action: 'code' } → { code, rewards, max, redeemed }
//                   { action: 'redeem', code } → { result, inviterRewarded }
//                   { action: 'gifts' } → { gifts: [{ code, redeemed }] } (hediye satın alanın kodları)
// 6 haneli kod davet, 8 haneli kod hediye (1 ay Pro).
// Ücretsiz kullanıcılar da kullanır; gerçek uygulama kanıtı zorunlu.
import { z } from 'zod';

import { appUserIdFrom } from '../lib/auth';
import { myCode, redeem } from '../lib/davet';
import { GIFT_CODE, myGifts, redeemGift } from '../lib/hediye';
import { HttpError, readRawBody, route, send } from '../lib/http';
import { verifyRequest } from '../lib/integrity';
import { perMinute } from '../lib/limits';

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('code') }),
  z.object({ action: z.literal('redeem'), code: z.string().max(20) }),
  z.object({ action: z.literal('gifts') }),
]);

export default route(['POST'], async (req, res) => {
  const raw = await readRawBody(req, 2000);
  const uid = appUserIdFrom(req);
  await perMinute(uid);
  await verifyRequest(req, raw, uid);
  let body: unknown;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    throw new HttpError(400, 'invalid_request');
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) throw new HttpError(400, 'invalid_request');
  const d = parsed.data;
  if (d.action === 'code') return send(res, 200, await myCode(uid));
  if (d.action === 'gifts') return send(res, 200, { gifts: await myGifts(uid) });
  if (GIFT_CODE.test(d.code.trim().toUpperCase())) {
    return send(res, 200, { result: await redeemGift(uid, d.code), inviterRewarded: false, gift: true });
  }
  send(res, 200, await redeem(uid, d.code));
});
