from dataclasses import dataclass


@dataclass(frozen=True)
class Win:
    id: str          # aynı kazancı tekrar bildirmemek için benzersiz kimlik
    game: str
    amount_try: float


class Adapter:
    """Her site adapter'ı bu arayüzü uygular: fetch(url) -> list[Win]"""

    def fetch(self, url: str) -> list[Win]:
        raise NotImplementedError
