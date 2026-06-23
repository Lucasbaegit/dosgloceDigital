from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ImanesCorteRectoQuoteInput:
    categoria: str
    producto: str
    formato: str
    papel: str
    gramaje: str
    terminacion: str
    cantidad_unidades: int
    urgencia: str
    modo_precio: str | None = None
    variables_override: dict[str, Any] | None = None


@dataclass(frozen=True)
class ImanesCorteRectoQuoteResult:
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
