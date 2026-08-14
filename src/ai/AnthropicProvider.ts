import type { AIProvider, ExtractedFollowUp } from './types';

export class AnthropicProvider implements AIProvider {
  constructor(private readonly backendUrl: string, private readonly appSecret?: string) {}

  async extractFollowUpsFromText(text: string): Promise<ExtractedFollowUp[]> {
    const response = await fetch(`${this.backendUrl}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Extraction failed (${response.status}): ${body.error ?? 'unknown'}`);
    }

    const body = (await response.json()) as { candidates: ExtractedFollowUp[] };
    return body.candidates;
  }
}
