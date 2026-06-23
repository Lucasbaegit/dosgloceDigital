from __future__ import annotations

from dataclasses import asdict
import json
from pathlib import Path
from typing import Any

from pricing_trace import build_pdf_matrix_trace
from pricing_variables import load_pricing_variables_bundle

from .config_loader import ImanesCorteRectoBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import ImanesCorteRectoQuoteInput, ImanesCorteRectoQuoteResult


class ImanesCorteRectoPricingEngine:
    VALID_CANTIDADES = {100, 200, 300, 500, 1000}
    VALID_FORMATOS = {"6x4", "7x5", "9x5", "10x7"}
    VALID_TERMINACIONES = {"sin_laca_uv", "con_laca_uv"}
    VALID_URGENCIA = {"normal", "express", "super_express", "ya_24hs"}
    RECARGOS_URGENCIA = {"normal": 0.0, "express": 0.15, "super_express": 0.30, "ya_24hs": 0.50}

    def __init__(self, bundle: ImanesCorteRectoBundle, project_root: Any | None = None):
        self._index: dict[tuple[int, str, str], dict[str, Any]] = {}
        for row in bundle.rows:
            self._index[(int(row["cantidad_unidades"]), str(row["formato"]), str(row["terminacion"]))] = row
        self._excel_trace = bundle.excel_trace
        self._formula_config = bundle.formula_config
        self._project_root = Path(project_root) if project_root is not None else None
        self._formula_config_path = (
            self._project_root / "data" / "imanes_corte_recto" / "formula_editable_config.json"
            if self._project_root is not None
            else None
        )
        self._variables_bundle = load_pricing_variables_bundle(project_root) if project_root is not None else None

    def quote(self, request: ImanesCorteRectoQuoteInput) -> ImanesCorteRectoQuoteResult:
        self._validate(request)
        formula_config = self._current_formula_config()
        row = self._index.get((request.cantidad_unidades, request.formato, request.terminacion))
        if row is None:
            raise PriceNotFoundError("combinacion_no_encontrada")

        total_pdf = float(row["precio_total_sin_iva"])
        modo_precio = request.modo_precio or formula_config.get("modo_precio_default", "formula_editable_calibrada")
        if modo_precio not in {"formula_editable_calibrada", "pdf_fijo"}:
            raise QuoteInputError("modo_precio_invalido")

        formula_breakdown = self._compute_formula_breakdown(request, request.variables_override or {}, formula_config)
        total_base = formula_breakdown["total_base_excel"]
        if total_base <= 0:
            raise QuoteInputError("formula_base_invalida")
        factor_ajuste_pdf = total_pdf / total_base

        total = total_pdf
        recargo = self.RECARGOS_URGENCIA[request.urgencia]
        total_u = round(total * (1 + recargo), 6)
        unit = round(total / request.cantidad_unidades, 6)
        unit_u = round(total_u / request.cantidad_unidades, 6)
        total_base_urgencia = round(total_base * (1 + recargo), 6)

        trace = build_pdf_matrix_trace(
            rama="imanes_corte_recto",
            fuente_precio_final="PDF pagina 15 - Imanes Corte Recto",
            fuente_logica_excel="Productos (historico, referencia)",
            motivo_override="Formula editable base preparada y calibrada contra PDF pagina 15 para preservar precio comercial final.",
            precio_pdf_objetivo=total_pdf,
            precio_unitario_derivado=unit,
            cantidad_unidades=request.cantidad_unidades,
            variables_detectadas=[
                "base_iman",
                "papel_300g_ilustracion",
                "click_color",
                "laca_uv",
                "corte_recto",
                "coeficiente_formato",
                "coeficiente_cantidad",
                "multiplicador_comercial",
                "factor_ajuste_pdf",
            ],
            variables_usadas={
                "formato": request.formato,
                "papel": request.papel,
                "gramaje": request.gramaje,
                "terminacion": request.terminacion,
                "cantidad_unidades": request.cantidad_unidades,
                "modo_precio": modo_precio,
                "variables_override": request.variables_override or {},
            },
            recargo_urgencia_aplicado=recargo,
            extras={
                "modo_calculo": (
                    "formula_calibrada_con_factor_pdf" if modo_precio == "formula_editable_calibrada" else "matriz_pdf_con_variables_detectadas"
                ),
                "modo_precio": modo_precio,
                "futuro_modo_precio": "formula_editable_calibrada",
                "motivo_no_formula_pura": "Excel historico puro no alcanza; se aplica calibracion con factor por combinacion.",
                "convencion_precio": "precio_total_por_paquete",
                "precio_base_estimado": round(total_base, 6),
                "precio_base_estimado_con_urgencia": total_base_urgencia,
                "factor_ajuste_pdf": round(factor_ajuste_pdf, 9),
                "arbol_calculo": {
                    "base_iman": formula_breakdown["base_iman"],
                    "papel": formula_breakdown["papel_300g_ilustracion"],
                    "click": formula_breakdown["click_total"],
                    "laca": formula_breakdown["laca_factor"],
                    "corte": formula_breakdown["corte_factor"],
                    "coeficientes": {
                        "formato": formula_breakdown["coeficiente_formato"],
                        "cantidad": formula_breakdown["coeficiente_cantidad"],
                        "multiplicador_comercial": formula_breakdown["multiplicador_comercial"],
                    },
                    "subtotal_formula_excel": round(total_base, 6),
                    "factor_ajuste_pdf": round(factor_ajuste_pdf, 9),
                    "total_final": round(total_pdf, 6),
                },
                "formula_excel_reconstruida": "((base_iman + papel_300g_ilustracion + click_color_base * coeficiente_formato) * laca_uv_factor * corte_recto_factor * coeficiente_cantidad) * multiplicador_comercial",
                "config_variables_base": self._variables_bundle.config_variables_base if self._variables_bundle else None,
                "config_formula_editable_path": "data/imanes_corte_recto/formula_editable_config.json",
                "variables_principales_usadas": [
                    {"key": "factor_laca_uv_imanes_corte_recto", "label": "Factor Laca UV Imanes Corte Recto", "value": formula_breakdown["laca_factor"], "unit": "factor"},
                    {"key": "corte_recto_factor_imanes_corte_recto", "label": "Factor corte recto Imanes Corte Recto", "value": formula_breakdown["corte_factor"], "unit": "factor"},
                    {"key": "multiplicador_comercial_imanes_corte_recto", "label": "Multiplicador comercial Imanes Corte Recto", "value": formula_breakdown["multiplicador_comercial"], "unit": "factor"},
                    {"key": f"coeficiente_formato_imanes_corte_recto_{self._safe_key(request.formato)}", "label": f"Coeficiente formato Imanes Corte Recto {request.formato}", "value": formula_breakdown["coeficiente_formato"], "unit": "factor"},
                    {"key": f"coeficiente_cantidad_imanes_corte_recto_{request.cantidad_unidades}", "label": f"Coeficiente cantidad Imanes Corte Recto {request.cantidad_unidades}", "value": formula_breakdown["coeficiente_cantidad"], "unit": "factor"},
                ],
            },
        )
        return ImanesCorteRectoQuoteResult(
            precio_unitario_sin_iva=unit,
            precio_unitario_con_urgencia=unit_u,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=str(request.cantidad_unidades),
            total_sin_iva=total,
            total_con_urgencia=total_u,
            precio_sin_iva=unit,
            precio_con_recargo_urgencia=unit_u,
            regla_aplicada=(
                "IMANES_CORTE_RECTO_FORMULA_EDITABLE_CALIBRADA_P15"
                if modo_precio == "formula_editable_calibrada"
                else "IMANES_CORTE_RECTO_MATRIZ_PDF_P15"
            ),
            fuente="imanes_corte_recto_pdf_pagina_15_calibrado",
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: ImanesCorteRectoQuoteInput) -> dict[str, Any]:
        return asdict(self.quote(request))

    def health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "rama": "imanes_corte_recto",
            "combinaciones": len(self._index),
            "modo_precio_default": self._current_formula_config().get("modo_precio_default", "formula_editable_calibrada"),
        }

    def _validate(self, request: ImanesCorteRectoQuoteInput) -> None:
        if request.categoria != "Imanes Corte Recto":
            raise QuoteInputError("categoria invalida")
        if request.producto != "iman_corte_recto":
            raise QuoteInputError("producto invalido")
        if request.formato not in self.VALID_FORMATOS:
            raise QuoteInputError("formato_no_soportado")
        if request.terminacion not in self.VALID_TERMINACIONES:
            raise QuoteInputError("terminacion_no_soportada")
        if request.cantidad_unidades not in self.VALID_CANTIDADES:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError("urgencia_invalida")
        if request.papel not in {"300g Ilustracion", "300g Ilustración"}:
            raise QuoteInputError("papel_invalido")
        if request.gramaje != "300g":
            raise QuoteInputError("gramaje_invalido")
        if request.modo_precio and request.modo_precio not in {"formula_editable_calibrada", "pdf_fijo"}:
            raise QuoteInputError("modo_precio_invalido")

    def _current_formula_config(self) -> dict[str, Any]:
        if self._formula_config_path is not None and self._formula_config_path.exists():
            return json.loads(self._formula_config_path.read_text(encoding="utf-8-sig"))
        return self._formula_config

    def _compute_formula_breakdown(self, request: ImanesCorteRectoQuoteInput, overrides: dict[str, Any], formula_config: dict[str, Any]) -> dict[str, float]:
        cfg = formula_config.get("variables", {})
        coef_formato_map = dict(cfg.get("coeficiente_tamano", {}))
        coef_cantidad_map = dict(cfg.get("coeficiente_cantidad", {}))
        base_iman = float(cfg.get("base_iman", 0.0))
        papel_300g = float(cfg.get("papel_300g_ilustracion", 0.0))
        click_color_base = float(cfg.get("click_color_base", 0.0))
        laca_uv_factor = float(cfg.get("laca_uv_factor", 1.0))
        corte_recto_factor = float(cfg.get("corte_recto_factor", 1.0))
        multiplicador_comercial = float(cfg.get("multiplicador_comercial", 1.0))
        coeficiente_formato = float(coef_formato_map[request.formato])
        coeficiente_cantidad = float(coef_cantidad_map[str(request.cantidad_unidades)])

        if "factor_laca_uv_imanes_corte_recto" in overrides:
            laca_uv_factor = float(overrides["factor_laca_uv_imanes_corte_recto"])
        if "corte_recto_factor_imanes_corte_recto" in overrides:
            corte_recto_factor = float(overrides["corte_recto_factor_imanes_corte_recto"])
        if "multiplicador_comercial_imanes_corte_recto" in overrides:
            multiplicador_comercial = float(overrides["multiplicador_comercial_imanes_corte_recto"])
        format_override_key = f"coeficiente_formato_imanes_corte_recto_{self._safe_key(request.formato)}"
        quantity_override_key = f"coeficiente_cantidad_imanes_corte_recto_{request.cantidad_unidades}"
        if format_override_key in overrides:
            coeficiente_formato = float(overrides[format_override_key])
        if quantity_override_key in overrides:
            coeficiente_cantidad = float(overrides[quantity_override_key])

        click_total = click_color_base * coeficiente_formato
        laca_factor = laca_uv_factor if request.terminacion == "con_laca_uv" else 1.0
        subtotal = (base_iman + papel_300g + click_total) * laca_factor * corte_recto_factor * coeficiente_cantidad
        total_base = subtotal * multiplicador_comercial
        return {
            "base_iman": base_iman,
            "papel_300g_ilustracion": papel_300g,
            "click_color_base": click_color_base,
            "click_total": click_total,
            "laca_factor": laca_factor,
            "corte_factor": corte_recto_factor,
            "coeficiente_formato": coeficiente_formato,
            "coeficiente_cantidad": coeficiente_cantidad,
            "multiplicador_comercial": multiplicador_comercial,
            "total_base_excel": total_base,
        }

    @staticmethod
    def _safe_key(value: str) -> str:
        return str(value).replace("-", "_").replace("/", "_")
