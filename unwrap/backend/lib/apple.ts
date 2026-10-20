// Apple ile giriş: kimlik belirtecini (JWT) Apple'ın açık anahtarlarıyla doğrular.
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

import { HttpError } from './http';

export const APPLE_ISSUER = 'https://appleid.apple.com';
export const APPLE_AUDIENCE = 'com.aydinapp.unwrap';

// Anahtar seti modül düzeyinde saklanır; jose kendi önbelleğini tutar.
let appleKeys: JWTVerifyGetKey | undefined;
function defaultKeys(): JWTVerifyGetKey {
  appleKeys ??= createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
  return appleKeys;
}

/** Geçerliyse { sub, email? } döner; değilse 401 invalid_token. Testler kendi anahtar setini verir. */
export async function verifyAppleToken(token: string, keys: JWTVerifyGetKey = defaultKeys()): Promise<{ sub: string; email?: string }> {
  try {
    const { payload } = await jwtVerify(token, keys, { issuer: APPLE_ISSUER, audience: APPLE_AUDIENCE });
    if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('sub missing');
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    return email ? { sub: payload.sub, email } : { sub: payload.sub };
  } catch {
    throw new HttpError(401, 'invalid_token');
  }
}
