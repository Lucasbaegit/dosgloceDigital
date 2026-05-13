from __future__ import annotations

from dataclasses import asdict
from typing import Any

from .config_loader import TarjetasPostalesBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import TarjetasPostalesQuoteInput, TarjetasPostalesQuoteResult


class TarjetasPostalesPricingEngine:
    VALID_CANTIDADES = {100, 200, 300, 500, 1000}
    VALID_TERMINACIONES = {"sin_laminar", "laca_uv", "laminado_brillo", "laminado_mate"}
    VALID_CARAS = {"4/0", "4/4"}
    VALID_URGENCIA = {"normal", "express", "super_express", "ya_24hs"}
    RECARGOS_URGENCIA = {"normal": 0.0, "express": 0.15, "super_express": 0.30, "ya_24hs": 0.50}

    def __init__(self, bundle: TarjetasPostalesBundle):
        self._index: dict[tuple[int, str, str], dict[str, Any]] = {}
        for row in bundle.rows:
            self._index[(int(row["cantidad_unidades"]), str(row["terminacion"]), str(row["caras"]))] = row

    def quote(self, request: TarjetasPostalesQuoteInput) -> TarjetasPostalesQuoteResult:
        self._validate(request)
        row = self._index.get((request.cantidad_unidades, request.terminacion, request.caras))
        if row is None:
            raise PriceNotFoundError("combinacion_no_encontrada")
        total = float(row["precio_total_sin_iva"])
        recargo = self.RECARGOS_URGENCIA[request.urgencia]
        total_u = round(total * (1 + recargo), 6)
        unit = round(total / request.cantidad_unidades, 6)
        unit_u = round(total_u / request.cantidad_unidades, 6)
        trace = {
            "rama": "tarjetas_postales",
            "origen_precio_final": "PDF página 12 - Tarjetas Postales",
            "origen_logico_excel": "Productos (histórico)",
            "motivo_override": "Excel histórico no reproduce PDF vigente.",
            "convencion_precio": "precio_total_por_paquete",
            "terminacion": request.terminacion,
            "caras": request.caras,
            "precio_objetivo_pdf": total,
            "recargo_urgencia_aplicado": recargo,
        }
        return TarjetasPostalesQuoteResult(
            precio_unitario_sin_iva=unit,
            precio_unitario_con_urgencia=unit_u,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=str(request.cantidad_unidades),
            total_sin_iva=total,
            total_con_urgencia=total_u,
            precio_sin_iva=unit,
            precio_con_recargo_urgencia=unit_u,
            regla_aplicada="TARJETAS_POSTALES_MATRIZ_PDF_P12",
            fuente="tarjetas_postales_pdf_pagina_12",
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: TarjetasPostalesQuoteInput) -> dict[str, Any]:
        return asdict(self.quote(request))

    def health(self) -> dict[str, Any]:
        return {"status": "ok", "rama": "tarjetas_postales", "combinaciones": len(self._index)}

    def _validate(self, request: TarjetasPostalesQuoteInput) -> None:
        if request.categoria != "Tarjetas Postales":
            raise QuoteInputError("categoria inválida")
        if request.producto != "postal":
            raise QuoteInputError("producto inválido")
        if request.formato != "postal":
            raise QuoteInputError("formato inválido")
        if request.papel not in {"300g Ilustración", "300g Ilustracion"}:
            raise QuoteInputError("papel inválido")
        if request.gramaje != "300g":
            raise QuoteInputError("gramaje inválido")
        if request.cantidad_unidades not in self.VALID_CANTIDADES:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if request.terminacion not in self.VALID_TERMINACIONES:
            raise QuoteInputError("terminacion_no_soportada")
        if request.caras not in self.VALID_CARAS:
            raise QuoteInputError("caras_no_soportadas")
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError("urgencia_invalida")
