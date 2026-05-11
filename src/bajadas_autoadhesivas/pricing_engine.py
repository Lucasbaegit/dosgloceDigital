"""Pricing engine for Bajadas Autoadhesivas v1."""

from __future__ import annotations

from dataclasses import asdict
from typing import Any

from .config_loader import AutoadhesivasBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import AutoadhesivasQuoteInput, AutoadhesivasQuoteResult, AutoadhesivasQuoteTrace


class AutoadhesivasPricingEngine:
    VALID_URGENCIA = {"normal", "express", "super_express", "ya_24hs"}
    VALID_COLUMNA = {"papel", "especial"}
    VALID_FORMATOS = {"A3+", "XA3"}
    VALID_RANGES = ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500", "501 a 1000"]

    def __init__(self, bundle: AutoadhesivasBundle):
        self.bundle = bundle
        self.config = bundle.config
        self.recargos = bundle.config["urgencias"]
        self.rangos = bundle.config["rangos"]
        self.adicionales_excluidos = bundle.config.get("adicionales_excluidos", [])
        self.factor_xa3 = float(bundle.config.get("factor_xa3", 1.10))

        objetivos = [r for r in bundle.objetivo_rows if r.get("activo")]
        self._papel_objetivo = {
            r["cantidad_rango"]: float(r["precio_objetivo_sin_iva"])
            for r in objetivos
            if str(r.get("columna_precio", "")).lower() == "papel"
        }
        self._especial_objetivo = {
            r["cantidad_rango"]: float(r["precio_objetivo_sin_iva"])
            for r in objetivos
            if str(r.get("columna_precio", "")).lower() == "especial"
        }

        b3 = bundle.comparativa.get("by_model", {}).get("B3", {})
        self._especial_b3 = {
            r["cantidad_rango"]: {
                "precio_calibrado": float(r["precio_calibrado"]),
                "precio_excel_base": float(r["precio_base_excel"]),
                "factor": float(r["factor"]),
            }
            for r in b3.get("especial", [])
        }

    def quote(self, request: AutoadhesivasQuoteInput) -> AutoadhesivasQuoteResult:
        self._validate_request(request)
        rango = request.cantidad_rango or self._derive_range(request.cantidad_unidades)
        if rango not in self.rangos:
            raise QuoteInputError("La cantidad ingresada no entra en ningún rango disponible para esta combinación.")

        recargo = float(self.recargos[request.urgencia])
        factor_formato = self.factor_xa3 if request.formato == "XA3" else 1.0
        regla_formato = "FACTOR_XA3_1_10" if request.formato == "XA3" else None

        if request.columna_precio == "papel":
            precio_unit = self._papel_objetivo.get(rango)
            if precio_unit is None:
                raise PriceNotFoundError(f"No hay precio operativo para papel en rango {rango}.")
            regla = "AUTOADHESIVA_PAPEL_HIBRIDO_B_C"
            fuente = "autoadhesivas_objetivo_calibrado"
            trace = AutoadhesivasQuoteTrace(
                base_formato="A3+",
                factor_aplicado=factor_formato,
                regla_especial=regla_formato,
                origen_excel=self.config["origen_excel_papel"],
                modelo_aplicado=self.config["modelo_papel"],
                motivo_calibracion="Fórmula Excel Sticker no usable directa por magnitud. Se aplica tabla calibrada por rango.",
                referencia_tecnica_formula="=(AC4x + AC12*AF4x)*AH4x",
                factor_familia_rango=None,
                precio_excel_base=None,
                precio_calibrado=precio_unit,
                precio_unitario_csv=precio_unit,
                modelo_tecnico_referencia=None,
                precio_b3_referencia=None,
                precio_objetivo_pdf=precio_unit,
                motivo_operativo="PDF vigente usado como precio final comercial.",
                recargo_urgencia_aplicado=recargo,
                cantidad_unidades=request.cantidad_unidades,
                cantidad_rango_aplicado=rango,
                adicionales_excluidos=self.adicionales_excluidos,
            )
        else:
            row = self._especial_b3.get(rango)
            precio_objetivo = self._especial_objetivo.get(rango)
            if precio_objetivo is None:
                raise PriceNotFoundError(f"No hay precio operativo para especial en rango {rango}.")
            precio_unit = float(precio_objetivo)
            regla = "AUTOADHESIVA_ESPECIAL_HIBRIDO_B_C"
            fuente = "autoadhesivas_objetivo_calibrado"
            trace = AutoadhesivasQuoteTrace(
                base_formato="A3+",
                factor_aplicado=factor_formato,
                regla_especial=regla_formato,
                origen_excel=self.config["origen_excel_especial"],
                modelo_aplicado=self.config["modelo_especial"],
                motivo_calibracion="Estructura Excel OPP/blanco mantenida como trazabilidad; precio operativo por tabla vigente.",
                referencia_tecnica_formula="=(AC4x + AC13*AF4x)*AH4x",
                factor_familia_rango=(float(row["factor"]) if row else None),
                precio_excel_base=(float(row["precio_excel_base"]) if row else None),
                precio_calibrado=precio_unit,
                precio_unitario_csv=precio_objetivo,
                modelo_tecnico_referencia="MODELO_B3",
                precio_b3_referencia=(float(row["precio_calibrado"]) if row else None),
                precio_objetivo_pdf=precio_objetivo,
                motivo_operativo="PDF vigente usado como precio final comercial.",
                recargo_urgencia_aplicado=recargo,
                cantidad_unidades=request.cantidad_unidades,
                cantidad_rango_aplicado=rango,
                adicionales_excluidos=self.adicionales_excluidos,
            )

        unit = round(float(precio_unit) * factor_formato, 6)
        unit_u = round(unit * (1.0 + recargo), 6)
        total = round(unit * request.cantidad_unidades, 6)
        total_u = round(unit_u * request.cantidad_unidades, 6)

        return AutoadhesivasQuoteResult(
            precio_unitario_sin_iva=unit,
            precio_unitario_con_urgencia=unit_u,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=rango,
            total_sin_iva=total,
            total_con_urgencia=total_u,
            precio_sin_iva=unit,
            precio_con_recargo_urgencia=unit_u,
            regla_aplicada=regla,
            fuente=fuente,
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: AutoadhesivasQuoteInput) -> dict[str, Any]:
        result = self.quote(request)
        payload = asdict(result)
        payload["trazabilidad"] = asdict(result.trazabilidad)
        return payload

    def health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "version": self.config.get("version"),
            "modelo_papel": self.config.get("modelo_papel"),
            "modelo_especial": self.config.get("modelo_especial"),
        }

    def get_config(self) -> dict[str, Any]:
        return self.config

    def _lookup_especial_objetivo(self, rango: str) -> float | None:
        for row in self.bundle.objetivo_rows:
            if str(row.get("columna_precio", "")).lower() == "especial" and row.get("cantidad_rango") == rango:
                return float(row["precio_objetivo_sin_iva"])
        return None

    def _validate_request(self, request: AutoadhesivasQuoteInput) -> None:
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError(f"Urgencia inválida: {request.urgencia}")
        if request.columna_precio not in self.VALID_COLUMNA:
            raise QuoteInputError("columna_precio inválida para Autoadhesivas v1. Opciones permitidas: papel, especial.")
        if request.categoria != "Bajadas Autoadhesivas":
            raise QuoteInputError("categoria inválida para motor Autoadhesivas v1.")
        if request.modo_color != "fullcolor":
            raise QuoteInputError("modo_color inválido para Autoadhesivas v1 (solo fullcolor).")
        if request.formato not in self.VALID_FORMATOS:
            raise QuoteInputError("formato inválido para Autoadhesivas v1 (permitidos: A3+, XA3).")
        if request.tipo_producto != "autoadhesiva":
            raise QuoteInputError("tipo_producto inválido para Autoadhesivas v1.")
        if request.cantidad_unidades < 1:
            raise QuoteInputError("cantidad_unidades debe ser mayor o igual a 1.")

    def _derive_range(self, qty: int) -> str:
        if qty == 1:
            return "1"
        for label in self.VALID_RANGES[1:]:
            low, high = [int(x.strip()) for x in label.split("a")]
            if low <= qty <= high:
                return label
        raise QuoteInputError("La cantidad ingresada no entra en ningún rango disponible para esta combinación.")
