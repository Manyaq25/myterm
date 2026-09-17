export type FollowUpType = 'promise_made' | 'promise_expected' | 'task' | 'waiting_on';

export type FollowUpStatus = 'open' | 'done' | 'snoozed' | 'cancelled';

export type FollowUpSource = 'manual' | 'text' | 'voice' | 'screenshot' | 'pdf';

export interface Person {
  id: string;
  name: string;
  note: string | null;
  phone: string | null;
  reminderLeadMinutes: number;
  lateSuggestionDismissedAt: number | null;
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

export const FOLLOW_UP_TYPES: FollowUpType[] = ['promise_made', 'promise_expected', 'task', 'waiting_on'];

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = ['open', 'done', 'snoozed', 'cancelled'];
