import type { IncomingMessage, ServerResponse } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import { RefusalError, extractFollowUpsFromImage, parseClientTime } from '../lib/extract';
import { parseAppLanguage } from '../lib/language';
import { UnsupportedImageError, normalizeImage } from '../lib/image';
import { commitAiUsage, openAiGate } from '../lib/quota';

// Vercel zaten ~4.5MB'ın üzerindeki istek gövdelerini fonksiyona ulaşmadan
// reddediyor; bu yalnızca bir üst güvenlik sınırı.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

/**
 * Yeni istemciler görseli ham dosya olarak (base64'süz, ~%27 daha küçük)
 * gönderiyor; eski sürümler JSON içinde base64 gönderiyor. İkisini de kabul
 * ediyoruz. Bildirilen mediaType'a güvenmiyoruz — biçim dosyanın kendisinden
 * belirleniyor.
 */
function imageBufferFromRequest(req: IncomingMessage, raw: Buffer): Buffer | null {
  const contentType = String(req.headers['content-type'] ?? '').toLowerCase();
  if (contentType.includes('application/json')) {
    const body = raw.length ? (JSON.parse(raw.toString('utf8')) as { imageBase64?: unknown } | null) : null;
    const b64 = body?.imageBase64;
    return typeof b64 === 'string' && b64.length > 0 ? Buffer.from(b64, 'base64') : null;
  }
  return raw.length > 0 ? raw : null;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  const appSecret = process.env.APP_SHARED_SECRET;
  if (appSecret && req.headers['x-app-secret'] !== appSecret) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return;
  }

  const gate = await openAiGate(req);
  if (!gate.ok) {
    res.statusCode = gate.status;
    res.end(JSON.stringify(gate.body));
    return;
  }

  let imageBuffer: Buffer | null;
  try {
    imageBuffer = imageBufferFromRequest(req, await readRawBody(req));
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'invalid_json' }));
    return;
  }
  if (!imageBuffer) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'image_required' }));
    return;
  }
  if (imageBuffer.length > MAX_IMAGE_BYTES) {
    res.statusCode = 413;
    res.end(JSON.stringify({ error: 'image_too_large' }));
    return;
  }

  let image: { base64: string; mediaType: 'image/jpeg' };
  try {
    image = await normalizeImage(imageBuffer);
  } catch (error) {
    if (error instanceof UnsupportedImageError) {
      res.statusCode = 415;
      res.end(JSON.stringify({ error: 'unsupported_image' }));
      return;
    }
    throw error;
  }

  const client = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

  try {
    const candidates = await extractFollowUpsFromImage(client, model, image.base64, image.mediaType, parseClientTime(req.headers), parseAppLanguage(req.headers));
    const usage = await commitAiUsage(gate.ctx);
    res.statusCode = 200;
    res.end(JSON.stringify({ candidates, usage }));
  } catch (error) {
    if (error instanceof RefusalError) {
      res.statusCode = 422;
      res.end(JSON.stringify({ error: 'refused' }));
      return;
    }
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'extraction_failed', message: (error as Error).message }));
  }
}
