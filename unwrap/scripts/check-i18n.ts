// Her dilin anahtarları Türkçeyle aynı mı, {{param}}'lar korunmuş mu kontrol eder.
// Çalıştırma: npx tsx scripts/check-i18n.ts
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(__dirname, '../src/i18n/locales');
type Tree = Record<string, unknown>;

function flat(o: Tree, pre = '', out: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(o)) {
    const key = pre ? `${pre}.${k}` : k;
    if (Array.isArray(v)) out[key] = `[${v.length}]` + v.join('|');
    else if (v && typeof v === 'object') flat(v as Tree, key, out);
    else out[key] = String(v);
  }
  return out;
}
const params = (s: string) => s.match(/\{\{\w+\}\}/g) ?? [];
// Çeviri kaynaktaki her {{param}}'ı taşımalı (fazlası serbest; kod onu da verir).
const lost = (src: string, dst: string) => params(src).some((p) => !dst.includes(p));

async function main() {
  const tr = flat((await import(join(dir, 'tr/index.ts'))).default.default ?? (await import(join(dir, 'tr/index.ts'))).default);
  let bad = 0;
  for (const code of readdirSync(dir).filter((d) => d !== 'tr')) {
    const mod = (await import(join(dir, code, 'index.ts'))).default;
    const d = flat(mod.default ?? mod);
    const missing = Object.keys(tr).filter((k) => !(k in d));
    const extra = Object.keys(d).filter((k) => !(k in tr));
    const wrong = Object.keys(tr).filter((k) => k in d && lost(tr[k], d[k]));
    const status = missing.length || extra.length || wrong.length ? 'HATA' : 'tamam';
    if (status === 'HATA') bad++;
    console.log(`${code}: ${status} (eksik ${missing.length}, fazla ${extra.length}, param ${wrong.length})`);
    for (const k of [...missing.slice(0, 5), ...extra.slice(0, 5), ...wrong.slice(0, 5)]) console.log('   ', k);
  }
  if (bad) process.exit(1);
}
main();
