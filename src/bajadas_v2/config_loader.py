"""Load and validate Bajadas v2 production configuration."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .exceptions import ConfigValidationError


@dataclass(frozen=True)
class BajadasV2Bundle:
    config: dict[str, Any]
    comparativa_final: dict[str, Any]
    precios_objetivo: dict[str, Any]


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise ConfigValidationError(f"JSON no encontrado: {path}")
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def load_bajadas_v2_bundle(project_root: str | Path) -> BajadasV2Bundle:
    root = Path(project_root)
    config = _read_json(root / "data" / "bajadas_v2" / "bajadas_v2_config_final.json")
    comparativa = _read_json(root / "data" / "bajadas_v2" / "comparativa_bajadas_v2_final.json")
    objetivo = _read_json(root / "data" / "bajadas_v2" / "precios_pdf_objetivo_validado.json")
    _validate_minimum_contract(config, comparativa, objetivo)
    return BajadasV2Bundle(config=config, comparativa_final=comparativa, precios_objetivo=objetivo)


def _validate_minimum_contract(
    config: dict[str, Any], comparativa: dict[str, Any], objetivo: dict[str, Any]
) -> None:
    required_config = [
        "base_formato",
        "factor_xa3",
        "modelo_base",
        "recargos_urgencia",
        "regla_especial_xl_byn",
        "precios_fijos_csv",
    ]
    for key in required_config:
        if key not in config:
            raise ConfigValidationError(f"Falta clave en config final: {key}")

    if "comparativa" not in comparativa or not isinstance(comparativa["comparativa"], list):
        raise ConfigValidationError("comparativa_bajadas_v2_final.json inválido: falta lista 'comparativa'")

    if "metricas_finales" not in comparativa:
        raise ConfigValidationError("comparativa_bajadas_v2_final.json inválido: falta 'metricas_finales'")

    if "validacion_integridad" not in objetivo:
        raise ConfigValidationError("precios_pdf_objetivo_validado.json inválido: falta 'validacion_integridad'")
