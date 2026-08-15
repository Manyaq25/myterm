import type { IncomingMessage, ServerResponse } from 'http';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI, { toFile } from 'openai';
import { RefusalError, extractFollowUpsFromText } from '../lib/extract';

const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB, generous for a few minutes of voice notes

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function readBinaryBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_AUDIO_BYTES) {
      throw new Error('audio_too_large');
    }
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
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

  let audio: Buffer;
  try {
    audio = await readBinaryBody(req);
  } catch {
    res.statusCode = 413;
    res.end(JSON.stringify({ error: 'audio_too_large', maxBytes: MAX_AUDIO_BYTES }));
    return;
  }
  if (audio.length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'audio_required' }));
    return;
  }

  const openai = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') });
  const anthropic = new Anthropic({ apiKey: requireEnv('ANTHROPIC_API_KEY') });
  const transcribeModel = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
  const extractModel = process.env.ANTHROPIC_MODEL || 'claude-opus-5';

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audio, 'recording.m4a', { type: 'audio/m4a' }),
      model: transcribeModel,
      language: 'tr',
    });
    const transcript = transcription.text.trim();

    if (!transcript) {
      res.statusCode = 200;
      res.end(JSON.stringify({ transcript: '', candidates: [] }));
      return;
    }

    const candidates = await extractFollowUpsFromText(anthropic, extractModel, transcript);
    res.statusCode = 200;
    res.end(JSON.stringify({ transcript, candidates }));
  } catch (error) {
    if (error instanceof RefusalError) {
      res.statusCode = 422;
      res.end(JSON.stringify({ error: 'refused' }));
      return;
    }
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'transcription_failed', message: (error as Error).message }));
  }
}
