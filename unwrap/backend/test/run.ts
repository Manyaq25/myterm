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

const publicDir = path.resolve(__dirname, '../public');
const LEGAL_PAGES = ['index.html', 'gizlilik.html', 'kosullar.html', 'hesap-silme.html'];

test('yasal sayfalar var, TODO kalmamış, Türkçe + İngilizce', () => {
  for (const f of LEGAL_PAGES) {
    const html = readFileSync(path.join(publicDir, f), 'utf8');
    assert.ok(!/TODO/i.test(html), `${f}: TODO kalmış`);
    assert.match(html, /<html lang="tr">/, f);
    assert.match(html, /name="viewport"/, f);
    assert.ok(!/<script/i.test(html), `${f}: dış betik olmamalı`);
    if (f !== 'index.html') assert.match(html, /id="en"/, `${f}: İngilizce bölüm (#en) yok`);
  }
});

test('vercel.json: geçerli, işlev ayarları ve temiz adresler yerinde', () => {
  const cfg = JSON.parse(readFileSync(path.resolve(__dirname, '../vercel.json'), 'utf8'));
  assert.equal(cfg.cleanUrls, true);
  assert.equal(cfg.outputDirectory, 'public');
  assert.equal(cfg.functions['api/report.ts'].maxDuration, 60);
  assert.equal(cfg.functions['api/coach.ts'].maxDuration, 30);
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

// Sona eklendi: test() kuyruğu çalışırken de dolar (for…of canlı dizi).
test('bildirim şeması: kabul ve red', async () => {
  const { BildirSchema } = await import('../lib/bildir');
  const ok = { kind: 'mila', reason: 'saldirgan', text: 'kötü cevap', lang: 'en' };
  assert.ok(BildirSchema.safeParse(ok).success);
  assert.ok(BildirSchema.safeParse({ ...ok, kind: 'rapor', reason: 'yanlis', note: 'not' }).success);
  assert.equal(BildirSchema.parse({ kind: 'mila', reason: 'diger', text: 'x' }).lang, 'tr');
  for (const b of [
    { ...ok, kind: 'koc' },
    { ...ok, reason: 'spam' },
    { ...ok, text: '' },
    { ...ok, text: 'x'.repeat(2001) },
    { ...ok, note: 'x'.repeat(301) },
    { ...ok, lang: 'xx' },
    { kind: 'mila', reason: 'diger' },
  ])
    assert.equal(BildirSchema.safeParse(b).success, false, JSON.stringify(b).slice(0, 80));
});

test('ek kart şemaları ilişki türüne göre: yalnız uygun alanlar', async () => {
  const { ReportSchema, extrasSchema } = await import('../lib/report');
  const base = { summary: 's', cards: [], karne: { subjects: [], teacherNote: 'n' }, tone: [], replies: [], finale: { title: 't', text: 'x' } };
  assert.ok(ReportSchema.safeParse(base).success, 'ana rapor ek kartsız geçerli');
  const flags = { red: [{ title: 'Noktalı Tamam', author: 'A', quote: 'Tamam.', date: '01.02' }], green: [], verdict: 'v' };
  const compatibility = { score: 87, title: 'Ruh ikizi', best: 'mizah', clash: 'plan', line: 'l' };
  const loveDuel = { rounds: [{ label: 'İlk mesaj', winner: 'A', detail: 'd' }], winner: 'DRAW', line: 'l' };
  const ex = { story: 's', turningPoint: { author: 'A', quote: 'q', date: '01.01', note: 'n' }, lesson: 'l' };
  assert.ok(extrasSchema('sevgili').safeParse({ flags, compatibility, loveDuel }).success);
  assert.equal(extrasSchema('sevgili').safeParse({ flags, compatibility }).success, false, 'düello zorunlu');
  assert.ok(extrasSchema('eski').safeParse({ flags, compatibility, ex }).success);
  assert.ok(extrasSchema('grup').safeParse({ awards: [{ emoji: '🦉', title: 'Gece kuşu', name: 'B', reason: 'r' }] }).success);
  assert.ok(extrasSchema('arkadas').safeParse({ flags, compatibility }).success);
  assert.deepEqual(Object.keys(extrasSchema('grup').shape), ['awards']);
});

test('ek kart istemi ilişki türüne göre', async () => {
  const { extrasSystemPrompt } = await import('../lib/report');
  assert.ok(extrasSystemPrompt('sevgili').includes('loveDuel: "Kim daha çok seviyor?"'));
  assert.ok(!extrasSystemPrompt('sevgili').includes('awards'));
  assert.ok(extrasSystemPrompt('grup').includes('awards: grup ödül töreni') && !extrasSystemPrompt('grup').includes('flags'));
  assert.ok(extrasSystemPrompt('eski').includes('ex: eski sevgiliyle'));
  assert.ok(extrasSystemPrompt('sevgili', 'en').includes('OUTPUT LANGUAGE'));
  assert.ok(!systemPrompt('sevgili').includes('loveDuel'), 'ana istem ek kartları istemez');
});

test('davet ve hediye kodları: biçim, karışan harf yok', async () => {
  const { CODE, newCode } = await import('../lib/davet');
  const { GIFT_CODE } = await import('../lib/hediye');
  for (let i = 0; i < 200; i++) {
    const c = newCode();
    assert.ok(CODE.test(c), c);
    assert.ok(!/[01IO]/.test(c), c);
  }
  assert.ok(GIFT_CODE.test('ABCDEFGH') && !GIFT_CODE.test('ABCDEF') && !CODE.test('ABCDEFGH'));
  assert.equal(newCode(() => 0), 'AAAAAA');
});

test('koç: hakem (çift modu) rolü kabul edilir ve istemde hakem kuralı var', async () => {
  const req = { relation: 'sevgili', me: 'A', other: 'B', context: '', role: 'hakem', history: [{ role: 'user', text: 'Ben: o geç kaldı. O: trafik vardı.' }] };
  assert.ok(CoachSchema.safeParse(req).success);
  assert.equal(CoachSchema.safeParse({ ...req, role: 'patron' }).success, false);
});
