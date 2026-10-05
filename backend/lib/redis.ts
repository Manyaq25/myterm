import { Redis } from '@upstash/redis';

let client: Redis | null | undefined;

/**
 * Vercel'deki Upstash entegrasyonunun eklediği KV_REST_API_* değişkenleriyle
 * bağlanır. Değişkenler yoksa (yerel geliştirme gibi) null döner; çağıranlar
 * bu durumda sayaç/ölçüm adımlarını atlayıp isteği yine de işler — Redis'e
 * bağımlı bir arıza uygulamayı tamamen durdurmasın.
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
