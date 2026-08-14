export type FollowUpType = 'promise_made' | 'promise_expected' | 'task' | 'waiting_on';

export type FollowUpStatus = 'open' | 'done' | 'snoozed' | 'cancelled';

export type FollowUpSource = 'manual' | 'text' | 'voice' | 'screenshot' | 'pdf';

export interface Person {
  id: string;
  name: string;
  note: string | null;
  createdAt: number;
}

export interface FollowUp {
  id: string;
  title: string;
  detail: string | null;
  type: FollowUpType;
  status: FollowUpStatus;
  personId: string | null;
  dueAt: number | null;
  remindAt: number | null;
  source: FollowUpSource;
  confidence: number | null;
  notificationId: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface FollowUpWithPerson extends FollowUp {
  personName: string | null;
}

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  promise_made: 'Verdiğim söz',
  promise_expected: 'Benden beklenen',
  task: 'Yapılacak iş',
  waiting_on: 'Birinden beklediğim',
};

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  open: 'Açık',
  done: 'Tamamlandı',
  snoozed: 'Ertelendi',
  cancelled: 'İptal edildi',
};
