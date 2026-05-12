"""Production pricing engine for Bajadas v2."""

from __future__ import annotations

from dataclasses import asdict
from statistics import median
from typing import Any

from .config_loader import BajadasV2Bundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .trace import build_lookup_key
from .types import QuoteInput, QuoteResult, QuoteTrace


class BajadasV2PricingEngine:
    VALID_URGENCIA = {"normal", "express", "super_express", "ya_24hs"}

    def __init__(self, bundle: BajadasV2Bundle):
        self.bundle = bundle
        self.config = bundle.config
        self.comparativa = bundle.comparativa_final["comparativa"]
        self.recargos = self.config["recargos_urgencia"]
        self.base_formato = self.config["base_formato"]
        self.factor_xa3 = float(self.config["factor_xa3"])
        self.an40_estado = self.config.get("AN40", {}).get("estado")
        self.fixed_cases = self.config.get("precios_fijos_csv", {}).get("casos", [])
        self.xl_byn_factors = self.config["regla_especial_xl_byn"]["factores"]

        self._comparativa_index = {build_lookup_key(row): row for row in self.comparativa}
        self._fixed_index = {build_lookup_key(row): row for row in self.fixed_cases}

    def quote(self, request: QuoteInput) -> QuoteResult:
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError(f"Urgencia invÃ¡lida: {request.urgencia}")

        key = build_lookup_key(request)
        fixed_case = self._fixed_index.get(key)
        row = self._comparativa_index.get(key)

        if fixed_case:
            precio = float(fixed_case["precio_objetivo_csv"])
            factor = float(fixed_case.get("factor_aplicado") or 0.0) or None
            regla = "PRECIO_FIJO_CSV"
            fuente = "precio_fijo_csv"
            precio_objetivo = precio
        elif request.formato == "XA3":
            base_price, precio_objetivo = self._derive_xa3_from_a3(request)
            precio = round(base_price * self.factor_xa3, 6)
            factor = self.factor_xa3
            regla = "FACTOR_XA3_1_10"
            fuente = "modelo_d"
        elif row:
            if row.get("estado") == "SIN_COMPARACION":
                if self._is_kraft_pdf_enabled(row):
                    precio_objetivo = self._coerce_float(row.get("precio_objetivo_csv"))
                    if precio_objetivo is None:
                        raise PriceNotFoundError("Bajadas Kraft en SIN_COMPARACION sin precio objetivo válido.")
                    precio = precio_objetivo
                    factor = None
                    regla = "KRAFT_A3_MATRIZ_PDF_ESPECIFICA"
                    fuente = "kraft_pdf_pagina_5"
                else:
                    raise PriceNotFoundError("La combinación existe pero quedó en SIN_COMPARACION.")
            else:
                precio = float(row["precio_estimado_v2"])
                factor = self._resolve_factor(request, row)
                regla = self._resolve_rule(request, row)
                fuente = "modelo_d"
                precio_objetivo = self._coerce_float(row.get("precio_objetivo_csv"))
        else:
            raise PriceNotFoundError("No se encontró la combinación solicitada en el baseline final.")

        cantidad_unidades = request.cantidad_unidades or 1
        recargo = float(self.recargos[request.urgencia])
        precio_unitario = round(precio, 6)
        precio_unitario_recargo = round(precio_unitario * (1.0 + recargo), 6)
        total_sin_iva = round(precio_unitario * cantidad_unidades, 6)
        total_con_urgencia = round(precio_unitario_recargo * cantidad_unidades, 6)
        trace = QuoteTrace(
            base_formato=self.base_formato,
            factor_aplicado=factor,
            regla_especial=self._resolve_special_rule(request),
            correccion_logica=self._resolve_correction_flag(request),
            precio_objetivo_csv=precio_objetivo,
            precio_unitario_csv=precio_objetivo,
            recargo_urgencia_aplicado=recargo,
            an40_estado=self.an40_estado,
            cantidad_unidades=cantidad_unidades,
            cantidad_rango_aplicado=request.cantidad_rango,
        )
        return QuoteResult(
            precio_unitario_sin_iva=precio_unitario,
            precio_unitario_con_urgencia=precio_unitario_recargo,
            cantidad_unidades=cantidad_unidades,
            cantidad_rango_aplicado=request.cantidad_rango,
            total_sin_iva=total_sin_iva,
            total_con_urgencia=total_con_urgencia,
            precio_sin_iva=precio_unitario,
            precio_con_recargo_urgencia=precio_unitario_recargo,
            regla_aplicada=regla,
            fuente=fuente,
            trazabilidad=trace,
        )

    def _derive_xa3_from_a3(self, request: QuoteInput) -> tuple[float, float | None]:
        a3_payload = {
            "categoria": request.categoria,
            "modo_color": request.modo_color,
            "formato": "A3+",
            "tipo_papel": request.tipo_papel,
            "material": request.material,
            "gramaje": request.gramaje,
            "cantidad_rango": request.cantidad_rango,
            "caras": request.caras,
            "terminacion": request.terminacion,
        }
        row = self._comparativa_index.get(build_lookup_key(a3_payload))
        if not row or row.get("estado") == "SIN_COMPARACION":
            raise PriceNotFoundError("No se pudo derivar XA3 porque falta base A3+ comparable.")
        return float(row["precio_estimado_v2"]), self._coerce_float(row.get("precio_objetivo_csv"))

    def quote_as_dict(self, request: QuoteInput) -> dict[str, Any]:
        result = self.quote(request)
        payload = asdict(result)
        payload["trazabilidad"] = asdict(result.trazabilidad)
        return payload

    def summary_metrics(self) -> dict[str, Any]:
        diffs = [
            abs(float(row.get("diferencia_porcentual", 0.0)))
            for row in self.comparativa
            if row.get("estado") != "SIN_COMPARACION"
        ]
        return {
            "metricas_finales": self.bundle.comparativa_final.get("metricas_finales", {}),
            "error_promedio_pct_abs": (sum(diffs) / len(diffs)) if diffs else None,
            "error_mediano_pct_abs": median(diffs) if diffs else None,
        }

    def _resolve_special_rule(self, request: QuoteInput) -> str | None:
        if request.categoria == "Bajadas Kraft":
            return "KRAFT_A3_PDF_PAGINA_5_OVERRIDE_SIN_COMPARACION"
        if (
            request.categoria == "Bajadas Blanco y Negro"
            and request.formato == "XL"
            and request.tipo_papel in {"liviano", "pesado"}
            and request.caras in {"1/0", "1/1"}
        ):
            return "REGLA_ESPECIAL_XL_BYN_TIPO_PAPEL_CARAS"
        return None

    def _resolve_correction_flag(self, request: QuoteInput) -> str | None:
        if (
            request.categoria == "Bajadas Blanco y Negro"
            and request.formato == "XL"
            and request.caras == "1/1"
        ):
            return "CORRECCION_XL_BYN_1_1_PARENTESIS"
        return None

    def _resolve_factor(self, request: QuoteInput, row: dict[str, Any]) -> float | None:
        if request.formato == "A3+":
            return 1.0
        if request.formato == "XA3":
            return self.factor_xa3
        if request.categoria == "Bajadas Blanco y Negro" and request.formato == "XL":
            key = f"{request.tipo_papel}|{request.caras}"
            value = self.xl_byn_factors.get(key, self.xl_byn_factors.get("global"))
            return self._coerce_float(value)
        if "factor_aplicado" in row:
            return self._coerce_float(row.get("factor_aplicado"))
        return None

    def _is_kraft_pdf_enabled(self, row: dict[str, Any]) -> bool:
        if row.get("estado") != "SIN_COMPARACION":
            return False
        if row.get("categoria") != "Bajadas Kraft":
            return False
        precio_objetivo = self._coerce_float(row.get("precio_objetivo_csv"))
        if precio_objetivo is None or precio_objetivo <= 0:
            return False
        return True

    def _resolve_rule(self, request: QuoteInput, row: dict[str, Any]) -> str:
        if request.formato == "XA3":
            return "FACTOR_XA3_1_10"
        if request.categoria == "Bajadas Blanco y Negro" and request.formato == "XL":
            return "MODELO_D_D2_REGLA_XL_BYN"
        return f"MODELO_D_D2_BASE_{row.get('formato', request.formato)}"

    @staticmethod
    def _coerce_float(value: Any) -> float | None:
        try:
            if value is None:
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

