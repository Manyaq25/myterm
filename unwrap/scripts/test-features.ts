// Yeni özellik testleri (aylık karşılaştırma, haftalık meydan okuma): npx tsx scripts/test-features.ts
import assert from 'node:assert/strict';

import { CHALLENGES, challengeOfWeek, isoWeek } from '../src/lib/challenge';
import { change, monthCompare } from '../src/lib/chat/month';
import type { Message } from '../src/lib/chat/parse';

const DAY = 86_400_000;
const at = (daysAgo: number, hour = 12) => new Date(Date.UTC(2026, 9, 25, hour) - daysAgo * DAY);
const msg = (daysAgo: number, text = 'selam', hour = 12): Message => ({ time: at(daysAgo, hour), author: daysAgo % 2 ? 'A' : 'B', text, media: false });

// Son 30 gün: 40 mesaj (10'u kahkaha, 5'i gece); önceki 30 gün: 20 mesaj
const list: Message[] = [
  ...Array.from({ length: 20 }, (_, i) => msg(31 + i)),
  ...Array.from({ length: 25 }, (_, i) => msg(i % 25)),
  ...Array.from({ length: 10 }, (_, i) => msg(i, 'hahaha 😂')),
  ...Array.from({ length: 5 }, (_, i) => msg(i, 'uyku yok', 2)),
].sort((a, b) => a.time.getTime() - b.time.getTime());
const c = monthCompare(list)!;
assert.ok(c, 'karşılaştırma çıkmalı');
assert.equal(c.now.messages + c.before.messages, 60);
assert.equal(c.before.messages, 20);
assert.ok(c.now.laughs >= 20, `kahkaha ${c.now.laughs}`);
assert.equal(c.now.night, 5);
assert.equal(change(40, 20), 100);
assert.equal(change(5, 0), null);
// Yetersiz veri: kart çıkmaz
assert.equal(monthCompare(list.slice(-10)), null);
assert.equal(monthCompare([]), null);
// Medya mesajları sayılmaz
assert.equal(monthCompare(list.map((m) => ({ ...m, media: true }))), null);

// Hafta: aynı hafta aynı konu, ISO hafta doğru
assert.equal(isoWeek(new Date(2026, 0, 1)), 1);
assert.equal(isoWeek(new Date(2026, 11, 31)), 53);
assert.equal(challengeOfWeek(new Date(2026, 9, 26)), challengeOfWeek(new Date(2026, 9, 31)));
assert.notEqual(challengeOfWeek(new Date(2026, 9, 26)), challengeOfWeek(new Date(2026, 10, 2)));
assert.ok(CHALLENGES.includes(challengeOfWeek()));
console.log('YENİ ÖZELLİK TESTLERİ GEÇTİ');
