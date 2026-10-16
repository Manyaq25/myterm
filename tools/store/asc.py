"""App Store Connect API yardımcısı (GitHub Actions içinde çalışır).

Anahtar: ASC_KEY_ID, ASC_KEY_P8 (gizli değişkenler), ASC_ISSUER_ID (iş akışında).
Komutlar:
  check                    - sürümleri, dilleri ve ekran görüntüsü bölümlerini listeler (salt okunur)
  prepare <sürüm> <derleme> - sürümü (yoksa) oluşturur, derlemeyi bağlar, "Yenilikler" metnini yazar ve
                             6.9" (APP_IPHONE_67) görsellerini store/appstore-screenshots/<dil>/ ile değiştirir.
                             İncelemeye GÖNDERMEZ (o kullanıcıda). --no-screenshots ile görsellere dokunmaz.
"""
import glob
import hashlib
import json
import os
import sys
import time

import jwt
import requests

APP_ID = '6812456837'
API = 'https://api.appstoreconnect.apple.com/v1'


def token():
    now = int(time.time())
    return jwt.encode({'iss': os.environ['ASC_ISSUER_ID'], 'iat': now, 'exp': now + 1200, 'aud': 'appstoreconnect-v1'},
                      os.environ['ASC_KEY_P8'], algorithm='ES256', headers={'kid': os.environ['ASC_KEY_ID']})


def get(path, **params):
    r = requests.get(API + path, headers={'Authorization': f'Bearer {token()}'}, params=params, timeout=60)
    if not r.ok:
        sys.exit(f'{r.status_code} {path}: {r.text[:500]}')
    return r.json()


def call(method, path, body=None):
    r = requests.request(method, API + path, headers={'Authorization': f'Bearer {token()}', 'Content-Type': 'application/json'},
                         data=json.dumps(body) if body is not None else None, timeout=120)
    if not r.ok:
        sys.exit(f'{r.status_code} {method} {path}: {r.text[:800]}')
    return r.json() if r.text else {}


# App Store dil kodu -> görsel klasörü (klasör yoksa en)
def shot_folder(locale):
    base = {'zh-Hans': 'zh', 'ar-SA': 'ar'}.get(locale, locale.split('-')[0])
    path = os.path.join('store/appstore-screenshots', base)
    return path if os.path.isdir(path) else 'store/appstore-screenshots/en'


def whats_new(locale):
    texts = json.load(open('store/whats-new.json', encoding='utf-8'))
    base = {'zh-Hans': 'zh', 'ar-SA': 'ar'}.get(locale, locale.split('-')[0])
    return texts.get(base, texts['en'])


def upload_screenshot(set_id, path):
    data = open(path, 'rb').read()
    res = call('POST', '/appScreenshots', {'data': {'type': 'appScreenshots',
               'attributes': {'fileName': os.path.basename(path), 'fileSize': len(data)},
               'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': set_id}}}}})['data']
    for op in res['attributes']['uploadOperations']:
        headers = {h['name']: h['value'] for h in op.get('requestHeaders', [])}
        chunk = data[op['offset']:op['offset'] + op['length']]
        r = requests.request(op['method'], op['url'], headers=headers, data=chunk, timeout=120)
        if not r.ok:
            sys.exit(f'yükleme hatası {r.status_code}: {r.text[:300]}')
    call('PATCH', f"/appScreenshots/{res['id']}", {'data': {'type': 'appScreenshots', 'id': res['id'],
         'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(data).hexdigest()}}})


def prepare(version, build_number, screenshots=True):
    versions = get(f'/apps/{APP_ID}/appStoreVersions', limit=10)['data']
    v = next((x for x in versions if x['attributes']['versionString'] == version), None)
    if v is None:
        v = call('POST', '/appStoreVersions', {'data': {'type': 'appStoreVersions',
                 'attributes': {'platform': 'IOS', 'versionString': version},
                 'relationships': {'app': {'data': {'type': 'apps', 'id': APP_ID}}}}})['data']
        print('sürüm oluşturuldu:', version)
    else:
        print('sürüm zaten var:', version, v['attributes'].get('appStoreState'))
    vid = v['id']

    builds = get('/builds', **{'filter[app]': APP_ID, 'filter[version]': str(build_number),
                               'filter[preReleaseVersion.version]': version})['data']
    if not builds:
        sys.exit(f'derleme {version} ({build_number}) App Store Connect\'te bulunamadı')
    b = builds[0]
    print('derleme:', build_number, 'işlenme durumu:', b['attributes'].get('processingState'))
    call('PATCH', f'/appStoreVersions/{vid}/relationships/build', {'data': {'type': 'builds', 'id': b['id']}})
    print('derleme sürüme bağlandı')

    locs = get(f'/appStoreVersions/{vid}/appStoreVersionLocalizations', limit=50)['data']
    for loc in locs:
        locale = loc['attributes']['locale']
        call('PATCH', f"/appStoreVersionLocalizations/{loc['id']}", {'data': {'type': 'appStoreVersionLocalizations',
             'id': loc['id'], 'attributes': {'whatsNew': whats_new(locale)}}})
        print(f'{locale}: Yenilikler yazıldı')
        if not screenshots:
            continue
        sets = get(f"/appStoreVersionLocalizations/{loc['id']}/appScreenshotSets", limit=50)['data']
        s67 = next((x for x in sets if x['attributes']['screenshotDisplayType'] == 'APP_IPHONE_67'), None)
        if s67 is None:
            s67 = call('POST', '/appScreenshotSets', {'data': {'type': 'appScreenshotSets',
                       'attributes': {'screenshotDisplayType': 'APP_IPHONE_67'},
                       'relationships': {'appStoreVersionLocalization': {'data': {'type': 'appStoreVersionLocalizations', 'id': loc['id']}}}}})['data']
        for old in get(f"/appScreenshotSets/{s67['id']}/appScreenshots", limit=50)['data']:
            call('DELETE', f"/appScreenshots/{old['id']}")
        files = sorted(glob.glob(os.path.join(shot_folder(locale), '*.jpg')))
        for f in files:
            upload_screenshot(s67['id'], f)
        print(f'{locale}: {len(files)} görsel yüklendi ({shot_folder(locale)})')
    print('Hazır. İncelemeye gönderme kullanıcıda.')


def check():
    app = get(f'/apps/{APP_ID}')['data']['attributes']
    print('Uygulama:', app['name'], app['bundleId'], 'ana dil:', app.get('primaryLocale'))
    versions = get(f'/apps/{APP_ID}/appStoreVersions', limit=5)['data']
    for v in versions:
        a = v['attributes']
        print(f"Sürüm {a['versionString']} [{a['platform']}] durum: {a.get('appVersionState') or a.get('appStoreState')}")
    v = versions[0]
    locs = get(f"/appStoreVersions/{v['id']}/appStoreVersionLocalizations", limit=50)['data']
    print(f"{v['attributes']['versionString']} dilleri ({len(locs)}):", ', '.join(l['attributes']['locale'] for l in locs))
    for l in locs:
        sets = get(f"/appStoreVersionLocalizations/{l['id']}/appScreenshotSets", limit=50)['data']
        print(' ', l['attributes']['locale'], '→', ', '.join(s['attributes']['screenshotDisplayType'] for s in sets) or '(kendi görseli yok)')


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'check':
        check()
    elif cmd == 'prepare':
        args = [a for a in sys.argv[2:] if not a.startswith('--')]
        prepare(args[0], args[1], screenshots='--no-screenshots' not in sys.argv)
    else:
        sys.exit('bilinmeyen komut: ' + cmd)
