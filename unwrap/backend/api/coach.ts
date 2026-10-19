// POST /api/coach — Mila ile sohbet.
// Pro: her şey. Ücretsiz: yalnız sohbet seçmeden genel sorular, günde sınırlı;
// Pro'ya özel konular yapay zekâ tarafından yakalanıp satın almaya yönlendirilir.
import { appUserIdFrom } from '../lib/auth';
import { CoachSchema, coachReply } from '../lib/coach';
import { recordUsage } from '../lib/costs';
import { isPro } from '../lib/entitlement';
import { HttpError, readRawBody, route, send } from '../lib/http';
import { verifyRequest } from '../lib/integrity';
import { countCoach, countFreeCoach, perMinute } from '../lib/limits';

export default route(['POST'], async (req, res) => {
  const raw = await readRawBody(req);
  const appUserId = appUserIdFrom(req);
  await perMinute(appUserId);
  await verifyRequest(req, raw, appUserId);
  const parsed = CoachSchema.safeParse(JSON.parse(raw || '{}'));
  if (!parsed.success) throw new HttpError(400, 'invalid_request');

  const pro = await isPro(appUserId);
  if (pro) await countCoach(appUserId);
  else {
    // Sohbete özel analiz ve rol yapma Pro'da.
    if (parsed.data.context.trim() || parsed.data.role) throw new HttpError(402, 'pro_required');
    await countFreeCoach(appUserId);
  }
  const { text, usage, proRequired } = await coachReply(parsed.data, pro ? 'pro' : 'free');
  await recordUsage('coach', usage);
  send(res, 200, { text, proRequired });
});
