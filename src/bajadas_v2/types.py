"""Typed contracts for Bajadas v2 pricing engine."""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class QuoteInput:
    categoria: str
    modo_color: str
    formato: str
    tipo_papel: str
    material: str
    gramaje: str
    cantidad_rango: str
    caras: str
    cantidad_unidades: Optional[int] = None
    terminacion: Optional[str] = None
    urgencia: str = "normal"


@dataclass(frozen=True)
class QuoteTrace:
    base_formato: str
    factor_aplicado: Optional[float]
    regla_especial: Optional[str]
    correccion_logica: Optional[str]
    precio_objetivo_csv: Optional[float]
    precio_unitario_csv: Optional[float]
    recargo_urgencia_aplicado: float
    an40_estado: Optional[str]
    cantidad_unidades: int
    cantidad_rango_aplicado: str


@dataclass(frozen=True)
class QuoteResult:
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
    trazabilidad: QuoteTrace
