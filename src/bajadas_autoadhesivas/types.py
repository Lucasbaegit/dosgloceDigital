"""Typed contracts for Autoadhesivas v1."""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class AutoadhesivasQuoteInput:
    categoria: str
    modo_color: str
    formato: str
    tipo_producto: str
    columna_precio: str
    cantidad_unidades: int
    cantidad_rango: Optional[str] = None
    urgencia: str = "normal"


@dataclass(frozen=True)
class AutoadhesivasQuoteTrace:
    origen_excel: str
    modelo_aplicado: str
    motivo_calibracion: str
    referencia_tecnica_formula: str
    factor_familia_rango: Optional[float]
    precio_excel_base: Optional[float]
    precio_calibrado: float
    precio_unitario_csv: Optional[float]
    modelo_tecnico_referencia: Optional[str]
    precio_b3_referencia: Optional[float]
    precio_objetivo_pdf: Optional[float]
    motivo_operativo: Optional[str]
    recargo_urgencia_aplicado: float
    cantidad_unidades: int
    cantidad_rango_aplicado: str
    adicionales_excluidos: list[str]


@dataclass(frozen=True)
class AutoadhesivasQuoteResult:
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
    trazabilidad: AutoadhesivasQuoteTrace
