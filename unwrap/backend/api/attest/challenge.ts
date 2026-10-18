// GET /api/attest/challenge — App Attest kaydı için tek kullanımlık değer.
import { route, send } from '../../lib/http';
import { newChallenge } from '../../lib/integrity';

export default route(['GET'], async (_req, res) => {
  send(res, 200, { challenge: await newChallenge() });
});
