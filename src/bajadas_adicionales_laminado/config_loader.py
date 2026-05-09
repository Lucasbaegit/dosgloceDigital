"""Load laminado additional config."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .exceptions import ConfigValidationError


@dataclass(frozen=True)
class LaminadoBundle:
    config: dict[str, Any]


def _read_json(path: Path) -> Any:
    if not path.exists():
        raise ConfigValidationError(f"JSON no encontrado: {path}")
    with path.open("r", encoding="utf-8-sig") as fh:
        return json.load(fh)


def load_laminado_bundle(project_root: str | Path) -> LaminadoBundle:
    root = Path(project_root)
    config = _read_json(root / "data" / "bajadas_adicionales_laminado" / "laminado_v1_config.json")

    if config.get("version") != "laminado_v1":
        raise ConfigValidationError("version inválida en laminado_v1_config.json")
    if config.get("formato_base") != "A3+":
        raise ConfigValidationError("formato_base inválido; este módulo solo soporta A3+")
    if not isinstance(config.get("urgencias"), dict):
        raise ConfigValidationError("urgencias no configuradas")
    if not isinstance(config.get("adicionales"), dict):
        raise ConfigValidationError("adicionales no configurados")

    return LaminadoBundle(config=config)

