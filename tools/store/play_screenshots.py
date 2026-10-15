"""Google Play mağaza girişlerindeki telefon ekran görüntülerini store/play-screenshots/<dil>/ ile değiştirir.

GitHub Actions içinde çalışır (.github/workflows/play-screenshots.yml). Anahtar PLAY_SERVICE_ACCOUNT_JSON
gizli değişkeninden okunur. Yalnızca Play'de zaten var olan mağaza dillerine yükler; dil kodu klasöre
öneki ile eşlenir (de-DE -> de, pt-BR -> pt, zh-CN -> zh). Klasörü olmayan dillere en/ yüklenir.
--dry-run: değişikliği hazırlar, hiçbir şey göndermez.
"""
import glob
import json
import os
import sys

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

PACKAGE = 'com.manyaq25.benimyerimetakipet'
ROOT = 'store/play-screenshots'


def folder_for(lang):
    base = lang.split('-')[0].lower()
    path = os.path.join(ROOT, base)
    return path if os.path.isdir(path) else os.path.join(ROOT, 'en')


def main():
    dry = '--dry-run' in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    creds = service_account.Credentials.from_service_account_info(
        json.loads(os.environ['PLAY_SERVICE_ACCOUNT_JSON']),
        scopes=['https://www.googleapis.com/auth/androidpublisher'])
    edits = build('androidpublisher', 'v3', credentials=creds, cache_discovery=False).edits()
    edit = edits.insert(packageName=PACKAGE, body={}).execute()['id']
    try:
        listings = edits.listings().list(packageName=PACKAGE, editId=edit).execute().get('listings', [])
        langs = [l['language'] for l in listings]
        print('Play mağaza dilleri:', ', '.join(langs))
        for lang in langs:
            if only and lang not in only and lang.split('-')[0] not in only:
                continue
            files = sorted(glob.glob(os.path.join(folder_for(lang), '*.jpg')))
            print(f'{lang}: {folder_for(lang)} ({len(files)} görsel)')
            edits.images().deleteall(packageName=PACKAGE, editId=edit, language=lang, imageType='phoneScreenshots').execute()
            for f in files:
                edits.images().upload(packageName=PACKAGE, editId=edit, language=lang, imageType='phoneScreenshots',
                                      media_body=MediaFileUpload(f, mimetype='image/jpeg')).execute()
        if dry:
            edits.delete(packageName=PACKAGE, editId=edit).execute()
            print('DENEME: hiçbir şey gönderilmedi.')
        else:
            # Yönetilen yayınlama açıkken değişiklik incelemeye gider; onaydan sonra kullanıcı yayınlar.
            edits.commit(packageName=PACKAGE, editId=edit, changesNotSentForReview=False).execute()
            print('Gönderildi: Google incelemesinden sonra görünür.')
    except Exception:
        edits.delete(packageName=PACKAGE, editId=edit).execute()
        raise


if __name__ == '__main__':
    main()
