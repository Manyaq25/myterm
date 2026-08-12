"""
Sitenin verisi sadece HTML içine gömülüyorsa (API/websocket bulunamadıysa)
bu şablonu kopyalayıp kendi site adına göre düzenle.

CSS seçicilerini (select) sitenin gerçek HTML yapısına göre değiştir.
Bu yöntem en kırılgan olanıdır: site tasarımı değişirse adapter'ı
güncellemen gerekir.
"""

import hashlib

import requests
from bs4 import BeautifulSoup

from .base import Adapter, Win


class ExampleHtmlAdapter(Adapter):
    def fetch(self, url: str) -> list[Win]:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        wins = []
        for row in soup.select(".winners-list .winner-row"):
            game = row.select_one(".game-name").get_text(strip=True)
            amount_text = row.select_one(".win-amount").get_text(strip=True)
            amount_try = float(
                amount_text.replace("TL", "").replace(".", "").replace(",", ".").strip()
            )

            # Sitede sabit bir ID yoksa oyun+tutar birleşiminden üretiyoruz
            row_id = hashlib.sha1(f"{game}-{amount_try}".encode()).hexdigest()
            wins.append(Win(id=row_id, game=game, amount_try=amount_try))
        return wins


def get_adapter() -> Adapter:
    return ExampleHtmlAdapter()
