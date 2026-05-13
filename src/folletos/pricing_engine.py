from __future__ import annotations

from dataclasses import asdict
from typing import Any

from .config_loader import FolletosBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import FolletosQuoteInput, FolletosQuoteResult


class FolletosPricingEngine:
    VALID_CANTIDADES = {100, 200, 300, 500, 1000}
    VALID_FORMATOS = {"10x10", "10x15", "15x21", "A4"}
    VALID_URGENCIA = {"normal", "express", "super_express", "ya_24hs"}
    VALID_MODO_COLOR = {"fullcolor", "escala_grises"}
    CARAS_FULL = {"4/0", "4/4"}
    CARAS_GRAY = {"1/0", "1/1"}
    RECARGOS_URGENCIA = {"normal": 0.0, "express": 0.15, "super_express": 0.30, "ya_24hs": 0.50}

    def __init__(self, bundle: FolletosBundle):
        self._index: dict[tuple[str, str, str, int, str], dict[str, Any]] = {}
        for row in bundle.rows:
            key = (
                str(row["papel"]),
                str(row["modo_color"]),
                str(row["formato"]),
                int(row["cantidad_unidades"]),
                str(row["caras"]),
            )
            self._index[key] = row

    def quote(self, request: FolletosQuoteInput) -> FolletosQuoteResult:
        self._validate(request)
        key = (request.papel, request.modo_color, request.formato, request.cantidad_unidades, request.caras)
        row = self._index.get(key)
        if row is None:
            raise PriceNotFoundError("combinacion_no_encontrada")
        total = float(row["precio_total_sin_iva"])
        recargo = self.RECARGOS_URGENCIA[request.urgencia]
        total_u = round(total * (1 + recargo), 6)
        unit = round(total / request.cantidad_unidades, 6)
        unit_u = round(total_u / request.cantidad_unidades, 6)
        trace = {
            "rama": "folletos",
            "origen_precio_final": "PDF página 13 - Folletos",
            "origen_logico_excel": "Productos (histórico)",
            "motivo_override": "Excel histórico no reproduce PDF vigente.",
            "convencion_precio": "precio_total_por_paquete",
            "papel": request.papel,
            "modo_color": request.modo_color,
            "formato": request.formato,
            "caras": request.caras,
            "recargo_urgencia_aplicado": recargo,
            "precio_objetivo_pdf": total,
        }
        return FolletosQuoteResult(
            precio_unitario_sin_iva=unit,
            precio_unitario_con_urgencia=unit_u,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=str(request.cantidad_unidades),
            total_sin_iva=total,
            total_con_urgencia=total_u,
            precio_sin_iva=unit,
            precio_con_recargo_urgencia=unit_u,
            regla_aplicada="FOLLETOS_MATRIZ_PDF_P13",
            fuente="folletos_pdf_pagina_13",
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: FolletosQuoteInput) -> dict[str, Any]:
        return asdict(self.quote(request))

    def health(self) -> dict[str, Any]:
        return {"status": "ok", "rama": "folletos", "combinaciones": len(self._index)}

    def _validate(self, request: FolletosQuoteInput) -> None:
        if request.categoria != "Folletos":
            raise QuoteInputError("categoria inválida")
        if request.producto != "folleto":
            raise QuoteInputError("producto inválido")
        if request.formato not in self.VALID_FORMATOS:
            raise QuoteInputError("formato_no_soportado")
        if request.modo_color not in self.VALID_MODO_COLOR:
            raise QuoteInputError("modo_color_invalido")
        if request.cantidad_unidades not in self.VALID_CANTIDADES:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError("urgencia_invalida")
        if request.modo_color == "fullcolor" and request.caras not in self.CARAS_FULL:
            raise QuoteInputError("caras_no_compatibles")
        if request.modo_color == "escala_grises" and request.caras not in self.CARAS_GRAY:
            raise QuoteInputError("caras_no_compatibles")
        valid_papers = {"150g Ilustracion": "150g", "80g Ilustracion": "80g"}
        if request.papel not in valid_papers:
            raise QuoteInputError("papel_invalido")
        if request.gramaje != valid_papers[request.papel]:
            raise QuoteInputError("gramaje_invalido")
