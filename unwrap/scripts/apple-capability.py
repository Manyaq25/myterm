"""Uygulamanın Apple kimliğinde "Sign In with Apple" yeteneğini açar (açıksa dokunmaz).
EAS'ın otomatik yetenek eşitlemesi bu yetenekte Apple API hatası verdiği için
App Store Connect API anahtarıyla doğrudan yapılır. Yalnız GitHub Actions'ta çalışır.
"""
import json
import os
import sys
import time
import urllib.request

import jwt

BUNDLE = 'com.aydinapp.unwrap'
API = 'https://api.appstoreconnect.apple.com/v1'

key = open(os.environ['EXPO_ASC_API_KEY_PATH']).read()
token = jwt.encode(
    {'iss': os.environ['EXPO_ASC_ISSUER_ID'], 'iat': int(time.time()), 'exp': int(time.time()) + 600, 'aud': 'appstoreconnect-v1'},
    key, algorithm='ES256', headers={'kid': os.environ['EXPO_ASC_KEY_ID'], 'typ': 'JWT'},
)


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body else None)
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        print(f'{method} {path} → {e.code}: {e.read().decode()[:500]}')
        sys.exit(1)


bundles = call('GET', f'/bundleIds?filter[identifier]={BUNDLE}&limit=5')['data']
bundle = next(b for b in bundles if b['attributes']['identifier'] == BUNDLE)
caps = call('GET', f"/bundleIds/{bundle['id']}/bundleIdCapabilities")['data']
if any(c['attributes']['capabilityType'] == 'APPLE_ID_AUTH' for c in caps):
    print('Sign In with Apple zaten açık')
    sys.exit(0)

call('POST', '/bundleIdCapabilities', {
    'data': {
        'type': 'bundleIdCapabilities',
        'attributes': {
            'capabilityType': 'APPLE_ID_AUTH',
            'settings': [{'key': 'APPLE_ID_AUTH_APP_CONSENT', 'options': [{'key': 'PRIMARY_APP_CONSENT'}]}],
        },
        'relationships': {'bundleId': {'data': {'type': 'bundleIds', 'id': bundle['id']}}},
    }
})
print('Sign In with Apple açıldı')
