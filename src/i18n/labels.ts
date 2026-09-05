import type { TFunction } from 'i18next';
import type { FollowUpStatus, FollowUpType } from '../types';

export function followUpTypeLabel(type: FollowUpType, t: TFunction): string {
  return t(`followUpType.${type}`);
}

export function followUpStatusLabel(status: FollowUpStatus, t: TFunction): string {
  return t(`followUpStatus.${status}`);
}
