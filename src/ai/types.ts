import type { FollowUpType } from '../types';

export interface ExtractedFollowUp {
  title: string;
  type: FollowUpType;
  personName: string | null;
  dueAtISO: string | null;
  /** Metinde açık bir saat geçiyorsa true; eski backend sürümleri göndermez. */
  timeSpecified?: boolean;
  confidence: number;
  note: string | null;
}

export interface TranscriptionResult {
  transcript: string;
  candidates: ExtractedFollowUp[];
}

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

/** Backend'in döndürdüğü HTTP durumunu ve hata kodunu taşır (ör. 413 image_too_large). */
export class AIRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(`AI request failed (${status}): ${code}`);
  }
}

export type ReminderTone = 'friendly' | 'formal' | 'short';

export interface ReminderMessageInput {
  title: string;
  personName: string;
  note?: string | null;
  /** Kullanıcının dilinde, okunabilir tarih (ör. "12 Ekim Pazartesi"). */
  due?: string | null;
  tone: ReminderTone;
}

export interface AIProvider {
  extractFollowUpsFromText(text: string): Promise<ExtractedFollowUp[]>;
  transcribeAndExtract(audioFileUri: string): Promise<TranscriptionResult>;
  extractFollowUpsFromImage(imageUri: string): Promise<ExtractedFollowUp[]>;
  extractFollowUpsFromPdf(base64Pdf: string): Promise<ExtractedFollowUp[]>;
  askAssistant(question: string, context: string): Promise<string>;
  /** Kişiye gönderilecek nazik hatırlatma mesajı ("Mesajla hatırlat"). */
  writeReminderMessage(input: ReminderMessageInput): Promise<string>;
}
