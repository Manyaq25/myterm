"""Dahili testteki en yeni sürümü Google Play KAPALI teste (alpha kanalı) taşır ve
incelemeye gönderir. Üretim kanalına asla dokunmaz. Test kullanıcı listesi Play
Console'dan elle eklenir (e-posta listeleri için API yok).
Kullanım: python3 scripts/play-closed-test.py   (PLAY_SA_JSON ortam değişkeniyle)
"""
import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location('ps', Path(__file__).with_name('play-setup.py'))
ps = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ps)

TRACK = 'alpha'  # Play'deki varsayılan kapalı test kanalı
NOTES = {
    'tr-TR': 'Kapalı test sürümü: sohbet karnesi, kanıtlı yapay zekâ raporu, Mila, profil ve rozetler. Geri bildirimin bizim için çok değerli.',
    'en-US': 'Closed test build: chat report card, evidence-based AI report, Mila, profile and badges. Your feedback means a lot.',
}

def main():
    assert TRACK != 'production'
    play = ps.Play()
    print('hizmet hesabı:', play.email)
    edit = play.call('POST', f'{ps.API}/edits')['id']
    tracks = play.call('GET', f'{ps.API}/edits/{edit}/tracks').get('tracks', [])
    for t in tracks:
        print('kanal', t['track'], [(r.get('name'), r.get('status'), r.get('versionCodes')) for r in t.get('releases', [])])
    if '--status' in sys.argv:  # yalnız okur; düzenlemeyi kaydetmeden siler
        try:
            print('test kullanıcıları:', play.call('GET', f'{ps.API}/edits/{edit}/testers/{TRACK}'))
        except ps.ApiError as e:
            print('test kullanıcıları okunamadı:', e)
        play.call('DELETE', f'{ps.API}/edits/{edit}')
        return
    internal = next((t for t in tracks if t['track'] == 'internal'), None)
    codes = [int(c) for r in (internal or {}).get('releases', []) for c in r.get('versionCodes', [])]
    if not codes:
        sys.exit('dahili testte sürüm yok')
    vc = str(max(codes))
    release = {
        # Hiç yayınlanmamış (taslak) uygulamada API yalnız taslak sürüm kabul ediyor; ülke ve test
        # kullanıcıları seçildikten sonra Play Console'dan "İncelemeye gönder" ile tamamlanır.
        'name': f'1.0.0 ({vc})', 'versionCodes': [vc], 'status': 'draft',
        'releaseNotes': [{'language': k, 'text': v} for k, v in NOTES.items()],
    }
    # Ülke seçimi API'de yalnız kademeli sürümlerde var; kapalı testte Play Console'dan seçilir.
    play.call('PUT', f'{ps.API}/edits/{edit}/tracks/{TRACK}', body={'track': TRACK, 'releases': [release]})
    print(f'kapalı test: sürüm {vc} taslak olarak eklendi')
    if ps.production_has_pending(play, edit):
        # Üretimde bekleyen bir şey varsa onu da incelemeye taşımamak için gönderme
        play.call('POST', f'{ps.API}/edits/{edit}:commit', params={'changesNotSentForReview': 'true'})
        print('commit edildi (üretimde bekleyen sürüm var, incelemeye gönderilmedi)')
        return
    try:
        play.call('POST', f'{ps.API}/edits/{edit}:commit')
        print('commit: incelemeye gönderildi')
    except ps.ApiError as e:
        if ps.is_review_error(str(e)):
            play.call('POST', f'{ps.API}/edits/{edit}:commit', params={'changesNotSentForReview': 'true'})
            print('commit edildi; Play Console → Yayın özeti\'nden "İncelemeye gönder" gerekiyor')
        else:
            raise


if __name__ == '__main__':
    main()
