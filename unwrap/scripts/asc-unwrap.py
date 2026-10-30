"""Unwrap App Store Connect aracı (yalnız Unwrap, APP_ID 6824578615; Synvia'ya dokunmaz).
Komutlar:
  audit   — her şeyi OKUR, eksikleri listeler (hiçbir şeyi değiştirmez)
  fill    — eksikleri store/appstore/texts.json ve store/play/ dosyalarından doldurur, sonra audit
KESİN KURAL: incelemeye göndermez (reviewSubmissions oluşturmaz).
Ortam: ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_P8
"""
import hashlib
import json
import os
import sys
import time
from pathlib import Path

import jwt
import requests

APP_ID = '6824578615'
ROOT = Path(__file__).resolve().parent.parent  # unwrap/
TEXTS = json.loads((ROOT / 'store/appstore/texts.json').read_text())
PLAY_LISTINGS = ROOT / 'store/play/listings'
SHOTS = ROOT / 'store/play/graphics/ios'
SITE = 'https://aydinapp.com.tr'
COPYRIGHT = '2026 İbrahim Aydın'
CONTACT = {'contactFirstName': 'İbrahim', 'contactLastName': 'Aydın', 'contactEmail': 'aydinibrahim25@gmail.com'}
REVIEW_NOTES = (
    'Unwrap analyzes a chat export that the user imports from WhatsApp or Telegram. No account or login is required '
    '(Sign in with Apple is optional and only syncs the profile name/avatar).\n\n'
    'How to test:\n'
    '1. Download the sample chat: https://aydinapp.com.tr/apps/unwrap/ornek-sohbet.txt (also linked on the support page).\n'
    '2. In the app tap "Choose file" on the home screen and pick the file (or share it to Unwrap from the Files app).\n'
    '3. Pick which participant is you and the relationship type; the stat cards and the chat report card appear (free).\n\n'
    'Unwrap Pro (auto-renewable subscription, monthly or yearly, 7-day free trial) unlocks the AI report, fun cards, '
    'unlimited Mila coach chat, role-play, badges and frames. You can buy it with a sandbox account in the paywall.\n\n'
    'Privacy: statistics are computed on the device. For Pro AI features, the chat text is masked (phone numbers, emails, '
    'IBANs) and sent over HTTPS to our server, which forwards it to the AI provider for a single answer and does not store it. '
    'Users can report AI content from the app (long-press a Mila message, or "Report content" under a report). '
    'The app is not affiliated with WhatsApp or Telegram.'
)
PERIOD = {
    'tr': ('Aylık', 'Yıllık'), 'en-US': ('Monthly', 'Yearly'), 'de-DE': ('Monatlich', 'Jährlich'),
    'es-ES': ('Mensual', 'Anual'), 'es-MX': ('Mensual', 'Anual'), 'fr-FR': ('Mensuel', 'Annuel'),
    'it': ('Mensile', 'Annuale'), 'nl-NL': ('Maandelijks', 'Jaarlijks'), 'pl': ('Miesięczny', 'Roczny'),
    'pt-BR': ('Mensal', 'Anual'), 'ro': ('Lunar', 'Anual'), 'ru': ('Месяц', 'Год'), 'uk': ('Місяць', 'Рік'),
    'ar-SA': ('شهري', 'سنوي'), 'hi': ('मासिक', 'वार्षिक'), 'id': ('Bulanan', 'Tahunan'),
}
API = 'https://api.appstoreconnect.apple.com'

_tok = None


def token():
    global _tok
    if not _tok or _tok[1] < time.time() + 60:
        exp = int(time.time()) + 1100
        t = jwt.encode({'iss': os.environ['ASC_ISSUER_ID'], 'iat': int(time.time()), 'exp': exp,
                        'aud': 'appstoreconnect-v1'}, os.environ['ASC_KEY_P8'], algorithm='ES256',
                       headers={'kid': os.environ['ASC_KEY_ID'], 'typ': 'JWT'})
        _tok = (t, exp)
    return _tok[0]


class ApiError(Exception):
    pass


def call(method, path, body=None, **params):
    url = path if path.startswith('http') else API + (path if path.startswith('/v') else '/v1' + path)
    r = requests.request(method, url, params=params or None, json=body,
                         headers={'Authorization': f'Bearer {token()}'}, timeout=60)
    if r.status_code >= 400:
        raise ApiError(f'{method} {path} → {r.status_code}: {r.text[:600]}')
    return r.json() if r.content else {}


def get(path, **params):
    return call('GET', path, **params)


def safe(fn, *a, **k):
    try:
        return fn(*a, **k)
    except ApiError as e:
        print('  (okunamadı)', e)
        return None


MISSING = []


def need(cond, msg):
    print(('  ✓ ' if cond else '  ✗ EKSİK: ') + msg)
    if not cond:
        MISSING.append(msg)


def audit():
    app = get(f'/apps/{APP_ID}')['data']['attributes']
    print('UYGULAMA', app.get('name'), app.get('bundleId'), 'birincil dil:', app.get('primaryLocale'),
          'içerik hakları:', app.get('contentRightsDeclaration'))
    need(app.get('contentRightsDeclaration'), 'İçerik hakları beyanı (contentRightsDeclaration)')

    print('\nUYGULAMA BİLGİLERİ (appInfos)')
    infos = get(f'/apps/{APP_ID}/appInfos', include='primaryCategory,secondaryCategory')['data']
    for info in infos:
        a = info['attributes']
        rel = info['relationships']
        print(' ', info['id'], 'durum:', a.get('appStoreState') or a.get('state'), 'yaş:', a.get('appStoreAgeRating'))
        need(rel['primaryCategory'].get('data'), 'Birincil kategori')
        locs = get(f"/appInfos/{info['id']}/appInfoLocalizations", limit=50)['data']
        print('  diller:', ', '.join(l['attributes']['locale'] for l in locs))
        for l in locs:
            la = l['attributes']
            print(f"   {la['locale']}: ad={la.get('name')!r} altbaşlık={la.get('subtitle')!r} gizlilik={la.get('privacyPolicyUrl')!r}")
            need(la.get('privacyPolicyUrl'), f"{la['locale']} gizlilik politikası URL'si")
            need(la.get('subtitle'), f"{la['locale']} altbaşlık")
        age = safe(get, f"/appInfos/{info['id']}/ageRatingDeclaration")
        if age:
            aa = age['data']['attributes']
            optional = {'kidsAgeBand', 'gracRatingClassificationNumber', 'developerAgeRatingInfoUrl',
                        'ageRatingOverride', 'ageRatingOverrideV2', 'koreaAgeRatingOverride'}
            empty = [k for k, v in aa.items() if v is None and k not in optional]
            print('  yaş derecelendirme:', {k: v for k, v in aa.items() if v not in (None, 'NONE', False)})
            need(not empty, f'Yaş derecelendirme anketi (boş: {", ".join(empty)})' if empty else 'Yaş derecelendirme anketi')

    print('\nSÜRÜMLER')
    versions = get(f'/apps/{APP_ID}/appStoreVersions', limit=5)['data']
    need(versions, 'App Store sürümü (1.0.0)')
    for v in versions:
        va = v['attributes']
        print(' ', v['id'], va['versionString'], va.get('appStoreState') or va.get('appVersionState'), va.get('platform'),
              'telif:', va.get('copyright'), 'yayın türü:', va.get('releaseType'))
        need(va.get('copyright'), f"{va['versionString']} telif hakkı (copyright)")
        build = safe(get, f"/appStoreVersions/{v['id']}/build")
        b = build and build.get('data')
        if b:
            ba = b['attributes']
            print('  derleme:', ba.get('version'), ba.get('processingState'), 'şifreleme:', ba.get('usesNonExemptEncryption'))
        need(b, f"{va['versionString']} sürümüne derleme seçilmesi")
        locs = get(f"/appStoreVersions/{v['id']}/appStoreVersionLocalizations", limit=50)['data']
        print('  diller:', ', '.join(l['attributes']['locale'] for l in locs))
        for l in locs:
            la = l['attributes']
            print(f"   {la['locale']}: açıklama={len(la.get('description') or '')} kar. anahtar={len(la.get('keywords') or '')} "
                  f"tanıtım={bool(la.get('promotionalText'))} destek={la.get('supportUrl')!r} pazarlama={la.get('marketingUrl')!r}")
            need(la.get('description'), f"{la['locale']} açıklama")
            need(la.get('keywords'), f"{la['locale']} anahtar kelimeler")
            need(la.get('supportUrl'), f"{la['locale']} destek URL'si")
            sets = get(f"/appStoreVersionLocalizations/{l['id']}/appScreenshotSets", limit=20)['data']
            counts = {}
            for s in sets:
                n = len(get(f"/appScreenshotSets/{s['id']}/appScreenshots", limit=20)['data'])
                counts[s['attributes']['screenshotDisplayType']] = n
            print('    ekran görüntüleri:', counts or 'yok')
            need(any(k.startswith('APP_IPHONE_67') or k.startswith('APP_IPHONE_65') for k, n in counts.items() if n),
                 f"{la['locale']} iPhone 6.7\"/6.5\" ekran görüntüleri")
        rd = safe(get, f"/appStoreVersions/{v['id']}/appStoreReviewDetail")
        r = rd and rd.get('data')
        if r:
            ra = r['attributes']
            print('  inceleme bilgisi:', {k: (v if k != 'demoAccountPassword' else '***') for k, v in ra.items()})
            need(ra.get('contactEmail') and ra.get('contactPhone') and ra.get('contactFirstName'), 'İnceleme iletişim bilgileri (ad, telefon, e-posta)')
            need(ra.get('notes'), 'İnceleme notu')
        else:
            need(False, 'İnceleme bilgileri (App Review Information)')

    print('\nFİYAT VE BULUNABİLİRLİK')
    sched = safe(get, f'/apps/{APP_ID}/appPriceSchedule')
    need(bool(sched and sched.get('data')), 'Uygulama fiyatı (ücretsiz)')
    if sched and sched.get('data'):
        base = safe(get, f"/appPriceSchedules/{sched['data']['id']}/baseTerritory")
        print('  temel bölge:', base and base['data']['id'])
    avail = safe(get, f'/v2/appAvailabilities/{APP_ID}') or safe(get, f'/apps/{APP_ID}/appAvailabilityV2')
    if avail:
        print('  bulunabilirlik:', avail['data']['attributes'])
    else:
        need(False, 'Ülke bulunabilirliği')

    print('\nABONELİKLER')
    groups = get(f'/apps/{APP_ID}/subscriptionGroups', limit=10)['data']
    need(groups, 'Abonelik grubu')
    for g in groups:
        print(' grup', g['attributes']['referenceName'])
        glocs = get(f"/subscriptionGroups/{g['id']}/subscriptionGroupLocalizations", limit=50)['data']
        print('  grup dilleri:', ', '.join(f"{l['attributes']['locale']}={l['attributes'].get('name')!r}/{l['attributes'].get('state')}" for l in glocs))
        print('  grup ham:', {k: v for k, v in g['attributes'].items()})
        need(glocs, 'Abonelik grubu yerelleştirmesi')
        for s in get(f"/subscriptionGroups/{g['id']}/subscriptions", limit=20)['data']:
            sa = s['attributes']
            print('   abonelik dil durumları:', [(l['attributes']['locale'], l['attributes'].get('state')) for l in get(f"/subscriptions/{s['id']}/subscriptionLocalizations", limit=50)['data']])
            print(f"  {sa['productId']}: durum={sa['state']} süre={sa.get('subscriptionPeriod')} aile={sa.get('familySharable')} not={bool(sa.get('reviewNote'))}")
            slocs = get(f"/subscriptions/{s['id']}/subscriptionLocalizations", limit=50)['data']
            print('   diller:', ', '.join(l['attributes']['locale'] for l in slocs))
            need(slocs, f"{sa['productId']} yerelleştirme (ad + açıklama)")
            prices = get(f"/subscriptions/{s['id']}/prices", limit=200)['data']
            print('   fiyatlı bölge sayısı:', len(prices))
            need(prices, f"{sa['productId']} fiyat")
            shot = safe(get, f"/subscriptions/{s['id']}/appStoreReviewScreenshot")
            need(bool(shot and shot.get('data')), f"{sa['productId']} inceleme ekran görüntüsü")
            intro = safe(get, f"/subscriptions/{s['id']}/introductoryOffers", limit=200)
            print('   tanıtım teklifi bölge sayısı:', len(intro['data']) if intro else '?')
            avail = safe(get, f"/subscriptions/{s['id']}/subscriptionAvailability")
            need(bool(avail and avail.get('data')), f"{sa['productId']} bölge bulunabilirliği")

    print('\nEULA / DİĞER')
    eula = safe(get, f'/apps/{APP_ID}/endUserLicenseAgreement')
    print('  özel EULA:', bool(eula and eula.get('data')), '(yoksa Apple standart EULA kullanılır; açıklamada Kullanım Koşulları linki olmalı)')
    print('  Gizlilik (veri toplama) etiketleri: API ile okunamıyor → App Privacy sayfası elle kontrol edilecek')

    print('\n==== ÖZET: %d eksik ====' % len(MISSING))
    for m in MISSING:
        print(' -', m)
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a') as f:
            f.write('## Unwrap App Store Connect taraması\n\n' + ('\n'.join(f'- ✗ {m}' for m in MISSING) or 'Eksik yok') + '\n')


def step(name, fn, *a):
    print(f'\n--- {name}')
    try:
        fn(*a)
    except ApiError as e:
        print('  ✗ HATA:', e)
        FAILED.append(name)


FAILED = []


def site_urls(loc):
    base = SITE + ('/apps/unwrap/' if loc['site'] == 'tr' else '/en/apps/unwrap/')
    return {'support': base + 'support.html', 'privacy': base + 'privacy-policy.html', 'terms': base + 'terms.html',
            'marketing': SITE + ('/uygulamalar/' if loc['site'] == 'tr' else '/en/apps/')}


def is_emoji(ch):
    o = ord(ch)
    return (o >= 0x1F000 or 0x2600 <= o <= 0x27BF or 0x2B00 <= o <= 0x2BFF or o in (0xFE0F, 0x200D, 0x20E3)
            or 0x2190 <= o <= 0x21FF or 0x2300 <= o <= 0x23FF)


def strip_emoji(text):
    """App Store açıklaması emoji kabul etmiyor: satır başı emojileri '•' (rakamlı tuşlar '1.') olur, diğerleri silinir."""
    out = []
    for line in text.split('\n'):
        i = 0
        while i < len(line) and (is_emoji(line[i]) or (line[i].isdigit() and i + 1 < len(line) and line[i + 1] in '\ufe0f\u20e3')):
            i += 1
        head, rest = line[:i], line[i:].lstrip()
        digits = ''.join(c for c in head if c.isdigit())
        rest = ''.join(c for c in rest if not is_emoji(c))
        title = any(c.isalpha() for c in rest) and rest == rest.upper()  # BÖLÜM BAŞLIĞI madde işareti almaz
        prefix = f'{digits}. ' if digits else ('• ' if head and not title else '')
        rest = ' '.join(rest.split(' ')).replace('  ', ' ').rstrip()
        out.append(prefix + rest)
    return '\n'.join(out)


def description(code, loc):
    full = json.loads((PLAY_LISTINGS / f"{loc['play']}.json").read_text())['fullDescription']
    paras = [loc['billing'] if 'Google Play' in p else p for p in full.split('\n')]
    assert loc['billing'] in paras, f'{code}: Google Play paragrafı bulunamadı'
    u = site_urls(loc)
    text = strip_emoji('\n'.join(paras)).rstrip() + f"\n\n{loc['terms']}: {u['terms']}\n{loc['privacy']}: {u['privacy']}"
    assert 'google' not in text.lower() and 'android' not in text.lower()
    assert len(text) <= 4000
    return text


def upsert(list_path, create_type, parent_rel, parent_id, locale, attrs, existing=None):
    rows = existing if existing is not None else get(list_path, limit=50)['data']
    row = next((r for r in rows if r['attributes']['locale'] == locale), None)
    if row:
        diff = {k: v for k, v in attrs.items() if row['attributes'].get(k) != v}
        if diff:
            call('PATCH', f'/{create_type}/{row["id"]}', {'data': {'type': create_type, 'id': row['id'], 'attributes': diff}})
            print(f'  {locale}: güncellendi ({", ".join(diff)})')
        else:
            print(f'  {locale}: zaten tamam')
        return row['id']
    r = call('POST', f'/{create_type}', {'data': {'type': create_type, 'attributes': {'locale': locale, **attrs},
                                                  'relationships': {parent_rel: {'data': {'type': parent_rel + 's' if not parent_rel.endswith('s') else parent_rel, 'id': parent_id}}}}})
    print(f'  {locale}: eklendi')
    return r['data']['id']


def fill_app():
    call('PATCH', f'/apps/{APP_ID}', {'data': {'type': 'apps', 'id': APP_ID,
                                               'attributes': {'contentRightsDeclaration': 'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}})
    print('  içerik hakları: üçüncü taraf içerik yok')


def editable_info():
    infos = get(f'/apps/{APP_ID}/appInfos')['data']
    return next((i for i in infos if (i['attributes'].get('appStoreState') or i['attributes'].get('state')) in
                 ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'WAITING_FOR_REVIEW', None)), infos[0])


def fill_category():
    info = editable_info()
    call('PATCH', f"/appInfos/{info['id']}", {'data': {'type': 'appInfos', 'id': info['id'], 'relationships': {
        'primaryCategory': {'data': {'type': 'appCategories', 'id': 'LIFESTYLE'}},
        'secondaryCategory': {'data': {'type': 'appCategories', 'id': 'ENTERTAINMENT'}}}}})
    print('  kategori: Yaşam Tarzı + Eğlence')


def fill_info_locs():
    info = editable_info()
    rows = get(f"/appInfos/{info['id']}/appInfoLocalizations", limit=50)['data']
    for code, loc in TEXTS['locales'].items():
        name = json.loads((PLAY_LISTINGS / f"{loc['play']}.json").read_text())['title']
        attrs = {'name': name, 'subtitle': loc['subtitle'], 'privacyPolicyUrl': site_urls(loc)['privacy']}
        try:
            upsert(None, 'appInfoLocalizations', 'appInfo', info['id'], code, attrs, rows)
        except ApiError as e:
            print(f'  ✗ {code}:', e)
            if 'name' in str(e).lower():  # ad başka uygulamada kullanılıyor olabilir
                try:
                    upsert(None, 'appInfoLocalizations', 'appInfo', info['id'], code, {**attrs, 'name': 'Unwrap: ' + loc['subtitle'][:22]}, rows)
                except ApiError as e2:
                    print(f'  ✗ {code} (yedek ad):', e2)


AGE = {
    'advertising': False, 'ageAssurance': False, 'gambling': False, 'healthOrWellnessTopics': False, 'lootBox': False,
    'messagingAndChat': False, 'parentalControls': False, 'socialMedia': False, 'socialMediaAgeRestricted': False, 'unrestrictedWebAccess': False,
    'userGeneratedContent': False,
    'alcoholTobaccoOrDrugUseOrReferences': 'NONE', 'contests': 'NONE', 'gamblingSimulated': 'NONE',
    'gunsOrOtherWeapons': 'NONE', 'horrorOrFearThemes': 'NONE', 'medicalOrTreatmentInformation': 'NONE',
    'sexualContentGraphicAndNudity': 'NONE', 'sexualContentOrNudity': 'NONE', 'violenceCartoonOrFantasy': 'NONE',
    'violenceRealistic': 'NONE', 'violenceRealisticProlongedGraphicOrSadistic': 'NONE',
    # İlişki/flört konuları ve kullanıcının kendi sohbetindeki argo yansıyabilir
    'matureOrSuggestiveThemes': 'INFREQUENT_OR_MILD', 'profanityOrCrudeHumor': 'INFREQUENT_OR_MILD',
}


def fill_age():
    info = editable_info()
    age = get(f"/appInfos/{info['id']}/ageRatingDeclaration")['data']
    known = set(age['attributes'])
    attrs = {k: v for k, v in AGE.items() if k in known}
    try:
        call('PATCH', f"/ageRatingDeclarations/{age['id']}", {'data': {'type': 'ageRatingDeclarations', 'id': age['id'], 'attributes': attrs}})
    except ApiError as e:
        if 'INFREQUENT_OR_MILD' in str(e):
            attrs = {k: ('INFREQUENT' if v == 'INFREQUENT_OR_MILD' else v) for k, v in attrs.items()}
            call('PATCH', f"/ageRatingDeclarations/{age['id']}", {'data': {'type': 'ageRatingDeclarations', 'id': age['id'], 'attributes': attrs}})
        else:
            raise
    print('  yaş anketi dolduruldu:', len(attrs), 'soru')


def version():
    vs = get(f'/apps/{APP_ID}/appStoreVersions', limit=5)['data']
    return next(v for v in vs if (v['attributes'].get('appStoreState') or v['attributes'].get('appVersionState')) in
                ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'))


def fill_version():
    v = version()
    attrs = {'copyright': COPYRIGHT}
    if v['attributes']['versionString'] != '1.0.0':
        attrs['versionString'] = '1.0.0'
    call('PATCH', f"/appStoreVersions/{v['id']}", {'data': {'type': 'appStoreVersions', 'id': v['id'], 'attributes': attrs}})
    print('  sürüm:', attrs)
    builds = get('/builds', **{'filter[app]': APP_ID, 'filter[preReleaseVersion.version]': '1.0.0',
                               'filter[processingState]': 'VALID', 'sort': '-uploadedDate', 'limit': 5})['data']
    if not builds:
        print('  ✗ 1.0.0 için işlenmiş derleme yok')
        return
    b = builds[0]
    if b['attributes'].get('usesNonExemptEncryption') is None:
        call('PATCH', f"/builds/{b['id']}", {'data': {'type': 'builds', 'id': b['id'], 'attributes': {'usesNonExemptEncryption': False}}})
    call('PATCH', f"/appStoreVersions/{v['id']}/relationships/build", {'data': {'type': 'builds', 'id': b['id']}})
    print('  derleme seçildi:', b['attributes']['version'], b['attributes'].get('uploadedDate'))


def upload_screenshot(set_id, path):
    data = path.read_bytes()
    r = call('POST', '/appScreenshots', {'data': {'type': 'appScreenshots', 'attributes': {'fileName': path.name, 'fileSize': len(data)},
                                                  'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': set_id}}}}})['data']
    for op in r['attributes']['uploadOperations']:
        chunk = data[op['offset']:op['offset'] + op['length']]
        requests.request(op['method'], op['url'], data=chunk,
                         headers={h['name']: h['value'] for h in op.get('requestHeaders', [])}, timeout=120).raise_for_status()
    call('PATCH', f"/appScreenshots/{r['id']}", {'data': {'type': 'appScreenshots', 'id': r['id'], 'attributes': {
        'uploaded': True, 'sourceFileChecksum': hashlib.md5(data).hexdigest()}}})


def fill_version_locs():
    v = version()
    rows = get(f"/appStoreVersions/{v['id']}/appStoreVersionLocalizations", limit=50)['data']
    for code, loc in TEXTS['locales'].items():
        u = site_urls(loc)
        attrs = {'description': description(code, loc), 'keywords': loc['keywords'], 'promotionalText': loc['promo'],
                 'supportUrl': u['support'], 'marketingUrl': u['marketing']}
        try:
            lid = upsert(None, 'appStoreVersionLocalizations', 'appStoreVersion', v['id'], code, attrs, rows)
        except ApiError as e:
            print(f'  ✗ {code}:', e)
            continue
        sets = get(f'/appStoreVersionLocalizations/{lid}/appScreenshotSets', limit=20)['data']
        st = next((x for x in sets if x['attributes']['screenshotDisplayType'] == 'APP_IPHONE_67'), None)
        if not st:
            st = call('POST', '/appScreenshotSets', {'data': {'type': 'appScreenshotSets', 'attributes': {'screenshotDisplayType': 'APP_IPHONE_67'},
                                                              'relationships': {'appStoreVersionLocalization': {'data': {'type': 'appStoreVersionLocalizations', 'id': lid}}}}})['data']
        have = get(f"/appScreenshotSets/{st['id']}/appScreenshots", limit=20)['data']
        if have:
            print(f'    ekran görüntüleri zaten var ({len(have)})')
            continue
        folder = SHOTS / ('tr-TR' if code == 'tr' else 'en-US')
        for f in sorted(folder.glob('*.png')):
            upload_screenshot(st['id'], f)
        print(f'    {len(list(folder.glob("*.png")))} ekran görüntüsü yüklendi ({folder.name})')


def fill_review():
    v = version()
    rd = get(f"/appStoreVersions/{v['id']}/appStoreReviewDetail").get('data')
    attrs = {**CONTACT, 'demoAccountRequired': False, 'notes': REVIEW_NOTES}
    phone = os.environ.get('REVIEW_PHONE', '').strip()
    if phone:
        attrs['contactPhone'] = phone
    else:
        print('  ! telefon yok (GitHub değişkeni UNWRAP_REVIEW_PHONE); telefon elle girilecek')
    if rd:
        call('PATCH', f"/appStoreReviewDetails/{rd['id']}", {'data': {'type': 'appStoreReviewDetails', 'id': rd['id'], 'attributes': attrs}})
    else:
        call('POST', '/appStoreReviewDetails', {'data': {'type': 'appStoreReviewDetails', 'attributes': attrs,
                                                         'relationships': {'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': v['id']}}}}})
    print('  inceleme bilgileri yazıldı')


def fill_availability():
    terr = []
    url = '/territories?limit=200'
    while url:
        page = get(url)
        terr += [t['id'] for t in page['data']]
        url = page.get('links', {}).get('next')
    body = {'data': {'type': 'appAvailabilities', 'attributes': {'availableInNewTerritories': True},
                     'relationships': {'app': {'data': {'type': 'apps', 'id': APP_ID}},
                                       'territoryAvailabilities': {'data': [{'type': 'territoryAvailabilities', 'id': f'${{{t}}}'} for t in terr]}}},
            'included': [{'type': 'territoryAvailabilities', 'id': f'${{{t}}}', 'attributes': {'available': True},
                          'relationships': {'territory': {'data': {'type': 'territories', 'id': t}}}} for t in terr]}
    call('POST', '/v2/appAvailabilities', body)
    print(f'  {len(terr)} ülkede bulunabilir')


def fill_subscriptions():
    for g in get(f'/apps/{APP_ID}/subscriptionGroups', limit=10)['data']:
        glocs = get(f"/subscriptionGroups/{g['id']}/subscriptionGroupLocalizations", limit=50)['data']
        for code in TEXTS['locales']:
            try:
                upsert(None, 'subscriptionGroupLocalizations', 'subscriptionGroup', g['id'], code, {'name': 'Unwrap Pro'}, glocs)
            except ApiError as e:
                print(f'  ✗ grup {code}:', e)
        for sub in get(f"/subscriptionGroups/{g['id']}/subscriptions", limit=20)['data']:
            yearly = sub['attributes']['subscriptionPeriod'] == 'ONE_YEAR'
            rows = get(f"/subscriptions/{sub['id']}/subscriptionLocalizations", limit=50)['data']
            print(' ', sub['attributes']['productId'], 'mevcut:', [(r['attributes']['locale'], r['attributes']['name'], r['attributes'].get('description')) for r in rows])
            for code, (desc,) in TEXTS['subscription'].items():
                if any(r['attributes']['locale'] == code for r in rows):
                    continue  # elle yazılanlara dokunma
                name = f"Unwrap Pro {PERIOD[code][1 if yearly else 0]}"
                try:
                    upsert(None, 'subscriptionLocalizations', 'subscription', sub['id'], code, {'name': name, 'description': desc}, rows)
                except ApiError as e:
                    print(f'  ✗ {code}:', e)


def fill_price():
    """Uygulamanın kendisini ücretsiz yapar (abonelik fiyatlarına dokunmaz)."""
    pts = get(f'/apps/{APP_ID}/appPricePoints', **{'filter[territory]': 'USA', 'limit': 200})['data']
    free = next(p for p in pts if float(p['attributes']['customerPrice']) == 0)
    call('POST', '/appPriceSchedules', {
        'data': {'type': 'appPriceSchedules', 'relationships': {
            'app': {'data': {'type': 'apps', 'id': APP_ID}},
            'baseTerritory': {'data': {'type': 'territories', 'id': 'USA'}},
            'manualPrices': {'data': [{'type': 'appPrices', 'id': '${free}'}]}}},
        'included': [{'type': 'appPrices', 'id': '${free}', 'attributes': {'startDate': None},
                      'relationships': {'appPricePoint': {'data': {'type': 'appPricePoints', 'id': free['id']}}}}]})
    sched = get(f'/apps/{APP_ID}/appPriceSchedule')['data']
    manual = get(f"/appPriceSchedules/{sched['id']}/manualPrices", include='appPricePoint', limit=5)
    print('  uygulama fiyatı: ücretsiz', [i['attributes'].get('customerPrice') for i in manual.get('included', [])])


ONETIME = json.loads((ROOT / 'store/onetime.json').read_text())


def _review_shot_bytes():
    """Abonelik inceleme ekran görüntüsünü indirir (ödeme ekranı; tek seferlik ürünlerde de kullanılır)."""
    for g in get(f'/apps/{APP_ID}/subscriptionGroups', limit=5)['data']:
        for sub in get(f"/subscriptionGroups/{g['id']}/subscriptions", limit=5)['data']:
            shot = get(f"/subscriptions/{sub['id']}/appStoreReviewScreenshot").get('data')
            asset = shot and shot['attributes'].get('imageAsset')
            if asset:
                url = asset['templateUrl'].replace('{w}', str(asset['width'])).replace('{h}', str(asset['height'])).replace('{f}', 'png')
                r = requests.get(url, timeout=60)
                r.raise_for_status()
                return r.content
    return None


def fill_iap():
    """Ömür boyu Pro (non-consumable) ve 1 ay hediye (consumable). Var olana dokunmaz, eksik parçayı tamamlar."""
    existing = {x['attributes']['productId']: x for x in get(f'/apps/{APP_ID}/inAppPurchasesV2', limit=50)['data']}
    terr = []
    url = '/territories?limit=200'
    while url:
        page = get(url)
        terr += [t['id'] for t in page['data']]
        url = page.get('links', {}).get('next')
    shot = None
    for key in ('lifetime', 'gift'):
        item = ONETIME[key]
        pid = item['productId']
        iap = existing.get(pid)
        if not iap:
            iap = call('POST', '/v2/inAppPurchases', {'data': {'type': 'inAppPurchases', 'attributes': {
                'name': item['referenceName'], 'productId': pid, 'inAppPurchaseType': item['appleType'], 'familySharable': False,
                'reviewNote': 'Unwrap Pro unlock (lifetime) / gift code generator. Test with a sandbox account in the paywall or the Invite screen.'},
                'relationships': {'app': {'data': {'type': 'apps', 'id': APP_ID}}}}})['data']
            print(f'  {pid}: oluşturuldu')
        else:
            print(f'  {pid}: var ({iap["attributes"].get("state")})')
        iid = iap['id']
        # Diller (tr, en-US) + diğer 14 dil İngilizce metinle
        locs = {l['attributes']['locale']: l for l in get(f'/v2/inAppPurchases/{iid}/inAppPurchaseLocalizations', limit=50)['data']}
        for loc in TEXTS['locales']:
            src = item['listings']['tr' if loc == 'tr' else 'en-US']
            if loc in locs:
                continue
            try:
                call('POST', '/inAppPurchaseLocalizations', {'data': {'type': 'inAppPurchaseLocalizations', 'attributes': {
                    'locale': loc, 'name': src['title'][:30], 'description': src['description'][:45]},
                    'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': iid}}}}})
            except ApiError as e:
                print(f'  ✗ {pid} {loc}:', e)
        print(f'  {pid}: diller tamam')
        # Fiyat: Türkiye temel bölge, diğerleri Apple'ın eşdeğeri
        sched = safe(get, f'/v2/inAppPurchases/{iid}/iapPriceSchedule')
        has_price = False
        if sched and sched.get('data'):
            manual = safe(get, f"/inAppPurchasePriceSchedules/{sched['data']['id']}/manualPrices", limit=1)
            has_price = bool(manual and manual.get('data'))
        if not has_price:
            target = float(item['priceTRY'])
            points, url = [], f'/v2/inAppPurchases/{iid}/pricePoints?filter[territory]=TUR&limit=200'
            while url:
                page = get(url)
                points += page['data']
                url = page.get('links', {}).get('next')
            best = min(points, key=lambda p: abs(float(p['attributes']['customerPrice']) - target))
            call('POST', '/inAppPurchasePriceSchedules', {
                'data': {'type': 'inAppPurchasePriceSchedules', 'relationships': {
                    'inAppPurchase': {'data': {'type': 'inAppPurchases', 'id': iid}},
                    'baseTerritory': {'data': {'type': 'territories', 'id': 'TUR'}},
                    'manualPrices': {'data': [{'type': 'inAppPurchasePrices', 'id': '${p0}'}]}}},
                'included': [{'type': 'inAppPurchasePrices', 'id': '${p0}', 'attributes': {'startDate': None},
                              'relationships': {'inAppPurchasePricePoint': {'data': {'type': 'inAppPurchasePricePoints', 'id': best['id']}}}}]})
            print(f"  {pid}: fiyat {best['attributes']['customerPrice']} TRY")
        # Bulunabilirlik
        av = safe(get, f'/v2/inAppPurchases/{iid}/inAppPurchaseAvailability')
        if not (av and av.get('data')):
            call('POST', '/inAppPurchaseAvailabilities', {'data': {'type': 'inAppPurchaseAvailabilities',
                'attributes': {'availableInNewTerritories': True},
                'relationships': {'inAppPurchase': {'data': {'type': 'inAppPurchases', 'id': iid}},
                                  'availableTerritories': {'data': [{'type': 'territories', 'id': t} for t in terr]}}}})
            print(f'  {pid}: {len(terr)} ülkede')
        # İnceleme ekran görüntüsü
        rs = safe(get, f'/v2/inAppPurchases/{iid}/appStoreReviewScreenshot')
        if not (rs and rs.get('data')):
            shot = shot or _review_shot_bytes()
            if not shot:
                print(f'  ! {pid}: inceleme ekran görüntüsü bulunamadı')
                continue
            r = call('POST', '/inAppPurchaseAppStoreReviewScreenshots', {'data': {'type': 'inAppPurchaseAppStoreReviewScreenshots',
                'attributes': {'fileName': f'{pid}.png', 'fileSize': len(shot)},
                'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': iid}}}}})['data']
            for op in r['attributes']['uploadOperations']:
                requests.request(op['method'], op['url'], data=shot[op['offset']:op['offset'] + op['length']],
                                 headers={h['name']: h['value'] for h in op.get('requestHeaders', [])}, timeout=120).raise_for_status()
            call('PATCH', f"/inAppPurchaseAppStoreReviewScreenshots/{r['id']}", {'data': {'type': 'inAppPurchaseAppStoreReviewScreenshots', 'id': r['id'],
                'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(shot).hexdigest()}}})
            print(f'  {pid}: inceleme ekran görüntüsü yüklendi')
    for x in get(f'/apps/{APP_ID}/inAppPurchasesV2', limit=50)['data']:
        print('  durum:', x['attributes']['productId'], x['attributes'].get('state'))


TEST_NOTES = {
    'tr': ('1.1.0 yenilikleri: Yapay zekâ raporunda Red/Green flag, Uyum %, "Kim daha çok seviyor?" düellosu, '
           'grup ödülleri ve eski sevgili kartları · Raporda "Hikâye olarak oynat (Wrapped)" ve 9:16 paylaşım · '
           'Profil → Arkadaşını getir (davet kodu, hediye Pro) · Paywall\'da Ömür boyu Pro · Ana sayfada haftanın meydan okuması · '
           'Mila\'da Hakem (Çift Modu) · Ayarlar → Aylık rapor hatırlatıcısı.'),
    'en-US': ('What\'s new in 1.1.0: red/green flags, compatibility %, "who loves more?" duel, group awards and ex cards in the AI report · '
              '"Play as a story (Wrapped)" with 9:16 sharing · Profile → Invite a friend (invite codes, gift Pro) · Lifetime Pro on the paywall · '
              'Challenge of the week on Home · Mila referee (Couple Mode) · Settings → monthly report reminder.'),
}


def test_notes():
    """En yeni TestFlight derlemesine "Ne test edilecek" notu yazar."""
    builds = get('/builds', **{'filter[app]': APP_ID, 'sort': '-uploadedDate', 'limit': 1, 'include': 'preReleaseVersion'})
    if not builds['data']:
        print('  derleme yok')
        return
    b = builds['data'][0]
    pre = next((x for x in builds.get('included', []) if x['type'] == 'preReleaseVersions'), None)
    print('  derleme', b['attributes']['version'], pre and pre['attributes'].get('version'), b['attributes'].get('processingState'))
    locs = {l['attributes']['locale']: l for l in get(f"/builds/{b['id']}/betaBuildLocalizations", limit=20)['data']}
    for loc, text in TEST_NOTES.items():
        if loc in locs:
            call('PATCH', f"/betaBuildLocalizations/{locs[loc]['id']}", {'data': {'type': 'betaBuildLocalizations', 'id': locs[loc]['id'], 'attributes': {'whatsNew': text}}})
        else:
            call('POST', '/betaBuildLocalizations', {'data': {'type': 'betaBuildLocalizations', 'attributes': {'locale': loc, 'whatsNew': text},
                                                              'relationships': {'build': {'data': {'type': 'builds', 'id': b['id']}}}}})
        print(f'  {loc}: not yazıldı')


def fill():
    for u in ['/apps/unwrap/support.html', '/apps/unwrap/privacy-policy.html', '/apps/unwrap/terms.html', '/apps/unwrap/ornek-sohbet.txt',
              '/en/apps/unwrap/support.html', '/en/apps/unwrap/privacy-policy.html', '/en/apps/unwrap/terms.html', '/uygulamalar/', '/en/apps/']:
        code = requests.get(SITE + u, timeout=30).status_code
        print('site', code, u)
        if code != 200:
            sys.exit('site sayfası açılmıyor, durduruldu')
    for code, loc in TEXTS['locales'].items():
        description(code, loc)  # metinleri önce denetle
    step('İçerik hakları', fill_app)
    step('Kategori', fill_category)
    step('Uygulama adı / altbaşlık / gizlilik (diller)', fill_info_locs)
    step('Yaş derecelendirme', fill_age)
    step('Sürüm, telif, derleme', fill_version)
    step('Açıklama / anahtar kelime / destek / ekran görüntüleri (diller)', fill_version_locs)
    step('İnceleme bilgileri', fill_review)
    step('Uygulama fiyatı', fill_price)
    step('Ülke bulunabilirliği', fill_availability)
    step('Abonelik dilleri', fill_subscriptions)
    print('\nHATALI ADIMLAR:', FAILED or 'yok')
    print('\n================ SON DURUM ================')
    audit()


def site():
    """Yalnız okur: site sayfaları ve Unwrap sunucusu açılıyor mu."""
    for u in ['/', '/apps/unwrap/', '/apps/unwrap/support.html', '/apps/unwrap/privacy-policy.html', '/apps/unwrap/terms.html',
              '/apps/unwrap/ornek-sohbet.txt', '/en/apps/unwrap/', '/en/apps/unwrap/support.html', '/en/apps/unwrap/privacy-policy.html',
              '/en/apps/unwrap/terms.html', '/uygulamalar/', '/en/apps/']:
        try:
            r = requests.get(SITE + u, timeout=30)
            print('site', r.status_code, f'{r.elapsed.total_seconds():.2f}s', u)
        except requests.RequestException as e:
            print('site HATA', u, type(e).__name__)
    try:
        r = requests.post('https://unwrap-backend.vercel.app/api/davet', json={'action': 'code'}, timeout=30)
        print('sunucu', r.status_code, '(401 beklenir: imzasız istek reddedilir)')
    except requests.RequestException as e:
        print('sunucu HATA', type(e).__name__)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'audit'
    {'audit': audit, 'site': site, 'fill': fill, 'testnote': lambda: step('TestFlight notu', test_notes), 'iap': lambda: step('Tek seferlik ürünler', fill_iap), 'price': lambda: (step('Uygulama fiyatı', fill_price), audit()), 'review': lambda: (step('İnceleme bilgileri', fill_review), audit())}[cmd]()
