"""Schemas and validation for Bajadas v2 API."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from bajadas_v2.types import QuoteInput


class ApiValidationError(ValueError):
    """Validation error for API payloads."""


@dataclass(frozen=True)
class QuoteRequestSchema:
    categoria: str
    modo_color: str
    formato: str
    tipo_papel: str
    material: str
    gramaje: str
    cantidad_rango: str | None
    cantidad_unidades: int | None
    caras: str
    tipo_producto: str | None
    columna_precio: str | None
    terminacion: str | None
    urgencia: str
    adicional_laminado: str | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "QuoteRequestSchema":
        required = [
            "categoria",
            "modo_color",
            "formato",
            "tipo_papel",
            "material",
            "gramaje",
            "caras",
            "urgencia",
        ]
        missing = [key for key in required if key not in payload or payload[key] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")

        return cls(
            categoria=str(payload["categoria"]).strip(),
            modo_color=str(payload["modo_color"]).strip(),
            formato=str(payload["formato"]).strip(),
            tipo_papel=str(payload["tipo_papel"]).strip(),
            material=str(payload["material"]).strip(),
            gramaje=str(payload["gramaje"]).strip(),
            cantidad_rango=(
                None if payload.get("cantidad_rango") in (None, "") else str(payload.get("cantidad_rango")).strip()
            ),
            cantidad_unidades=cls._coerce_positive_int(payload.get("cantidad_unidades")),
            caras=str(payload["caras"]).strip(),
            tipo_producto=(
                None if payload.get("tipo_producto") in (None, "") else str(payload.get("tipo_producto")).strip()
            ),
            columna_precio=(
                None if payload.get("columna_precio") in (None, "") else str(payload.get("columna_precio")).strip()
            ),
            terminacion=(None if payload.get("terminacion") in ("", None) else str(payload.get("terminacion"))),
            urgencia=str(payload["urgencia"]).strip().lower(),
            adicional_laminado=(
                None
                if payload.get("adicional_laminado") in (None, "")
                else str(payload.get("adicional_laminado")).strip().lower()
            ),
        )

    def to_quote_input(self) -> QuoteInput:
        return QuoteInput(
            categoria=self.categoria,
            modo_color=self.modo_color,
            formato=self.formato,
            tipo_papel=self.tipo_papel,
            material=self.material,
            gramaje=self.gramaje,
            cantidad_rango=self.cantidad_rango or "",
            cantidad_unidades=self.cantidad_unidades,
            caras=self.caras,
            terminacion=self.terminacion,
            urgencia=self.urgencia,
        )

    @staticmethod
    def _coerce_positive_int(value: Any) -> int | None:
        if value in ("", None):
            return None
        try:
            parsed = int(value)
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser un entero positivo.") from exc
        if parsed < 1:
            raise ApiValidationError("cantidad_unidades debe ser mayor o igual a 1.")
        return parsed
