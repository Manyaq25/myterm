import { route, send } from '../lib/http';

export default route(['GET'], async (_req, res) => send(res, 200, { ok: true, service: 'unwrap' }));
