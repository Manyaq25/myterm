import type { IncomingMessage, ServerResponse } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import { RefusalError, extractFollowUpsFromPdf } from '../lib/extract';

// ~5MB raw PDF, base64 adds ~37% overhead.
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

  const pdfBase64 = (body as { pdfBase64?: unknown } | null)?.pdfBase64;
  if (typeof pdfBase64 !== 'string' || pdfBase64.length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'pdf_required' }));
    return;
  }
  if (pdfBase64.length > MAX_BASE64_LENGTH) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'pdf_too_large' }));
    return;
  }

  const client = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

  try {
    const candidates = await extractFollowUpsFromPdf(client, model, pdfBase64);
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
