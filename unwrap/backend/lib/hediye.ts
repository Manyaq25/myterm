// Hediye Pro: "1 ay Pro hediyesi" satın alan kullanıcı her satın alma için bir
// hediye kodu alır; kodu giren kişiye 1 ay Pro (RevenueCat promosyon) verilir.
// Satın alma RevenueCat'ten doğrulanır; her mağaza işlemi yalnız bir kod üretir.
import { HttpError, requireEnv } from './http';
import { k, redis } from './redis';
import { newCode } from './davet';

export const GIFT_PRODUCT = 'unwrap_gift_month';
export const GIFT_CODE = /^[A-HJ-NP-Z2-9]{8}$/;
const ENTITLEMENT = process.env.REVENUECAT_ENTITLEMENT_ID || 'unwrap_pro';

type NonSub = { id: string; store_transaction_id?: string; purchase_date?: string };
type Subscriber = { subscriber?: { non_subscriptions?: Record<string, NonSub[]> } };

const txKey = (tx: string) => k('gift', 'tx', tx);
const codeKey = (code: string) => k('gift', 'code', code);
const usedKey = (code: string) => k('gift', 'used', code);
const mineKey = (uid: string) => k('gift', 'mine', uid);

async function purchases(uid: string): Promise<NonSub[]> {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    headers: { Authorization: `Bearer ${requireEnv('REVENUECAT_SECRET_KEY')}` },
  });
  if (!res.ok) throw new HttpError(502, 'entitlement_unavailable');
  const data = (await res.json()) as Subscriber;
  return data.subscriber?.non_subscriptions?.[GIFT_PRODUCT] ?? [];
}

const giftCode = () => newCode() + newCode().slice(0, 2);

/** Yeni satın almalar için kod üretir; kullanıcının tüm hediye kodlarını döner. */
export async function myGifts(uid: string): Promise<{ code: string; redeemed: boolean }[]> {
  const r = redis();
  for (const p of await purchases(uid)) {
    const tx = p.store_transaction_id || p.id;
    // Bu işlem daha önce koda çevrildiyse atla (NX: iki istek aynı anda gelse de tek kod).
    if (!(await r.set(txKey(tx), '1', { nx: true }))) continue;
    let code = giftCode();
    for (let i = 0; i < 5 && !(await r.set(codeKey(code), uid, { nx: true })); i++) code = giftCode();
    await r.rpush(mineKey(uid), code);
  }
  const codes = await r.lrange<string>(mineKey(uid), 0, 49);
  const used = codes.length ? await r.mget<(string | null)[]>(...codes.map(usedKey)) : [];
  return codes.map((code, i) => ({ code, redeemed: !!used[i] }));
}

export async function redeemGift(uid: string, raw: string): Promise<'ok' | 'invalid' | 'already'> {
  const code = raw.trim().toUpperCase();
  if (!GIFT_CODE.test(code)) return 'invalid';
  const r = redis();
  if (!(await r.get<string>(codeKey(code)))) return 'invalid';
  if (!(await r.set(usedKey(code), uid, { nx: true }))) return 'already';
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}/entitlements/${encodeURIComponent(ENTITLEMENT)}/promotional`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${requireEnv('REVENUECAT_SECRET_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 'monthly' }),
    },
  );
  if (!res.ok) {
    await r.del(usedKey(code)); // verilemediyse kod yanmasın
    throw new HttpError(502, 'grant_failed');
  }
  await r.del(k('pro', uid));
  return 'ok';
}
