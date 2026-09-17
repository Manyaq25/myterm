import * as FileSystem from 'expo-file-system/legacy';
import type { AIProvider, ExtractedFollowUp, ImageMediaType, TranscriptionResult } from './types';

// AI çıkarım/asistan çağrıları normalde birkaç saniyede döner ama zayıf bir
// bağlantıda ya da backend takılırsa fetch süresiz asılı kalabilir — bu da
// kullanıcıya sonsuz bir yükleniyor ekranı olarak yansır. AbortController
// ile makul bir üst sınır koyuyoruz.
const FETCH_TIMEOUT_MS = 45_000;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export class AnthropicProvider implements AIProvider {
  constructor(private readonly backendUrl: string, private readonly appSecret?: string) {}

  async extractFollowUpsFromText(text: string): Promise<ExtractedFollowUp[]> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/extract`, {
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

  async transcribeAndExtract(audioFileUri: string): Promise<TranscriptionResult> {
    const result = await FileSystem.uploadAsync(`${this.backendUrl}/api/transcribe`, audioFileUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'audio/m4a',
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
    });

    if (result.status < 200 || result.status >= 300) {
      const errorBody = JSON.parse(result.body || '{}');
      throw new Error(`Transcription failed (${result.status}): ${errorBody.error ?? 'unknown'}`);
    }

    return JSON.parse(result.body) as TranscriptionResult;
  }

  async extractFollowUpsFromImage(base64Image: string, mediaType: ImageMediaType): Promise<ExtractedFollowUp[]> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/extract-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
      body: JSON.stringify({ imageBase64: base64Image, mediaType }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Image extraction failed (${response.status}): ${body.error ?? 'unknown'}`);
    }

    const body = (await response.json()) as { candidates: ExtractedFollowUp[] };
    return body.candidates;
  }

  async extractFollowUpsFromPdf(base64Pdf: string): Promise<ExtractedFollowUp[]> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/extract-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
      body: JSON.stringify({ pdfBase64: base64Pdf }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`PDF extraction failed (${response.status}): ${body.error ?? 'unknown'}`);
    }

    const body = (await response.json()) as { candidates: ExtractedFollowUp[] };
    return body.candidates;
  }

  async askAssistant(question: string, context: string): Promise<string> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Assistant failed (${response.status}): ${body.error ?? 'unknown'}`);
    }

    const body = (await response.json()) as { answer: string };
    return body.answer;
  }
}
