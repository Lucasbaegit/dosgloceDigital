from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class TarjetasPostalesQuoteInput:
    categoria: str
    producto: str
    formato: str
    papel: str
    gramaje: str
    terminacion: str
    caras: str
    cantidad_unidades: int
    urgencia: str


@dataclass(frozen=True)
class TarjetasPostalesQuoteResult:
    precio_unitario_sin_iva: float
    precio_unitario_con_urgencia: float
    cantidad_unidades: int
    cantidad_rango_aplicado: str
    total_sin_iva: float
    total_con_urgencia: float
    precio_sin_iva: float
    precio_con_recargo_urgencia: float
    regla_aplicada: str
    fuente: str
    trazabilidad: dict[str, Any]
