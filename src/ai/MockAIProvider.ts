import type { AIProvider, ExtractedFollowUp } from './types';

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
}
