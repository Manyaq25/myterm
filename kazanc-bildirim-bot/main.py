import os
import time

import yaml
from dotenv import load_dotenv

from adapters import load_adapter
from state import is_seen, load_state, mark_seen, save_state
from telegram_notifier import TelegramNotifier


def format_message(site_name: str, game: str, amount_try: float) -> str:
    return f"{site_name}: {game}, {amount_try:,.0f} TL".replace(",", ".")


def run(config_path: str = "config.yaml") -> None:
    load_dotenv()

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    notifier = TelegramNotifier(
        bot_token=os.environ["TELEGRAM_BOT_TOKEN"],
        chat_id=os.environ["TELEGRAM_CHAT_ID"],
    )

    sites = config["sites"]
    state_path = config.get("state_file", "seen_wins.json")
    state = load_state(state_path)

    adapters = {site["name"]: load_adapter(site["adapter"]) for site in sites}
    last_polled = {site["name"]: 0.0 for site in sites}

    print(f"{len(sites)} site izleniyor. Çıkmak için Ctrl+C.")

    while True:
        now = time.monotonic()
        for site in sites:
            name = site["name"]
            if now - last_polled[name] < site["poll_interval_sec"]:
                continue
            last_polled[name] = now

            try:
                wins = adapters[name].fetch(site["url"])
            except Exception as exc:
                print(f"[{name}] veri çekilemedi: {exc}")
                continue

            for win in wins:
                if is_seen(state, name, win.id):
                    continue
                mark_seen(state, name, win.id)

                if win.amount_try >= site["threshold_try"]:
                    text = format_message(name, win.game, win.amount_try)
                    try:
                        notifier.send(text)
                        print(f"Bildirildi: {text}")
                    except Exception as exc:
                        print(f"[{name}] Telegram gönderimi başarısız: {exc}")

            save_state(state_path, state)

        time.sleep(1)


if __name__ == "__main__":
    run()
