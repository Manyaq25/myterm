import * as FileSystem from 'expo-file-system/legacy';
import { AIRequestError, type AIProvider, type ExtractedFollowUp, type TranscriptionResult } from './types';
import { getDeviceId } from '../services/deviceId';
import { getRevenueCatAppUserId, isPremiumNow } from '../services/subscription';
import { reportServerAiUsage } from '../services/aiUsage';
import i18n from '../i18n';

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


// Ücretsiz AI hakkı sunucuda cihaz başına sayılıyor; premium durumu da sunucu
// tarafından RevenueCat'e sorularak doğrulanıyor. X-Client-Premium yalnızca
// RevenueCat'e ulaşılamadığı durumlar için bir ipucu.
export async function identityHeaders(): Promise<Record<string, string>> {
  const [deviceId, appUserId] = await Promise.all([getDeviceId(), getRevenueCatAppUserId()]);
  return {
    'X-Device-Id': deviceId,
    // AI'nin başlıkları/cevapları bu dilde yazması ve sesli notu bu dilde dinlemesi için.
    'X-App-Language': i18n.language,
    ...(appUserId ? { 'X-RC-App-User-Id': appUserId } : {}),
    ...(isPremiumNow() ? { 'X-Client-Premium': '1' } : {}),
  };
}

function errorCode(body: unknown): string {
  const code = (body as { error?: unknown } | null)?.error;
  return typeof code === 'string' ? code : 'unknown';
}

// Hata gövdesini okur, hak doldu yanıtındaki kullanım bilgisini kaydeder ve
// durum koduyla birlikte fırlatır (402 = aylık ücretsiz hak doldu).
function throwRequestError(status: number, body: unknown): never {
  reportServerAiUsage((body as { usage?: unknown } | null)?.usage);
  throw new AIRequestError(status, errorCode(body));
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throwRequestError(response.status, body);
  reportServerAiUsage((body as { usage?: unknown }).usage);
  return body as T;
}

function parseUploadResult<T>(result: FileSystem.FileSystemUploadResult): T {
  let body: unknown = {};
  try {
    body = JSON.parse(result.body || '{}');
  } catch {
    // Vercel'in 413 gibi yanıtları JSON olmayabiliyor.
  }
  if (result.status < 200 || result.status >= 300) throwRequestError(result.status, body);
  reportServerAiUsage((body as { usage?: unknown }).usage);
  return body as T;
}

export class AnthropicProvider implements AIProvider {
  constructor(private readonly backendUrl: string, private readonly appSecret?: string) {}

  async extractFollowUpsFromText(text: string): Promise<ExtractedFollowUp[]> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientTimeHeaders(),
        ...(await identityHeaders()),
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
      body: JSON.stringify({ text }),
    });
    return (await readJsonResponse<{ candidates: ExtractedFollowUp[] }>(response)).candidates;
  }

  async transcribeAndExtract(audioFileUri: string): Promise<TranscriptionResult> {
    const result = await FileSystem.uploadAsync(`${this.backendUrl}/api/transcribe`, audioFileUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'audio/m4a',
        ...clientTimeHeaders(),
        ...(await identityHeaders()),
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
    });
    return parseUploadResult<TranscriptionResult>(result);
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
        ...(await identityHeaders()),
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
    });
    return parseUploadResult<{ candidates: ExtractedFollowUp[] }>(result).candidates;
  }

  async extractFollowUpsFromPdf(base64Pdf: string): Promise<ExtractedFollowUp[]> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/extract-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...clientTimeHeaders(),
        ...(await identityHeaders()),
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
      body: JSON.stringify({ pdfBase64: base64Pdf }),
    });
    return (await readJsonResponse<{ candidates: ExtractedFollowUp[] }>(response)).candidates;
  }

  async askAssistant(question: string, context: string): Promise<string> {
    const response = await fetchWithTimeout(`${this.backendUrl}/api/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await identityHeaders()),
        ...(this.appSecret ? { 'X-App-Secret': this.appSecret } : {}),
      },
      body: JSON.stringify({ question, context }),
    });
    return (await readJsonResponse<{ answer: string }>(response)).answer;
  }
}
