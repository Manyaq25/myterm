import type { Relation } from './store';

export const RELATIONS: { id: Relation; label: string; emoji: string }[] = [
  { id: 'sevgili', label: 'Sevgili', emoji: '💘' },
  { id: 'es', label: 'Eş', emoji: '💍' },
  { id: 'flort', label: 'Flört', emoji: '🦋' },
  { id: 'eski', label: 'Eski sevgili', emoji: '💔' },
  { id: 'arkadas', label: 'Arkadaş', emoji: '🤝' },
  { id: 'aile', label: 'Aile', emoji: '👨‍👩‍👧' },
  { id: 'is', label: 'İş', emoji: '💼' },
  { id: 'diger', label: 'Diğer', emoji: '✨' },
];

export const isRomantic = (r: Relation | null) => r === 'sevgili' || r === 'es' || r === 'flort' || r === 'eski';

export const relationLabel = (r: Relation | null) =>
  r === 'grup' ? 'Grup' : (RELATIONS.find((x) => x.id === r)?.label ?? 'Sohbet');
