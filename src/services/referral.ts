import { BACKEND_URL } from '../config/publicConfig';
import { identityHeaders } from '../ai/AnthropicProvider';
import { setAiBonus } from './aiUsage';

const TIMEOUT_MS = 15_000;
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SHARED_SECRET;

/** Davet bağlantısı: site hem App Store hem Google Play düğmesini gösteriyor. */
export const INVITE_LINK = 'https://aydinapp.com.tr';

export interface ReferralStatus {
  code: string;
  invites: number;
  rewardedInvites: number;
  maxRewardedInvites: number;
  reward: number;
  bonus: number;
  redeemed: boolean;
}

export type RedeemError = 'invalid_code' | 'own_code' | 'already_redeemed' | 'network';

async function post(body: Record<string, unknown>): Promise<{ status: number; data: Record<string, unknown> }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BACKEND_URL}/api/referral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await identityHeaders()),
        ...(APP_SECRET ? { 'X-App-Secret': APP_SECRET } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

/** Kendi davet kodun ve davet durumun. Bağlantı yoksa null. */
export async function fetchReferralStatus(): Promise<ReferralStatus | null> {
  try {
    const { status, data } = await post({ action: 'status' });
    if (status !== 200 || typeof data.code !== 'string') return null;
    const result = data as unknown as ReferralStatus;
    await setAiBonus(result.bonus);
    return result;
  } catch {
    return null;
  }
}

/** Arkadaşının davet kodunu girer; ödülü davet eden kazanır. */
export async function redeemReferralCode(code: string): Promise<{ ok: true } | { ok: false; error: RedeemError }> {
  try {
    const { status, data } = await post({ action: 'redeem', code });
    if (status === 200) return { ok: true };
    const error = data.error;
    if (error === 'own_code' || error === 'already_redeemed' || error === 'invalid_code') return { ok: false, error };
    return { ok: false, error: 'network' };
  } catch {
    return { ok: false, error: 'network' };
  }
}
