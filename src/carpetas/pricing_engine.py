from __future__ import annotations

from dataclasses import asdict
from typing import Any

from pricing_trace import build_pdf_matrix_trace

from .config_loader import CarpetasBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import CarpetasQuoteInput, CarpetasQuoteResult


class CarpetasPricingEngine:
    VALID_URGENCIA = {'normal', 'express', 'super_express', 'ya_24hs'}
    VALID_TERMINACIONES = {'sin_laminar', 'laca_uv', 'laminado_brillo', 'laminado_mate'}
    VALID_CARAS = {'4/0', '4/4'}
    RECARGOS_URGENCIA = {'normal': 0.0, 'express': 0.15, 'super_express': 0.30, 'ya_24hs': 0.50}

    def __init__(self, bundle: CarpetasBundle):
        self.bundle = bundle
        self._index: dict[tuple[str, str, int, int], dict[str, Any]] = {}
        for row in bundle.rows:
            key = (
                str(row['terminacion']),
                str(row['caras']),
                int(row['cantidad_desde']),
                int(row['cantidad_hasta']),
            )
            self._index[key] = row

    def quote(self, request: CarpetasQuoteInput) -> CarpetasQuoteResult:
        self._validate(request)
        row = self._find_row(request.terminacion, request.caras, request.cantidad_unidades)
        if row is None:
            raise PriceNotFoundError('cantidad_fuera_de_matriz')

        base_unit = float(row['precio_unitario'])
        solapa_unit = float(row['precio_solapa_impresa_unitario']) if request.solapa_impresa else 0.0
        unit = round(base_unit + solapa_unit, 6)
        recargo = float(self.RECARGOS_URGENCIA[request.urgencia])
        unit_u = round(unit * (1 + recargo), 6)
        total = round(unit * request.cantidad_unidades, 6)
        total_u = round(total * (1 + recargo), 6)

        trace = build_pdf_matrix_trace(
            rama='carpetas',
            fuente_precio_final='PDF página 14 - Papelería / Carpetas',
            fuente_logica_excel='Hoja3!B132:M143 (histórico con #REF!)',
            motivo_override='Excel histórico no reproduce de forma confiable el PDF vigente.',
            precio_pdf_objetivo=unit,
            precio_unitario_derivado=unit,
            cantidad_unidades=request.cantidad_unidades,
            variables_detectadas=[
                'papel_300g_ilustracion',
                'click_color',
                'click_doble_cara',
                'laca_uv',
                'laminado_brillo',
                'laminado_mate',
                'solapa_impresa',
                'coeficiente_cantidad',
                'multiplicador_comercial',
            ],
            variables_usadas={
                'papel': request.papel,
                'gramaje': request.gramaje,
                'terminacion': request.terminacion,
                'caras': request.caras,
                'solapa_impresa': request.solapa_impresa,
            },
            recargo_urgencia_aplicado=recargo,
            extras={
                'convencion_precio': 'precio_unitario_por_carpeta',
                'cantidad_rango_aplicado': row['cantidad_rango'],
                'precio_unitario_base': base_unit,
                'precio_solapa_impresa_unitario': solapa_unit,
                'precio_unitario_final': unit,
            },
        )

        return CarpetasQuoteResult(
            precio_unitario_sin_iva=unit,
            precio_unitario_con_urgencia=unit_u,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=str(row['cantidad_rango']),
            total_sin_iva=total,
            total_con_urgencia=total_u,
            precio_sin_iva=unit,
            precio_con_recargo_urgencia=unit_u,
            regla_aplicada='CARPETAS_MATRIZ_PDF_P14',
            fuente='carpetas_pdf_pagina_14',
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: CarpetasQuoteInput) -> dict[str, Any]:
        return asdict(self.quote(request))

    def health(self) -> dict[str, Any]:
        return {'status': 'ok', 'rama': 'carpetas', 'combinaciones': len(self.bundle.rows)}

    def _find_row(self, terminacion: str, caras: str, cantidad: int) -> dict[str, Any] | None:
        for (t, c, d, h), row in self._index.items():
            if t == terminacion and c == caras and d <= cantidad <= h:
                return row
        return None

    def _validate(self, request: CarpetasQuoteInput) -> None:
        if request.categoria != 'Carpetas':
            raise QuoteInputError('categoria inválida')
        if request.producto != 'carpeta_a4':
            raise QuoteInputError('producto inválido')
        if request.formato != 'A4':
            raise QuoteInputError('formato inválido')
        if request.papel not in {'300g Ilustración', '300g Ilustracion'}:
            raise QuoteInputError('papel inválido')
        if request.gramaje != '300g':
            raise QuoteInputError('gramaje inválido')
        if request.terminacion not in self.VALID_TERMINACIONES:
            raise QuoteInputError('terminacion_no_soportada')
        if request.caras not in self.VALID_CARAS:
            raise QuoteInputError('caras_no_soportadas')
        if request.cantidad_unidades < 1:
            raise QuoteInputError('cantidad_invalida')
        if request.cantidad_unidades > 1000:
            raise PriceNotFoundError('cantidad_fuera_de_matriz')
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError('urgencia_invalida')
