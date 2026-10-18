// Günlük maliyet ölçümü (yalnız sayılar; içerik saklanmaz).
import type { Usage } from './report';
import { dayKey, k, redis } from './redis';

export async function recordUsage(kind: 'report' | 'coach', u: Usage) {
  const key = k('stats', dayKey());
  await redis()
    .pipeline()
    .hincrby(key, `${kind}:count`, 1)
    .hincrby(key, `${u.model}:in`, u.input)
    .hincrby(key, `${u.model}:out`, u.output)
    .expire(key, 120 * 86400)
    .exec();
}
