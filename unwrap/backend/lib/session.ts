// Hesap oturumları: yeni sır gerekmez. İstemciye rastgele belirteç verilir,
// Redis'te yalnız özeti (sha256) tutulur.
import { createHash, randomBytes } from 'crypto';
import type { IncomingMessage } from 'http';

import { HttpError, header } from './http';
import { k, redis } from './redis';

const SESSION_TTL = 365 * 86400;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

const hex = (s: string) => createHash('sha256').update(s).digest('hex');

/** Apple "sub" değerinden kararlı kullanıcı kimliği. */
export const uidFromSub = (sub: string) => 'apple_' + hex('unwrap:' + sub).slice(0, 32);

export const newToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token: string) => hex(token);

const sessKey = (h: string) => k('sess', h);
const sessOfKey = (uid: string) => k('sess-of', uid);

export async function createSession(uid: string): Promise<string> {
  const token = newToken();
  const h = tokenHash(token);
  await redis()
    .pipeline()
    .set(sessKey(h), uid, { ex: SESSION_TTL })
    .sadd(sessOfKey(uid), h)
    .expire(sessOfKey(uid), SESSION_TTL)
    .exec();
  return token;
}

/** "Authorization: Bearer <belirteç>" başlığını okur; yoksa ya da geçersizse 401. */
export function bearerToken(req: IncomingMessage): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header(req, 'authorization') ?? '');
  return m && TOKEN.test(m[1]) ? m[1] : null;
}

export async function uidFromRequest(req: IncomingMessage): Promise<string> {
  const token = bearerToken(req);
  if (!token) throw new HttpError(401, 'unauthorized');
  const uid = await redis().get<string>(sessKey(tokenHash(token)));
  if (typeof uid !== 'string' || !uid) throw new HttpError(401, 'unauthorized');
  return uid;
}

/** Kullanıcının tüm oturumlarını siler (hesap silme). */
export async function deleteSessions(uid: string) {
  const hashes = await redis().smembers(sessOfKey(uid));
  await redis().del(sessOfKey(uid), ...hashes.map(sessKey));
}
