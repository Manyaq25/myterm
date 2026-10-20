// GET /api/profil — { profile } (yoksa null).
// PUT /api/profil — profili kaydeder (ad, avatar, elle düzeltmeler; sohbet yok).
import { HttpError, readRawBody, route, send } from '../lib/http';
import { PROFILE_MAX_BYTES, ProfileSchema, profileKey, type Profile } from '../lib/profil';
import { redis } from '../lib/redis';
import { uidFromRequest } from '../lib/session';

export default route(['GET', 'PUT'], async (req, res) => {
  const uid = await uidFromRequest(req);
  if (req.method === 'GET') {
    const profile = await redis().get<Profile>(profileKey(uid));
    return send(res, 200, { profile: profile ?? null });
  }

  const raw = await readRawBody(req, PROFILE_MAX_BYTES);
  let body: unknown;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    throw new HttpError(400, 'invalid_request');
  }
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, 'invalid_request');
  await redis().set(profileKey(uid), JSON.stringify(parsed.data));
  send(res, 200, { ok: true });
});
