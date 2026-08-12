"""
Sitenin verisi bir JSON API'den geliyorsa bu şablonu kopyalayıp
kendi site adına göre (ör. adapters/site_a.py) düzenle.

Gerçek endpoint'i ve alan adlarını bulmak için tarayıcıda F12 >
Network > Fetch/XHR sekmesini aç, kazananlar bölümü yenilendiğinde
hangi isteğin gittiğine ve JSON içindeki alan adlarına bak.
"""

import requests

from .base import Adapter, Win


class ExampleApiAdapter(Adapter):
    def fetch(self, url: str) -> list[Win]:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        wins = []
        for item in data.get("winners", []):
            wins.append(
                Win(
                    id=str(item["id"]),
                    game=item["gameName"],
                    amount_try=float(item["winAmount"]),
                )
            )
        return wins


def get_adapter() -> Adapter:
    return ExampleApiAdapter()
