// Gerçek modelle uçtan uca rapor denemesi (GitHub Actions'ta, UNWRAP anahtarıyla).
// Uygulamanın isteği hazırlayan kodu + sunucunun istemi ve şeması birlikte denenir.
// Çalıştırma: npx tsx test/live-report.ts  (UNWRAP_ANTHROPIC_API_KEY gerekli)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildReportPayload } from '../../src/lib/ai/request';
import { parseChat } from '../../src/lib/chat/parse';
import { computeStats } from '../../src/lib/chat/stats';
import { RequestSchema, generateReport } from '../lib/report';
import { coachReply } from '../lib/coach';

const dir = path.resolve(__dirname, '../../../tools/sohbet-test/sohbetler');
const SETUP: Record<string, { me: string; relation: string }> = {
  '1-soguyan-flort.txt': { me: 'Emre', relation: 'flort' },
  '2-kankalar-grubu.txt': { me: 'Burak', relation: 'grup' },
  '3-anne-ogul.txt': { me: 'Kerem', relation: 'aile' },
  '4-ironik-kavga.txt': { me: 'Ozan', relation: 'sevgili' },
  '5-kanka-sevgisi.txt': { me: 'Damla', relation: 'arkadas' },
};

async function main() {
  if (!process.env.UNWRAP_ANTHROPIC_API_KEY) throw new Error('UNWRAP_ANTHROPIC_API_KEY yok');
  const out: string[] = ['# Unwrap canlı rapor denemesi', ''];
  // Aynı ironik kavga sohbeti bir kez de "eski sevgili" olarak denenir (ex kartı).
  const runs: [string, { me: string; relation: string }][] = [
    ...readdirSync(dir).sort().map((f): [string, { me: string; relation: string }] => [f, SETUP[f]]),
    ['4-ironik-kavga.txt', { me: 'Ozan', relation: 'eski' }],
  ];
  for (const [f, setup] of runs) {
    const chat = parseChat(readFileSync(path.join(dir, f), 'utf8'));
    const stats = computeStats(chat);
    const payload = RequestSchema.parse(
      buildReportPayload({ relation: setup.relation, me: setup.me, participants: chat.participants, stats, messages: chat.messages }),
    );
    const t0 = Date.now();
    const { report, usage } = await generateReport(payload, 'sonnet');
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const cost = (usage.input * 2 + usage.output * 10) / 1e6;
    out.push(`## ${f} (${setup.relation}, kullanıcı ${setup.me})`, `_${usage.model} · girdi ${usage.input} · çıktı ${usage.output} · ${secs} sn · $${cost.toFixed(4)}_`, '');
    out.push('```json', JSON.stringify(report, null, 2), '```', '');

    // Kanıt kontrolü: alıntılar sohbette gerçekten geçiyor mu?
    const all = chat.messages.map((m) => m.text).join('\n');
    const quotes = [
      ...report.cards.flatMap((c) => c.evidence.map((e) => e.quote)),
      ...(report.flags ? [...report.flags.red, ...report.flags.green].map((f) => f.quote) : []),
      ...(report.ex ? [report.ex.turningPoint.quote] : []),
    ];
    out.push(`Ek kartlar: bayrak ${report.flags ? report.flags.red.length + '+' + report.flags.green.length : '-'} · uyum ${report.compatibility?.score ?? '-'} · düello ${report.loveDuel?.rounds.length ?? '-'} · ödül ${report.awards?.length ?? '-'} · eski ${report.ex ? 'var' : '-'}`);
    const missing = quotes.filter((q) => !all.includes(q.replace(/^["“]|["”]$/g, '')));
    out.push(`Kanıt alıntıları: ${quotes.length - missing.length}/${quotes.length} sohbette birebir bulundu.`);
    if (missing.length) out.push('Bulunamayanlar: ' + missing.map((q) => `"${q}"`).join(' · '));
    out.push('');

    if (f.startsWith('1-')) {
      const coach = await coachReply({
        lang: 'tr', relation: 'flort', me: 'Emre', other: 'Zeynep', role: null,
        context: `${payload.stats}\n\n${payload.messages}`,
        history: [{ role: 'user', text: 'Zeynep son günlerde çok soğuk, ilgisini mi kaybetti? Ona ne yazayım?' }],
      });
      out.push('### Mila (koç) cevabı', coach.text, `_girdi ${coach.usage.input} · çıktı ${coach.usage.output}_`, '');
      const role = await coachReply({
        lang: 'tr', relation: 'flort', me: 'Emre', other: 'Zeynep', role: 'hoslandigim',
        context: `${payload.stats}\n\n${payload.messages}`,
        history: [{ role: 'user', text: 'Selam, bugün nasılsın?' }],
      });
      out.push('### Mila rol yapma (hoşlandığım kişi)', role.text, '');

      // Ücretsiz sürüm: Pro'ya özel konular (dolaylı sorular dahil) yakalanmalı.
      const freeCases: [string, boolean][] = [
        ['Flörtüme ilk mesajı nasıl atayım?', false],
        ['Sevgilim telefonunu benden saklıyor, sence neden?', true],
        ['Arkadaşım için soruyorum: partneri ekranını hep ters çeviriyormuş, bu ne demek olabilir?', true],
        ['Sohbetimiz tıkandı, nasıl ilerletebilirim?', true],
        ['Tartıştık, genel olarak nasıl barışılır?', false],
      ];
      out.push('### Ücretsiz sürüm kapısı');
      for (const [q, expectPro] of freeCases) {
        const r = await coachReply({ lang: 'tr', relation: 'diger', me: null, other: null, role: null, context: '', history: [{ role: 'user', text: q }] }, 'free');
        const ok = r.proRequired === expectPro;
        out.push(`- ${ok ? '✅' : '❌'} "${q}" → ${r.proRequired ? 'PRO' : 'cevap'}: ${r.text.slice(0, 160).replace(/\n/g, ' ')}`);
      }
      out.push('');

      // Diğer dil: İngilizce rapor + İngilizce ücretsiz kapı.
      const en = await generateReport({ ...payload, lang: 'en' }, 'sonnet');
      out.push('### English report (same chat)', '```json', JSON.stringify(en.report, null, 2).slice(0, 3000), '```');
      const enGate = await coachReply({ lang: 'en', relation: 'diger', me: null, other: null, role: null, context: '', history: [{ role: 'user', text: 'Asking for a friend: her boyfriend always keeps his phone face down, what does it mean?' }] }, 'free');
      out.push(`- ${enGate.proRequired ? '✅' : '❌'} EN gate → ${enGate.proRequired ? 'PRO' : 'answer'}: ${enGate.text.slice(0, 160)}`, '');
    }
    console.log('bitti:', f);
  }
  const report = out.join('\n');
  writeFileSync(path.resolve(__dirname, 'live-report-output.md'), report);
  console.log('\n===== RAPOR =====\n' + report);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
