"""EAS iOS kimlik bilgilerini (dağıtım sertifikası + mağaza profili) etkileşimli
komutu otomatik yanıtlayarak hazırlar. Yalnız GitHub Actions'ta, App Store Connect
API anahtarıyla çalışır (EXPO_ASC_* ortam değişkenleri). Bildirim (push) kurulmaz.
"""
import sys

import pexpect

cmd = 'eas credentials:configure-build --platform ios --profile production'
child = pexpect.spawn(cmd, encoding='utf-8', timeout=600, dimensions=(50, 200))
child.logfile_read = sys.stdout

YES_NO = r'\((?:Y/n|y/N)\)'
SELECT = r'›'
while True:
    i = child.expect([YES_NO, r'\? .*›', pexpect.EOF, pexpect.TIMEOUT])
    seen = (child.before or '').lower()[-400:]
    if i == 0:
        answer = 'n' if ('push' in seen or 'notification' in seen) else 'y'
        child.sendline(answer)
    elif i == 1:
        child.send('\r')  # listede varsayılan (ilk) seçenek
    else:
        break

child.close()
sys.exit(child.exitstatus or 0)
