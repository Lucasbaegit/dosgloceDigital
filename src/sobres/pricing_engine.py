from __future__ import annotations

from dataclasses import asdict
from typing import Any

from pricing_trace import build_pdf_matrix_trace

from .config_loader import SobresBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import SobresQuoteInput, SobresQuoteResult


class SobresPricingEngine:
    VALID_CANTIDADES = {100, 200, 300, 500, 1000}
    VALID_TIPOS = {
        'sobre_bolsa_a4_22_9x32_4',
        'sobre_bolsa_27x37',
        'sobre_bolsa_25x35_3',
        'oficio_ingles_12x23_5',
    }
    VALID_URGENCIA = {'normal', 'express', 'super_express', 'ya_24hs'}
    RECARGOS_URGENCIA = {'normal': 0.0, 'express': 0.15, 'super_express': 0.30, 'ya_24hs': 0.50}

    def __init__(self, bundle: SobresBundle):
        self.bundle = bundle
        self._index: dict[tuple[int, str, str], dict[str, Any]] = {}
        for row in bundle.rows:
            self._index[(int(row['cantidad_unidades']), str(row['tipo_sobre']), str(row['caras']))] = row

    def quote(self, request: SobresQuoteInput) -> SobresQuoteResult:
        self._validate(request)
        row = self._index.get((request.cantidad_unidades, request.tipo_sobre, request.caras))
        if row is None:
            raise PriceNotFoundError('combinacion_no_encontrada')

        unit = float(row['precio_unitario'])
        recargo = float(self.RECARGOS_URGENCIA[request.urgencia])
        unit_u = round(unit * (1 + recargo), 6)
        total = round(unit * request.cantidad_unidades, 6)
        total_u = round(total * (1 + recargo), 6)

        trace = build_pdf_matrix_trace(
            rama='sobres',
            fuente_precio_final='PDF página 14 - Papelería / Sobres',
            fuente_logica_excel='Hoja3!F150:J163 (histórico, no alineado 1:1 al PDF vigente)',
            motivo_override='Se usa matriz PDF publicada como precio final comercial vigente.',
            precio_pdf_objetivo=unit,
            precio_unitario_derivado=unit,
            cantidad_unidades=request.cantidad_unidades,
            variables_detectadas=[
                'papel_63g',
                'click_color',
                'tamano_sobre',
                'coeficiente_cantidad',
                'multiplicador_comercial',
            ],
            variables_usadas={
                'tipo_sobre': request.tipo_sobre,
                'papel': request.papel,
                'color': request.color,
                'caras': request.caras,
            },
            recargo_urgencia_aplicado=recargo,
            extras={
                'convencion_precio': 'precio_unitario_por_sobre',
                'nota_impresion': 'La impresión no puede cubrir el 100% de la cara del sobre.',
            },
        )

        return SobresQuoteResult(
            precio_unitario_sin_iva=unit,
            precio_unitario_con_urgencia=unit_u,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=str(request.cantidad_unidades),
            total_sin_iva=total,
            total_con_urgencia=total_u,
            precio_sin_iva=unit,
            precio_con_recargo_urgencia=unit_u,
            regla_aplicada='SOBRES_MATRIZ_PDF_P14',
            fuente='sobres_pdf_pagina_14',
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: SobresQuoteInput) -> dict[str, Any]:
        return asdict(self.quote(request))

    def health(self) -> dict[str, Any]:
        return {'status': 'ok', 'rama': 'sobres', 'combinaciones': len(self.bundle.rows)}

    def _validate(self, request: SobresQuoteInput) -> None:
        if request.categoria != 'Sobres':
            raise QuoteInputError('categoria inválida')
        if request.producto != 'sobre':
            raise QuoteInputError('producto inválido')
        if request.tipo_sobre not in self.VALID_TIPOS:
            raise QuoteInputError('tipo_sobre_no_soportado')
        if request.papel != '63g':
            raise QuoteInputError('papel_invalido')
        if request.color != 'blanco':
            raise QuoteInputError('color_no_soportado')
        if request.caras != '4/0':
            raise QuoteInputError('caras_no_soportadas')
        if request.cantidad_unidades not in self.VALID_CANTIDADES:
            raise PriceNotFoundError('cantidad_fuera_de_matriz')
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError('urgencia_invalida')
