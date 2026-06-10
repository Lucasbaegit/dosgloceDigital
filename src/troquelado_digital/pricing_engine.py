from __future__ import annotations
from dataclasses import asdict
from typing import Any
from pricing_trace import build_pdf_matrix_trace
from .config_loader import TroqueladoDigitalBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import TroqueladoDigitalQuoteInput, TroqueladoDigitalQuoteResult


class TroqueladoDigitalPricingEngine:
    VALID_SIZES={"1x1_a_2x2","2x2_a_4x4","5x5_a_9x9","10x10_a_14x14","mas_de_15x15"}
    VALID_URGENCIA={"normal","express","super_express","ya_24hs"}
    RECARGOS={"normal":0.0,"express":0.15,"super_express":0.30,"ya_24hs":0.50}

    def __init__(self,bundle:TroqueladoDigitalBundle):
        self.bundle=bundle

    def _range(self,qty:int)->dict[str,Any]|None:
        for r in self.bundle.rows:
            mn=r["cantidad_min"];mx=r["cantidad_max"]
            if qty>=mn and (mx is None or qty<=mx):
                return r
        return None

    def quote(self,req:TroqueladoDigitalQuoteInput)->TroqueladoDigitalQuoteResult:
        if req.categoria!="Troquelado Digital" or req.producto!="troquelado_digital":
            raise QuoteInputError("categoria_o_producto_invalido")
        if req.familia_tamano not in self.VALID_SIZES:
            raise QuoteInputError("familia_tamano_no_soportada")
        if req.cantidad_unidades<1:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if req.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError("urgencia_invalida")
        row=None
        for r in self.bundle.rows:
            mn=r["cantidad_min"];mx=r["cantidad_max"]
            if req.cantidad_unidades>=mn and (mx is None or req.cantidad_unidades<=mx) and r["familia_tamano"]==req.familia_tamano:
                row=r;break
        if row is None:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        unit=float(row["precio_unitario_sin_iva"])
        rec=float(self.RECARGOS[req.urgencia])
        unit_u=round(unit*(1+rec),6)
        total=round(unit*req.cantidad_unidades,6)
        total_u=round(total*(1+rec),6)
        tr=build_pdf_matrix_trace(rama="troquelado_digital",fuente_precio_final="PDF p?gina 11 - Troquelado Digital",fuente_logica_excel="troquelados!W44:AB50",motivo_override="Matriz PDF publicada como precio final vigente.",precio_pdf_objetivo=unit,precio_unitario_derivado=unit,cantidad_unidades=req.cantidad_unidades,variables_detectadas=["complejidad_troquel","familia_tamano","coeficiente_cantidad","corte_cama_plana"],variables_usadas={"familia_tamano":req.familia_tamano,"cantidad_rango":row["cantidad_rango"]},recargo_urgencia_aplicado=rec,extras={"convencion_precio":"precio_unitario_por_pieza","modo_precio":"pdf_fijo","futuro_modo_precio":"formula_editable_calibrada"})
        return TroqueladoDigitalQuoteResult(precio_unitario_sin_iva=unit,precio_unitario_con_urgencia=unit_u,cantidad_unidades=req.cantidad_unidades,cantidad_rango_aplicado=row["cantidad_rango"],total_sin_iva=total,total_con_urgencia=total_u,precio_sin_iva=unit,precio_con_recargo_urgencia=unit_u,regla_aplicada="TROQUELADO_DIGITAL_MATRIZ_PDF_P11",fuente="troquelado_digital_pdf_pagina_11",trazabilidad=tr)

    def quote_as_dict(self,req:TroqueladoDigitalQuoteInput)->dict[str,Any]:
        return asdict(self.quote(req))

    def health(self)->dict[str,Any]:
        return {"status":"ok","rama":"troquelado_digital","combinaciones":len(self.bundle.rows)}
