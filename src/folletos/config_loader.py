from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class FolletosBundle:
    rows: list[dict[str, Any]]


def load_folletos_bundle(project_root: Path) -> FolletosBundle:
    path = project_root / "data" / "folletos" / "precios_pdf_objetivo_folletos.json"
    with path.open("r", encoding="utf-8") as fh:
        payload = json.load(fh)
    rows = payload.get("rows", [])
    if not isinstance(rows, list) or not rows:
        raise ValueError("Folletos dataset inválido.")
    return FolletosBundle(rows=rows)
