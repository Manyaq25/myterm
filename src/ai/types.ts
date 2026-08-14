import type { FollowUpType } from '../types';

export interface ExtractedFollowUp {
  title: string;
  type: FollowUpType;
  personName: string | null;
  dueAtISO: string | null;
  confidence: number;
  note: string | null;
}

export interface AIProvider {
  extractFollowUpsFromText(text: string): Promise<ExtractedFollowUp[]>;
}
