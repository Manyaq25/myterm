#!/usr/bin/env python3
"""Unwrap: Google Play mağaza kaydı + abonelik + RevenueCat kurulumu (tekrar çalıştırılabilir).

Yalnız GitHub Actions'ta gerçek çalışır (.github/workflows/unwrap-play-setup.yml).
KESİN KURAL: hiçbir yayın kanalına (production dahil) sürüm/release oluşturmaz, değiştirmez.
Yalnız mağaza kaydı (listing), görseller, uygulama ayrıntıları ve abonelikler.

Adımlar:
  1. listings      : mağaza metinleri + görseller + ayrıntılar (tek "edit", sonra commit)
  2. subscriptions : unwrap_pro aboneliği, aylik/yillik temel planlar, 7 gün deneme teklifi
  3. revenuecat    : RevenueCat ürünleri, yetki (entitlement) ve paketler (en iyi çaba)

Kullanım:
  python3 scripts/play-setup.py --dry-run          # çevrimdışı giriş kontrolü
  python3 scripts/play-setup.py                    # hepsi
  python3 scripts/play-setup.py --only subscriptions,revenuecat

Ortam değişkenleri:
  PLAY_SA_JSON                  hizmet hesabı JSON içeriği (ya da GOOGLE_APPLICATION_CREDENTIALS dosya yolu)
  PLAY_CONTACT_EMAIL            mağaza iletişim e-postası (boşsa atlanır)
  RC_SECRET_KEY                 RevenueCat gizli anahtarı (API v2)
  RC_PROJECT_ID                 (isteğe bağlı) RevenueCat proje kimliği
  PLAY_NOT_SEND_FOR_REVIEW=1    commit'i incelemeye göndermeden yap (Play Console'dan elle gönderilir)
  PLAY_REPRICE=1                var olan temel planların bölge fiyatlarını yeniden hesapla
"""
import argparse
import json
import os
import struct
import sys
import time
from decimal import Decimal
from pathlib import Path

PACKAGE = 'com.aydinapp.unwrap'
DEFAULT_LANGUAGE = 'tr-TR'
CONTACT_WEBSITE = 'https://aydinapp.com.tr'
FALLBACK_SCREENSHOT_LANG = 'en-US'

ROOT = Path(__file__).resolve().parent.parent  # unwrap/
STORE = ROOT / 'store' / 'play'
LISTINGS_DIR = STORE / 'listings'
GRAPHICS_DIR = STORE / 'graphics'
SUBSCRIPTION_FILE = STORE / 'subscription.json'

API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/' + PACKAGE
UPLOAD_API = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/' + PACKAGE
SCOPE = 'https://www.googleapis.com/auth/androidpublisher'
RC_API = 'https://api.revenuecat.com'
# App Store ürünleri (App Store Connect'te tanımlı)
IOS_BUNDLE = 'com.aydinapp.unwrap'
IOS_PRODUCTS = {'monthly': 'unwrap_pro_monthly', 'yearly': 'unwrap_pro_yearly'}
IOS_PACKAGES = {'monthly': '$rc_monthly', 'yearly': '$rc_annual'}

# Google Play sınırları
LIMITS = {'title': 30, 'shortDescription': 80, 'fullDescription': 4000}
SUB_LIMITS = {'title': 55, 'benefit': 40, 'benefits': 4, 'description': 80}

LATENCY = 'PRODUCT_UPDATE_LATENCY_TOLERANCE_LATENCY_TOLERANT'

# ---------------------------------------------------------------- günlük + özet

RESULTS = []  # (adım, durum, ayrıntı)  durum: ok | failed | skipped | warn
FAILED = []


def log(msg=''):
    print(msg, flush=True)


def ok(step, msg):
    log(f'  [TAMAM] {msg}')
    RESULTS.append((step, 'ok', msg))


def fail(step, msg):
    log(f'  [HATA]  {msg}')
    RESULTS.append((step, 'failed', msg))
    FAILED.append(step)


def warn(step, msg):
    log(f'  [UYARI] {msg}')
    RESULTS.append((step, 'warn', msg))


def skip(step, msg):
    log(f'  [ATLANDI] {msg}')
    RESULTS.append((step, 'skipped', msg))


def header(title):
    log('')
    log('=' * 70)
    log(title)
    log('=' * 70)


def write_summary(dry_run):
    icons = {'ok': '✅', 'failed': '❌', 'skipped': '⏭️', 'warn': '⚠️'}
    lines = [f"## Unwrap Google Play kurulumu{' (dry-run)' if dry_run else ''}", '',
             '| Adım | Durum | Ayrıntı |', '|---|---|---|']
    for step, status, msg in RESULTS:
        lines.append(f"| {step} | {icons.get(status, status)} {status} | {msg.replace('|', '/')} |")
    lines += ['', f"**Sonuç:** {'BAŞARISIZ (' + str(len(FAILED)) + ' hata)' if FAILED else 'başarılı'}"]
    text = '\n'.join(lines) + '\n'
    path = os.environ.get('GITHUB_STEP_SUMMARY')
    if path:
        with open(path, 'a', encoding='utf-8') as f:
            f.write(text)
    log('')
    log(text)

# ---------------------------------------------------------------- yardımcılar


class ApiError(Exception):
    def __init__(self, status, message, body=None):
        super().__init__(f'HTTP {status}: {message}')
        self.status = status
        self.message = message or ''
        self.body = body or {}


def money(amount, currency):
    d = Decimal(str(amount))
    units = int(d)
    nanos = int(((d - units) * Decimal(10 ** 9)).to_integral_value())
    return {'currencyCode': currency, 'units': str(units), 'nanos': nanos}


def money_str(m):
    if not m:
        return '-'
    return f"{Decimal(m.get('units', '0')) + Decimal(m.get('nanos', 0)) / Decimal(10 ** 9):.2f} {m.get('currencyCode')}"


def same_money(a, b):
    return bool(a and b) and a.get('currencyCode') == b.get('currencyCode') and \
        str(a.get('units', '0')) == str(b.get('units', '0')) and int(a.get('nanos', 0)) == int(b.get('nanos', 0))


def image_size(path):
    """PNG/JPEG genişlik-yükseklik (Pillow gerektirmez)."""
    with open(path, 'rb') as f:
        head = f.read(32)
        if head[:8] == b'\x89PNG\r\n\x1a\n':
            w, h = struct.unpack('>II', head[16:24])
            return 'png', w, h
        if head[:2] == b'\xff\xd8':
            f.seek(2)
            while True:
                marker = f.read(2)
                if len(marker) < 2 or marker[0] != 0xFF:
                    break
                if marker[1] in (0xC0, 0xC1, 0xC2):
                    f.read(3)
                    h, w = struct.unpack('>HH', f.read(4))
                    return 'jpeg', w, h
                seg_len = struct.unpack('>H', f.read(2))[0]
                f.seek(seg_len - 2, 1)
    return None, 0, 0


def mime_for(path):
    return 'image/png' if path.suffix.lower() == '.png' else 'image/jpeg'

# ---------------------------------------------------------------- girişleri oku + doğrula


def load_listings(step):
    """{lang: {title, shortDescription, fullDescription}} — hatalı dosyalar atlanır."""
    out = {}
    if not LISTINGS_DIR.is_dir():
        fail(step, f'EKSİK klasör: {LISTINGS_DIR.relative_to(ROOT)} (<dil>.json dosyaları bekleniyor)')
        return out
    files = sorted(LISTINGS_DIR.glob('*.json'))
    if not files:
        fail(step, f'EKSİK: {LISTINGS_DIR.relative_to(ROOT)} içinde hiç <dil>.json yok')
    for p in files:
        lang = p.stem
        try:
            data = json.loads(p.read_text(encoding='utf-8'))
        except Exception as e:  # noqa: BLE001
            fail(step, f'{p.name}: JSON okunamadı ({e})')
            continue
        bad = []
        for key, lim in LIMITS.items():
            v = data.get(key)
            if not isinstance(v, str) or not v.strip():
                bad.append(f'{key} yok/boş')
            elif len(v) > lim:
                bad.append(f'{key} {len(v)}>{lim} karakter')
        if bad:
            fail(step, f'{p.name}: ' + ', '.join(bad))
            continue
        out[lang] = {k: data[k] for k in LIMITS}
        log(f'  dil {lang}: başlık "{data["title"]}" ({len(data["title"])}), kısa {len(data["shortDescription"])}, uzun {len(data["fullDescription"])} karakter')
    if out and DEFAULT_LANGUAGE not in out:
        fail(step, f'varsayılan dil {DEFAULT_LANGUAGE} için listing dosyası yok')
    return out


def check_image(step, path, kind):
    fmt, w, h = image_size(path)
    rel = path.relative_to(ROOT)
    if not fmt:
        fail(step, f'{rel}: PNG/JPEG değil')
        return False
    if path.stat().st_size > 8 * 1024 * 1024:
        fail(step, f'{rel}: 8 MB sınırını aşıyor')
        return False
    if kind == 'icon' and (fmt != 'png' or (w, h) != (512, 512)):
        fail(step, f'{rel}: simge 512x512 PNG olmalı (bulunan {fmt} {w}x{h})')
        return False
    if kind == 'featureGraphic' and (w, h) != (1024, 500):
        fail(step, f'{rel}: öne çıkan görsel 1024x500 olmalı (bulunan {w}x{h})')
        return False
    if kind == 'phoneScreenshots':
        lo, hi = min(w, h), max(w, h)
        if lo < 320 or hi > 3840 or hi > 2 * lo:
            fail(step, f'{rel}: ekran görüntüsü 320–3840 px ve en çok 2:1 olmalı (bulunan {w}x{h})')
            return False
    return True


def load_graphics(step, languages):
    """{'icon': path|None, 'featureGraphic': path|None, 'phone': {lang: [paths]}}"""
    g = {'icon': None, 'featureGraphic': None, 'phone': {}}
    for kind, name in (('icon', 'icon-512.png'), ('featureGraphic', 'feature-1024x500.png')):
        p = GRAPHICS_DIR / name
        if not p.is_file():
            fail(step, f'EKSİK: {p.relative_to(ROOT)}')
        elif check_image(step, p, kind):
            g[kind] = p
            log(f'  {kind}: {p.relative_to(ROOT)}')
    phone_root = GRAPHICS_DIR / 'phone'

    def shots(lang):
        d = phone_root / lang
        if not d.is_dir():
            return None
        return sorted(p for p in d.iterdir() if p.suffix.lower() in ('.png', '.jpg', '.jpeg'))

    fallback = shots(FALLBACK_SCREENSHOT_LANG)
    no_shots = []
    for lang in languages:
        own = shots(lang)
        src = own if own is not None else fallback
        src_lang = lang if own is not None else FALLBACK_SCREENSHOT_LANG
        if lang == 'tr-TR' and own is None:
            fail(step, 'EKSİK: tr-TR kendi ekran görüntülerini kullanmalı (graphics/phone/tr-TR/)')
            continue
        if not src:
            no_shots.append(lang)
            continue
        good = [p for p in src if check_image(step, p, 'phoneScreenshots')]
        if len(good) < 2 or len(good) > 8:
            fail(step, f'{lang}: geçerli ekran görüntüsü sayısı {len(good)} (2–8 olmalı)')
            continue
        g['phone'][lang] = good
        log(f'  {lang}: {len(good)} ekran görüntüsü (phone/{src_lang}/)')
    if no_shots:
        fail(step, f'ekran görüntüsü yok (ne phone/<dil>/ ne phone/{FALLBACK_SCREENSHOT_LANG}/): ' + ', '.join(no_shots))
    return g


def load_subscription(step):
    if not SUBSCRIPTION_FILE.is_file():
        fail(step, f'EKSİK: {SUBSCRIPTION_FILE.relative_to(ROOT)}')
        return None
    try:
        cfg = json.loads(SUBSCRIPTION_FILE.read_text(encoding='utf-8'))
    except Exception as e:  # noqa: BLE001
        fail(step, f'subscription.json okunamadı ({e})')
        return None
    bad = []
    listings = cfg.get('listings') or {}
    for lang in (DEFAULT_LANGUAGE, 'en-US'):
        if lang not in listings:
            bad.append(f'{lang} listing yok')
    for lang, li in listings.items():
        if not li.get('title') or len(li['title']) > SUB_LIMITS['title']:
            bad.append(f'{lang} başlık boş ya da >{SUB_LIMITS["title"]}')
        ben = li.get('benefits') or []
        if len(ben) > SUB_LIMITS['benefits']:
            bad.append(f'{lang} avantaj sayısı {len(ben)}>4')
        for b in ben:
            if len(b) > SUB_LIMITS['benefit']:
                bad.append(f'{lang} avantaj {len(b)}>{SUB_LIMITS["benefit"]}: "{b}"')
        if len(li.get('description') or '') > SUB_LIMITS['description']:
            bad.append(f'{lang} açıklama {len(li["description"])}>{SUB_LIMITS["description"]}')
    for bp in cfg.get('basePlans') or []:
        for k in ('basePlanId', 'billingPeriodDuration', 'priceTRY'):
            if not bp.get(k):
                bad.append(f'temel plan alanı eksik: {k}')
    if not cfg.get('basePlans'):
        bad.append('basePlans boş')
    if bad:
        fail(step, 'subscription.json: ' + '; '.join(bad))
        return None
    for lang, li in listings.items():
        log(f'  {lang}: "{li["title"]}" · {len(li.get("benefits") or [])} avantaj · açıklama {len(li.get("description") or "")} karakter')
    for bp in cfg['basePlans']:
        log(f'  temel plan {bp["basePlanId"]}: {bp["billingPeriodDuration"]}, TR {bp["priceTRY"]} TRY, ödemesiz süre {bp.get("gracePeriodDuration", "-")}')
    if cfg.get('trialOffer'):
        log(f'  teklif {cfg["trialOffer"]["offerId"]}: {cfg["trialOffer"]["duration"]} ücretsiz, yalnız yeni aboneler')
    return cfg

# ---------------------------------------------------------------- Google Play istemcisi


class Play:
    def __init__(self):
        from google.auth.transport.requests import AuthorizedSession
        from google.oauth2 import service_account
        raw = os.environ.get('PLAY_SA_JSON', '').strip()
        if raw:
            info = json.loads(raw)
        else:
            path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
            if not path:
                raise RuntimeError('PLAY_SA_JSON / GOOGLE_APPLICATION_CREDENTIALS yok')
            info = json.loads(Path(path).read_text())
        creds = service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])
        self.email = info.get('client_email', '?')
        self.s = AuthorizedSession(creds)

    def call(self, method, url, params=None, body=None, data=None, headers=None):
        for attempt in range(3):
            r = self.s.request(method, url, params=params, json=body if data is None else None,
                               data=data, headers=headers, timeout=120)
            if r.status_code in (429, 500, 502, 503) and attempt < 2:
                time.sleep(3 * (attempt + 1))
                continue
            break
        try:
            js = r.json() if r.content else {}
        except ValueError:
            js = {'raw': r.text[:500]}
        if r.status_code >= 400:
            err = js.get('error', {}) if isinstance(js, dict) else {}
            raise ApiError(r.status_code, err.get('message') or str(js)[:500], js)
        return js

# ---------------------------------------------------------------- 1. mağaza kaydı


def is_review_error(msg):
    m = msg.lower()
    return 'changesnotsentforreview' in m or 'sent for review' in m or 'managed publishing' in m \
        or 'send for review' in m or 'in review' in m


def production_has_pending(play, edit_id):
    """Yalnız OKUR. Üretim kanalında taslak/yarım sürüm varsa commit onu incelemeye taşımasın."""
    try:
        tr = play.call('GET', f'{API}/edits/{edit_id}/tracks/production')
    except ApiError as e:
        log(f'  (üretim kanalı okunamadı: {e}; önlem olarak incelemeye gönderilmeyecek)')
        return True
    pending = [r for r in tr.get('releases', []) if r.get('status') in ('draft', 'inProgress')]
    for r in pending:
        log(f'  üretim kanalında bekleyen sürüm: {r.get("name") or r.get("versionCodes")} ({r.get("status")})')
    return bool(pending)


def step_listings(play, dry_run):
    step = '1-mağaza-kaydı'
    header('1) Mağaza kaydı, görseller, ayrıntılar')
    listings = load_listings(step)
    graphics = load_graphics(step, list(listings)) if listings else load_graphics(step, [])
    email = os.environ.get('PLAY_CONTACT_EMAIL', '').strip()
    log(f'  ayrıntılar: defaultLanguage={DEFAULT_LANGUAGE}, contactWebsite={CONTACT_WEBSITE}, '
        f'contactEmail={"(ayarlı)" if email else "(boş, atlanır)"}')
    if dry_run:
        if listings:
            ok(step, f'{len(listings)} dil hazır: {", ".join(sorted(listings))}')
        return
    if not listings and not graphics['icon'] and not graphics['featureGraphic']:
        fail(step, 'yüklenecek hiçbir şey yok; edit açılmadı')
        return

    try:
        edit_id = play.call('POST', f'{API}/edits', body={})['id']
        log(f'  edit açıldı: {edit_id}')
    except ApiError as e:
        fail(step, f'edits.insert: {e}')
        return
    changed = 0

    for lang, li in listings.items():
        try:
            play.call('PUT', f'{API}/edits/{edit_id}/listings/{lang}', body={'language': lang, **li})
            ok(step, f'listing {lang} güncellendi')
            changed += 1
        except ApiError as e:
            fail(step, f'listing {lang}: {e}')

    def replace_images(lang, image_type, paths):
        nonlocal changed
        try:
            play.call('DELETE', f'{API}/edits/{edit_id}/listings/{lang}/{image_type}')
            for p in paths:
                play.call('POST', f'{UPLOAD_API}/edits/{edit_id}/listings/{lang}/{image_type}',
                          params={'uploadType': 'media'}, data=p.read_bytes(),
                          headers={'Content-Type': mime_for(p)})
            ok(step, f'{lang} {image_type}: {len(paths)} görsel yüklendi')
            changed += 1
        except ApiError as e:
            fail(step, f'{lang} {image_type}: {e}')

    for lang in listings:
        if graphics['icon']:
            replace_images(lang, 'icon', [graphics['icon']])
        if graphics['featureGraphic']:
            replace_images(lang, 'featureGraphic', [graphics['featureGraphic']])
        if graphics['phone'].get(lang):
            replace_images(lang, 'phoneScreenshots', graphics['phone'][lang])

    details = {'defaultLanguage': DEFAULT_LANGUAGE, 'contactWebsite': CONTACT_WEBSITE}
    if email:
        details['contactEmail'] = email
    try:
        # details.patch: yalnız verilen alanlar değişir (e-posta boşsa mevcut e-posta silinmez)
        play.call('PATCH', f'{API}/edits/{edit_id}/details', body=details)
        ok(step, 'uygulama ayrıntıları güncellendi (' + ', '.join(details) + ')')
        changed += 1
    except ApiError as e:
        fail(step, f'details: {e}')

    if not changed:
        fail(step, 'hiçbir değişiklik uygulanamadı; edit commit edilmedi')
        try:
            play.call('DELETE', f'{API}/edits/{edit_id}')
        except ApiError:
            pass
        return

    try:
        play.call('POST', f'{API}/edits/{edit_id}:validate')
        log('  edit doğrulandı (validate)')
    except ApiError as e:
        warn(step, f'validate uyarısı: {e}')

    no_review = os.environ.get('PLAY_NOT_SEND_FOR_REVIEW') == '1' or production_has_pending(play, edit_id)
    # Değişiklikler başka bir incelemedeyse o incelemeyi İPTAL ETME (varsayılan davranış iptal eder).
    base = {'changesInReviewBehavior': 'ERROR_IF_IN_REVIEW'}
    attempts = [True] if no_review else [False, True]
    for not_sent in attempts:
        params = {**base, 'changesNotSentForReview': 'true' if not_sent else 'false'}
        try:
            play.call('POST', f'{API}/edits/{edit_id}:commit', params=params)
            if not_sent:
                ok(step, 'edit commit edildi; değişiklikler İNCELEMEYE GÖNDERİLMEDİ — '
                         'Play Console > Yayın özeti\'nden elle gönderilmeli')
            else:
                ok(step, 'edit commit edildi ve değişiklikler incelemeye gönderildi')
            return
        except ApiError as e:
            if not not_sent and is_review_error(e.message):
                log(f'  commit (incelemeye gönder) reddedildi: {e.message}')
                log('  → changesNotSentForReview=true ile yeniden deneniyor')
                continue
            if 'production' in e.message.lower() or 'release' in e.message.lower():
                fail(step, f'commit: uygulamanın henüz ilgili sürümü yok gibi görünüyor: {e}')
            else:
                fail(step, f'commit: {e}')
            try:
                play.call('DELETE', f'{API}/edits/{edit_id}')
            except ApiError:
                pass
            return

# ---------------------------------------------------------------- 2. abonelik


def step_subscriptions(play, dry_run):
    step = '2-abonelik'
    header('2) Abonelik: unwrap_pro (aylik / yillik + 7 gün deneme)')
    cfg = load_subscription(step)
    if not cfg:
        return
    if dry_run:
        ok(step, f'subscription.json geçerli ({cfg["productId"]}: '
                 + ', '.join(bp['basePlanId'] for bp in cfg['basePlans']) + ')')
        return
    pid = cfg['productId']
    sub_url = f'{API}/subscriptions/{pid}'
    reprice = os.environ.get('PLAY_REPRICE') == '1'

    # Bölge fiyatları: TRY fiyatından Google'ın dönüşümü
    conv = {}
    regions_version = None
    for bp in cfg['basePlans']:
        try:
            r = play.call('POST', f'{API}/pricing:convertRegionPrices',
                          body={'price': money(bp['priceTRY'], 'TRY')})
        except ApiError as e:
            fail(step, f'convertRegionPrices {bp["basePlanId"]}: {e}')
            return
        regions_version = (r.get('regionVersion') or {}).get('version') or regions_version
        conv[bp['basePlanId']] = r
        log(f'  {bp["basePlanId"]}: {len(r.get("convertedRegionPrices", {}))} bölge fiyatı, '
            f'diğer bölgeler {money_str((r.get("convertedOtherRegionsPrice") or {}).get("usdPrice"))} / '
            f'{money_str((r.get("convertedOtherRegionsPrice") or {}).get("eurPrice"))}, regionsVersion={regions_version}')
    if not regions_version:
        fail(step, 'convertRegionPrices regionVersion döndürmedi')
        return

    def desired_regional(bp):
        r = conv[bp['basePlanId']]
        cfgs = {}
        for code, cp in (r.get('convertedRegionPrices') or {}).items():
            cfgs[code] = {'regionCode': code, 'price': cp['price'], 'newSubscriberAvailability': True}
        cfgs['TR'] = {'regionCode': 'TR', 'price': money(bp['priceTRY'], 'TRY'), 'newSubscriberAvailability': True}
        return cfgs

    def desired_other(bp):
        o = conv[bp['basePlanId']].get('convertedOtherRegionsPrice') or {}
        if not o.get('usdPrice') or not o.get('eurPrice'):
            return None
        return {'usdPrice': o['usdPrice'], 'eurPrice': o['eurPrice'], 'newSubscriberAvailability': True}

    def new_base_plan(bp):
        plan = {
            'basePlanId': bp['basePlanId'],
            'autoRenewingBasePlanType': {
                'billingPeriodDuration': bp['billingPeriodDuration'],
                'resubscribeState': 'RESUBSCRIBE_STATE_ACTIVE',
                'prorationMode': 'SUBSCRIPTION_PRORATION_MODE_CHARGE_ON_NEXT_BILLING_DATE',
                'legacyCompatible': False,
            },
            'regionalConfigs': list(desired_regional(bp).values()),
        }
        if bp.get('gracePeriodDuration'):
            plan['autoRenewingBasePlanType']['gracePeriodDuration'] = bp['gracePeriodDuration']
        other = desired_other(bp)
        if other:
            plan['otherRegionsConfig'] = other
        return plan

    listings = [{'languageCode': lang, 'title': li['title'], 'benefits': li.get('benefits') or [],
                 'description': li.get('description') or ''} for lang, li in cfg['listings'].items()]

    try:
        existing = play.call('GET', sub_url)
    except ApiError as e:
        if e.status != 404:
            fail(step, f'subscriptions.get: {e}')
            return
        existing = None

    if existing is None:
        body = {'packageName': PACKAGE, 'productId': pid, 'listings': listings,
                'basePlans': [new_base_plan(bp) for bp in cfg['basePlans']]}
        try:
            existing = play.call('POST', f'{API}/subscriptions', body=body,
                                 params={'productId': pid, 'regionsVersion.version': regions_version})
            ok(step, f'abonelik {pid} oluşturuldu (temel planlar: '
                     + ', '.join(bp['basePlanId'] for bp in cfg['basePlans']) + ')')
        except ApiError as e:
            fail(step, f'subscriptions.create: {e}')
            return
    else:
        log(f'  abonelik {pid} zaten var; güncelleniyor')
        if existing.get('archived'):
            warn(step, f'{pid} arşivlenmiş görünüyor')
        have = {p['basePlanId']: p for p in existing.get('basePlans', [])}
        plans, mask, notes = [], ['listings'], []
        bp_changed = False
        for bp in cfg['basePlans']:
            cur = have.pop(bp['basePlanId'], None)
            if cur is None:
                plans.append(new_base_plan(bp))
                bp_changed = True
                notes.append(f'{bp["basePlanId"]} eklendi')
                continue
            want = desired_regional(bp)
            cur_regions = {c['regionCode']: c for c in cur.get('regionalConfigs', [])}
            tr_differs = not same_money((cur_regions.get('TR') or {}).get('price'), want['TR']['price'])
            merged = dict(cur)  # süre ve tür alanları değiştirilmez
            if reprice or tr_differs:
                merged['regionalConfigs'] = list(want.values())
                other = desired_other(bp)
                if other:
                    merged['otherRegionsConfig'] = other
                bp_changed = True
                notes.append(f'{bp["basePlanId"]} fiyatları yenilendi (TR {bp["priceTRY"]} TRY)')
            else:
                missing = [c for code, c in want.items() if code not in cur_regions]
                if missing:
                    merged['regionalConfigs'] = list(cur_regions.values()) + missing
                    bp_changed = True
                    notes.append(f'{bp["basePlanId"]}: {len(missing)} yeni bölge eklendi')
                else:
                    notes.append(f'{bp["basePlanId"]} fiyatları aynı, dokunulmadı')
            merged.pop('state', None)
            plans.append(merged)
        for other_id, p in have.items():  # bizim tanımlamadığımız planları koru
            p = dict(p)
            p.pop('state', None)
            plans.append(p)
            notes.append(f'{other_id} (elle eklenmiş) korundu')
        ours = {li['languageCode'] for li in listings}
        kept = [li for li in existing.get('listings', []) if li.get('languageCode') not in ours]
        if kept:
            notes.append('elle eklenmiş listing dilleri korundu: ' + ', '.join(li['languageCode'] for li in kept))
        body = {'packageName': PACKAGE, 'productId': pid, 'listings': listings + kept}
        if bp_changed:
            body['basePlans'] = plans
            mask.append('basePlans')
        try:
            existing = play.call('PATCH', sub_url, body=body,
                                 params={'updateMask': ','.join(mask), 'regionsVersion.version': regions_version,
                                         'latencyTolerance': LATENCY})
            ok(step, f'abonelik {pid} güncellendi: listings' + ('; ' + '; '.join(notes) if notes else ''))
        except ApiError as e:
            fail(step, f'subscriptions.patch: {e}')
            try:
                existing = play.call('GET', sub_url)
            except ApiError:
                return

    # Temel planları etkinleştir
    for bp in cfg['basePlans']:
        bid = bp['basePlanId']
        cur = next((p for p in existing.get('basePlans', []) if p['basePlanId'] == bid), None)
        if not cur:
            fail(step, f'temel plan {bid} abonelikte görünmüyor')
            continue
        if cur.get('state') == 'ACTIVE':
            ok(step, f'temel plan {bid} zaten etkin')
            continue
        try:
            play.call('POST', f'{sub_url}/basePlans/{bid}:activate',
                      body={'packageName': PACKAGE, 'productId': pid, 'basePlanId': bid, 'latencyTolerance': LATENCY})
            ok(step, f'temel plan {bid} etkinleştirildi')
        except ApiError as e:
            fail(step, f'temel plan {bid} etkinleştirme: {e}')

    # Ücretsiz deneme teklifi (her temel planda)
    trial = cfg.get('trialOffer')
    if not trial:
        return
    try:
        existing = play.call('GET', sub_url)
    except ApiError as e:
        fail(step, f'abonelik yeniden okunamadı: {e}')
        return
    for bp in cfg['basePlans']:
        bid = bp['basePlanId']
        oid = trial['offerId']
        cur = next((p for p in existing.get('basePlans', []) if p['basePlanId'] == bid), None)
        if not cur:
            continue
        regions = sorted(c['regionCode'] for c in cur.get('regionalConfigs', []) if c.get('newSubscriberAvailability'))
        offer = {
            'packageName': PACKAGE, 'productId': pid, 'basePlanId': bid, 'offerId': oid,
            'phases': [{
                'recurrenceCount': 1,
                'duration': trial['duration'],
                'regionalConfigs': [{'regionCode': c, 'free': {}} for c in regions],
                'otherRegionsConfig': {'free': {}},
            }],
            'targeting': {'acquisitionRule': {'scope': {'thisSubscription': {}}}},
            'regionalConfigs': [{'regionCode': c, 'newSubscriberAvailability': True} for c in regions],
            'otherRegionsConfig': {'otherRegionsNewSubscriberAvailability': True},
        }
        if not cur.get('otherRegionsConfig'):
            offer['phases'][0].pop('otherRegionsConfig')
            offer.pop('otherRegionsConfig')
        offer_url = f'{sub_url}/basePlans/{bid}/offers/{oid}'
        try:
            have = play.call('GET', offer_url)
        except ApiError as e:
            if e.status != 404:
                fail(step, f'teklif {bid}/{oid} okunamadı: {e}')
                continue
            have = None
        try:
            if have is None:
                have = play.call('POST', f'{sub_url}/basePlans/{bid}/offers', body=offer,
                                 params={'offerId': oid, 'regionsVersion.version': regions_version})
                ok(step, f'teklif {bid}/{oid} oluşturuldu ({len(regions)} bölge, {trial["duration"]} ücretsiz)')
            else:
                have_regions = sorted(c['regionCode'] for c in have.get('regionalConfigs', []))
                if have_regions != regions:
                    mask = 'phases,regionalConfigs' + (',otherRegionsConfig' if 'otherRegionsConfig' in offer else '')
                    have = play.call('PATCH', offer_url, body=offer,
                                     params={'updateMask': mask, 'regionsVersion.version': regions_version,
                                             'latencyTolerance': LATENCY})
                    ok(step, f'teklif {bid}/{oid} bölgeleri güncellendi ({len(have_regions)} → {len(regions)})')
                else:
                    log(f'  teklif {bid}/{oid} zaten var ({have.get("state")})')
            if have.get('state') != 'ACTIVE':
                play.call('POST', f'{offer_url}:activate',
                          body={'packageName': PACKAGE, 'productId': pid, 'basePlanId': bid,
                                'offerId': oid, 'latencyTolerance': LATENCY})
                ok(step, f'teklif {bid}/{oid} etkinleştirildi')
            else:
                ok(step, f'teklif {bid}/{oid} zaten etkin')
        except ApiError as e:
            fail(step, f'teklif {bid}/{oid}: {e}')

# ---------------------------------------------------------------- 3. RevenueCat


class RcAuthError(Exception):
    pass


class RC:
    def __init__(self, key):
        import requests
        self.s = requests.Session()
        self.s.headers.update({'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})

    def call(self, method, path, params=None, body=None):
        url = path if path.startswith('http') else RC_API + path
        for attempt in range(4):
            r = self.s.request(method, url, params=params, json=body, timeout=60)
            if r.status_code == 429 and attempt < 3:
                try:
                    wait = (r.json().get('backoff_ms') or 2000) / 1000
                except ValueError:
                    wait = 2
                time.sleep(min(wait, 30))
                continue
            break
        try:
            js = r.json() if r.content else {}
        except ValueError:
            js = {'message': r.text[:300]}
        if r.status_code in (401, 403) or js.get('type') in ('authentication_error', 'authorization_error'):
            raise RcAuthError(f'HTTP {r.status_code} {js.get("type", "")}: {js.get("message", "")}')
        if r.status_code >= 400:
            raise ApiError(r.status_code, f'{js.get("type", "")}: {js.get("message", "")}', js)
        return js

    def all(self, path, params=None):
        items, nxt, first = [], path, True
        while nxt:
            js = self.call('GET', nxt, params=params if first else None)
            first = False
            items += js.get('items', [])
            nxt = js.get('next_page')
        return items


def step_revenuecat(dry_run):
    step = '3-revenuecat'
    header('3) RevenueCat (en iyi çaba)')
    cfg = json.loads(SUBSCRIPTION_FILE.read_text(encoding='utf-8')) if SUBSCRIPTION_FILE.is_file() else None
    if not cfg:
        fail(step, 'subscription.json yok')
        return
    pid = cfg['productId']
    wanted = {bp['basePlanId']: f'{pid}:{bp["basePlanId"]}' for bp in cfg['basePlans']}
    pkg_for = {'P1M': '$rc_monthly', 'P1Y': '$rc_annual'}
    plan_pkg = {bp['basePlanId']: pkg_for.get(bp['billingPeriodDuration']) for bp in cfg['basePlans']}
    log('  ürünler: ' + ', '.join(f'{v} → {plan_pkg[k]}' for k, v in wanted.items()))
    if dry_run:
        ok(step, 'RevenueCat planı hazır (çevrimdışı; API çağrılmadı)')
        return
    key = os.environ.get('RC_SECRET_KEY', '').strip()
    if not key:
        skip(step, 'RC_SECRET_KEY yok')
        return
    rc = RC(key)
    try:
        projects = rc.all('/v2/projects')
        pid_env = os.environ.get('RC_PROJECT_ID', '').strip()
        proj = next((p for p in projects if p['id'] == pid_env), None) if pid_env else None
        proj = proj or next((p for p in projects if 'unwrap' in (p.get('name') or '').lower()), None)
        if not proj and len(projects) == 1:
            proj = projects[0]
        if not proj:
            fail(step, 'Unwrap projesi bulunamadı (projeler: ' + ', '.join(p.get('name', '?') for p in projects) + ')')
            return
        P = f'/v2/projects/{proj["id"]}'
        log(f'  proje: {proj.get("name")} ({proj["id"]})')

        apps = rc.all(f'{P}/apps')
        log('  uygulamalar: ' + ', '.join(f'{a.get("name")} [{a.get("type")}]' for a in apps))
        # Her mağaza: (uygulama seçici, {plan: mağaza ürün kimliği}, {plan: paket})
        stores = [
            ('Play', lambda a: a.get('type') == 'play_store' and (a.get('play_store') or {}).get('package_name') == PACKAGE,
             wanted, plan_pkg),
            ('App Store', lambda a: a.get('type') == 'app_store' and (a.get('app_store') or {}).get('bundle_id') == IOS_BUNDLE,
             IOS_PRODUCTS, {k: v for k, v in IOS_PACKAGES.items()}),
        ]

        # Entitlement: yoksa 'pro' oluşturulur.
        ents = [e for e in rc.all(f'{P}/entitlements') if e.get('state', 'active') == 'active']
        if ents:
            ent = ents[0] if len(ents) == 1 else next(
                (e for e in ents if 'pro' in (e.get('lookup_key') or '').lower()), ents[0])
        else:
            ent = rc.call('POST', f'{P}/entitlements', body={'lookup_key': 'pro', 'display_name': 'Unwrap Pro'})
            ok(step, 'entitlement "pro" oluşturuldu')
        log(f'  entitlement: {ent.get("lookup_key")} ({ent["id"]})')

        # Geçerli offering: yoksa 'default' oluşturulur.
        offerings = rc.all(f'{P}/offerings')
        cur = next((o for o in offerings if o.get('is_current')), None)
        if not cur:
            cur = rc.call('POST', f'{P}/offerings', body={'lookup_key': 'default', 'display_name': 'Unwrap Pro'})
            warn(step, 'geçerli offering yoktu; "default" oluşturuldu — RevenueCat panelinde "current" yapılması gerekebilir')
        log(f'  offering: {cur.get("lookup_key")} ({cur["id"]})')
        packages = {pk['lookup_key']: pk for pk in rc.all(f'{P}/offerings/{cur["id"]}/packages')}
        for lk, name in (('$rc_monthly', 'Aylık'), ('$rc_annual', 'Yıllık')):
            if lk not in packages:
                try:
                    packages[lk] = rc.call('POST', f'{P}/offerings/{cur["id"]}/packages',
                                           body={'lookup_key': lk, 'display_name': name, 'position': len(packages) + 1})
                    ok(step, f'paket {lk} oluşturuldu')
                except ApiError as e:
                    fail(step, f'paket {lk} oluşturulamadı: {e}')

        attached = {pr['id'] for pr in rc.all(f'{P}/entitlements/{ent["id"]}/products')}
        for store_name, pick, want, pkgs in stores:
            app = next((a for a in apps if pick(a)), None)
            if not app:
                fail(step, f'{store_name} uygulaması RevenueCat projesinde yok')
                continue
            log(f'  {store_name} uygulaması: {app.get("name")} ({app["id"]})')
            products = rc.all(f'{P}/products', params={'app_id': app['id'], 'limit': 100})
            by_store = {pr['store_identifier']: pr for pr in products if pr.get('app_id') == app['id']}
            ids = {}
            for bid, sid in want.items():
                if sid in by_store:
                    ids[bid] = by_store[sid]['id']
                    ok(step, f'{store_name} ürün {sid} var ({ids[bid]})')
                    continue
                try:
                    pr = rc.call('POST', f'{P}/products', body={
                        'store_identifier': sid, 'app_id': app['id'], 'type': 'subscription',
                        'display_name': f'Unwrap Pro {"Aylık" if bid in ("aylik", "monthly") else "Yıllık"}'})
                    ids[bid] = pr['id']
                    ok(step, f'{store_name} ürün {sid} oluşturuldu ({pr["id"]})')
                except ApiError as e:
                    fail(step, f'{store_name} ürün {sid}: {e}')
            todo = [i for i in ids.values() if i not in attached]
            if todo:
                try:
                    rc.call('POST', f'{P}/entitlements/{ent["id"]}/actions/attach_products', body={'product_ids': todo})
                    attached.update(todo)
                    ok(step, f'{store_name}: {len(todo)} ürün "{ent.get("lookup_key")}" entitlement\'ına bağlandı')
                except ApiError as e:
                    fail(step, f'{store_name} entitlement bağlama: {e}')
            else:
                ok(step, f'{store_name}: ürünler entitlement\'ta')
            for bid, prod_id in ids.items():
                lk = pkgs.get(bid)
                pk = packages.get(lk)
                if not pk:
                    fail(step, f'paket {lk} yok')
                    continue
                assoc = rc.all(f'{P}/packages/{pk["id"]}/products')
                same_app = [x['product'] for x in assoc if x.get('product', {}).get('app_id') == app['id']]
                if any(x['id'] == prod_id for x in same_app):
                    ok(step, f'{store_name}: {lk} zaten {want[bid]} içeriyor')
                    continue
                if same_app:
                    warn(step, f'{store_name}: {lk} pakette başka ürün var '
                               f'({same_app[0].get("store_identifier")}); değiştirilmedi')
                    continue
                try:
                    rc.call('POST', f'{P}/packages/{pk["id"]}/actions/attach_products',
                            body={'products': [{'product_id': prod_id, 'eligibility_criteria': 'all'}]})
                    ok(step, f'{store_name}: {want[bid]} → {lk}')
                except ApiError as e:
                    fail(step, f'{store_name} paket {lk}: {e}')
    except RcAuthError as e:
        skip(step, f'RevenueCat anahtarı API v2 için geçersiz ya da yetkisiz ({e}). '
                   'v2 gizli anahtar gerekir; izinler: project_configuration:projects:read, apps:read, '
                   'products:read_write, entitlements:read_write, offerings:read, packages:read_write')
    except ApiError as e:
        fail(step, f'RevenueCat: {e}')

# ---------------------------------------------------------------- ana akış


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dry-run', action='store_true', help='yalnız çevrimdışı giriş kontrolü')
    ap.add_argument('--only', default='listings,subscriptions,revenuecat',
                    help='virgülle: listings,subscriptions,revenuecat')
    ap.add_argument('--store-dir', help='store/play yerine başka klasör (deneme için)')
    a = ap.parse_args()
    if a.store_dir:
        global STORE, LISTINGS_DIR, GRAPHICS_DIR, SUBSCRIPTION_FILE, ROOT
        STORE = Path(a.store_dir).resolve()
        ROOT = STORE.parent.parent
        LISTINGS_DIR, GRAPHICS_DIR, SUBSCRIPTION_FILE = STORE / 'listings', STORE / 'graphics', STORE / 'subscription.json'
    steps = {s.strip() for s in a.only.split(',') if s.strip()}
    log(f'Unwrap Play kurulumu — paket {PACKAGE}{" (DRY-RUN, ağ yok)" if a.dry_run else ""}')
    log('Kural: yayın kanallarına (production dahil) dokunulmaz; yalnız mağaza kaydı ve abonelik.')

    play = None
    if not a.dry_run and steps & {'listings', 'subscriptions'}:
        try:
            play = Play()
            log(f'Google hizmet hesabı: {play.email}')
        except Exception as e:  # noqa: BLE001
            header('Google kimlik doğrulama')
            fail('0-kimlik', f'hizmet hesabı yüklenemedi: {type(e).__name__}: {e}')

    for name, fn in (('listings', step_listings), ('subscriptions', step_subscriptions)):
        if name not in steps:
            continue
        if not a.dry_run and play is None:
            skip(f'{name}', 'Google kimlik doğrulama yok')
            continue
        try:
            fn(play, a.dry_run)
        except Exception as e:  # noqa: BLE001
            fail(name, f'beklenmeyen hata: {type(e).__name__}: {e}')
    if 'revenuecat' in steps:
        try:
            step_revenuecat(a.dry_run)
        except Exception as e:  # noqa: BLE001
            fail('3-revenuecat', f'beklenmeyen hata: {type(e).__name__}: {e}')

    write_summary(a.dry_run)
    sys.exit(1 if FAILED else 0)


if __name__ == '__main__':
    main()
