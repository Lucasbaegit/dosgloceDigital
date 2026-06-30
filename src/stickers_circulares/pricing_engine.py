from __future__ import annotations

from dataclasses import asdict
import json
from pathlib import Path
from typing import Any

from pricing_trace import build_pdf_matrix_trace
from pricing_variables import load_pricing_variables_bundle, merge_global_base_costs

from .config_loader import StickersCircularesBundle
from .exceptions import PriceNotFoundError, QuoteInputError
from .types import StickersCircularesQuoteInput, StickersCircularesQuoteResult


class StickersCircularesPricingEngine:
    VALID_CANTIDADES = {100, 200, 300, 500, 1000}
    VALID_URGENCIA = {"normal", "express", "super_express", "ya_24hs"}
    RECARGOS_URGENCIA = {"normal": 0.0, "express": 0.15, "super_express": 0.30, "ya_24hs": 0.50}

    def __init__(self, bundle: StickersCircularesBundle, project_root: Any | None = None):
        self._index: dict[tuple[str, int, str, str], dict[str, Any]] = {}
        self._materials: set[str] = set()
        self._formatos: set[str] = set()
        self._terminaciones: set[str] = set()
        for row in bundle.rows:
            mat = str(row["material"])
            qty = int(row["cantidad_unidades"])
            fmt = str(row["formato"])
            term = str(row["terminacion"])
            self._index[(mat, qty, fmt, term)] = row
            self._materials.add(mat)
            self._formatos.add(fmt)
            self._terminaciones.add(term)

        self._excel_trace = bundle.excel_trace
        self._formula_config = bundle.formula_config
        self._project_root = Path(project_root) if project_root is not None else None
        self._formula_config_path = (
            self._project_root / "data" / "stickers_circulares" / "formula_editable_config.json"
            if self._project_root is not None
            else None
        )
        self._variables_bundle = load_pricing_variables_bundle(project_root) if project_root is not None else None

    def quote(self, request: StickersCircularesQuoteInput) -> StickersCircularesQuoteResult:
        normalized_material = self._normalize_material(request.material)
        normalized_terminacion = self._normalize_terminacion(request.terminacion)
        normalized_request = StickersCircularesQuoteInput(
            categoria=request.categoria,
            producto=request.producto,
            material=normalized_material,
            formato=request.formato,
            terminacion=normalized_terminacion,
            cantidad_unidades=request.cantidad_unidades,
            urgencia=request.urgencia,
            modo_precio=request.modo_precio,
            variables_override=request.variables_override,
        )
        self._validate(normalized_request)
        row = self._index.get((normalized_request.material, normalized_request.cantidad_unidades, normalized_request.formato, normalized_request.terminacion))
        if row is None:
            raise PriceNotFoundError("combinacion_no_encontrada")

        total_pdf = float(row["precio_total_sin_iva"])
        modo_precio = request.modo_precio or self._formula_config.get("modo_precio_default", "formula_editable_calibrada")
        if modo_precio not in {"formula_editable_calibrada", "pdf_fijo"}:
            raise QuoteInputError("modo_precio_invalido")

        formula_breakdown = self._compute_formula_breakdown(normalized_request, normalized_request.variables_override or {})
        total_base = formula_breakdown["total_base_excel"]
        if total_base <= 0:
            raise QuoteInputError("formula_base_invalida")
        factor_ajuste_pdf = total_pdf / total_base

        # En ambos modos mantenemos precio final comercial PDF; cambia el nivel de trazabilidad/calculo.
        total = total_pdf

        recargo = self.RECARGOS_URGENCIA[request.urgencia]
        total_u = round(total * (1 + recargo), 6)
        unit = round(total / request.cantidad_unidades, 6)
        unit_u = round(total_u / request.cantidad_unidades, 6)
        total_base_urgencia = round(total_base * (1 + recargo), 6)

        trace = build_pdf_matrix_trace(
            rama="stickers_circulares",
            fuente_precio_final="PDF pagina 8 - Stickers Circulares",
            fuente_logica_excel=f"{self._excel_trace.get('hoja_origen', 'circulares')} ({', '.join(self._excel_trace.get('rangos_relevantes', []))})",
            motivo_override="Formula histórica Excel calibrada contra PDF hoja 8 para preservar precio comercial final.",
            precio_pdf_objetivo=total_pdf,
            precio_unitario_derivado=unit,
            cantidad_unidades=request.cantidad_unidades,
            variables_detectadas=[
                "material_autoadhesivo",
                "click_color",
                "laca_uv",
                "troquel_circular",
                "coeficiente_tamano",
                "coeficiente_cantidad",
                "multiplicador_comercial",
                "factor_ajuste_pdf",
                "dolar",
            ],
            variables_usadas={
                "material": request.material,
                "material_normalizado": normalized_material,
                "formato": normalized_request.formato,
                "terminacion": request.terminacion,
                "terminacion_normalizada": normalized_terminacion,
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
                "motivo_no_formula_pura": "Excel histórico puro no alcanza; se aplica calibración con factor por combinación.",
                "convencion_precio": "precio_total_por_paquete",
                "precio_base_estimado": round(total_base, 6),
                "precio_base_estimado_con_urgencia": total_base_urgencia,
                "factor_ajuste_pdf": round(factor_ajuste_pdf, 9),
                "arbol_calculo": {
                    "material": formula_breakdown["material_base"],
                    "click": formula_breakdown["click_total"],
                    "laca": formula_breakdown["laca_factor"],
                    "recargo_laca_uv_brillo_pct": formula_breakdown["recargo_laca_uv_brillo_pct"],
                    "corte": formula_breakdown["corte_factor"],
                    "coeficientes": {
                        "tamano": formula_breakdown["coeficiente_tamano"],
                        "cantidad": formula_breakdown["coeficiente_cantidad"],
                        "multiplicador_comercial": formula_breakdown["multiplicador_comercial"],
                    },
                    "subtotal_formula_excel": round(total_base, 6),
                    "factor_ajuste_pdf": round(factor_ajuste_pdf, 9),
                    "total_final": round(total_pdf, 6),
                },
                "formula_excel_reconstruida": "((material_base + click_color_base * coeficiente_tamano) * laca_uv_factor * corte_circular_factor * coeficiente_cantidad) * multiplicador_comercial",
                "config_variables_base": self._variables_bundle.config_variables_base if self._variables_bundle else None,
                "config_formula_editable_path": "data/stickers_circulares/formula_editable_config.json",
                "variables_principales_usadas": [
                    {
                        "key": "click_color",
                        "label": "Click color",
                        "value": formula_breakdown["click_color_base"],
                        "unit": "ARS",
                    },
                    {
                        "key": "multiplicador_general",
                        "label": "Multiplicador comercial general",
                        "value": formula_breakdown["multiplicador_comercial"],
                        "unit": "factor",
                    },
                    {
                        "key": "laca_uv_factor_stickers_circulares",
                        "label": "Factor Laca UV Stickers Circulares",
                        "value": formula_breakdown["laca_factor"],
                        "unit": "factor",
                    },
                    {
                        "key": "corte_circular_factor_stickers_circulares",
                        "label": "Factor corte circular Stickers Circulares",
                        "value": formula_breakdown["corte_factor"],
                        "unit": "factor",
                    },
                    {
                        "key": "multiplicador_comercial_stickers_circulares",
                        "label": "Multiplicador comercial Stickers Circulares",
                        "value": formula_breakdown["multiplicador_comercial"],
                        "unit": "factor",
                    },
                    {
                        "key": f"coeficiente_tamano_stickers_circulares_{str(request.formato).replace('-', '_').replace('/', '_')}",
                        "label": f"Coeficiente tamaño Stickers Circulares {request.formato}",
                        "value": formula_breakdown["coeficiente_tamano"],
                        "unit": "factor",
                    },
                    {
                        "key": f"coeficiente_cantidad_stickers_circulares_{request.cantidad_unidades}",
                        "label": f"Coeficiente cantidad Stickers Circulares {request.cantidad_unidades}",
                        "value": formula_breakdown["coeficiente_cantidad"],
                        "unit": "factor",
                    },
                ],
            },
        )

        return StickersCircularesQuoteResult(
            precio_unitario_sin_iva=unit,
            precio_unitario_con_urgencia=unit_u,
            cantidad_unidades=request.cantidad_unidades,
            cantidad_rango_aplicado=str(request.cantidad_unidades),
            total_sin_iva=total,
            total_con_urgencia=total_u,
            precio_sin_iva=unit,
            precio_con_recargo_urgencia=unit_u,
            regla_aplicada=(
                "STICKERS_CIRCULARES_FORMULA_EDITABLE_CALIBRADA_H8"
                if modo_precio == "formula_editable_calibrada"
                else "STICKERS_CIRCULARES_MATRIZ_PDF_HOJA_8"
            ),
            fuente="stickers_circulares_pdf_hoja_8_calibrado",
            trazabilidad=trace,
        )

    def quote_as_dict(self, request: StickersCircularesQuoteInput) -> dict[str, Any]:
        return asdict(self.quote(request))

    def health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "rama": "stickers_circulares",
            "combinaciones": len(self._index),
            "materiales": sorted(self._materials),
            "modo_precio_default": self._formula_config.get("modo_precio_default", "formula_editable_calibrada"),
        }

    def _validate(self, request: StickersCircularesQuoteInput) -> None:
        if request.categoria != "Stickers Circulares":
            raise QuoteInputError("categoria invalida")
        if request.producto != "sticker_circular":
            raise QuoteInputError("producto invalido")
        if request.material == "opp":
            raise QuoteInputError("material_opp_pendiente_datos")
        if request.material not in self._materials:
            raise QuoteInputError("material_no_soportado")
        if request.formato not in self._formatos:
            raise QuoteInputError("formato_no_soportado")
        if request.terminacion not in self._terminaciones:
            raise QuoteInputError("terminacion_no_soportada")
        if request.cantidad_unidades not in self.VALID_CANTIDADES:
            raise PriceNotFoundError("cantidad_fuera_de_matriz")
        if request.urgencia not in self.VALID_URGENCIA:
            raise QuoteInputError("urgencia_invalida")
        if request.modo_precio and request.modo_precio not in {"formula_editable_calibrada", "pdf_fijo"}:
            raise QuoteInputError("modo_precio_invalido")

    def _compute_formula_breakdown(self, request: StickersCircularesQuoteInput, overrides: dict[str, Any]) -> dict[str, float]:
        formula_config = self._current_formula_config()
        cfg = formula_config.get("variables", {})
        material_map = dict(cfg.get("material_base", {}))
        coef_tamano_map = dict(cfg.get("coeficiente_tamano", {}))
        coef_cantidad_map = dict(cfg.get("coeficiente_cantidad", {}))

        material_base = float(material_map[request.material])
        click_color_base = float(cfg.get("click_color_base", 0.0))
        laca_uv_factor = float(cfg.get("laca_uv_factor", 1.15))
        corte_circular_factor = float(cfg.get("corte_circular_factor", 1.0))
        multiplicador_comercial = float(cfg.get("multiplicador_comercial", 1.0))
        coeficiente_tamano = float(coef_tamano_map[request.formato])
        coeficiente_cantidad = float(coef_cantidad_map[str(request.cantidad_unidades)])

        if "click_color_base" in overrides:
            click_color_base = float(overrides["click_color_base"])
        if "laca_uv_factor" in overrides:
            laca_uv_factor = float(overrides["laca_uv_factor"])
        if "corte_circular_factor" in overrides:
            corte_circular_factor = float(overrides["corte_circular_factor"])
        if "multiplicador_comercial" in overrides:
            multiplicador_comercial = float(overrides["multiplicador_comercial"])
        if "laca_uv_factor_stickers_circulares" in overrides:
            laca_uv_factor = float(overrides["laca_uv_factor_stickers_circulares"])
        if "corte_circular_factor_stickers_circulares" in overrides:
            corte_circular_factor = float(overrides["corte_circular_factor_stickers_circulares"])
        if "multiplicador_comercial_stickers_circulares" in overrides:
            multiplicador_comercial = float(overrides["multiplicador_comercial_stickers_circulares"])
        size_override_key = f"coeficiente_tamano_stickers_circulares_{str(request.formato).replace('-', '_').replace('/', '_')}"
        quantity_override_key = f"coeficiente_cantidad_stickers_circulares_{request.cantidad_unidades}"
        if size_override_key in overrides:
            coeficiente_tamano = float(overrides[size_override_key])
        if quantity_override_key in overrides:
            coeficiente_cantidad = float(overrides[quantity_override_key])

        click_total = click_color_base * coeficiente_tamano
        laca_factor = laca_uv_factor if request.terminacion in {"con_laca_uv", "con_laca_uv_brillo"} else 1.0
        subtotal = (material_base + click_total) * laca_factor * corte_circular_factor * coeficiente_cantidad
        total_base = subtotal * multiplicador_comercial

        return {
            "material_base": material_base,
            "click_color_base": click_color_base,
            "click_total": click_total,
            "laca_factor": laca_factor,
            "corte_factor": corte_circular_factor,
            "coeficiente_tamano": coeficiente_tamano,
            "coeficiente_cantidad": coeficiente_cantidad,
            "multiplicador_comercial": multiplicador_comercial,
            "recargo_laca_uv_brillo_pct": round((laca_factor - 1.0) * 100.0, 6),
            "total_base_excel": total_base,
        }

    def _current_formula_config(self) -> dict[str, Any]:
        if self._formula_config_path is not None and self._formula_config_path.exists():
            formula_config = json.loads(self._formula_config_path.read_text(encoding="utf-8-sig"))
            return merge_global_base_costs(formula_config, self._project_root)
        return merge_global_base_costs(self._formula_config, self._project_root)

    @staticmethod
    def _normalize_material(material: str) -> str:
        normalized = str(material).strip().lower()
        mapping = {
            "fluo": "fluo_kraft_marron",
            "kraft_marron": "fluo_kraft_marron",
            "fluo_kraft_marron": "fluo_kraft_marron",
            "obra_ilustracion_90g": "obra_ilustracion_90g",
            "opp": "opp",
        }
        return mapping.get(normalized, material)

    @staticmethod
    def _normalize_terminacion(terminacion: str) -> str:
        normalized = str(terminacion).strip().lower()
        if normalized == "con_laca_uv_brillo":
            return "con_laca_uv"
        return normalized
