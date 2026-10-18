// Çevrimdışı testler (anahtar gerekmez): istek hazırlama, maskeleme, şemalar.
// Çalıştırma: npm test
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { MAX_MESSAGES, buildReportPayload, sampleMessages } from '../../src/lib/ai/request';
import { parseChat } from '../../src/lib/chat/parse';
import { computeStats } from '../../src/lib/chat/stats';
import { CoachSchema } from '../lib/coach';
import { sha256 } from '../lib/integrity';
import { maskPersonalData } from '../lib/mask';
import { RequestSchema, systemPrompt } from '../lib/report';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log('✓', name);
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

console.log(`\n${passed} test geçti`);
