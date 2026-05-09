"""Typed contracts for Laminado additionals v1."""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class LaminadoQuoteInput:
    adicional: str
    formato: str
    cantidad_unidades: int
    urgencia: str = "normal"
    precio_unitario_base: Optional[float] = None
    total_base: Optional[float] = None


@dataclass(frozen=True)
class LaminadoQuoteTrace:
    hoja_origen: str
    rango_origen: str
    celda_origen: str
    formula_origen: str
    escala: str
    dependencias: list[str]
    precio_por_pliego_a3plus: bool
    adicional_no_combinable: bool
    nota_adicional_antes_urgencia: str
    duplicado_1001_estado: str
    duplicado_1001_resolucion: str


@dataclass(frozen=True)
class LaminadoQuoteResult:
    adicional_unitario_sin_iva: float
    adicional_unitario_con_urgencia: float
    cantidad_unidades: int
    rango_aplicado: str
    total_adicional_sin_iva: float
    total_adicional_con_urgencia: float
    precio_unitario_base: Optional[float]
    total_base: Optional[float]
    total_combinado_sin_iva: Optional[float]
    total_combinado_con_urgencia: Optional[float]
    regla_aplicada: str
    fuente: str
    trazabilidad: LaminadoQuoteTrace

