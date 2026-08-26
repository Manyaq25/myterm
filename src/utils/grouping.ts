import type { FollowUpWithPerson } from '../types';

export interface PersonGroup {
  personId: string | null;
  personName: string;
  items: FollowUpWithPerson[];
  hasOverdue: boolean;
}

/**
 * Maddeleri kişiye göre gruplar. Gecikmiş maddesi olan gruplar önce gelir;
 * grup içinde de en gecikmiş/en yakın son tarihli madde en üstte olur.
 */
export function groupFollowUpsByPerson(items: FollowUpWithPerson[]): PersonGroup[] {
  const groups = new Map<string, PersonGroup>();

  for (const item of items) {
    const key = item.personId ?? '__none__';
    let group = groups.get(key);
    if (!group) {
      group = {
        personId: item.personId,
        personName: item.personName ?? 'Kişisiz',
        items: [],
        hasOverdue: false,
      };
      groups.set(key, group);
    }
    group.items.push(item);
    if (item.dueAt !== null && item.dueAt < Date.now()) {
      group.hasOverdue = true;
    }
  }

  for (const group of groups.values()) {
    group.items.sort((a, b) => {
      if (a.dueAt === null) return 1;
      if (b.dueAt === null) return -1;
      return a.dueAt - b.dueAt;
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.hasOverdue !== b.hasOverdue) return a.hasOverdue ? -1 : 1;
    return a.personName.localeCompare(b.personName, 'tr');
  });
}
