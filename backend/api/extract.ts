import type { IncomingMessage, ServerResponse } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import { MAX_TEXT_LENGTH, RefusalError, extractFollowUpsFromText } from '../lib/extract';

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

  const text = (body as { text?: unknown } | null)?.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'text_required' }));
    return;
  }
  if (text.length > MAX_TEXT_LENGTH) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'text_too_long', maxLength: MAX_TEXT_LENGTH }));
    return;
  }

  const client = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

  try {
    const candidates = await extractFollowUpsFromText(client, model, text);
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
