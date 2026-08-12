import importlib

from .base import Adapter, Win

__all__ = ["Adapter", "Win", "load_adapter"]


def load_adapter(name: str) -> Adapter:
    module = importlib.import_module(f"adapters.{name}")
    return module.get_adapter()
