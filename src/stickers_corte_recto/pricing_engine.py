from __future__ import annotations

from dataclasses import asdict
from typing import Any

from pricing_trace import build_pdf_matrix_trace

from .config_loader import StickersCorteRectoBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import StickersCorteRectoQuoteInput, StickersCorteRectoQuoteResult


class StickersCorteRectoPricingEngine:
    VALID_CANTIDADES = {100, 200, 300, 500, 1000}
    VALID_FORMATOS = {"6x4", "7x5", "9x5", "10x7"}
    VALID_TERMINACIONES = {"sin_laca_uv", "con_laca_uv"}
    VALID_URGENCIA = {"normal", "express", "super_express", "ya_24hs"}
    RECARGOS_URGENCIA = {"normal": 0.0, "express": 0.15, "super_express": 0.30, "ya_24hs": 0.50}

    def __init__(self, bundle: StickersCorteRectoBundle):
        self._index: dict[tuple[int, str, str], dict[str, Any]] = {}
        for row in bundle.rows:
            self._index[(int(row["cantidad_unidades"]), str(row["formato"]), str(row["terminacion"]))] = row

    def quote(self, request: StickersCorteRectoQuoteInput) -> StickersCorteRectoQuoteResult:
        self._validate(request)
        row = self._index.get((request.cantidad_unidades, request.formato, request.terminacion))
        if row is None:
            raise PriceNotFoundError("combinacion_no_encontrada")
        total = float(row["precio_total_sin_iva"])
        recargo = self.RECARGOS_URGENCIA[request.urgencia]
        total_u = round(total * (1 + recargo), 6)
        unit = round(total / request.cantidad_unidades, 6)
        unit_u = round(total_u / request.cantidad_unidades, 6)
        trace = build_pdf_matrix_trace(
            rama="stickers_corte_recto",
            fuente_precio_final="PDF página 15 - Stickers Corte Recto",
            fuente_logica_excel="Productos (histórico, referencia)",
            motivo_override="Excel histórico no reproduce PDF vigente.",
            precio_pdf_objetivo=total,
            precio_unitario_derivado=unit,
            cantidad_unidades=request.cantidad_unidades,
            variables_detectadas=[
                "papel_300g_ilustracion",
                "click_color",
                "laca_uv",
                "corte_recto",
                "coeficiente_tamano",
                "coeficiente_cantidad",
                "multiplicador_comercial",
                "factor_ajuste_pdf",
            ],
            variables_usadas={
                "formato": request.formato,
                "terminacion": request.terminacion,
                "cantidad_unidades": request.cantidad_unidades,
            },
            recargo_urgencia_aplicado=recargo,
            extras={"convencion_precio": "precio_total_por_paquete"},
        )
        return StickersCorteRectoQuoteResult(
            precio_unitario_sin_iva=unit,
            precio_unitario_con_urgencia=unit_u,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=str(request.cantidad_unidades),
            total_sin_iva=total,
            total_con_urgencia=total_u,
            precio_sin_iva=unit,
            precio_con_recargo_urgencia=unit_u,
            regla_aplicada="STICKERS_CORTE_RECTO_MATRIZ_PDF_P15",
            fuente="stickers_corte_recto_pdf_pagina_15",
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: StickersCorteRectoQuoteInput) -> dict[str, Any]:
        return asdict(self.quote(request))

    def health(self) -> dict[str, Any]:
        return {"status": "ok", "rama": "stickers_corte_recto", "combinaciones": len(self._index)}

    def _validate(self, request: StickersCorteRectoQuoteInput) -> None:
        if request.categoria != "Stickers Corte Recto":
            raise QuoteInputError("categoria inválida")
        if request.producto != "sticker_corte_recto":
            raise QuoteInputError("producto inválido")
        if request.formato not in self.VALID_FORMATOS:
            raise QuoteInputError("formato_no_soportado")
        if request.terminacion not in self.VALID_TERMINACIONES:
            raise QuoteInputError("terminacion_no_soportada")
        if request.cantidad_unidades not in self.VALID_CANTIDADES:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError("urgencia_invalida")
