"""
Öğrenme amaçlı örnek adapter: GitHub'ın herkese açık Events API'sini
(https://api.github.com/events) gerçek bir "canlı akış + eşik bildirimi"
kaynağı olarak kullanır.

Bir bahis/casino sitesindeki "son kazananlar" akışıyla birebir aynı mantık:
- Sürekli yenilenen bir olay listesi
- Her olayın benzersiz bir kimliği (tekrar bildirmemek için)
- Bir "büyüklük" değeri (burada: bir push'taki commit sayısı; gerçek bir
  sitede: kazanç tutarı)

Not: GitHub Events API kimliksiz (unauthenticated) istekte saatte 60
istekle sınırlıdır, bu yüzden poll_interval_sec'i çok düşük tutma.
"""

import requests

from .base import Adapter, Win


class GithubEventsAdapter(Adapter):
    def fetch(self, url: str) -> list[Win]:
        response = requests.get(
            url,
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "kazanc-bildirim-bot-demo",
            },
            timeout=10,
        )
        response.raise_for_status()
        events = response.json()

        wins = []
        for event in events:
            if event.get("type") != "PushEvent":
                continue
            payload = event["payload"]
            # Genel API'de "size"/"distinct_size" gelir; bazı kısıtlı GitHub
            # App bağlamlarında gelmeyebilir, o yüzden "commits" listesine
            # de düşüyoruz.
            commit_count = (
                payload.get("size")
                or payload.get("distinct_size")
                or len(payload.get("commits", []))
                or 0
            )
            wins.append(
                Win(
                    id=event["id"],
                    game=event["repo"]["name"],
                    amount_try=float(commit_count),
                )
            )
        return wins


def get_adapter() -> Adapter:
    return GithubEventsAdapter()
