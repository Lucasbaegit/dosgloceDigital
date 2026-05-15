from __future__ import annotations
from dataclasses import asdict
from typing import Any
from pricing_trace import build_pdf_matrix_trace
from .config_loader import TarjetasTroqueladasCircularesBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import TarjetasTroqueladasCircularesQuoteInput, TarjetasTroqueladasCircularesQuoteResult


class TarjetasTroqueladasCircularesPricingEngine:
    VALID_QTY={100,200,300,500,1000}
    VALID_FORMAT={"1cm","2cm","3cm","4cm","5cm","6cm","7cm","8cm","9cm"}
    VALID_CARAS={"4/0","4/4"}
    VALID_URGENCIA={"normal","express","super_express","ya_24hs"}
    RECARGOS={"normal":0.0,"express":0.15,"super_express":0.30,"ya_24hs":0.50}
    VALID_ADICIONAL={"sin_adicional","laminado_brillo","laminado_mate"}

    def __init__(self,bundle:TarjetasTroqueladasCircularesBundle):
        self.bundle=bundle
        self.index={(r["formato"],r["caras"],int(r["cantidad_unidades"])):r for r in bundle.rows}

    def quote(self,req:TarjetasTroqueladasCircularesQuoteInput)->TarjetasTroqueladasCircularesQuoteResult:
        if req.categoria!="Tarjetas Troqueladas Circulares" or req.producto!="tarjeta_troquelada_circular":
            raise QuoteInputError("categoria_o_producto_invalido")
        if req.formato not in self.VALID_FORMAT: raise QuoteInputError("formato_no_soportado")
        if req.caras not in self.VALID_CARAS: raise QuoteInputError("caras_no_soportadas")
        if req.cantidad_unidades not in self.VALID_QTY: raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if req.urgencia not in self.VALID_URGENCIA: raise QuoteInputError("urgencia_invalida")
        if req.adicional_laminado not in self.VALID_ADICIONAL: raise QuoteInputError("laminado_no_soportado")
        if req.caras_adicional_laminado not in {0,1,2}: raise QuoteInputError("caras_laminado_no_soportadas")
        if req.adicional_laminado == "sin_adicional" and req.caras_adicional_laminado != 0:
            raise QuoteInputError("caras_laminado_no_soportadas")
        if req.adicional_laminado in {"laminado_brillo","laminado_mate"} and req.caras_adicional_laminado not in {1,2}:
            raise QuoteInputError("caras_laminado_no_soportadas")
        row=self.index.get((req.formato,req.caras,req.cantidad_unidades))
        if row is None: raise PriceNotFoundError("combinacion_no_encontrada")
        total_base=float(row["precio_total_sin_iva"])
        pct_laminado = 0.10 if req.caras_adicional_laminado == 1 else (0.20 if req.caras_adicional_laminado == 2 else 0.0)
        monto_laminado = round(total_base * pct_laminado, 6)
        total = round(total_base + monto_laminado, 6)
        rec=float(self.RECARGOS[req.urgencia])
        total_u=round(total*(1+rec),6)
        unit=round(total/req.cantidad_unidades,6)
        unit_u=round(total_u/req.cantidad_unidades,6)
        tr=build_pdf_matrix_trace(rama="tarjetas_troqueladas_circulares",fuente_precio_final="PDF página 11 - Tarjetas Troqueladas Circulares",fuente_logica_excel="circulares/troquelados (histórico)",motivo_override="Excel histórico no reproduce PDF vigente.",precio_pdf_objetivo=total_base,precio_unitario_derivado=round(total_base/req.cantidad_unidades,6),cantidad_unidades=req.cantidad_unidades,variables_detectadas=["papel_300g_ilustracion","click_color","troquel_circular","coeficiente_tamano","coeficiente_cantidad","laminado_brillo","laminado_mate"],variables_usadas={"formato":req.formato,"caras":req.caras},recargo_urgencia_aplicado=rec,extras={"convencion_precio":"precio_total_por_paquete","total_base":total_base,"adicional_laminado":req.adicional_laminado,"caras_laminado":req.caras_adicional_laminado,"porcentaje_aplicado":pct_laminado,"monto_adicional":monto_laminado,"total_final":total})
        return TarjetasTroqueladasCircularesQuoteResult(precio_unitario_sin_iva=unit,precio_unitario_con_urgencia=unit_u,cantidad_unidades=req.cantidad_unidades,cantidad_rango_aplicado=str(req.cantidad_unidades),total_sin_iva=total,total_con_urgencia=total_u,precio_sin_iva=unit,precio_con_recargo_urgencia=unit_u,regla_aplicada="TARJETAS_TROQ_CIRC_MATRIZ_PDF_P11",fuente="tarjetas_troqueladas_circulares_pdf_pagina_11",trazabilidad=tr)

    def quote_as_dict(self,req:TarjetasTroqueladasCircularesQuoteInput)->dict[str,Any]:
        return asdict(self.quote(req))

    def health(self)->dict[str,Any]:
        return {"status":"ok","rama":"tarjetas_troqueladas_circulares","combinaciones":len(self.bundle.rows)}
