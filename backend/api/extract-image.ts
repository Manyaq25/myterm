import type { IncomingMessage, ServerResponse } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import { RefusalError, extractFollowUpsFromImage, type ImageMediaType } from '../lib/extract';

const ALLOWED_MEDIA_TYPES: ImageMediaType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// ~5MB raw image, base64 adds ~37% overhead.
const MAX_BASE64_LENGTH = 7 * 1024 * 1024;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
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

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'invalid_json' }));
    return;
  }

  const { imageBase64, mediaType } = (body as { imageBase64?: unknown; mediaType?: unknown } | null) ?? {};
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'image_required' }));
    return;
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'image_too_large' }));
    return;
  }
  if (typeof mediaType !== 'string' || !ALLOWED_MEDIA_TYPES.includes(mediaType as ImageMediaType)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'invalid_media_type', allowed: ALLOWED_MEDIA_TYPES }));
    return;
  }

  const client = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

  try {
    const candidates = await extractFollowUpsFromImage(client, model, imageBase64, mediaType as ImageMediaType);
    res.statusCode = 200;
    res.end(JSON.stringify({ candidates }));
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
