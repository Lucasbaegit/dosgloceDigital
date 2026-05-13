"""Config loader for Tarjetas 9x5."""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Tarjetas9x5Bundle:
    rows: list[dict[str, Any]]


def load_tarjetas_9x5_bundle(project_root: Path) -> Tarjetas9x5Bundle:
    path = project_root / "data" / "tarjetas_9x5" / "precios_pdf_objetivo_tarjetas_9x5.json"
    with path.open("r", encoding="utf-8") as fh:
        payload = json.load(fh)
    rows = payload.get("rows", [])
    if not isinstance(rows, list) or not rows:
        raise ValueError("Tarjetas 9x5 dataset inválido: rows vacío.")
    return Tarjetas9x5Bundle(rows=rows)
