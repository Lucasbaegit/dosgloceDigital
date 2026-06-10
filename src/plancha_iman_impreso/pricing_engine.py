from __future__ import annotations
from dataclasses import asdict
from typing import Any
import unicodedata
from pricing_trace import build_pdf_matrix_trace
from .config_loader import PlanchaImanImpresoBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import PlanchaImanImpresoQuoteInput, PlanchaImanImpresoQuoteResult


class PlanchaImanImpresoPricingEngine:
    VALID_VARIANT={"papel_300g_ilustracion"}
    VALID_URGENCIA={"normal","express","super_express","ya_24hs"}
    RECARGOS={"normal":0.0,"express":0.15,"super_express":0.30,"ya_24hs":0.50}

    def __init__(self,bundle:PlanchaImanImpresoBundle):
        self.bundle=bundle

    @staticmethod
    def _norm(text: str) -> str:
        base = unicodedata.normalize("NFKD", text or "")
        without_accents = "".join(ch for ch in base if not unicodedata.combining(ch))
        return without_accents.replace("?", "a").strip().lower()

    def quote(self,req:PlanchaImanImpresoQuoteInput)->PlanchaImanImpresoQuoteResult:
        if self._norm(req.categoria)!="plancha de iman impreso" or req.producto!="plancha_iman_impreso":
            raise QuoteInputError("categoria_o_producto_invalido")
        if req.variante not in self.VALID_VARIANT:
            raise QuoteInputError("variante_no_soportada")
        if req.cantidad_unidades<1 or req.cantidad_unidades>500:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if req.urgencia not in self.VALID_URGENCIA: raise QuoteInputError("urgencia_invalida")
        row=None
        for r in self.bundle.rows:
            mn=r["cantidad_min"];mx=r["cantidad_max"]
            if req.cantidad_unidades>=mn and (mx is None or req.cantidad_unidades<=mx) and r["variante"]==req.variante:
                row=r;break
        if row is None: raise PriceNotFoundError("cantidad_fuera_de_matriz")
        unit=float(row["precio_unitario_sin_iva"])
        rec=float(self.RECARGOS[req.urgencia])
        unit_u=round(unit*(1+rec),6)
        total=round(unit*req.cantidad_unidades,6)
        total_u=round(total*(1+rec),6)
        tr=build_pdf_matrix_trace(rama="plancha_iman_impreso",fuente_precio_final="PDF página 16 - Plancha de imán impreso",fuente_logica_excel="No identificada con confianza para variante autoadhesiva",motivo_override="Se implementa variante visible confiable; variante autoadhesiva queda pendiente de datos legibles.",precio_pdf_objetivo=unit,precio_unitario_derivado=unit,cantidad_unidades=req.cantidad_unidades,variables_detectadas=["base_iman","impresion_4_0","coeficiente_cantidad"],variables_usadas={"variante":req.variante,"cantidad_rango":row["cantidad_rango"]},recargo_urgencia_aplicado=rec,extras={"convencion_precio":"precio_unitario_por_plancha","estado_datos":"parcial"})
        return PlanchaImanImpresoQuoteResult(precio_unitario_sin_iva=unit,precio_unitario_con_urgencia=unit_u,cantidad_unidades=req.cantidad_unidades,cantidad_rango_aplicado=row["cantidad_rango"],total_sin_iva=total,total_con_urgencia=total_u,precio_sin_iva=unit,precio_con_recargo_urgencia=unit_u,regla_aplicada="PLANCHA_IMAN_IMPRESO_MATRIZ_PDF_P16",fuente="plancha_iman_impreso_pdf_pagina_16",trazabilidad=tr)

    def quote_as_dict(self,req:PlanchaImanImpresoQuoteInput)->dict[str,Any]:
        return asdict(self.quote(req))

    def health(self)->dict[str,Any]:
        return {"status":"ok","rama":"plancha_iman_impreso","combinaciones":len(self.bundle.rows),"estado_datos":"parcial"}
