"""Load and validate Autoadhesivas v1 config/data."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .exceptions import ConfigValidationError


@dataclass(frozen=True)
class AutoadhesivasBundle:
    config: dict[str, Any]
    objetivo_rows: list[dict[str, Any]]
    comparativa: dict[str, Any]
    trace_tree: dict[str, Any]


def _read_json(path: Path) -> Any:
    if not path.exists():
        raise ConfigValidationError(f"JSON no encontrado: {path}")
    with path.open("r", encoding="utf-8-sig") as fh:
        return json.load(fh)


def load_autoadhesivas_bundle(project_root: str | Path) -> AutoadhesivasBundle:
    root = Path(project_root)
    config = _read_json(root / "data" / "bajadas_autoadhesivas" / "autoadhesivas_v1_config.json")
    objetivo = _read_json(root / "data" / "bajadas_autoadhesivas" / "precios_autoadhesivas_objetivo.json")
    comparativa = _read_json(root / "data" / "bajadas_autoadhesivas" / "comparativa_autoadhesivas_modelo_b.json")
    trace_tree = _read_json(root / "data" / "bajadas_autoadhesivas" / "autoadhesivas_price_trace_tree.json")

    if not isinstance(objetivo, list) or not objetivo:
        raise ConfigValidationError("precios_autoadhesivas_objetivo.json inválido")
    if not isinstance(config.get("rangos"), list) or not config["rangos"]:
        raise ConfigValidationError("autoadhesivas_v1_config.json sin rangos")
    if "urgencias" not in config:
        raise ConfigValidationError("autoadhesivas_v1_config.json sin urgencias")

    return AutoadhesivasBundle(config=config, objetivo_rows=objetivo, comparativa=comparativa, trace_tree=trace_tree)
