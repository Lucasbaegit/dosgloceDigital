from __future__ import annotations
from dataclasses import asdict
from typing import Any
from pricing_trace import build_pdf_matrix_trace
from .config_loader import AgendasCuadernosBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import AgendasCuadernosQuoteInput, AgendasCuadernosQuoteResult


class AgendasCuadernosPricingEngine:
    VALID_PRODUCTS={"cuaderno_escolar_abrochado","cuaderno_universitario_ringwire","agenda_2026"}
    VALID_FORMATS={"A5","A4"}
    VALID_URGENCIA={"normal","express","super_express","ya_24hs"}
    RECARGOS={"normal":0.0,"express":0.15,"super_express":0.30,"ya_24hs":0.50}

    def __init__(self,bundle:AgendasCuadernosBundle):
        self.bundle=bundle
        self.index={(r["producto"],r["formato"],int(r["paginas"])):r for r in bundle.rows}

    def quote(self,req:AgendasCuadernosQuoteInput)->AgendasCuadernosQuoteResult:
        if req.categoria!="Agendas / Cuadernos": raise QuoteInputError("categoria_invalida")
        if req.producto not in self.VALID_PRODUCTS: raise QuoteInputError("producto_no_soportado")
        if req.formato not in self.VALID_FORMATS: raise QuoteInputError("formato_no_soportado")
        if req.cantidad_unidades<2: raise PriceNotFoundError("cantidad_minima_no_alcanzada")
        if req.urgencia not in self.VALID_URGENCIA: raise QuoteInputError("urgencia_invalida")
        row=self.index.get((req.producto,req.formato,req.paginas))
        if row is None: raise PriceNotFoundError("combinacion_no_encontrada")
        unit=float(row["precio_unitario_sin_iva"])
        rec=float(self.RECARGOS[req.urgencia])
        unit_u=round(unit*(1+rec),6)
        total=round(unit*req.cantidad_unidades,6)
        total_u=round(total*(1+rec),6)
        tr=build_pdf_matrix_trace(rama="agendas_cuadernos",fuente_precio_final="PDF p?gina 17 - Agendas y Cuadernos",fuente_logica_excel="Productos (hist?rico referencial)",motivo_override="Precios promocionales vigentes por matriz PDF.",precio_pdf_objetivo=unit,precio_unitario_derivado=unit,cantidad_unidades=req.cantidad_unidades,variables_detectadas=["tapa_300g","laminado_mate_brillo","encuadernacion","paginas_interiores","formato"],variables_usadas={"producto":req.producto,"formato":req.formato,"paginas":req.paginas},recargo_urgencia_aplicado=rec,extras={"convencion_precio":"precio_unitario_promocional","cantidad_minima":2})
        return AgendasCuadernosQuoteResult(precio_unitario_sin_iva=unit,precio_unitario_con_urgencia=unit_u,cantidad_unidades=req.cantidad_unidades,cantidad_rango_aplicado="desde 2",total_sin_iva=total,total_con_urgencia=total_u,precio_sin_iva=unit,precio_con_recargo_urgencia=unit_u,regla_aplicada="AGENDAS_CUADERNOS_MATRIZ_PDF_P17",fuente="agendas_cuadernos_pdf_pagina_17",trazabilidad=tr)

    def quote_as_dict(self,req:AgendasCuadernosQuoteInput)->dict[str,Any]:
        return asdict(self.quote(req))

    def health(self)->dict[str,Any]:
        return {"status":"ok","rama":"agendas_cuadernos","combinaciones":len(self.bundle.rows)}
