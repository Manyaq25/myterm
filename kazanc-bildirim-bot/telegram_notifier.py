import requests


class TelegramNotifier:
    def __init__(self, bot_token: str, chat_id: str):
        self._base_url = f"https://api.telegram.org/bot{bot_token}"
        self._chat_id = chat_id

    def send(self, text: str) -> None:
        response = requests.post(
            f"{self._base_url}/sendMessage",
            json={"chat_id": self._chat_id, "text": text},
            timeout=10,
        )
        response.raise_for_status()
