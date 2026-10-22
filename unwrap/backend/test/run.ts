// Çevrimdışı testler (anahtar gerekmez): istek hazırlama, maskeleme, şemalar.
// Çalıştırma: npm test
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { MAX_MESSAGES, buildReportPayload, sampleMessages } from '../../src/lib/ai/request';
import { parseChat } from '../../src/lib/chat/parse';
import { computeStats } from '../../src/lib/chat/stats';
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import type { IncomingMessage } from 'node:http';

import { APPLE_AUDIENCE, APPLE_ISSUER, verifyAppleToken } from '../lib/apple';
import { CoachSchema } from '../lib/coach';
import { sha256 } from '../lib/integrity';
import { maskPersonalData } from '../lib/mask';
import { ProfileSchema } from '../lib/profil';
import { RequestSchema, systemPrompt } from '../lib/report';
import { bearerToken, newToken, tokenHash, uidFromSub } from '../lib/session';

let passed = 0;
const queue: [string, () => void | Promise<void>][] = [];
function test(name: string, fn: () => void | Promise<void>) {
  queue.push([name, fn]);
}

const dir = path.resolve(__dirname, '../../../tools/sohbet-test/sohbetler');

test('örnek sohbetlerden geçerli istek oluşur', () => {
  for (const f of readdirSync(dir)) {
    const chat = parseChat(readFileSync(path.join(dir, f), 'utf8'));
    const payload = buildReportPayload({ relation: 'flort', me: chat.participants[0], participants: chat.participants, stats: computeStats(chat), messages: chat.messages });
    RequestSchema.parse(payload);
    assert.ok(payload.messages.length > 0, f);
  }
});

test('örnekleme sınırı aşmaz, son mesajları tutar', () => {
  const msgs = Array.from({ length: 5000 }, (_, i) => ({ time: new Date(2026, 0, 1, 0, i), author: i % 2 ? 'A' : 'B', text: `m${i}`, media: false }));
  const s = sampleMessages(msgs);
  assert.equal(s.length, MAX_MESSAGES);
  assert.equal(s.at(-1)!.text, 'm4999');
  assert.equal(s[0].text, 'm0');
  for (let i = 1; i < s.length; i++) assert.ok(s[i].time > s[i - 1].time, 'sıra korunmalı');
});

test('kişisel veriler maskelenir', () => {
  const t = maskPersonalData('ibanım TR33 0006 1005 1978 6457 8413 26, mail a.b@c.com, tel 0532 123 45 67');
  assert.ok(!t.includes('TR33'), t);
  assert.ok(!t.includes('a.b@c.com'), t);
  assert.ok(!t.includes('123 45 67'), t);
});

test('koç isteği geçmiş olmadan reddedilir', () => {
  assert.equal(CoachSchema.safeParse({ relation: 'flort', me: null, other: null, context: '', role: null, history: [] }).success, false);
});

test('her ilişki türü için sistem istemi var', () => {
  for (const r of ['sevgili', 'flort', 'grup', 'aile'] as const) assert.ok(systemPrompt(r).length > 200, r);
});

test('özet (hash) kararlı', () => {
  assert.equal(sha256('abc'), sha256('abc'));
  assert.notEqual(sha256('abc'), sha256('abd'));
});

// Apple belirteci: yerel anahtar çiftiyle (ağ yok).
async function appleSetup() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const sign = (o: { iss?: string; aud?: string; exp?: number } = {}) =>
    new SignJWT({ email: 'x@privaterelay.appleid.com' })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setSubject('001234.abc')
      .setIssuer(o.iss ?? APPLE_ISSUER)
      .setAudience(o.aud ?? APPLE_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(o.exp ?? Math.floor(Date.now() / 1000) + 600)
      .sign(privateKey);
  return { keys, sign };
}

test('Apple belirteci: geçerli kabul edilir', async () => {
  const { keys, sign } = await appleSetup();
  assert.deepEqual(await verifyAppleToken(await sign(), keys), { sub: '001234.abc', email: 'x@privaterelay.appleid.com' });
});

test('Apple belirteci: yanlış hedef, yanlış yayıncı, süresi dolmuş reddedilir', async () => {
  const { keys, sign } = await appleSetup();
  const bad = [
    await sign({ aud: 'com.baska.uygulama' }),
    await sign({ iss: 'https://kotu.example.com' }),
    await sign({ exp: Math.floor(Date.now() / 1000) - 3600 }),
    'bozuk.belirtec.x',
  ];
  for (const t of bad) await assert.rejects(verifyAppleToken(t, keys), { status: 401, code: 'invalid_token' });
});

test('başka anahtarla imzalı belirteç reddedilir', async () => {
  const a = await appleSetup();
  const b = await appleSetup();
  await assert.rejects(verifyAppleToken(await b.sign(), a.keys), { status: 401 });
});

test('kullanıcı kimliği kararlı ve biçimli', () => {
  assert.equal(uidFromSub('001234.abc'), uidFromSub('001234.abc'));
  assert.notEqual(uidFromSub('001234.abc'), uidFromSub('001234.abd'));
  assert.match(uidFromSub('001234.abc'), /^apple_[0-9a-f]{32}$/);
});

test('oturum belirteci: rastgele, özeti kararlı, Bearer okunur', () => {
  const t = newToken();
  assert.match(t, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(t, newToken());
  assert.equal(tokenHash(t), tokenHash(t));
  assert.match(tokenHash(t), /^[0-9a-f]{64}$/);
  const req = (authorization?: string) => ({ headers: authorization ? { authorization } : {} }) as IncomingMessage;
  assert.equal(bearerToken(req(`Bearer ${t}`)), t);
  assert.equal(bearerToken(req()), null);
  assert.equal(bearerToken(req('Bearer kisa')), null);
  assert.equal(bearerToken(req(`Basic ${t}`)), null);
});

test('profil şeması: geçerli gövdeler kabul edilir', () => {
  assert.ok(ProfileSchema.safeParse({ name: 'Ayşe', avatar: { emoji: '🦊', color: '#FF8800' }, overrides: { Ali: 'Ali Bey' } }).success);
  assert.ok(ProfileSchema.safeParse({ name: null, avatar: null, overrides: {} }).success);
  assert.ok(ProfileSchema.safeParse({ name: 'A', avatar: { kind: 'emoji', emoji: '🦊', color: '#FF8800' }, overrides: {} }).success);
  assert.ok(ProfileSchema.safeParse({ name: 'A', avatar: { kind: 'preset', id: 'f01', color: '#FF8800' }, overrides: {} }).success);
  assert.ok(!ProfileSchema.safeParse({ name: 'A', avatar: { kind: 'preset', id: 'F 01!', color: '#FF8800' }, overrides: {} }).success);
  assert.ok(!ProfileSchema.safeParse({ name: 'A', avatar: { kind: 'photo', file: 'x.jpg', color: '#FF8800' }, overrides: {} }).success);
});

test('profil şeması: hatalı gövdeler reddedilir', () => {
  const ok = { name: 'A', avatar: null, overrides: {} };
  const many = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`k${i}`, 'v']));
  for (const b of [
    { ...ok, name: 'x'.repeat(41) },
    { ...ok, avatar: { emoji: '🦊', color: 'red' } },
    { ...ok, avatar: { emoji: '🦊', color: '#12345' } },
    { ...ok, avatar: { emoji: '123456789', color: '#123456' } },
    { ...ok, overrides: { a: 'x'.repeat(81) } },
    { ...ok, overrides: many },
    { ...ok, overrides: { a: 1 } },
    { name: 'A', avatar: null },
    {},
  ])
    assert.equal(ProfileSchema.safeParse(b).success, false, JSON.stringify(b).slice(0, 80));
});

(async () => {
  for (const [name, fn] of queue) {
    await fn();
    passed++;
    console.log('✓', name);
  }
  console.log(`\n${passed} test geçti`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
