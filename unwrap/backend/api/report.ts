// POST /api/report — ücretli yapay zekâ raporu.
import { guardPaid } from '../lib/auth';
import { recordUsage } from '../lib/costs';
import { HttpError, readRawBody, route, send } from '../lib/http';
import { countReport } from '../lib/limits';
import { incrWithTtl, k, weekKey } from '../lib/redis';
import { RequestSchema, generateReport } from '../lib/report';

export default route(['POST'], async (req, res) => {
  const raw = await readRawBody(req);
  const appUserId = await guardPaid(req, raw);
  const parsed = RequestSchema.safeParse(JSON.parse(raw || '{}'));
  if (!parsed.success) throw new HttpError(400, 'invalid_request');

  const tier = await countReport(appUserId);
  const { report, usage } = await generateReport(parsed.data, tier);
  await Promise.all([recordUsage('report', usage), incrWithTtl(k('count', weekKey()), 21 * 86400)]);
  send(res, 200, { report });
});
