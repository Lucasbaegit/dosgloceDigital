"""Build enriched trace payloads for matrix-based products."""

from __future__ import annotations

from typing import Any


def build_pdf_matrix_trace(
    *,
    rama: str,
    fuente_precio_final: str,
    fuente_logica_excel: str,
    motivo_override: str,
    precio_pdf_objetivo: float,
    precio_unitario_derivado: float,
    cantidad_unidades: int,
    variables_detectadas: list[str],
    variables_usadas: dict[str, Any],
    recargo_urgencia_aplicado: float,
    extras: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "rama": rama,
        # backward-compatible aliases
        "origen_precio_final": fuente_precio_final,
        "origen_logico_excel": fuente_logica_excel,
        # preferred keys
        "fuente_precio_final": fuente_precio_final,
        "fuente_logica_excel": fuente_logica_excel,
        "precio_pdf_objetivo": float(precio_pdf_objetivo),
        "precio_unitario_derivado": float(precio_unitario_derivado),
        "cantidad_unidades": int(cantidad_unidades),
        "modo_calculo": "matriz_pdf_con_variables_detectadas",
        "modo_precio": "pdf_fijo",
        "futuro_modo_precio": "formula_editable_calibrada",
        "precio_base_estimado": None,
        "factor_ajuste_pdf": None,
        "motivo_override": motivo_override,
        "motivo_no_formula_pura": motivo_override,
        "variables_detectadas": variables_detectadas,
        "variables_usadas": variables_usadas,
        "recargo_urgencia_aplicado": float(recargo_urgencia_aplicado),
        "config_variables_base": {
            "path": "data/variables_comerciales/config_variables_base.json",
            "modo_precio_default": "pdf_fijo",
            "futuro_modo_precio": "formula_editable_calibrada",
            "modo_aplicacion_actual": "solo_trazabilidad",
        },
    }
    if extras:
        payload.update(extras)
    return payload
