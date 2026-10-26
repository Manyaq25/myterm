// Aylık ilişki raporu kartı (hesap: lib/chat/month.ts).
import { locale, t } from '@/i18n';
import { colors } from '@/theme';

import { change, monthCompare } from '../chat/month';
import type { Message } from '../chat/parse';
import type { Card } from './free';

export function monthCard(messages: Message[]): Card | null {
  const c = monthCompare(messages);
  if (!c) return null;
  const fmt = (n: number) => n.toLocaleString(locale());
  const row = (emoji: string, key: string, now: number, before: number, goodWhenUp = true) => {
    const ch = change(now, before);
    const arrow = ch == null || ch === 0 ? '＝' : ch > 0 ? '▲' : '▼';
    const good = ch == null || ch === 0 ? null : (ch > 0) === goodWhenUp;
    return {
      emoji,
      title: `${t(`story.month.${key}`)}: ${fmt(now)}`,
      sub: t('story.month.vs', { before: fmt(before), change: ch == null ? '–' : `${arrow} %${Math.abs(ch)}` }),
      tint: good == null ? undefined : good ? colors.cardMint : colors.cardCoral,
    };
  };
  const msgCh = change(c.now.messages, c.before.messages) ?? 0;
  const caption = msgCh >= 15 ? t('story.month.captionUp') : msgCh <= -15 ? t('story.month.captionDown') : t('story.month.captionSame');
  return {
    id: 'ay', kind: 'list', title: t('story.month.title'), bg: colors.cardButter, caption,
    items: [
      row('💬', 'messages', c.now.messages, c.before.messages),
      row('📅', 'days', c.now.days, c.before.days),
      row('😂', 'laughs', c.now.laughs, c.before.laughs),
      row('🌙', 'night', c.now.night, c.before.night),
    ],
  };
}
