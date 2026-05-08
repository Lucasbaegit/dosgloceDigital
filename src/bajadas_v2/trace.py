"""Trace helpers for Bajadas v2 pricing."""

from __future__ import annotations

from typing import Any, Optional

from .types import QuoteInput


def build_lookup_key(payload: QuoteInput | dict[str, Any]) -> tuple:
    if isinstance(payload, QuoteInput):
        src = {
            "categoria": payload.categoria,
            "modo_color": payload.modo_color,
            "formato": payload.formato,
            "tipo_papel": payload.tipo_papel,
            "material": payload.material,
            "gramaje": payload.gramaje,
            "cantidad_rango": payload.cantidad_rango,
            "caras": payload.caras,
            "terminacion": payload.terminacion,
        }
    else:
        src = payload

    return (
        _norm(src.get("categoria")),
        _norm(src.get("modo_color")),
        _norm(src.get("formato")),
        _norm(src.get("tipo_papel")),
        _norm(src.get("material")),
        _norm(src.get("gramaje")),
        _norm(src.get("cantidad_rango")),
        _norm(src.get("caras")),
        _norm(src.get("terminacion")),
    )


def _norm(value: Optional[Any]) -> str:
    if value is None:
        return ""
    return str(value).strip().lower()
