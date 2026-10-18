// POST /api/attest/register — iPhone App Attest anahtarını kaydeder.
import { z } from 'zod';

import { appUserIdFrom } from '../../lib/auth';
import { HttpError, readRawBody, route, send } from '../../lib/http';
import { registerAppleKey } from '../../lib/integrity';
import { perMinute } from '../../lib/limits';

const Body = z.object({ keyId: z.string().min(10).max(200), attestation: z.string().min(100).max(20000), challenge: z.string().min(10).max(100) });

export default route(['POST'], async (req, res) => {
  const appUserId = appUserIdFrom(req);
  await perMinute(appUserId);
  const parsed = Body.safeParse(JSON.parse((await readRawBody(req)) || '{}'));
  if (!parsed.success) throw new HttpError(400, 'invalid_request');
  await registerAppleKey(appUserId, parsed.data.keyId, parsed.data.attestation, parsed.data.challenge);
  send(res, 200, { ok: true });
});
