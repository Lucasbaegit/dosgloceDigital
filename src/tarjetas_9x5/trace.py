"""Trace helpers for Tarjetas 9x5."""

from __future__ import annotations

from typing import Any

from pricing_trace import build_pdf_matrix_trace

from .types import Tarjetas9x5QuoteInput


def build_trace(request: Tarjetas9x5QuoteInput, row: dict[str, Any], recargo: float) -> dict[str, Any]:
    return build_pdf_matrix_trace(
        rama="tarjetas_9x5",
        fuente_precio_final="PDF página 12 - Tarjetas Personales",
        fuente_logica_excel="Productos!BA32:BI39 (histórico, no alineado al PDF vigente)",
        motivo_override="Excel histórico no reproduce PDF vigente (40/40 desalineados).",
        precio_pdf_objetivo=float(row["precio_total_sin_iva"]),
        precio_unitario_derivado=float(row["precio_total_sin_iva"]) / request.cantidad_unidades,
        cantidad_unidades=request.cantidad_unidades,
        variables_detectadas=[
            "precio_papel_300g",
            "click_color",
            "click_blanco_negro",
            "costo_laca_uv",
            "costo_laminado_brillo",
            "costo_laminado_mate",
            "coeficiente_cantidad",
            "multiplicador_comercial",
            "factor_ajuste_pdf",
        ],
        variables_usadas={
            "papel": request.papel,
            "gramaje": request.gramaje,
            "terminacion": request.terminacion,
            "caras": request.caras,
        },
        recargo_urgencia_aplicado=recargo,
        extras={
            "convencion_precio": "precio_total_por_paquete",
            "cantidad_rango_aplicado": row["cantidad_rango"],
            "terminacion": request.terminacion,
            "caras": request.caras,
            "gramaje": request.gramaje,
            "papel": request.papel,
        },
    )
