// POST /api/hesap — Apple ile giriş: { identityToken } → { uid, token }.
// DELETE /api/hesap — hesabı siler (profil + tüm oturumlar). App Store şartı.
import { z } from 'zod';

import { verifyAppleToken } from '../lib/apple';
import { HttpError, header, readRawBody, route, send } from '../lib/http';
import { perMinute } from '../lib/limits';
import { profileKey } from '../lib/profil';
import { redis } from '../lib/redis';
import { createSession, deleteSessions, uidFromRequest, uidFromSub } from '../lib/session';

const LoginSchema = z.object({ identityToken: z.string().min(1).max(4096) });

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    throw new HttpError(400, 'invalid_request');
  }
}

export default route(['POST', 'DELETE'], async (req, res) => {
  if (req.method === 'DELETE') {
    const uid = await uidFromRequest(req);
    await redis().del(profileKey(uid));
    await deleteSessions(uid);
    return send(res, 200, { ok: true });
  }

  const raw = await readRawBody(req, 8 * 1024);
  const parsed = LoginSchema.safeParse(parseJson(raw));
  if (!parsed.success) throw new HttpError(400, 'invalid_request');
  // Giriş henüz kimliksiz: dakikalık sınır IP'ye göre.
  const ip = (header(req, 'x-forwarded-for') ?? header(req, 'x-real-ip') ?? 'unknown').split(',')[0].trim();
  await perMinute('ip:' + ip);
  const { sub } = await verifyAppleToken(parsed.data.identityToken);
  const uid = uidFromSub(sub);
  const token = await createSession(uid);
  send(res, 200, { uid, token });
});
