from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class TarjetasPostalesBundle:
    rows: list[dict[str, Any]]


def load_tarjetas_postales_bundle(project_root: Path) -> TarjetasPostalesBundle:
    path = project_root / "data" / "tarjetas_postales" / "precios_pdf_objetivo_tarjetas_postales.json"
    with path.open("r", encoding="utf-8") as fh:
        payload = json.load(fh)
    rows = payload.get("rows", [])
    if not isinstance(rows, list) or not rows:
        raise ValueError("Tarjetas Postales dataset inválido.")
    return TarjetasPostalesBundle(rows=rows)
