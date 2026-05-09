"""Trace helpers for laminado additional quotes."""

from __future__ import annotations

from .types import LaminadoQuoteTrace


def build_trace(
    *,
    hoja_origen: str,
    rango_origen: str,
    celda_origen: str,
    formula_origen: str,
    escala: str,
    dependencias: list[str],
    duplicado_1001_estado: str,
    duplicado_1001_resolucion: str,
) -> LaminadoQuoteTrace:
    return LaminadoQuoteTrace(
        hoja_origen=hoja_origen,
        rango_origen=rango_origen,
        celda_origen=celda_origen,
        formula_origen=formula_origen,
        escala=escala,
        dependencias=dependencias,
        precio_por_pliego_a3plus=True,
        adicional_no_combinable=True,
        nota_adicional_antes_urgencia="El adicional se suma antes de urgencia: (precio_unitario_base + adicional_unitario) * cantidad.",
        duplicado_1001_estado=duplicado_1001_estado,
        duplicado_1001_resolucion=duplicado_1001_resolucion,
    )

