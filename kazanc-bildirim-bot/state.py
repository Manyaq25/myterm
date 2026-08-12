import json
import os

MAX_SEEN_PER_SITE = 300


def load_state(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(path: str, state: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def mark_seen(state: dict, site_name: str, win_id: str) -> None:
    seen = state.setdefault(site_name, [])
    seen.append(win_id)
    if len(seen) > MAX_SEEN_PER_SITE:
        del seen[: len(seen) - MAX_SEEN_PER_SITE]


def is_seen(state: dict, site_name: str, win_id: str) -> bool:
    return win_id in state.get(site_name, [])
