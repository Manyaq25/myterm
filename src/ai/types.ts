import type { FollowUpType } from '../types';

export interface ExtractedFollowUp {
  title: string;
  type: FollowUpType;
  personName: string | null;
  dueAtISO: string | null;
  confidence: number;
  note: string | null;
}

export interface TranscriptionResult {
  transcript: string;
  candidates: ExtractedFollowUp[];
}

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export interface AIProvider {
  extractFollowUpsFromText(text: string): Promise<ExtractedFollowUp[]>;
  transcribeAndExtract(audioFileUri: string): Promise<TranscriptionResult>;
  extractFollowUpsFromImage(base64Image: string, mediaType: ImageMediaType): Promise<ExtractedFollowUp[]>;
}
