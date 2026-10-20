import { t } from '@/i18n';
import type { Relation } from './store';

// Analiz kurulumu ve Mila'nın rol seçimi aynı listeyi kullanır.
// Etiket o anki dilde okunur (getter).
const rel = (id: Relation, emoji: string) => ({
  id,
  emoji,
  get label() {
    return t(`common.relations.${id}`);
  },
});

export const RELATIONS: { id: Relation; readonly label: string; emoji: string }[] = [
  rel('sevgili', '💘'),
  rel('es', '💍'),
  rel('nisanli', '💎'),
  rel('flort', '🦋'),
  rel('crush', '😍'),
  rel('situationship', '🌀'),
  rel('eski', '💔'),
  rel('bestie', '👯'),
  rel('arkadas', '🤝'),
  rel('aile', '👨‍👩‍👧'),
  rel('is', '💼'),
  rel('diger', '✨'),
];

const ROMANTIC = new Set<Relation>(['sevgili', 'es', 'nisanli', 'flort', 'crush', 'situationship', 'eski']);
export const isRomantic = (r: Relation | null) => r != null && ROMANTIC.has(r);

export const relationLabel = (r: Relation | null) =>
  r === 'grup' ? t('common.relations.grup') : (RELATIONS.find((x) => x.id === r)?.label ?? t('common.relations.chat'));
