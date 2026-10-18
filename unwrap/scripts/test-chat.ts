// Ayrıştırıcı ve istatistik testleri: npx tsx scripts/test-chat.ts
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseChat } from '../src/lib/chat/parse';
import { computeStats, formatDuration } from '../src/lib/chat/stats';
import { maskPersonalData } from '../src/lib/chat/mask';

const dir = '../tools/sohbet-test/sohbetler';
for (const f of readdirSync(dir).sort()) {
  const chat = parseChat(readFileSync(`${dir}/${f}`, 'utf8'));
  const s = computeStats(chat);
  console.log(f, chat.messages.length, 'mesaj', chat.participants.join(','), '| gün', s.spanDays,
    '| sessizlik', s.longestSilence && formatDuration(s.longestSilence.ms), 'kıran', s.longestSilence?.brokenBy,
    '| gülme', s.totalLaughs);
  for (const p of s.people) console.log('   ', p.name, p.messages, 'başlatma', p.initiations,
    'cevap', p.medianReplyMs == null ? '-' : formatDuration(p.medianReplyMs), 'emoji', p.topEmoji, 'tamam.', p.coldTamam, 'aynen', p.aynen);
}

// Belirli beklentiler
const flort = computeStats(parseChat(readFileSync(`${dir}/1-soguyan-flort.txt`, 'utf8')));
assert.equal(flort.people.find((p) => p.name === 'Zeynep')!.initiations, 0);
assert.equal(flort.people.find((p) => p.name === 'Zeynep')!.coldTamam, 1);
const grup = computeStats(parseChat(readFileSync(`${dir}/2-kankalar-grubu.txt`, 'utf8')));
assert.equal(grup.isGroup, true);
assert.equal(grup.people.length, 4);

// İngilizce telefon: ay önce, AM/PM, çok satırlı mesaj, medya
const en = parseChat(`10/14/26, 8:05 PM - Messages and calls are end-to-end encrypted.
10/14/26, 8:05 PM - Alex: hey
second line
10/14/26, 9:15 PM - Sam: <Media omitted>
10/15/26, 12:30 AM - Sam: haha ok 😂😂`);
assert.equal(en.messages.length, 3);
assert.equal(en.messages[0].text, 'hey\nsecond line');
assert.equal(en.messages[1].media, true);
assert.equal(en.messages[1].time.getHours(), 21);
assert.equal(en.messages[2].time.getHours(), 0);
assert.equal(en.messages[2].time.getDate(), 15);
assert.equal(computeStats(en).totalLaughs, 3);

// iPhone: görünmez işaretler ve sistem satırı
const ios = parseChat('‎[14.10.2026 18:02:10] Selin: ‎Mesajlar uçtan uca şifrelidir.\n[14.10.2026 18:02:10] Selin: Neredesin?\n‎[14.10.2026 18:40:22] Ozan: ‎görüntü dahil edilmedi');
assert.equal(ios.messages.length, 3);
assert.equal(ios.messages[2].media, true);

// Telegram JSON
const tg = parseChat(JSON.stringify({ messages: [
  { type: 'service', date: '2026-10-01T10:00:00', from: null, text: '' },
  { type: 'message', date: '2026-10-01T10:00:05', from: 'Ece', text: ['Selam ', { type: 'bold', text: 'kızım' }] },
  { type: 'message', date: '2026-10-01T10:01:00', from: 'Damla', text: '', photo: 'p.jpg' },
] }));
assert.equal(tg.source, 'telegram');
assert.equal(tg.messages[0].text, 'Selam kızım');
assert.equal(tg.messages[1].media, true);

assert.equal(maskPersonalData('IBAN TR00 0000 0000 0000 0000 0000 00, tel 0532 123 45 67, a@b.com'), 'IBAN [IBAN], tel [TELEFON], [E-POSTA]');
assert.throws(() => parseChat('merhaba'));
assert.equal(formatDuration(3 * 60 * 60 * 1000 + 12 * 60 * 1000), '3 sa 12 dk');
console.log('\nTÜM TESTLER GEÇTİ');
