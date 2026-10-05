import type Anthropic from '@anthropic-ai/sdk';
import { getRedis } from './redis';

const STATS_TTL_SECONDS = 120 * 24 * 60 * 60;

/**
 * Her AI isteğinin harcadığı token sayılarını günlük toplamlara ekler. Kullanıcı
 * içeriği tutulmaz, sadece sayılar. Upstash panelinde `stats:YYYY-MM-DD`
 * anahtarlarından okunur — önbelleğin gerçekten tutup tutmadığını ve çıkarım
 * başına maliyeti buradan ölçüyoruz.
 */
export async function recordTokenUsage(route: string, usage: Anthropic.Usage | undefined): Promise<void> {
  if (!usage) return;
  const counts = {
    requests: 1,
    input: usage.input_tokens ?? 0,
    output: usage.output_tokens ?? 0,
    cache_write: usage.cache_creation_input_tokens ?? 0,
    cache_read: usage.cache_read_input_tokens ?? 0,
  };
  console.log(JSON.stringify({ event: 'ai_usage', route, ...counts }));

  const redis = getRedis();
  if (!redis) return;
  const key = `stats:${new Date().toISOString().slice(0, 10)}`;
  try {
    const pipeline = redis.pipeline();
    for (const [field, value] of Object.entries(counts)) {
      if (value) pipeline.hincrby(key, `${route}:${field}`, value);
    }
    pipeline.expire(key, STATS_TTL_SECONDS);
    await pipeline.exec();
  } catch (error) {
    console.warn(JSON.stringify({ event: 'stats_error', message: (error as Error).message }));
  }
}
