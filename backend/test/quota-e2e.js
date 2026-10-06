// Sunucu tarafı hak/premium kontrolünün uçtan uca testi: sahte Upstash REST,
// sahte RevenueCat ve sahte Anthropic sunucularıyla gerçek uç kodlarını çalıştırır.
//
// Çalıştırma (backend klasöründe):
//   npx tsc -p . --noEmit false --outDir test/.build && node test/quota-e2e.js
const http = require('http');
const assert = require('assert');

const store = new Map(); // key -> string | Map (hash)
const b64 = (v) => (typeof v === 'string' ? Buffer.from(v).toString('base64') : v);

function runCommand([cmd, ...args]) {
  const c = String(cmd).toUpperCase();
  if (c === 'INCR') { const n = Number(store.get(args[0]) ?? 0) + 1; store.set(args[0], String(n)); return n; }
  if (c === 'EXPIRE') return 1;
  if (c === 'GET') { const v = store.get(args[0]); return v === undefined ? null : v; }
  if (c === 'SET') {
    const nx = args.slice(2).some((a) => String(a).toUpperCase() === 'NX');
    if (nx && store.has(args[0])) return null;
    store.set(args[0], String(args[1])); return 'OK';
  }
  if (c === 'DEL') return store.delete(args[0]) ? 1 : 0;
  if (c === 'DECR') { const n = Number(store.get(args[0]) ?? 0) - 1; store.set(args[0], String(n)); return n; }
  if (c === 'INCRBY') { const n = Number(store.get(args[0]) ?? 0) + Number(args[1]); store.set(args[0], String(n)); return n; }
  if (c === 'HINCRBY') {
    const h = store.get(args[0]) instanceof Map ? store.get(args[0]) : new Map();
    const n = Number(h.get(args[1]) ?? 0) + Number(args[2]); h.set(args[1], n); store.set(args[0], h); return n;
  }
  throw new Error('unsupported ' + c);
}

function listen(handler) {
  return new Promise((resolve) => {
    const srv = http.createServer(handler);
    srv.listen(0, '127.0.0.1', () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}` }));
  });
}
function readBody(req) {
  return new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => r(d)); });
}

(async () => {
  const redis = await listen(async (req, res) => {
    const body = JSON.parse(await readBody(req));
    const encode = req.headers['upstash-encoding'] === 'base64';
    res.setHeader('Content-Type', 'application/json');
    if (req.url.startsWith('/pipeline') || req.url.startsWith('/multi-exec')) {
      res.end(JSON.stringify(body.map((cmd) => ({ result: encode ? b64(runCommand(cmd)) : runCommand(cmd) }))));
    } else {
      const r = runCommand(body);
      res.end(JSON.stringify({ result: encode ? b64(r) : r }));
    }
  });
  let rcCalls = 0;
  const rc = await listen((req, res) => {
    rcCalls++;
    assert.ok(req.headers.authorization === 'Bearer rc-secret', 'RevenueCat auth header');
    const u = decodeURIComponent(req.url);
    const premium = u.includes('/customers/$RCAnonymousID:premium/') || u.includes('/customers/$RCAnonymousID:upgraded/');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ items: premium ? [{ object: 'customer.active_entitlement', entitlement_id: 'entl1' }] : [] }));
  });
  const anthropic = await listen(async (req, res) => {
    const body = JSON.parse(await readBody(req));
    res.setHeader('Content-Type', 'application/json');
    const usage = { input_tokens: 40, output_tokens: 30, cache_creation_input_tokens: 0, cache_read_input_tokens: 900 };
    const content = body.tools
      ? [{ type: 'tool_use', id: 'tu1', name: 'record_follow_ups', input: { candidates: [] } }]
      : [{ type: 'text', text: 'cevap' }];
    res.end(JSON.stringify({ id: 'msg1', type: 'message', role: 'assistant', model: body.model, content,
      stop_reason: body.tools ? 'tool_use' : 'end_turn', stop_sequence: null, usage }));
  });

  Object.assign(process.env, {
    KV_REST_API_URL: redis.url, KV_REST_API_TOKEN: 'kv-token',
    REVENUECAT_SECRET_KEY: 'rc-secret', REVENUECAT_PROJECT_ID: 'proj656980a8', REVENUECAT_API_BASE: rc.url,
    ANTHROPIC_API_KEY: 'test', ANTHROPIC_BASE_URL: anthropic.url, ANTHROPIC_MODEL: 'claude-opus-5',
  });

  const extract = require('./.build/api/extract.js').default;
  const assistant = require('./.build/api/assistant.js').default;
  const referral = require('./.build/api/referral.js').default;
  const api = await listen((req, res) =>
    (req.url === '/api/assistant' ? assistant : req.url === '/api/referral' ? referral : extract)(req, res)
  );

  let ipCounter = 0;
  async function call(path, headers, body) {
    const r = await fetch(api.url + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': headers.ip ?? `10.0.0.${++ipCounter}`, ...headers },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  }
  const textBody = { text: 'Ahmete yarın raporu göndereceğim' };

  // 1) Eski istemci (cihaz kimliği yok), son tarihten önce: izin verilir, kullanım sayılmaz.
  let r = await call('/api/extract', {}, textBody);
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  assert.strictEqual(r.body.usage, undefined);
  console.log('ok 1 eski istemci izinli');

  // 2) Ücretsiz cihaz: 6 başarılı istek, 7. istek 402.
  const free = { 'X-Device-Id': 'i:11111111-2222-4333-8444-555555555555', 'X-RC-App-User-Id': '$RCAnonymousID:free' };
  for (let i = 1; i <= 5; i++) {
    r = await call('/api/extract', free, textBody);
    assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.body.usage, { used: i, limit: 6, premium: false });
  }
  r = await call('/api/assistant', free, { question: 'Bu hafta ne var?', context: '- rapor' });
  assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.body.usage, { used: 6, limit: 6, premium: false });
  r = await call('/api/extract', free, textBody);
  assert.strictEqual(r.status, 402); assert.strictEqual(r.body.error, 'limit_reached');
  assert.deepStrictEqual(r.body.usage, { used: 6, limit: 6, premium: false });
  r = await call('/api/assistant', free, { question: 'x', context: '' });
  assert.strictEqual(r.status, 402);
  console.log('ok 2 ücretsiz sınır 6 (asistan dahil), 7. istek 402');

  // 3) Aynı cihazda premium kullanıcı: sınırsız, sayaç artmaz.
  const premium = { ...free, 'X-RC-App-User-Id': '$RCAnonymousID:premium' };
  for (let i = 0; i < 3; i++) {
    r = await call('/api/extract', premium, textBody);
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.usage.premium, true);
  }
  assert.strictEqual(store.get(`usage:${free['X-Device-Id']}:${new Date().toISOString().slice(0, 7)}`), '6');
  const rcBefore = rcCalls;
  await call('/api/extract', premium, textBody);
  assert.strictEqual(rcCalls, rcBefore, 'premium sonucu önbellekten gelmeli');
  console.log('ok 3 premium sınırsız, RevenueCat sonucu önbellekte');

  // 4) Uygulama "premium" dese bile RevenueCat hayır diyorsa sınır uygulanır.
  r = await call('/api/extract', { ...free, 'X-Client-Premium': '1' }, textBody);
  assert.strictEqual(r.status, 402);
  console.log('ok 4 sahte premium iddiası işe yaramıyor');

  // 4b) Az önce premium alan kullanıcı: önbellekte 'premium değil' kalmış olsa da
  // uygulama premium dediğinde sunucu RevenueCat'e yeniden sorar.
  const upgraded = { ...free, 'X-RC-App-User-Id': '$RCAnonymousID:upgraded' };
  store.set('prem:$RCAnonymousID:upgraded', '0');
  r = await call('/api/extract', upgraded, textBody);
  assert.strictEqual(r.status, 402, 'iddia yoksa önbellek kullanılır');
  r = await call('/api/extract', { ...upgraded, 'X-Client-Premium': '1' }, textBody);
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.usage.premium, true);
  console.log('ok 4b yeni premium kullanıcı önbelleğe takılmıyor');

  // 5) Geçersiz cihaz kimliği eski istemci gibi işlenir; son tarih geçince 426.
  process.env.AI_LEGACY_CLIENT_CUTOFF = '2020-01-01T00:00:00Z';
  r = await call('/api/extract', { 'X-Device-Id': 'short' }, textBody);
  assert.strictEqual(r.status, 426); assert.strictEqual(r.body.error, 'upgrade_required');
  delete process.env.AI_LEGACY_CLIENT_CUTOFF;
  console.log('ok 5 son tarihten sonra kimliksiz istek 426');

  // 6) Dakikalık hız sınırı (aynı IP'den 20'den fazla istek).
  const fresh = { 'X-Device-Id': 'a:0123456789abcdef', ip: '10.9.9.9' };
  let limited = 0;
  for (let i = 0; i < 40; i++) {
    r = await call('/api/extract', fresh, textBody);
    if (r.status === 429) limited++;
  }
  assert.ok(limited >= 5, `429 sayısı ${limited}`);
  console.log('ok 6 dakikalık hız sınırı çalışıyor');

  // 7) Ölçüm: günlük istatistik hash'i dolmuş olmalı.
  const stats = store.get(`stats:${new Date().toISOString().slice(0, 10)}`);
  assert.ok(stats instanceof Map && stats.get('text:requests') > 0 && stats.get('assistant:requests') === 1, 'stats');
  assert.strictEqual(stats.get('text:cache_read'), stats.get('text:requests') * 900);
  console.log('ok 7 ölçüm kaydı', Object.fromEntries(stats));

  // 8) Davet: kod oluşur, başkası girince davet eden +3 kazanır; aylık hak bitince bonus kullanılır.
  r = await call('/api/referral', free, { action: 'status' });
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  const code = r.body.code;
  assert.match(code, /^[A-Z2-9]{6}$/);
  assert.strictEqual(r.body.bonus, 0);
  r = await call('/api/referral', free, { action: 'status' });
  assert.strictEqual(r.body.code, code, 'kod kalıcı olmalı');
  r = await call('/api/referral', free, { action: 'redeem', code });
  assert.strictEqual(r.status, 400); assert.strictEqual(r.body.error, 'own_code');
  r = await call('/api/referral', { 'X-Device-Id': 'i:friend-0001-aaaa' }, { action: 'redeem', code: 'ZZZZZZ' });
  assert.strictEqual(r.body.error, 'invalid_code');
  r = await call('/api/referral', { 'X-Device-Id': 'i:friend-0001-aaaa' }, { action: 'redeem', code: code.toLowerCase() });
  assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  r = await call('/api/referral', { 'X-Device-Id': 'i:friend-0001-aaaa' }, { action: 'redeem', code });
  assert.strictEqual(r.status, 409); assert.strictEqual(r.body.error, 'already_redeemed');
  r = await call('/api/referral', { 'X-Device-Id': 'i:friend-0001-aaaa' }, { action: 'status' });
  assert.strictEqual(r.body.bonus, 0, 'davet edilen kazanmaz'); assert.strictEqual(r.body.redeemed, true);
  r = await call('/api/referral', free, { action: 'status' });
  assert.strictEqual(r.body.bonus, 3); assert.strictEqual(r.body.invites, 1);
  console.log('ok 8 davet kodu: sadece davet eden +3 kazanır, kod bir kez girilir');

  // 9) Aylık hak bitmiş cihaz bonusla devam eder; bonus bitince yine 402.
  for (let i = 3; i >= 1; i--) {
    r = await call('/api/extract', free, textBody);
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    const expected = { used: 6, limit: 6, premium: false, ...(i - 1 > 0 ? { bonus: i - 1 } : {}) };
    assert.deepStrictEqual(r.body.usage, expected);
  }
  r = await call('/api/extract', free, textBody);
  assert.strictEqual(r.status, 402);
  console.log('ok 9 bonus haklar aylık hak bitince kullanılıyor');

  // 10) Ödül en fazla 10 davet için verilir.
  for (let i = 0; i < 12; i++) {
    r = await call('/api/referral', { 'X-Device-Id': `i:friend-cap-${String(i).padStart(4, '0')}` }, { action: 'redeem', code });
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
  }
  r = await call('/api/referral', free, { action: 'status' });
  assert.strictEqual(r.body.invites, 13); assert.strictEqual(r.body.rewardedInvites, 10);
  assert.strictEqual(r.body.bonus, 27, '10 davetten 30 hak, 3 tanesi kullanıldı');
  console.log('ok 10 davet ödülü 10 davetle sınırlı');

  for (const s of [redis, rc, anthropic, api]) s.srv.close();
  console.log('TÜM TESTLER GEÇTİ');
})().catch((e) => { console.error('BAŞARISIZ:', e); process.exit(1); });
