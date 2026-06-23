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
    caras_adicional_laminado: int | None
    adicional_laminado_por_lado: str | None
    adicional_plastificado: bool | None
    adicional_tinta_blanca: bool | None
    adicional_laca_uv: bool | None
    adicional_troquelado: bool | None
    complejidad_troquelado: str | None

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
            caras_adicional_laminado=(
                None
                if payload.get("caras_adicional_laminado") in (None, "")
                else cls._coerce_adicional_caras(payload.get("caras_adicional_laminado"))
            ),
            adicional_laminado_por_lado=(
                None
                if payload.get("adicional_laminado_por_lado") in (None, "")
                else str(payload.get("adicional_laminado_por_lado")).strip().lower()
            ),
            adicional_plastificado=(
                None
                if "adicional_plastificado" not in payload
                else cls._coerce_bool(payload.get("adicional_plastificado"), "adicional_plastificado")
            ),
            adicional_tinta_blanca=(
                None
                if "adicional_tinta_blanca" not in payload
                else cls._coerce_bool(payload.get("adicional_tinta_blanca"), "adicional_tinta_blanca")
            ),
            adicional_laca_uv=(
                None
                if "adicional_laca_uv" not in payload
                else cls._coerce_bool(payload.get("adicional_laca_uv"), "adicional_laca_uv")
            ),
            adicional_troquelado=(
                None
                if "adicional_troquelado" not in payload
                else cls._coerce_bool(payload.get("adicional_troquelado"), "adicional_troquelado")
            ),
            complejidad_troquelado=(
                None
                if payload.get("complejidad_troquelado") in (None, "")
                else str(payload.get("complejidad_troquelado")).strip().lower()
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

    @staticmethod
    def _coerce_bool(value: Any, field: str) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"true", "1", "si", "sí", "yes"}:
                return True
            if normalized in {"false", "0", "no"}:
                return False
        raise ApiValidationError(f"{field} debe ser booleano.")

    @staticmethod
    def _coerce_adicional_caras(value: Any) -> int:
        try:
            parsed = int(value)
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("caras_adicional_laminado debe ser 1 o 2.") from exc
        if parsed not in {1, 2}:
            raise ApiValidationError("caras_adicional_laminado debe ser 1 o 2.")
        return parsed


@dataclass(frozen=True)
class Tarjetas9x5QuoteRequestSchema:
    categoria: str
    producto: str
    formato: str
    papel: str
    gramaje: str
    terminacion: str
    caras: str
    cantidad_unidades: int
    urgencia: str
    terminaciones_extra: dict[str, bool] | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "Tarjetas9x5QuoteRequestSchema":
        required = [
            "categoria",
            "producto",
            "formato",
            "papel",
            "gramaje",
            "terminacion",
            "caras",
            "cantidad_unidades",
            "urgencia",
        ]
        missing = [key for key in required if key not in payload or payload[key] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")

        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc

        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            formato=str(payload["formato"]).strip(),
            papel=str(payload["papel"]).strip(),
            gramaje=str(payload["gramaje"]).strip(),
            terminacion=str(payload["terminacion"]).strip().lower(),
            caras=str(payload["caras"]).strip(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
            terminaciones_extra=(payload.get("terminaciones_extra") if isinstance(payload.get("terminaciones_extra"), dict) else None),
        )


@dataclass(frozen=True)
class TarjetasPostalesQuoteRequestSchema:
    categoria: str
    producto: str
    formato: str
    papel: str
    gramaje: str
    terminacion: str
    caras: str
    cantidad_unidades: int
    urgencia: str
    terminaciones_extra: dict[str, bool] | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "TarjetasPostalesQuoteRequestSchema":
        required = ["categoria", "producto", "formato", "papel", "gramaje", "terminacion", "caras", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            formato=str(payload["formato"]).strip(),
            papel=str(payload["papel"]).strip(),
            gramaje=str(payload["gramaje"]).strip(),
            terminacion=str(payload["terminacion"]).strip().lower(),
            caras=str(payload["caras"]).strip(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
            terminaciones_extra=(payload.get("terminaciones_extra") if isinstance(payload.get("terminaciones_extra"), dict) else None),
        )


@dataclass(frozen=True)
class FolletosQuoteRequestSchema:
    categoria: str
    producto: str
    formato: str
    papel: str
    gramaje: str
    modo_color: str
    caras: str
    cantidad_unidades: int
    urgencia: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "FolletosQuoteRequestSchema":
        required = ["categoria", "producto", "formato", "papel", "gramaje", "modo_color", "caras", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            formato=str(payload["formato"]).strip(),
            papel=str(payload["papel"]).strip(),
            gramaje=str(payload["gramaje"]).strip(),
            modo_color=str(payload["modo_color"]).strip().lower(),
            caras=str(payload["caras"]).strip(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
        )


@dataclass(frozen=True)
class CarpetasQuoteRequestSchema:
    categoria: str
    producto: str
    formato: str
    papel: str
    gramaje: str
    terminacion: str
    caras: str
    cantidad_unidades: int
    solapa_impresa: bool
    urgencia: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "CarpetasQuoteRequestSchema":
        required = [
            "categoria",
            "producto",
            "formato",
            "papel",
            "gramaje",
            "terminacion",
            "caras",
            "cantidad_unidades",
            "urgencia",
        ]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            formato=str(payload["formato"]).strip(),
            papel=str(payload["papel"]).strip(),
            gramaje=str(payload["gramaje"]).strip(),
            terminacion=str(payload["terminacion"]).strip().lower(),
            caras=str(payload["caras"]).strip(),
            cantidad_unidades=qty,
            solapa_impresa=bool(payload.get("solapa_impresa", False)),
            urgencia=str(payload["urgencia"]).strip().lower(),
        )


@dataclass(frozen=True)
class SobresQuoteRequestSchema:
    categoria: str
    producto: str
    tipo_sobre: str
    papel: str
    color: str
    caras: str
    cantidad_unidades: int
    urgencia: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "SobresQuoteRequestSchema":
        required = ["categoria", "producto", "tipo_sobre", "papel", "color", "caras", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            tipo_sobre=str(payload["tipo_sobre"]).strip(),
            papel=str(payload["papel"]).strip(),
            color=str(payload["color"]).strip().lower(),
            caras=str(payload["caras"]).strip(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
        )


@dataclass(frozen=True)
class StickersCorteRectoQuoteRequestSchema:
    categoria: str
    producto: str
    formato: str
    terminacion: str
    cantidad_unidades: int
    urgencia: str
    modo_precio: str | None = None
    variables_override: dict[str, Any] | None = None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "StickersCorteRectoQuoteRequestSchema":
        required = ["categoria", "producto", "formato", "terminacion", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            formato=str(payload["formato"]).strip(),
            terminacion=str(payload["terminacion"]).strip().lower(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
            modo_precio=(
                None if payload.get("modo_precio") in (None, "") else str(payload.get("modo_precio")).strip().lower()
            ),
            variables_override=(
                payload.get("variables_override") if isinstance(payload.get("variables_override"), dict) else None
            ),
        )


@dataclass(frozen=True)
class ImanesCorteRectoQuoteRequestSchema:
    categoria: str
    producto: str
    formato: str
    papel: str
    gramaje: str
    terminacion: str
    cantidad_unidades: int
    urgencia: str
    modo_precio: str | None = None
    variables_override: dict[str, Any] | None = None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "ImanesCorteRectoQuoteRequestSchema":
        required = ["categoria", "producto", "formato", "papel", "gramaje", "terminacion", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            formato=str(payload["formato"]).strip(),
            papel=str(payload["papel"]).strip(),
            gramaje=str(payload["gramaje"]).strip(),
            terminacion=str(payload["terminacion"]).strip().lower(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
            modo_precio=(
                None if payload.get("modo_precio") in (None, "") else str(payload.get("modo_precio")).strip().lower()
            ),
            variables_override=(
                payload.get("variables_override") if isinstance(payload.get("variables_override"), dict) else None
            ),
        )


@dataclass(frozen=True)
class StickersCircularesQuoteRequestSchema:
    categoria: str
    producto: str
    material: str
    formato: str
    terminacion: str
    cantidad_unidades: int
    urgencia: str
    modo_precio: str | None
    variables_override: dict[str, Any] | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "StickersCircularesQuoteRequestSchema":
        required = ["categoria", "producto", "material", "formato", "terminacion", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            material=str(payload["material"]).strip(),
            formato=str(payload["formato"]).strip(),
            terminacion=str(payload["terminacion"]).strip().lower(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
            modo_precio=(
                None if payload.get("modo_precio") in (None, "") else str(payload.get("modo_precio")).strip().lower()
            ),
            variables_override=(
                payload.get("variables_override") if isinstance(payload.get("variables_override"), dict) else None
            ),
        )


@dataclass(frozen=True)
class TroqueladoDigitalQuoteRequestSchema:
    categoria: str
    producto: str
    familia_tamano: str
    cantidad_unidades: int
    urgencia: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "TroqueladoDigitalQuoteRequestSchema":
        required = ["categoria", "producto", "familia_tamano", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            familia_tamano=str(payload["familia_tamano"]).strip(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
        )


@dataclass(frozen=True)
class TarjetasTroqueladasCircularesQuoteRequestSchema:
    categoria: str
    producto: str
    formato: str
    caras: str
    cantidad_unidades: int
    urgencia: str
    adicional_laminado: str | None
    caras_adicional_laminado: int | None

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "TarjetasTroqueladasCircularesQuoteRequestSchema":
        required = ["categoria", "producto", "formato", "caras", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        caras_adic: int | None = None
        if payload.get("caras_adicional_laminado") not in (None, ""):
            try:
                caras_adic = int(payload.get("caras_adicional_laminado"))
            except (TypeError, ValueError) as exc:
                raise ApiValidationError("caras_adicional_laminado debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            formato=str(payload["formato"]).strip(),
            caras=str(payload["caras"]).strip(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
            adicional_laminado=(
                None if payload.get("adicional_laminado") in (None, "") else str(payload.get("adicional_laminado")).strip().lower()
            ),
            caras_adicional_laminado=caras_adic,
        )


@dataclass(frozen=True)
class PlanchaImanImpresoQuoteRequestSchema:
    categoria: str
    producto: str
    variante: str
    cantidad_unidades: int
    urgencia: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "PlanchaImanImpresoQuoteRequestSchema":
        required = ["categoria", "producto", "variante", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("cantidad_unidades debe ser entero.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            variante=str(payload["variante"]).strip(),
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
        )


@dataclass(frozen=True)
class AgendasCuadernosQuoteRequestSchema:
    categoria: str
    producto: str
    formato: str
    paginas: int
    cantidad_unidades: int
    urgencia: str

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> "AgendasCuadernosQuoteRequestSchema":
        required = ["categoria", "producto", "formato", "paginas", "cantidad_unidades", "urgencia"]
        missing = [k for k in required if k not in payload or payload[k] in (None, "")]
        if missing:
            raise ApiValidationError(f"Campos faltantes: {', '.join(missing)}")
        try:
            paginas = int(payload["paginas"])
            qty = int(payload["cantidad_unidades"])
        except (TypeError, ValueError) as exc:
            raise ApiValidationError("paginas y cantidad_unidades deben ser enteros.") from exc
        return cls(
            categoria=str(payload["categoria"]).strip(),
            producto=str(payload["producto"]).strip(),
            formato=str(payload["formato"]).strip(),
            paginas=paginas,
            cantidad_unidades=qty,
            urgencia=str(payload["urgencia"]).strip().lower(),
        )
