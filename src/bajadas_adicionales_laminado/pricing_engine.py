"""Pricing engine for Laminado additionales v1 (isolated module)."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from .config_loader import LaminadoBundle
from .exceptions import QuoteInputError
from .trace import build_trace
from .types import LaminadoQuoteInput, LaminadoQuoteResult


class LaminadoAdicionalesPricingEngine:
    VALID_ADICIONALES = {"sin_adicional", "laca", "laminado_brillo", "laminado_mate"}
    VALID_URGENCIAS = {"normal", "express", "super_express", "ya_24hs"}

    def __init__(self, bundle: LaminadoBundle):
        self.bundle = bundle
        self.config = bundle.config
        self.urgencias = self.config["urgencias"]
        self.adicionales = self.config["adicionales"]
        self.escalas = self.config["escalas"]
        self.hoja = self.config["hoja_origen"]
        self.rango = self.config["rango_origen"]
        self.duplicado = self.config["duplicado_1001"]

    def quote(self, request: LaminadoQuoteInput) -> LaminadoQuoteResult:
        self._validate_request(request)
        rango_aplicado = self._derive_range(request.cantidad_unidades)
        recargo = float(self.urgencias[request.urgencia])

        info = self.adicionales[request.adicional]
        adicional_unit_sin = float(info["unitarios"][rango_aplicado])
        adicional_unit_con = round(adicional_unit_sin * (1.0 + recargo), 6)

        total_adicional_sin = round(adicional_unit_sin * request.cantidad_unidades, 6)
        total_adicional_con = round(total_adicional_sin * (1.0 + recargo), 6)

        total_base = self._resolve_total_base(request)
        total_comb_sin = None
        total_comb_con = None
        if total_base is not None:
            total_comb_sin = round(total_base + total_adicional_sin, 6)
            total_comb_con = round(total_comb_sin * (1.0 + recargo), 6)

        trace = build_trace(
            hoja_origen=self.hoja,
            rango_origen=self.rango,
            celda_origen=info["celdas"][rango_aplicado],
            formula_origen=info["formula"],
            escala=rango_aplicado,
            dependencias=info["dependencias"],
            duplicado_1001_estado=self.duplicado["estado"],
            duplicado_1001_resolucion=self.duplicado["resolucion_operativa"],
        )

        return LaminadoQuoteResult(
            adicional_unitario_sin_iva=round(adicional_unit_sin, 6),
            adicional_unitario_con_urgencia=adicional_unit_con,
            cantidad_unidades=request.cantidad_unidades,
            rango_aplicado=rango_aplicado,
            total_adicional_sin_iva=total_adicional_sin,
            total_adicional_con_urgencia=total_adicional_con,
            precio_unitario_base=request.precio_unitario_base,
            total_base=total_base,
            total_combinado_sin_iva=total_comb_sin,
            total_combinado_con_urgencia=total_comb_con,
            regla_aplicada=info["regla"],
            fuente="excel_laminado_readonly_a3plus",
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: LaminadoQuoteInput) -> dict[str, Any]:
        result = self.quote(request)
        payload = asdict(result)
        payload["trazabilidad"] = asdict(result.trazabilidad)
        return payload

    def _resolve_total_base(self, request: LaminadoQuoteInput) -> float | None:
        if request.total_base is not None:
            return float(request.total_base)
        if request.precio_unitario_base is not None:
            return float(request.precio_unitario_base) * request.cantidad_unidades
        return None

    def _derive_range(self, qty: int) -> str:
        for scale in self.escalas:
            low = int(scale["desde"])
            high = scale["hasta"]
            if high is None:
                if qty >= low:
                    return scale["etiqueta"]
            else:
                if low <= qty <= int(high):
                    return scale["etiqueta"]
        raise QuoteInputError("La cantidad ingresada no entra en ningún rango disponible para Laminado v1.")

    def _validate_request(self, request: LaminadoQuoteInput) -> None:
        if request.formato != "A3+":
            raise QuoteInputError("Formato inválido para Laminado v1. Solo A3+.")
        if request.cantidad_unidades <= 0:
            raise QuoteInputError("cantidad_unidades debe ser mayor a 0.")
        if request.urgencia not in self.VALID_URGENCIAS:
            raise QuoteInputError(f"Urgencia inválida: {request.urgencia}")
        if request.adicional not in self.VALID_ADICIONALES:
            raise QuoteInputError(f"Adicional inválido: {request.adicional}")
