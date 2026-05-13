"""Load editable-like commercial variable files (read-only for now)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class PricingVariablesBundle:
    config_variables_base: dict[str, Any]
    papeles: dict[str, Any]
    clicks: dict[str, Any]
    terminaciones: dict[str, Any]
    multiplicadores: dict[str, Any]


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_pricing_variables_bundle(project_root: Path) -> PricingVariablesBundle:
    base = project_root / "data" / "variables_comerciales"
    return PricingVariablesBundle(
        config_variables_base=_load_json(base / "config_variables_base.json"),
        papeles=_load_json(base / "papeles.json"),
        clicks=_load_json(base / "clicks.json"),
        terminaciones=_load_json(base / "terminaciones.json"),
        multiplicadores=_load_json(base / "multiplicadores.json"),
    )

