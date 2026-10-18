// GET /api/counter — "Bu hafta X sohbet analiz edildi". Sayı henüz anlamlı
// değilse null döner; uygulama "– –" gösterir.
import { route, send } from '../lib/http';
import { k, redis, weekKey } from '../lib/redis';

const MIN_TO_SHOW = 100;

export default route(['GET'], async (_req, res) => {
  const n = Number((await redis().get<number>(k('count', weekKey()))) ?? 0);
  res.setHeader('Cache-Control', 'public, max-age=600');
  send(res, 200, { thisWeek: n >= MIN_TO_SHOW ? n : null });
});
