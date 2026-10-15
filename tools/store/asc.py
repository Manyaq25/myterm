"""App Store Connect API yardımcısı (GitHub Actions içinde çalışır).

Anahtar: ASC_KEY_ID, ASC_KEY_P8 (gizli değişkenler), ASC_ISSUER_ID (iş akışında).
Komutlar:
  check  - anahtarı doğrular; uygulamanın sürümlerini, dillerini ve ekran görüntüsü bölümlerini listeler (salt okunur)
"""
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
    {'check': check}[sys.argv[1]]()
