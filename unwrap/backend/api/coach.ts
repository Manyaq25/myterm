// POST /api/coach — Mila ile sohbet.
import { guardPaid } from '../lib/auth';
import { CoachSchema, coachReply } from '../lib/coach';
import { recordUsage } from '../lib/costs';
import { HttpError, readRawBody, route, send } from '../lib/http';
import { countCoach } from '../lib/limits';

export default route(['POST'], async (req, res) => {
  const raw = await readRawBody(req);
  const appUserId = await guardPaid(req, raw);
  const parsed = CoachSchema.safeParse(JSON.parse(raw || '{}'));
  if (!parsed.success) throw new HttpError(400, 'invalid_request');
  await countCoach(appUserId);
  const { text, usage } = await coachReply(parsed.data);
  await recordUsage('coach', usage);
  send(res, 200, { text });
});
