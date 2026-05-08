"""Route handlers for Bajadas v2 internal API."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from bajadas_v2 import BajadasV2PricingEngine, load_bajadas_v2_bundle
from bajadas_v2.exceptions import PriceNotFoundError, QuoteInputError

from .schemas import ApiValidationError, QuoteRequestSchema


class BajadasV2ApiService:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(project_root))
        self.config_path = project_root / "data" / "bajadas_v2" / "bajadas_v2_config_final.json"
        self.snapshot_path = project_root / "data" / "bajadas_v2" / "snapshots" / "bajadas_v2_metrics_snapshot.json"

    def health(self) -> dict[str, Any]:
        return {"status": "ok", "service": "bajadas_v2_api"}

    def bajadas_health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "checks": {
                "config_final_exists": self.config_path.exists(),
                "snapshot_exists": self.snapshot_path.exists(),
                "engine_import_ok": self.engine is not None,
            },
        }

    def metrics(self) -> dict[str, Any]:
        with self.snapshot_path.open("r", encoding="utf-8") as fh:
            snapshot = json.load(fh)
        estados = snapshot.get("conteo_estados", {})
        return {
            "OK": estados.get("OK", 0),
            "DIFERENCIA_LEVE": estados.get("DIFERENCIA_LEVE", 0),
            "DIFERENCIA_MEDIA": estados.get("DIFERENCIA_MEDIA", 0),
            "DIFERENCIA_ALTA": estados.get("DIFERENCIA_ALTA", 0),
            "SIN_COMPARACION": estados.get("SIN_COMPARACION", 0),
            "casos_regresion": snapshot.get("cantidad_casos_regresion"),
            "precio_fijo_csv": snapshot.get("cantidad_precio_fijo_csv"),
        }

    def cotizar(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = QuoteRequestSchema.from_payload(payload)
            result = self.engine.quote_as_dict(req.to_quote_input())
            return 200, result
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except QuoteInputError as exc:
            return 400, {"error": "urgencia_invalida", "detail": str(exc)}
        except PriceNotFoundError as exc:
            return 404, {"error": "combinacion_no_encontrada", "detail": str(exc)}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}
