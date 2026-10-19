// Gerçek uygulama kanıtı: istek mağazadan indirilmiş, değiştirilmemiş
// Unwrap'ten geliyor mu? iPhone'da App Attest, Android'de Play Integrity.
// Kanıt her istekte gövdenin özetine (sha256) bağlanır; sunucu doğrular.
// Kanıt üretilemezse istek kanıtsız gider; karar sunucunundur.
import * as AppIntegrity from '@expo/app-integrity';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { config } from './config';

const KEY_ID = 'unwrap.attestKey';
const DEVICE_ID = 'unwrap.deviceId';

const toBase64Url = (b64: string) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function bodyHash(raw: string): Promise<string> {
  const b64 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  return toBase64Url(b64);
}

async function deviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID);
  if (!id) {
    id = Crypto.randomUUID().replace(/-/g, '');
    await SecureStore.setItemAsync(DEVICE_ID, id);
  }
  return id;
}

/** iPhone: anahtar bir kez üretilip Apple'a onaylatılır ve sunucuya kaydedilir. */
async function appleKey(userId: string): Promise<string | null> {
  const saved = await SecureStore.getItemAsync(KEY_ID);
  if (saved) return saved;
  if (!AppIntegrity.isSupported) return null;
  const keyId = await AppIntegrity.generateKeyAsync();
  const { challenge } = (await (await fetch(`${config.apiUrl}/api/attest/challenge`)).json()) as { challenge: string };
  const attestation = await AppIntegrity.attestKeyAsync(keyId, challenge);
  const res = await fetch(`${config.apiUrl}/api/attest/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-user-id': userId },
    body: JSON.stringify({ keyId, attestation, challenge }),
  });
  if (!res.ok) return null;
  await SecureStore.setItemAsync(KEY_ID, keyId);
  return keyId;
}

let playReady: Promise<void> | null = null;

export async function integrityHeaders(userId: string, hash: string): Promise<Record<string, string>> {
  try {
    if (Platform.OS === 'ios') {
      const keyId = await appleKey(userId);
      if (!keyId) return {};
      const assertion = await AppIntegrity.generateAssertionAsync(keyId, hash);
      return { 'x-platform': 'ios', 'x-attest-key': keyId, 'x-attest-assertion': assertion };
    }
    if (Platform.OS === 'android' && config.playCloudProjectNumber) {
      playReady ??= AppIntegrity.prepareIntegrityTokenProviderAsync(config.playCloudProjectNumber);
      await playReady;
      const token = await AppIntegrity.requestIntegrityCheckAsync(hash);
      return { 'x-platform': 'android', 'x-integrity-token': token, 'x-device-id': await deviceId() };
    }
  } catch {
    playReady = null;
  }
  return {};
}
