// POST /api/bildir — yapay zekâ içeriğini bildir (Pro gerekmez).
import { appUserIdFrom } from '../lib/auth';
import { BildirSchema, saveBildirim } from '../lib/bildir';
import { HttpError, readRawBody, route, send } from '../lib/http';
import { verifyRequest } from '../lib/integrity';
import { perMinute } from '../lib/limits';

export default route(['POST'], async (req, res) => {
  const raw = await readRawBody(req, 20_000);
  const appUserId = appUserIdFrom(req);
  await perMinute(appUserId);
  // Bildirim hiçbir cihazda engellenmez; bütünlük yalnız kayda geçer.
  await verifyRequest(req, raw, appUserId).catch((e) => console.warn('bildir integrity:', e instanceof HttpError ? e.code : e));
  let body: unknown;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    throw new HttpError(400, 'invalid_request');
  }
  const parsed = BildirSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, 'invalid_request');
  await saveBildirim(parsed.data);
  send(res, 200, { ok: true });
});
