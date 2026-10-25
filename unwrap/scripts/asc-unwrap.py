"""Unwrap App Store Connect aracı (yalnız Unwrap, APP_ID 6824578615; Synvia'ya dokunmaz).
Komutlar:
  audit   — her şeyi OKUR, eksikleri listeler (hiçbir şeyi değiştirmez)
KESİN KURAL: incelemeye göndermez (reviewSubmissions oluşturmaz).
Ortam: ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_P8
"""
import os
import sys
import time

import jwt
import requests

APP_ID = '6824578615'
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
            empty = [k for k, v in aa.items() if v is None]
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
        print('  grup dilleri:', ', '.join(f"{l['attributes']['locale']}={l['attributes'].get('name')!r}" for l in glocs))
        need(glocs, 'Abonelik grubu yerelleştirmesi')
        for s in get(f"/subscriptionGroups/{g['id']}/subscriptions", limit=20)['data']:
            sa = s['attributes']
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


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'audit'
    {'audit': audit}[cmd]()
