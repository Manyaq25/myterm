// Profil istatistikleri testi: npx tsx scripts/test-profile.ts
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseChat } from '../src/lib/chat/parse';
import { computeStats, formatDuration } from '../src/lib/chat/stats';
import { computeMyStats } from '../src/lib/profile/stats';
import type { Analysis } from '../src/lib/store';
import type { Report } from '../src/lib/ai/types';

const dir = '../tools/sohbet-test/sohbetler';
const build = (file: string, me: string, createdAt: string): Analysis => {
  const chat = parseChat(readFileSync(`${dir}/${file}`, 'utf8'));
  assert.ok(chat.participants.includes(me), `${file}: ${me} yok`);
  return {
    id: file, createdAt, title: file.replace(/\.txt$/, ''), source: chat.source, participants: chat.participants,
    me, relation: null, stats: computeStats(chat), messages: chat.messages,
  };
};

const analyses = [
  build('1-soguyan-flort.txt', 'Emre', '2026-10-15T10:00:00Z'),
  build('5-kanka-sevgisi.txt', 'Damla', '2026-10-16T10:00:00Z'),
  build('2-kankalar-grubu.txt', 'Can', '2026-10-17T10:00:00Z'),
];
// me olmayan analiz sayılmaz
const noMe = { ...build('3-anne-ogul.txt', 'Kerem', '2026-10-18T10:00:00Z'), me: null };

const s = computeMyStats([...analyses, noMe]);
console.log(s);
console.log('ghosting', s.ghosting && formatDuration(s.ghosting.ms), '| cevap', s.medianReplyMs != null && formatDuration(s.medianReplyMs));

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
assert.equal(s.chats, 3);
assert.ok(s.messages > 0);
const expected = analyses.reduce((n, a) => n + a.messages.filter((m) => m.author === a.me).length, 0);
assert.equal(s.messages, expected);
assert.ok(s.topPerson && ['Zeynep', 'Ece'].includes(s.topPerson.name));
for (const pct of [s.nightOwlPct, s.initiationPct]) if (pct != null) assert.ok(pct >= 0 && pct <= 100);
for (const mo of [s.happiestMoment, s.mostEmotionalDay]) {
  if (!mo) continue;
  assert.match(mo.date, dateRe);
  assert.ok(analyses.some((a) => a.title === mo.chat));
  assert.ok(mo.text == null || mo.text.length <= 140);
}
if (s.ghosting) assert.ok(s.ghosting.ms >= 60 * 60 * 1000);
if (s.busiestHour != null) assert.ok(s.busiestHour >= 0 && s.busiestHour <= 23);
assert.ok(s.longestMessageWords != null && s.longestMessageWords > 0);
assert.ok(s.firstMessageDate && !Number.isNaN(Date.parse(s.firstMessageDate)));
if (s.favoriteWord) assert.ok(s.favoriteWord.count >= 3 && s.favoriteWord.word.length >= 3);
assert.deepEqual(s.ai, []);
assert.equal(s.karneAvg, null);

// Boş girdi
const empty = computeMyStats([]);
assert.equal(empty.chats, 0);
assert.equal(empty.topPerson, null);
assert.equal(empty.busiestHour, null);

// Küçük sahte rapor
const report: Report = {
  summary: '',
  cards: [
    { key: 'ilgi', title: 'İlgi', people: [{ name: 'Zeynep', value: 30, display: '%30' }, { name: 'Emre', value: 70, display: '%70' }], evidence: [], caption: '' },
    { key: 'mizah', title: 'Mizah', people: [{ name: 'Zeynep', value: 5, display: '5/10' }], evidence: [], caption: '' },
  ],
  karne: { subjects: [
    { subject: 'İletişim', grades: [{ name: 'Emre', grade: 8 }, { name: 'Zeynep', grade: 4 }] },
    { subject: 'Mizah', grades: [{ name: 'Emre', grade: 7 }] },
  ], teacherNote: '' },
  tone: [], replies: [], finale: { title: '', text: '' },
};
analyses[0].report = report;
const r = computeMyStats(analyses);
assert.deepEqual(r.ai, [{ key: 'ilgi', title: 'İlgi', display: '%70', value: 70, chat: '1-soguyan-flort' }]);
assert.equal(r.karneAvg, 7.5);

console.log('\nPROFIL TESTLERI GEÇTİ');
