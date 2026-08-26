import type { AIProvider, ExtractedFollowUp, ImageMediaType, TranscriptionResult } from './types';

/**
 * Backend olmadan UI akışını test etmek için. Gerçek bir dil anlayışı yapmaz —
 * metni satır/cümlelere böler ve her birini düşük güvenli bir "task" adayı olarak döner.
 */
export class MockAIProvider implements AIProvider {
  async extractFollowUpsFromText(text: string): Promise<ExtractedFollowUp[]> {
    const parts = text
      .split(/[\n.]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    return parts.map((title) => ({
      title,
      type: 'task',
      personName: null,
      dueAtISO: null,
      confidence: 0.5,
      note: 'Mock AI (test modu) — gerçek çıkarım için backend gerekli.',
    }));
  }

  async transcribeAndExtract(_audioFileUri: string): Promise<TranscriptionResult> {
    const transcript = 'Mock AI (test modu) — gerçek deşifre için backend gerekli.';
    return { transcript, candidates: await this.extractFollowUpsFromText(transcript) };
  }

  async extractFollowUpsFromImage(_base64Image: string, _mediaType: ImageMediaType): Promise<ExtractedFollowUp[]> {
    return [
      {
        title: 'Mock AI (test modu) — gerçek görsel analizi için backend gerekli.',
        type: 'task',
        personName: null,
        dueAtISO: null,
        confidence: 0.5,
        note: null,
      },
    ];
  }

  async askAssistant(_question: string, _context: string): Promise<string> {
    return 'Mock AI (test modu) — gerçek asistan yanıtı için backend gerekli.';
  }
}
