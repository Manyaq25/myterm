import * as FileSystem from 'expo-file-system/legacy';
import { AIRequestError, type AIProvider, type ExtractedFollowUp, type TranscriptionResult } from './types';

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

// Backend "yarın", "pazartesi saat 10:00" gibi ifadeleri kullanıcının yerel
// saatine göre çözebilsin diye cihazın saat dilimini her çıkarım isteğiyle
// gönderiyoruz — aksi halde UTC varsayılıp saatler kayıyordu.
function clientTimeHeaders(): Record<string, string> {
  let timezone = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    timezone = '';
  }
  return {
    'X-Client-UTC-Offset': String(-new Date().getTimezoneOffset()),
    ...(timezone ? { 'X-Client-Timezone': timezone } : {}),
  };
}

export class AnthropicProvider implements AIProvider {
  constructor(private readonly backendUrl: string, private readonly appSecret?: string) {}

  async extractFollowUpsFromText(text: string): Promise<ExtractedFollowUp[]> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientTimeHeaders(),
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
        ...clientTimeHeaders(),
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
    });

    if (result.status < 200 || result.status >= 300) {
      const errorBody = JSON.parse(result.body || '{}');
      throw new Error(`Transcription failed (${result.status}): ${errorBody.error ?? 'unknown'}`);
    }

    return JSON.parse(result.body) as TranscriptionResult;
  }

  // Görsel base64'e çevrilmeden ham dosya olarak yükleniyor (~%27 daha küçük
  // gövde, bellekte dev bir base64 dizgesi yok); biçimi backend dosyadan
  // anlayıp JPEG'e çeviriyor.
  async extractFollowUpsFromImage(imageUri: string): Promise<ExtractedFollowUp[]> {
    const result = await FileSystem.uploadAsync(`${this.backendUrl}/api/extract-image`, imageUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'application/octet-stream',
        ...clientTimeHeaders(),
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
    });

    if (result.status < 200 || result.status >= 300) {
      let code = 'unknown';
      try {
        code = (JSON.parse(result.body || '{}') as { error?: string }).error ?? code;
      } catch {
        // Vercel'in 413 gibi yanıtları JSON olmayabiliyor.
      }
      throw new AIRequestError(result.status, code);
    }

    return (JSON.parse(result.body) as { candidates: ExtractedFollowUp[] }).candidates;
  }

  async extractFollowUpsFromPdf(base64Pdf: string): Promise<ExtractedFollowUp[]> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/extract-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientTimeHeaders(),
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
