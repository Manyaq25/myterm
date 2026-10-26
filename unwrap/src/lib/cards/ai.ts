// Yapay zekâ raporundan hikâye (Wrapped) kartları: uyum yüzdesi, bayraklar,
// düello, grup ödülleri, eski sevgili ve kapanış. Eski raporlarda ek alanlar
// yoksa yalnız kapanış kartı çıkar.
import { t } from '@/i18n';
import { colors } from '@/theme';

import type { Report } from '../ai/types';
import type { Card } from './free';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
const winner = (w: string) => (w.trim().toUpperCase() === 'DRAW' ? t('report.duel.draw') : w);

export function buildAiCards(r: Report): Card[] {
  const cards: Card[] = [];
  if (r.compatibility) {
    cards.push({
      id: 'ai-uyum', kind: 'big', title: t('report.compat.storyTitle'), bg: colors.cardCoral,
      value: `%${clamp(r.compatibility.score)}`, unit: r.compatibility.title, caption: r.compatibility.line,
    });
  }
  if (r.flags && (r.flags.red.length || r.flags.green.length)) {
    cards.push({
      id: 'ai-bayrak', kind: 'list', title: t('report.flags.title'), bg: colors.surface, caption: r.flags.verdict,
      items: [
        ...r.flags.red.slice(0, 3).map((f) => ({ emoji: '🚩', title: f.title, sub: `“${f.quote}” · ${f.author}`, tint: colors.cardCoral })),
        ...r.flags.green.slice(0, 3).map((f) => ({ emoji: '💚', title: f.title, sub: `“${f.quote}” · ${f.author}`, tint: colors.cardMint })),
      ],
    });
  }
  if (r.loveDuel?.rounds.length) {
    cards.push({
      id: 'ai-duello', kind: 'list', title: t('report.duel.title'), bg: colors.cardLilac,
      caption: `💘 ${winner(r.loveDuel.winner)} · ${r.loveDuel.line}`,
      items: r.loveDuel.rounds.slice(0, 5).map((x) => ({ emoji: '⚔️', title: `${x.label}: ${winner(x.winner)}`, sub: x.detail })),
    });
  }
  if (r.awards?.length) {
    cards.push({
      id: 'ai-odul', kind: 'awards', title: t('report.awards.title'), bg: colors.cardButter, caption: t('report.awards.caption'),
      awards: r.awards.slice(0, 6).map((a) => ({ emoji: a.emoji, title: a.title, name: a.name })),
    });
  }
  if (r.ex) {
    cards.push({
      id: 'ai-eski', kind: 'list', title: t('report.ex.title'), bg: colors.cardPeach, caption: r.ex.lesson,
      items: [
        { emoji: '📖', title: r.ex.story },
        { emoji: '💔', title: t('report.ex.turningPoint'), sub: `“${r.ex.turningPoint.quote}” · ${r.ex.turningPoint.author} · ${r.ex.turningPoint.date}` },
      ],
    });
  }
  cards.push({ id: 'ai-final', kind: 'big', title: r.finale.title, bg: colors.cardMint, value: '✨', unit: '', caption: r.finale.text });
  return cards;
}
