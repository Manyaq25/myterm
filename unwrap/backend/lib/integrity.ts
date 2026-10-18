// Gerçek uygulama kontrolü: istek mağazadan indirilmiş, değiştirilmemiş
// Unwrap'ten mi geliyor?
//  - iPhone: Apple App Attest. Cihaz bir kez anahtarını kaydeder (attest),
//    sonra her isteği o anahtarla imzalar (assertion).
//  - Android: Google Play Integrity. Her istekte Google'ın imzalı belirteci
//    Google'a çözdürülür.
// Kırılmış / yan yüklenmiş IPA ve APK bu kontrolleri geçemez.
//
// INTEGRITY_MODE: "enforce" (yayında), "log" (yalnız kayıt, geliştirme).
import { createHash, randomBytes } from 'crypto';
import type { IncomingMessage } from 'http';
import { GoogleAuth } from 'google-auth-library';
import type * as AppAttest from 'node-app-attest';
import { pathToFileURL } from 'url';

import { HttpError, header, requireEnv } from './http';
import { k, redis } from './redis';

const BUNDLE_ID = process.env.APP_BUNDLE_ID ?? 'com.aydinapp.unwrap';
const ANDROID_PACKAGE = process.env.ANDROID_PACKAGE ?? 'com.aydinapp.unwrap';
const TEAM_ID = process.env.APPLE_TEAM_ID ?? 'G2T885G2XY';
const CHALLENGE_TTL = 300;
/** Bir abonelik en fazla bu kadar cihaz anahtarıyla kullanılabilir. */
const MAX_KEYS_PER_USER = 4;

// node-app-attest yalnız ESM; Vercel'in CommonJS yükleyicisi require() edemiyor.
// Gerçek import() ile yüklenir (TypeScript bunu require'a çevirmesin diye
// Function ile). require.resolve, Vercel'in dosya izleyicisinin paketi dahil
// etmesini de sağlar.
const esmImport = new Function('u', 'return import(u)') as (u: string) => Promise<typeof AppAttest>;
let appAttest: Promise<typeof AppAttest> | null = null;
const loadAppAttest = () => (appAttest ??= esmImport(pathToFileURL(require.resolve('node-app-attest')).href));

const mode = () => (process.env.INTEGRITY_MODE === 'enforce' ? 'enforce' : 'log');

export const sha256 = (s: string) => createHash('sha256').update(s).digest('base64url');

export async function newChallenge(): Promise<string> {
  const challenge = randomBytes(24).toString('base64url');
  await redis().set(k('challenge', challenge), '1', { ex: CHALLENGE_TTL });
  return challenge;
}

/** iPhone: cihazın App Attest anahtarını kaydeder ve kullanıcıya bağlar. */
export async function registerAppleKey(appUserId: string, keyId: string, attestationB64: string, challenge: string) {
  const used = await redis().getdel(k('challenge', challenge));
  if (!used) throw new HttpError(400, 'challenge_expired');
  let publicKey: string;
  try {
    ({ publicKey } = (await loadAppAttest()).verifyAttestation({
      attestation: Buffer.from(attestationB64, 'base64'),
      challenge,
      keyId,
      bundleIdentifier: BUNDLE_ID,
      teamIdentifier: TEAM_ID,
      allowDevelopmentEnvironment: process.env.APP_ATTEST_DEV === '1',
    }));
  } catch {
    throw new HttpError(403, 'attestation_failed');
  }
  await bindKeyToUser(appUserId, `ios:${keyId}`);
  await redis().set(k('attest', keyId), JSON.stringify({ publicKey, signCount: 0, appUserId }));
}

async function bindKeyToUser(appUserId: string, keyRef: string) {
  const setKey = k('userkeys', appUserId);
  await redis().sadd(setKey, keyRef);
  if ((await redis().scard(setKey)) > MAX_KEYS_PER_USER) {
    await redis().srem(setKey, keyRef);
    throw new HttpError(403, 'too_many_devices');
  }
}

/**
 * Her yapay zekâ isteğinde çağrılır. Gövdenin özeti (sha256) imzalanmış
 * olmalı; böylece imza başka bir isteğe taşınamaz.
 */
export async function verifyRequest(req: IncomingMessage, rawBody: string, appUserId: string): Promise<void> {
  try {
    await verifyRequestStrict(req, rawBody, appUserId);
  } catch (e) {
    if (mode() === 'enforce') throw e;
    console.warn('integrity (log mode):', e instanceof HttpError ? e.code : e);
  }
}

async function verifyRequestStrict(req: IncomingMessage, rawBody: string, appUserId: string) {
  const platform = header(req, 'x-platform');
  const bodyHash = sha256(rawBody);

  if (platform === 'ios') {
    const keyId = header(req, 'x-attest-key');
    const assertion = header(req, 'x-attest-assertion');
    if (!keyId || !assertion) throw new HttpError(401, 'integrity_missing');
    const stored = await redis().get<{ publicKey: string; signCount: number; appUserId: string }>(k('attest', keyId));
    if (!stored) throw new HttpError(401, 'attest_unknown_key');
    if (stored.appUserId !== appUserId) throw new HttpError(403, 'attest_user_mismatch');
    let signCount: number;
    try {
      ({ signCount } = (await loadAppAttest()).verifyAssertion({
        assertion: Buffer.from(assertion, 'base64'),
        payload: bodyHash,
        publicKey: stored.publicKey,
        bundleIdentifier: BUNDLE_ID,
        teamIdentifier: TEAM_ID,
        signCount: stored.signCount,
      }));
    } catch {
      throw new HttpError(403, 'assertion_failed');
    }
    await redis().set(k('attest', keyId), JSON.stringify({ ...stored, signCount }));
    return;
  }

  if (platform === 'android') {
    const token = header(req, 'x-integrity-token');
    if (!token) throw new HttpError(401, 'integrity_missing');
    const verdict = await decodePlayToken(token);
    const details = verdict.requestDetails;
    if (details?.requestPackageName !== ANDROID_PACKAGE || details.requestHash !== bodyHash) {
      throw new HttpError(403, 'integrity_request_mismatch');
    }
    if (verdict.appIntegrity?.appRecognitionVerdict !== 'PLAY_RECOGNIZED') throw new HttpError(403, 'integrity_app_unrecognized');
    if (!verdict.deviceIntegrity?.deviceRecognitionVerdict?.includes('MEETS_DEVICE_INTEGRITY')) {
      throw new HttpError(403, 'integrity_device');
    }
    // Play Integrity kalıcı cihaz kimliği vermez; kurulumun kendi rastgele
    // kimliği bağlanır (bir abonelik en fazla MAX_KEYS_PER_USER kurulumda).
    const deviceId = header(req, 'x-device-id');
    if (!deviceId || !/^[A-Za-z0-9_-]{16,64}$/.test(deviceId)) throw new HttpError(401, 'device_id_missing');
    await bindKeyToUser(appUserId, `android:${deviceId}`);
    return;
  }

  throw new HttpError(401, 'integrity_missing');
}

type PlayVerdict = {
  requestDetails?: { requestPackageName?: string; requestHash?: string };
  appIntegrity?: { appRecognitionVerdict?: string };
  deviceIntegrity?: { deviceRecognitionVerdict?: string[] };
};

let auth: GoogleAuth | null = null;

async function decodePlayToken(token: string): Promise<PlayVerdict> {
  auth ??= new GoogleAuth({
    credentials: JSON.parse(requireEnv('PLAY_INTEGRITY_SA_JSON')),
    scopes: ['https://www.googleapis.com/auth/playintegrity'],
  });
  const client = await auth.getClient();
  const res = await client.request<{ tokenPayloadExternal: PlayVerdict }>({
    url: `https://playintegrity.googleapis.com/v1/${ANDROID_PACKAGE}:decodeIntegrityToken`,
    method: 'POST',
    data: { integrity_token: token },
  });
  return res.data.tokenPayloadExternal;
}
