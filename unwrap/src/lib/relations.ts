import type { Relation } from './store';

// Analiz kurulumu ve Mila'nın rol seçimi aynı listeyi kullanır.
export const RELATIONS: { id: Relation; label: string; emoji: string }[] = [
  { id: 'sevgili', label: 'Sevgili', emoji: '💘' },
  { id: 'es', label: 'Eş', emoji: '💍' },
  { id: 'nisanli', label: 'Nişanlı', emoji: '💎' },
  { id: 'flort', label: 'Flört', emoji: '🦋' },
  { id: 'crush', label: 'Crush', emoji: '😍' },
  { id: 'situationship', label: 'Situationship', emoji: '🌀' },
  { id: 'eski', label: 'Eski sevgili', emoji: '💔' },
  { id: 'bestie', label: 'Bestie / Kanka', emoji: '👯' },
  { id: 'arkadas', label: 'Arkadaş', emoji: '🤝' },
  { id: 'aile', label: 'Aile', emoji: '👨‍👩‍👧' },
  { id: 'is', label: 'İş', emoji: '💼' },
  { id: 'diger', label: 'Diğer', emoji: '✨' },
];

const ROMANTIC = new Set<Relation>(['sevgili', 'es', 'nisanli', 'flort', 'crush', 'situationship', 'eski']);
export const isRomantic = (r: Relation | null) => r != null && ROMANTIC.has(r);

export const relationLabel = (r: Relation | null) =>
  r === 'grup' ? 'Grup' : (RELATIONS.find((x) => x.id === r)?.label ?? 'Sohbet');
