"""Pricing engine for Tarjetas Personales 9x5."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from .config_loader import Tarjetas9x5Bundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .trace import build_trace
from .types import Tarjetas9x5QuoteInput, Tarjetas9x5QuoteResult


class Tarjetas9x5PricingEngine:
    VALID_CANTIDADES = {100, 200, 300, 500, 1000}
    VALID_TERMINACIONES = {"sin_laminar", "laca_uv", "laminado_brillo", "laminado_mate"}
    VALID_CARAS = {"4/0", "4/4"}
    VALID_URGENCIA = {"normal", "express", "super_express", "ya_24hs"}
    RECARGOS_URGENCIA = {"normal": 0.0, "express": 0.15, "super_express": 0.30, "ya_24hs": 0.50}
    RECARGO_350G = 0.10
    TERMINACIONES_EXTRA_SIN_DATOS = ("puntas_redondeadas", "agujerado")

    def __init__(self, bundle: Tarjetas9x5Bundle):
        self.bundle = bundle
        self._index: dict[tuple[int, str, str], dict[str, Any]] = {}
        for row in bundle.rows:
            key = (int(row["cantidad_unidades"]), str(row["terminacion"]), str(row["caras"]))
            self._index[key] = row

    def quote(self, request: Tarjetas9x5QuoteInput) -> Tarjetas9x5QuoteResult:
        self._validate_request(request)
        key = (request.cantidad_unidades, request.terminacion, request.caras)
        row = self._index.get(key)
        if row is None:
            if request.cantidad_unidades not in self.VALID_CANTIDADES:
                raise PriceNotFoundError("cantidad_fuera_de_matriz")
            if request.terminacion not in self.VALID_TERMINACIONES:
                raise PriceNotFoundError("terminacion_no_soportada")
            if request.caras not in self.VALID_CARAS:
                raise PriceNotFoundError("caras_no_soportadas")
            raise PriceNotFoundError("combinacion_no_encontrada")

        total_base_300g = float(row["precio_total_sin_iva"])
        total_base = (
            round(total_base_300g * (1.0 + self.RECARGO_350G), 6)
            if request.gramaje == "350g"
            else total_base_300g
        )
        recargo = float(self.RECARGOS_URGENCIA[request.urgencia])
        total_urgencia = round(total_base * (1.0 + recargo), 6)
        unit_base = round(total_base / request.cantidad_unidades, 6)
        unit_urgencia = round(total_urgencia / request.cantidad_unidades, 6)

        trace = build_trace(request, row, recargo)
        trace["gramaje_trazabilidad"] = {
            "gramaje_base": "300g",
            "gramaje_solicitado": request.gramaje,
            "recargo_350g_pct": self.RECARGO_350G if request.gramaje == "350g" else 0.0,
            "precio_base_300g": total_base_300g,
            "precio_calculado_gramaje": total_base,
            "fuente_regla_350g": "regla_comercial_aprobada_10pct",
        }
        trace["terminaciones_extra"] = {
            "estado": "bloqueadas_por_falta_de_datos",
            "terminaciones_solicitadas": request.terminaciones_extra or {},
            "codigo_bloqueo": "terminacion_extra_bloqueada_por_falta_de_datos",
        }

        return Tarjetas9x5QuoteResult(
            precio_unitario_sin_iva=unit_base,
            precio_unitario_con_urgencia=unit_urgencia,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=str(request.cantidad_unidades),
            total_sin_iva=total_base,
            total_con_urgencia=total_urgencia,
            precio_sin_iva=unit_base,
            precio_con_recargo_urgencia=unit_urgencia,
            regla_aplicada="TARJETAS_9X5_MATRIZ_PDF_P12",
            fuente="tarjetas_9x5_pdf_pagina_12",
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: Tarjetas9x5QuoteInput) -> dict[str, Any]:
        return asdict(self.quote(request))

    def health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "rama": "tarjetas_9x5",
            "fuente": "pdf_pagina_12",
            "combinaciones": len(self._index),
        }

    def _validate_request(self, request: Tarjetas9x5QuoteInput) -> None:
        if request.categoria != "Tarjetas Personales":
            raise QuoteInputError("categoria invalida para Tarjetas 9x5.")
        if request.producto != "9x5":
            raise QuoteInputError("producto invalido para Tarjetas 9x5.")
        if request.formato not in {"9x5", "90x50"}:
            raise QuoteInputError("formato invalido para Tarjetas 9x5.")
        if request.papel not in {"300g Ilustracion", "300g Ilustración", "350g Ilustracion", "350g Ilustración"}:
            raise QuoteInputError("papel invalido para Tarjetas 9x5.")
        if request.gramaje not in {"300g", "350g"}:
            raise QuoteInputError("gramaje invalido para Tarjetas 9x5.")
        if request.cantidad_unidades not in self.VALID_CANTIDADES:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if request.terminacion not in self.VALID_TERMINACIONES:
            raise QuoteInputError("terminacion_no_soportada")
        if request.caras not in self.VALID_CARAS:
            raise QuoteInputError("caras_no_soportadas")
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError(f"urgencia_invalida: {request.urgencia}")
        if request.terminaciones_extra and any(
            bool(request.terminaciones_extra.get(key)) for key in self.TERMINACIONES_EXTRA_SIN_DATOS
        ):
            raise QuoteInputError("terminacion_extra_bloqueada_por_falta_de_datos")
