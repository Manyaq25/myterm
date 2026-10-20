import type { IncomingMessage, ServerResponse } from 'http';

export const MAX_BODY_BYTES = 400_000;

export function header(req: IncomingMessage, name: string): string | null {
  const v = req.headers[name.toLowerCase()];
  const first = Array.isArray(v) ? v[0] : v;
  return typeof first === 'string' && first.length > 0 ? first : null;
}

/** Ham gövde metni (App Attest imzası bu metin üzerinden doğrulanır). */
export async function readRawBody(req: IncomingMessage, maxBytes = MAX_BODY_BYTES): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > maxBytes) throw new HttpError(413, 'body_too_large');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, public extra: Record<string, unknown> = {}) {
    super(code);
  }
}

export function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

/** Her uç noktayı aynı hata düzeniyle sarar; iç hata ayrıntısı istemciye gitmez. */
export function route(methods: string[], fn: (req: IncomingMessage, res: ServerResponse) => Promise<void>) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (!methods.includes(req.method ?? '')) return send(res, 405, { error: 'method_not_allowed' });
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.code, ...e.extra });
      console.error(e);
      send(res, 500, { error: 'server_error' });
    }
  };
}
