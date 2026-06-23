"""Controlled read/write access to principal commercial variables."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any


class PrincipalVariableError(ValueError):
    """Raised when a principal-variable request is invalid."""


class PrincipalVariablesService:
    GROUP_ORDER = ("tipo_cambio", "clicks", "papeles", "multiplicadores", "adicionales")

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backups_dir = project_root / "data" / "backups" / "variables_principales"
        self.prepared_variables_file = "data/variables_principales/variables_madre.json"
        self.catalog = {
            "tipo_cambio_usd": {
                "group": "tipo_cambio",
                "label": "Tipo de cambio USD",
                "unit": "ARS/USD",
                "description": "Tipo de cambio comercial de referencia.",
                "tipo": "variable_madre",
                "min": 1,
                "max": 100000,
                "step": 1,
                "source_file": "data/bajadas_v2/bajadas_v2_config_final.json",
                "path": ["dolar_actual"],
                "source_path": "dolar_actual",
                "applies_today": False,
                "confiabilidad": "alta",
                "productos_afectados": ["FÃ³rmulas variables futuras"],
                "impact": "Impacta costos expresados en USD cuando el producto usa fÃ³rmula variable; precios PDF fijos no cambian.",
            },
            "click_color": {
                "group": "clicks",
                "label": "Click color base",
                "unit": "ARS",
                "description": "Click color base usado en fÃ³rmulas variables calibradas.",
                "tipo": "variable_madre",
                "min": 0.01,
                "max": 100000,
                "step": 0.01,
                "source_file": "data/stickers_circulares/formula_editable_config.json",
                "path": ["variables", "click_color_base"],
                "source_path": "variables.click_color_base",
                "applies_today": True,
                "confiabilidad": "alta",
                "productos_afectados": ["Stickers Circulares"],
                "impact": "Cambia el precio base estimado y la trazabilidad de Stickers Circulares.",
            },
            "obra_90g": {
                "group": "papeles",
                "label": "Papel obra/ilustración 90g (Stickers Circulares)",
                "unit": "USD",
                "description": "Costo base real del material usado en fórmula editable de Stickers Circulares. No está conectado a Bajadas Autoadhesivas.",
                "tipo": "variable_madre",
                "min": 0.01,
                "max": 1000000,
                "step": 0.01,
                "source_file": "data/stickers_circulares/formula_editable_config.json",
                "path": ["variables", "material_base", "obra_ilustracion_90g"],
                "source_path": "variables.material_base.obra_ilustracion_90g",
                "applies_today": True,
                "confiabilidad": "alta",
                "productos_afectados": ["Stickers Circulares"],
                "impact": "Cambia el precio base estimado y la trazabilidad de Stickers Circulares.",
            },
            "multiplicador_general": {
                "group": "multiplicadores",
                "label": "Multiplicador comercial general",
                "unit": "factor",
                "description": "Multiplicador comercial general de fÃ³rmulas variables calibradas.",
                "tipo": "variable_madre",
                "min": 0.01,
                "max": 100,
                "step": 0.01,
                "source_file": "data/stickers_circulares/formula_editable_config.json",
                "path": ["variables", "multiplicador_comercial"],
                "source_path": "variables.multiplicador_comercial",
                "applies_today": True,
                "confiabilidad": "alta",
                "productos_afectados": ["Stickers Circulares"],
                "impact": "Cambia el precio base estimado y la trazabilidad de Stickers Circulares.",
            },
            "adicional_tinta_blanca_base_1_copia": {
                "group": "adicionales",
                "label": "Tinta blanca Autoadhesivas (1 copia)",
                "unit": "ARS/unidad",
                "description": "Valor unitario proporcional del adicional Tinta Blanca.",
                "tipo": "variable_madre",
                "min": 0.01,
                "max": 1000000,
                "step": 0.01,
                "source_file": "data/bajadas_autoadhesivas/autoadhesivas_v1_config.json",
                "path": ["adicional_tinta_blanca_base_1_copia"],
                "source_path": "adicional_tinta_blanca_base_1_copia",
                "applies_today": True,
                "confiabilidad": "alta",
                "productos_afectados": ["Bajadas Autoadhesivas"],
                "impact": "Cambia inmediatamente el adicional Tinta Blanca de Autoadhesivas.",
            },
        }
        self.expected_but_missing = [
            "click_bn",
            "ilustracion_150g",
            "ilustracion_200g",
            "ilustracion_250g",
            "ilustracion_300g",
            "ilustracion_350g",
            "obra_80g",
            "kraft_80g",
            "kraft_200g",
            "autoadhesivo_opp_blanco",
            "multiplicador_digital",
            "multiplicador_stickers",
            "multiplicador_tarjetas",
        ]
        self.detected_papers = {
            "Papeles Stickers Circulares": [
                "obra_90g",
            ],
            "Papeles Bajadas": [
                "obra_80g", "obra_90g", "ilustracion_90g", "ilustracion_115g", "ilustracion_150g",
                "ilustracion_200g", "ilustracion_250g", "ilustracion_300g", "ilustracion_350g",
                "triplex_350g", "kraft_80g", "kraft_200g",
            ],
            "Papeles Autoadhesivas": [
                "autoadhesivo_obra_90g", "autoadhesivo_ilustracion_90g", "opp_blanco", "opp_clear",
                "papel_kraft_marron", "papel_fluo",
            ],
            "Papeles Productos": [
                "papel_300g_ilustracion", "papel_150g_ilustracion", "papel_80g_ilustracion", "papel_63g_sobres",
            ],
        }
        self.detected_paper_variable_links = {
            ("Papeles Stickers Circulares", "obra_90g"): "obra_90g",
        }
        self._add_stickers_circulares_editable_variables()
        self._add_corte_recto_editable_variables(
            product_label="Stickers Corte Recto",
            source_file="data/stickers_corte_recto/formula_editable_config.json",
            laca_key="factor_laca_uv_stickers_corte_recto",
            corte_key="corte_recto_factor_stickers_corte_recto",
            multiplicador_key="multiplicador_comercial_stickers_corte_recto",
            coef_formato_prefix="coeficiente_formato_stickers_corte_recto",
            coef_cantidad_prefix="coeficiente_cantidad_stickers_corte_recto",
        )
        self._add_corte_recto_editable_variables(
            product_label="Imanes Corte Recto",
            source_file="data/imanes_corte_recto/formula_editable_config.json",
            laca_key="factor_laca_uv_imanes_corte_recto",
            corte_key="corte_recto_factor_imanes_corte_recto",
            multiplicador_key="multiplicador_comercial_imanes_corte_recto",
            coef_formato_prefix="coeficiente_formato_imanes_corte_recto",
            coef_cantidad_prefix="coeficiente_cantidad_imanes_corte_recto",
        )
        self._add_bajadas_autoadhesivas_editable_variables()
        self._add_tarjetas_pdf_editable_variables(
            product_label="Tarjetas 9x5",
            source_file="data/tarjetas_9x5/formula_editable_config.json",
            gramaje_key="factor_gramaje_tarjetas_9x5_350g",
            laca_key="factor_laca_uv_tarjetas_9x5",
            brillo_key="factor_laminado_brillo_tarjetas_9x5",
            mate_key="factor_laminado_mate_tarjetas_9x5",
            multiplicador_key="multiplicador_comercial_tarjetas_9x5",
            coef_cantidad_prefix="coeficiente_cantidad_tarjetas_9x5",
            coef_impresion_prefix="coeficiente_impresion_tarjetas_9x5",
        )
        self._add_tarjetas_pdf_editable_variables(
            product_label="Tarjetas Postales",
            source_file="data/tarjetas_postales/formula_editable_config.json",
            gramaje_key="factor_gramaje_tarjetas_postales_350g",
            laca_key="factor_laca_uv_tarjetas_postales",
            brillo_key="factor_laminado_brillo_tarjetas_postales",
            mate_key="factor_laminado_mate_tarjetas_postales",
            multiplicador_key="multiplicador_comercial_tarjetas_postales",
            coef_cantidad_prefix="coeficiente_cantidad_tarjetas_postales",
            coef_impresion_prefix="coeficiente_impresion_tarjetas_postales",
        )
        self._add_folletos_editable_variables()
        self._load_prepared_variables()

    def _add_stickers_circulares_editable_variables(self) -> None:
        """Expose calibrated Stickers Circulares formula parts as scoped variables."""
        cfg_path = self.project_root / "data" / "stickers_circulares" / "formula_editable_config.json"
        if not cfg_path.exists():
            return
        payload = self._read_json(cfg_path)
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return

        def add_variable(key: str, *, group: str, label: str, unit: str, path: list[str],
                         source_path: str, description: str, min_value: float, max_value: float,
                         step: float, impact: str) -> None:
            self.catalog[key] = {
                "group": group,
                "label": label,
                "unit": unit,
                "description": description,
                "tipo": "variable_madre",
                "min": min_value,
                "max": max_value,
                "step": step,
                "source_file": "data/stickers_circulares/formula_editable_config.json",
                "path": path,
                "source_path": source_path,
                "applies_today": True,
                "confiabilidad": "alta",
                "productos_afectados": ["Stickers Circulares"],
                "impact": impact,
            }

        common_note = (
            "Variable operativa exclusiva de Stickers Circulares. Cambia el subtotal tÃ©cnico "
            "de la fÃ³rmula editable calibrada; el precio final comercial se preserva contra PDF/lista "
            "mediante factor_ajuste_pdf por combinaciÃ³n."
        )
        add_variable(
            "laca_uv_factor_stickers_circulares",
            group="adicionales",
            label="Factor Laca UV Stickers Circulares",
            unit="factor",
            path=["variables", "laca_uv_factor"],
            source_path="variables.laca_uv_factor",
            description=common_note,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Modifica el subtotal tÃ©cnico cuando la cotizaciÃ³n circular usa Laca UV.",
        )
        add_variable(
            "corte_circular_factor_stickers_circulares",
            group="multiplicadores",
            label="Factor corte circular Stickers Circulares",
            unit="factor",
            path=["variables", "corte_circular_factor"],
            source_path="variables.corte_circular_factor",
            description=common_note,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Modifica el subtotal tÃ©cnico de todos los Stickers Circulares habilitados.",
        )
        add_variable(
            "multiplicador_comercial_stickers_circulares",
            group="multiplicadores",
            label="Multiplicador comercial Stickers Circulares",
            unit="factor",
            path=["variables", "multiplicador_comercial"],
            source_path="variables.multiplicador_comercial",
            description=common_note,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Modifica el subtotal tÃ©cnico comercial de Stickers Circulares antes de calibrar contra PDF.",
        )

        coef_tamano = variables.get("coeficiente_tamano", {})
        if isinstance(coef_tamano, dict):
            for formato in sorted(coef_tamano, key=str):
                safe = str(formato).replace("-", "_").replace("/", "_")
                add_variable(
                    f"coeficiente_tamano_stickers_circulares_{safe}",
                    group="multiplicadores",
                    label=f"Coeficiente tamaÃ±o Stickers Circulares {formato}",
                    unit="factor",
                    path=["variables", "coeficiente_tamano", str(formato)],
                    source_path=f"variables.coeficiente_tamano.{formato}",
                    description=f"{common_note} Aplica al formato {formato}.",
                    min_value=0.0001,
                    max_value=1000000,
                    step=0.0001,
                    impact=f"Modifica el subtotal tÃ©cnico solo para Stickers Circulares formato {formato}.",
                )

        coef_cantidad = variables.get("coeficiente_cantidad", {})
        if isinstance(coef_cantidad, dict):
            for cantidad in sorted(coef_cantidad, key=lambda value: int(value) if str(value).isdigit() else str(value)):
                add_variable(
                    f"coeficiente_cantidad_stickers_circulares_{cantidad}",
                    group="multiplicadores",
                    label=f"Coeficiente cantidad Stickers Circulares {cantidad}",
                    unit="factor",
                    path=["variables", "coeficiente_cantidad", str(cantidad)],
                    source_path=f"variables.coeficiente_cantidad.{cantidad}",
                    description=f"{common_note} Aplica a cantidad {cantidad}.",
                    min_value=0.0001,
                    max_value=1000000,
                    step=0.0001,
                    impact=f"Modifica el subtotal tÃ©cnico solo para Stickers Circulares cantidad {cantidad}.",
                )
    def _add_corte_recto_editable_variables(
        self,
        *,
        product_label: str,
        source_file: str,
        laca_key: str,
        corte_key: str,
        multiplicador_key: str,
        coef_formato_prefix: str,
        coef_cantidad_prefix: str,
    ) -> None:
        """Expose prepared calibrated formula parts for corte-recto products."""
        cfg_path = self.project_root / source_file
        if not cfg_path.exists():
            return
        payload = self._read_json(cfg_path)
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return

        def add_variable(key: str, *, group: str, label: str, unit: str, path: list[str],
                         source_path: str, description: str, min_value: float, max_value: float,
                         step: float, impact: str) -> None:
            self.catalog[key] = {
                "group": group,
                "label": label,
                "unit": unit,
                "description": description,
                "tipo": "variable_madre",
                "min": min_value,
                "max": max_value,
                "step": step,
                "source_file": source_file,
                "path": path,
                "source_path": source_path,
                "applies_today": True,
                "confiabilidad": "alta",
                "productos_afectados": [product_label],
                "impact": impact,
            }

        common_note = (
            f"Variable operativa exclusiva de {product_label}. Cambia el subtotal tecnico "
            "de la formula editable calibrada; el precio final comercial se preserva contra PDF/lista "
            "mediante factor_ajuste_pdf por combinacion."
        )
        add_variable(
            laca_key,
            group="adicionales",
            label=f"Factor Laca UV {product_label}",
            unit="factor",
            path=["variables", "laca_uv_factor"],
            source_path="variables.laca_uv_factor",
            description=common_note,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact=f"Modifica el subtotal tecnico cuando {product_label} usa Laca UV.",
        )
        add_variable(
            corte_key,
            group="multiplicadores",
            label=f"Factor corte recto {product_label}",
            unit="factor",
            path=["variables", "corte_recto_factor"],
            source_path="variables.corte_recto_factor",
            description=common_note,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact=f"Modifica el subtotal tecnico de {product_label}.",
        )
        add_variable(
            multiplicador_key,
            group="multiplicadores",
            label=f"Multiplicador comercial {product_label}",
            unit="factor",
            path=["variables", "multiplicador_comercial"],
            source_path="variables.multiplicador_comercial",
            description=common_note,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact=f"Modifica el subtotal tecnico comercial de {product_label} antes de calibrar contra PDF.",
        )

        coef_formato = variables.get("coeficiente_tamano", {})
        if isinstance(coef_formato, dict):
            for formato in sorted(coef_formato, key=str):
                safe = str(formato).replace("-", "_").replace("/", "_")
                add_variable(
                    f"{coef_formato_prefix}_{safe}",
                    group="multiplicadores",
                    label=f"Coeficiente formato {product_label} {formato}",
                    unit="factor",
                    path=["variables", "coeficiente_tamano", str(formato)],
                    source_path=f"variables.coeficiente_tamano.{formato}",
                    description=f"{common_note} Aplica al formato {formato}.",
                    min_value=0.0001,
                    max_value=1000000,
                    step=0.0001,
                    impact=f"Modifica el subtotal tecnico solo para {product_label} formato {formato}.",
                )

        coef_cantidad = variables.get("coeficiente_cantidad", {})
        if isinstance(coef_cantidad, dict):
            for cantidad in sorted(coef_cantidad, key=lambda value: int(value) if str(value).isdigit() else str(value)):
                add_variable(
                    f"{coef_cantidad_prefix}_{cantidad}",
                    group="multiplicadores",
                    label=f"Coeficiente cantidad {product_label} {cantidad}",
                    unit="factor",
                    path=["variables", "coeficiente_cantidad", str(cantidad)],
                    source_path=f"variables.coeficiente_cantidad.{cantidad}",
                    description=f"{common_note} Aplica a cantidad {cantidad}.",
                    min_value=0.0001,
                    max_value=1000000,
                    step=0.0001,
                    impact=f"Modifica el subtotal tecnico solo para {product_label} cantidad {cantidad}.",
                )


    def _add_bajadas_autoadhesivas_editable_variables(self) -> None:
        """Expose scoped technical variables for Bajadas and Autoadhesivas."""
        source_file = "data/bajadas_v2/formula_editable_config.json"
        cfg_path = self.project_root / source_file
        if not cfg_path.exists():
            return
        payload = self._read_json(cfg_path)
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return

        def add_variable(key: str, *, group: str, label: str, unit: str, path: list[str],
                         source_path: str, description: str, min_value: float, max_value: float,
                         step: float, impact: str, products: list[str]) -> None:
            self.catalog[key] = {
                "group": group,
                "label": label,
                "unit": unit,
                "description": description,
                "tipo": "variable_madre",
                "min": min_value,
                "max": max_value,
                "step": step,
                "source_file": source_file,
                "path": path,
                "source_path": source_path,
                "applies_today": True,
                "confiabilidad": "media",
                "productos_afectados": products,
                "impact": impact,
            }

        common = (
            "Variable técnica contextual de Bajadas/Autoadhesivas. Sirve para preview, "
            "trazabilidad y futuras fórmulas calibradas; el precio final base permanece "
            "validado contra PDF/lista salvo adicionales operativos explícitos."
        )
        add_variable(
            "factor_laca_uv_bajadas",
            group="adicionales",
            label="Factor Laca UV Bajadas",
            unit="factor",
            path=["variables", "factor_laca_uv_bajadas"],
            source_path="variables.factor_laca_uv_bajadas",
            description=common,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Documenta/calibra el adicional Laca UV por rango en Bajadas y Autoadhesivas.",
            products=["Bajadas Fullcolor/ByN", "Bajadas Autoadhesivas"],
        )
        add_variable(
            "factor_troquelado_digital_bajadas",
            group="adicionales",
            label="Factor Troquelado Digital Bajadas",
            unit="factor",
            path=["variables", "factor_troquelado_digital_bajadas"],
            source_path="variables.factor_troquelado_digital_bajadas",
            description=common,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Variable contextual del adicional Troquelado Digital aplicado a Bajadas.",
            products=["Bajadas Fullcolor/ByN", "Bajadas Kraft"],
        )
        add_variable(
            "factor_tinta_blanca_autoadhesivas",
            group="adicionales",
            label="Factor Tinta Blanca Autoadhesivas",
            unit="factor",
            path=["variables", "factor_tinta_blanca_autoadhesivas"],
            source_path="variables.factor_tinta_blanca_autoadhesivas",
            description=common,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Factor técnico complementario del adicional Tinta Blanca; la base operativa real sigue siendo el valor 1 copia.",
            products=["Bajadas Autoadhesivas"],
        )
        add_variable(
            "multiplicador_comercial_bajadas",
            group="multiplicadores",
            label="Multiplicador comercial Bajadas",
            unit="factor",
            path=["variables", "multiplicador_comercial_bajadas"],
            source_path="variables.multiplicador_comercial_bajadas",
            description=common,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Multiplicador técnico preparado para fórmulas futuras de Bajadas.",
            products=["Bajadas Fullcolor/ByN", "Bajadas Autoadhesivas", "Bajadas Kraft"],
        )

        for formato in sorted((variables.get("coeficiente_formato") or {}), key=str):
            safe = str(formato).replace("+", "plus").replace("-", "_").replace("/", "_")
            add_variable(
                f"coeficiente_formato_bajadas_{safe}",
                group="multiplicadores",
                label=f"Coeficiente formato Bajadas {formato}",
                unit="factor",
                path=["variables", "coeficiente_formato", str(formato)],
                source_path=f"variables.coeficiente_formato.{formato}",
                description=f"{common} Aplica al formato {formato}.",
                min_value=0.0001,
                max_value=1000000,
                step=0.0001,
                impact=f"Variable contextual para Bajadas formato {formato}.",
                products=["Bajadas Fullcolor/ByN", "Bajadas Autoadhesivas", "Bajadas Kraft"],
            )

        for rango in sorted((variables.get("coeficiente_rango") or {}), key=str):
            safe = str(rango).replace(" ", "_").replace("+", "plus").replace("-", "_")
            add_variable(
                f"coeficiente_rango_bajadas_{safe}",
                group="multiplicadores",
                label=f"Coeficiente rango Bajadas {rango}",
                unit="factor",
                path=["variables", "coeficiente_rango", str(rango)],
                source_path=f"variables.coeficiente_rango.{rango}",
                description=f"{common} Aplica al rango {rango}.",
                min_value=0.0001,
                max_value=1000000,
                step=0.0001,
                impact=f"Variable contextual para Bajadas rango {rango}.",
                products=["Bajadas Fullcolor/ByN", "Bajadas Autoadhesivas", "Bajadas Kraft"],
            )

    def _add_tarjetas_pdf_editable_variables(
        self,
        *,
        product_label: str,
        source_file: str,
        gramaje_key: str,
        laca_key: str,
        brillo_key: str,
        mate_key: str,
        multiplicador_key: str,
        coef_cantidad_prefix: str,
        coef_impresion_prefix: str,
    ) -> None:
        """Expose contextual variables for card products that keep PDF totals."""
        cfg_path = self.project_root / source_file
        if not cfg_path.exists():
            return
        payload = self._read_json(cfg_path)
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return

        def add_variable(key: str, *, group: str, label: str, unit: str, path: list[str],
                         source_path: str, description: str, min_value: float, max_value: float,
                         step: float, impact: str) -> None:
            self.catalog[key] = {
                "group": group,
                "label": label,
                "unit": unit,
                "description": description,
                "tipo": "variable_madre",
                "min": min_value,
                "max": max_value,
                "step": step,
                "source_file": source_file,
                "path": path,
                "source_path": source_path,
                "applies_today": True,
                "confiabilidad": "media",
                "productos_afectados": [product_label],
                "impact": impact,
            }

        common = (
            f"Variable contextual de {product_label}. Mantiene la matriz PDF/lista como "
            "precio final validado; se usa para preview, trazabilidad y futura fórmula calibrada."
        )
        add_variable(
            gramaje_key,
            group="multiplicadores",
            label=f"Factor gramaje 350g {product_label}",
            unit="factor",
            path=["variables", "factor_gramaje_350g"],
            source_path="variables.factor_gramaje_350g",
            description=f"{common} La regla comercial vigente para 350g es 1.10 sobre 300g.",
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Representa la regla comercial 350g = 300g + 10%.",
        )
        for key, label, path_name in [
            (laca_key, "Factor Laca UV", "factor_laca_uv"),
            (brillo_key, "Factor Laminado Brillo", "factor_laminado_brillo"),
            (mate_key, "Factor Laminado Mate", "factor_laminado_mate"),
        ]:
            add_variable(
                key,
                group="adicionales",
                label=f"{label} {product_label}",
                unit="factor",
                path=["variables", path_name],
                source_path=f"variables.{path_name}",
                description=common,
                min_value=0.01,
                max_value=100,
                step=0.001,
                impact=f"Variable contextual para terminación {label.lower()} en {product_label}.",
            )
        add_variable(
            multiplicador_key,
            group="multiplicadores",
            label=f"Multiplicador comercial {product_label}",
            unit="factor",
            path=["variables", next(key for key in variables if key.startswith("multiplicador_comercial"))],
            source_path=f"variables.{next(key for key in variables if key.startswith('multiplicador_comercial'))}",
            description=common,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact=f"Multiplicador contextual para {product_label}.",
        )
        for cantidad in sorted((variables.get("coeficiente_cantidad") or {}), key=lambda value: int(value)):
            add_variable(
                f"{coef_cantidad_prefix}_{cantidad}",
                group="multiplicadores",
                label=f"Coeficiente cantidad {product_label} {cantidad}",
                unit="factor",
                path=["variables", "coeficiente_cantidad", str(cantidad)],
                source_path=f"variables.coeficiente_cantidad.{cantidad}",
                description=f"{common} Aplica a cantidad {cantidad}.",
                min_value=0.0001,
                max_value=1000000,
                step=0.0001,
                impact=f"Variable contextual para {product_label} cantidad {cantidad}.",
            )
        for impresion in sorted((variables.get("coeficiente_impresion") or {}), key=str):
            safe = str(impresion).replace("/", "_")
            add_variable(
                f"{coef_impresion_prefix}_{safe}",
                group="multiplicadores",
                label=f"Coeficiente impresión {product_label} {impresion}",
                unit="factor",
                path=["variables", "coeficiente_impresion", str(impresion)],
                source_path=f"variables.coeficiente_impresion.{impresion}",
                description=f"{common} Aplica a impresión {impresion}.",
                min_value=0.0001,
                max_value=1000000,
                step=0.0001,
                impact=f"Variable contextual para {product_label} impresión {impresion}.",
            )

    def _add_folletos_editable_variables(self) -> None:
        """Expose contextual variables for Folletos PDF matrix product."""
        source_file = "data/folletos/formula_editable_config.json"
        cfg_path = self.project_root / source_file
        if not cfg_path.exists():
            return
        payload = self._read_json(cfg_path)
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return

        def add_variable(key: str, *, group: str, label: str, unit: str, path: list[str],
                         source_path: str, description: str, min_value: float, max_value: float,
                         step: float, impact: str) -> None:
            self.catalog[key] = {
                "group": group,
                "label": label,
                "unit": unit,
                "description": description,
                "tipo": "variable_madre",
                "min": min_value,
                "max": max_value,
                "step": step,
                "source_file": source_file,
                "path": path,
                "source_path": source_path,
                "applies_today": True,
                "confiabilidad": "media",
                "productos_afectados": ["Folletos"],
                "impact": impact,
            }

        common = (
            "Variable contextual de Folletos. La cotización final actual permanece "
            "validada contra PDF/lista; se usa para preview, trazabilidad y futura fórmula calibrada."
        )
        add_variable(
            "multiplicador_comercial_folletos",
            group="multiplicadores",
            label="Multiplicador comercial Folletos",
            unit="factor",
            path=["variables", "multiplicador_comercial_folletos"],
            source_path="variables.multiplicador_comercial_folletos",
            description=common,
            min_value=0.01,
            max_value=100,
            step=0.001,
            impact="Multiplicador contextual para Folletos.",
        )
        for family, prefix, label_base in [
            ("factor_papel", "factor_papel_folletos", "Factor papel Folletos"),
            ("factor_formato", "factor_formato_folletos", "Factor formato Folletos"),
            ("factor_color", "factor_color_folletos", "Factor color Folletos"),
            ("factor_impresion", "factor_impresion_folletos", "Factor impresión Folletos"),
            ("coeficiente_cantidad", "coeficiente_cantidad_folletos", "Coeficiente cantidad Folletos"),
        ]:
            values = variables.get(family, {})
            if not isinstance(values, dict):
                continue
            for raw_key in sorted(values, key=lambda value: int(value) if str(value).isdigit() else str(value)):
                safe = str(raw_key).replace("/", "_").replace("+", "plus").replace(" ", "_")
                add_variable(
                    f"{prefix}_{safe}",
                    group="multiplicadores",
                    label=f"{label_base} {raw_key}",
                    unit="factor",
                    path=["variables", family, str(raw_key)],
                    source_path=f"variables.{family}.{raw_key}",
                    description=f"{common} Aplica a {raw_key}.",
                    min_value=0.0001,
                    max_value=1000000,
                    step=0.0001,
                    impact=f"Variable contextual de Folletos para {raw_key}.",
                )


    def get_grouped(self) -> dict[str, Any]:
        grouped = {group: [] for group in self.GROUP_ORDER}
        for key, meta in self.catalog.items():
            item = deepcopy(meta)
            item.update({
                "key": key,
                "value": self._read_value(meta),
                "editable": True,
                "impacta_hoy": bool(meta.get("applies_today")),
                "confiabilidad": meta.get("confiabilidad", "alta"),
                "productos_afectados": meta.get("productos_afectados", []),
            })
            item.pop("path", None)
            item.pop("storage_file", None)
            grouped[meta["group"]].append(item)
        mother_variables = [item for group in self.GROUP_ORDER for item in grouped[group]]
        return {
            **grouped,
            "variables_madre_impactan_hoy": [item for item in mother_variables if item["impacta_hoy"]],
            "variables_madre_preparadas": [item for item in mother_variables if not item["impacta_hoy"]],
            "papeles_detectados": self._detected_papers_status(),
            "valores_derivados": self._derived_values_status(),
            "tablas_fijas_pdf": self._fixed_tables_status(),
            "variables_no_encontradas": list(self.expected_but_missing),
            "warning": "Solo se editan variables madre. Rangos, matrices PDF y precios finales son fijos o derivados.",
        }

    def ranges(self) -> dict[str, Any]:
        package = ["100", "200", "300", "500", "1000"]
        standard = ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500", "501 a 1000"]
        reason = "Los rangos pertenecen a matrices PDF cerradas"
        return {
            "rangos": [
                {"grupo": "Bajadas Fullcolor / Kraft", "rangos": standard, "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/bajadas_v2/precios_pdf_objetivo_limpio.json"},
                {"grupo": "Bajadas Blanco y Negro", "rangos": ["1", "2 a 50", "51 a 100", "101 a 500", "501 a 1000", "1001 a 5000"], "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/bajadas_v2/precios_pdf_objetivo_limpio.json"},
                {"grupo": "Autoadhesivas", "rangos": standard, "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/bajadas_autoadhesivas/autoadhesivas_v1_config.json"},
                {"grupo": "Troquelado Digital", "rangos": ["1 a 2", "3 a 9", "10 a 25", "26 a 50", "51 a 100", "mÃ¡s de 100"], "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/troquelado_digital/precios_pdf_objetivo_troquelado_digital.json"},
                {"grupo": "Tarjetas / Postales / Folletos / Stickers / Imanes", "rangos": package, "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "matrices PDF por producto"},
                {"grupo": "Carpetas", "rangos": standard, "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/carpetas/precios_pdf_objetivo_carpetas.json"},
                {"grupo": "Sobres", "rangos": package, "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/sobres/precios_pdf_objetivo_sobres.json"},
                {"grupo": "Plancha ImÃ¡n", "rangos": ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500"], "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/plancha_iman_impreso/precios_pdf_objetivo_plancha_iman_impreso.json"},
                {"grupo": "Agendas / Cuadernos", "rangos": ["desde 2 unidades", "mÃ­nimos segÃºn producto"], "editable": False, "tipo": "rango_fijo", "motivo": "Los mÃ­nimos pertenecen a matrices PDF cerradas", "fuente": "data/agendas_cuadernos/precios_pdf_objetivo_agendas_cuadernos.json"},
            ],
            "warning": "Rangos fijos de matrices. No son editables en esta etapa.",
        }

    def audit(self) -> dict[str, Any]:
        files = sorted({str(meta.get("storage_file", meta["source_file"])) for meta in self.catalog.values()})
        mtimes = {}
        for relative in files:
            path = self.project_root / relative
            mtimes[relative] = (
                datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat() if path.exists() else None
            )
        variables = self.get_grouped()
        mother_variables = [
            item
            for group in self.GROUP_ORDER
            for item in variables.get(group, [])
        ]
        found_config = [item for item in mother_variables if item.get("confiabilidad") == "alta"]
        found_excel = [item for item in mother_variables if item.get("confiabilidad") == "media"]
        discarded = self._prepared_discarded_variables()
        return {
            "ultima_modificacion_por_archivo": mtimes,
            "archivos_mapeados": files,
            "variables_editables_disponibles": sorted(self.catalog),
            "variables_madre_encontradas_config": found_config,
            "variables_madre_encontradas_excel": found_excel,
            "variables_preparadas_sin_impacto_actual": [item for item in mother_variables if not item.get("impacta_hoy")],
            "variables_descartadas_por_falta_de_valor": discarded,
            "variables_no_encontradas": list(self.expected_but_missing),
            "papeles_detectados_no_editables": self._detected_papers_status(),
            "papeles_detectados_solo_pdf": self._detected_papers_status(),
            "advertencias": [
                "No se exponen matrices PDF, factores de ajuste PDF ni coeficientes tÃ©cnicos internos.",
                "Los precios finales PDF fijos permanecen sin cambios.",
                "Las variables de confiabilidad media se guardan en JSON preparado y no impactan el motor actual.",
            ],
        }

    def _detected_papers_status(self) -> dict[str, list[dict[str, Any]]]:
        result = {}
        for family, keys in self.detected_papers.items():
            entries = []
            for key in keys:
                linked_variable = self.detected_paper_variable_links.get((family, key))
                linked_meta = self.catalog.get(linked_variable or "")
                is_editable_context = bool(linked_meta)
                entries.append({
                    "key": key,
                    "label": linked_meta["label"] if linked_meta else key.replace("_", " ").title(),
                    "editable": is_editable_context,
                    "tipo": "variable_madre" if is_editable_context else "detectado_sin_costo_base",
                    "unit": "USD",
                    "estado": "variable_madre_editable" if is_editable_context else "detectado_sin_costo_base_confiable",
                    "motivo_no_editable": None if is_editable_context else "Detectado en Excel/PDF, pero no existe costo base operativo conectado para esta familia.",
                    "impacta_hoy": is_editable_context,
                    "variables_madre_relacionadas": self._related_prepared_variables(key),
                    "variable_operativa": linked_variable,
                    "source_file": "data/variables_comerciales/papeles.json",
                })
            result[family] = entries
        return result

    def _load_prepared_variables(self) -> None:
        path = self.project_root / self.prepared_variables_file
        if not path.exists():
            return
        payload = self._read_json(path)
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return
        for key, raw in variables.items():
            if not isinstance(raw, dict):
                continue
            value = raw.get("value")
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                continue
            if str(raw.get("confiabilidad", "")).lower() not in {"alta", "media"}:
                continue
            meta = {
                "group": raw.get("group", "papeles"),
                "label": raw.get("label", key),
                "unit": raw.get("unit", "USD"),
                "description": raw.get("description", "Variable madre preparada desde auditorÃ­a."),
                "tipo": "variable_madre",
                "min": raw.get("min", 0.0001),
                "max": raw.get("max", 1000000),
                "step": raw.get("step", 0.0001),
                "source_file": raw.get("source_file", self.prepared_variables_file),
                "source_cell": raw.get("source_cell"),
                "source_path": raw.get("source_path") or f"variables.{key}.value",
                "storage_file": self.prepared_variables_file,
                "path": ["variables", key, "value"],
                "applies_today": bool(raw.get("impacta_hoy", False)),
                "confiabilidad": raw.get("confiabilidad", "media"),
                "productos_afectados": raw.get("productos_afectados", []),
                "impact": "Preparada para fÃ³rmulas variables futuras; no cambia precios actuales."
                if not raw.get("impacta_hoy", False)
                else raw.get("impact", "Impacta el cÃ¡lculo actual."),
            }
            if meta["group"] in self.GROUP_ORDER:
                self.catalog[key] = meta

    def _prepared_discarded_variables(self) -> list[dict[str, Any]]:
        path = self.project_root / self.prepared_variables_file
        if not path.exists():
            return []
        payload = self._read_json(path)
        discarded = payload.get("descartadas", [])
        return discarded if isinstance(discarded, list) else []

    def _related_prepared_variables(self, key: str) -> list[str]:
        normalized = key.replace("papel_", "").replace("autoadhesivo_", "")
        related = []
        for catalog_key, meta in self.catalog.items():
            if meta.get("confiabilidad") != "media":
                continue
            if key in catalog_key or normalized in catalog_key:
                related.append(catalog_key)
        return related

    @staticmethod
    def _derived_values_status() -> list[dict[str, Any]]:
        return [
            {"key": "precios_finales_por_rango", "label": "Precios finales por rango", "editable": False, "tipo": "derivado", "motivo_no_editable": "Son resultado de matrices PDF o fÃ³rmulas controladas.", "impacta_hoy": False},
            {"key": "recargos_urgencia", "label": "Precios con urgencia", "editable": False, "tipo": "derivado", "motivo_no_editable": "Se calculan desde la cotizaciÃ³n base y reglas internas.", "impacta_hoy": False},
        ]

    @staticmethod
    def _fixed_tables_status() -> list[dict[str, Any]]:
        return [
            {"key": "matrices_pdf_productos", "label": "Matrices PDF de productos", "editable": False, "tipo": "tabla_fija_pdf", "source_file": "data/*/precios_pdf_objetivo*.json", "motivo_no_editable": "Fuente final publicada; no se edita desde Variables principales."},
            {"key": "rangos_matrices", "label": "Rangos de matrices", "editable": False, "tipo": "tabla_fija_pdf", "source_file": "data/*", "motivo_no_editable": "Rangos fijos de lista de precios."},
        ]

    def update(self, payload: dict[str, Any]) -> dict[str, Any]:
        updates = payload.get("updates")
        if not isinstance(updates, list) or not updates:
            raise PrincipalVariableError("updates debe ser una lista no vacÃ­a.")

        prepared: list[tuple[str, float, dict[str, Any], float]] = []
        for raw in updates:
            if not isinstance(raw, dict):
                raise PrincipalVariableError("Cada update debe ser un objeto.")
            key = str(raw.get("key", "")).strip()
            if key not in self.catalog:
                raise PrincipalVariableError(f"variable_no_editable_o_inexistente:{key}")
            value = raw.get("value")
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise PrincipalVariableError(f"valor_no_numerico:{key}")
            numeric = float(value)
            meta = self.catalog[key]
            if numeric <= 0 or numeric < float(meta["min"]) or numeric > float(meta["max"]):
                raise PrincipalVariableError(f"valor_fuera_de_rango:{key}")
            prepared.append((key, numeric, meta, float(self._read_value(meta))))

        files = sorted({meta.get("storage_file", meta["source_file"]) for _, _, meta, _ in prepared})
        backups = [self._backup_file(relative) for relative in files]
        documents = {relative: self._read_json(self.project_root / relative) for relative in files}

        for _, value, meta, _ in prepared:
            self._set_nested(documents[meta.get("storage_file", meta["source_file"])], meta["path"], value)
        for relative, document in documents.items():
            self._write_json(self.project_root / relative, document)

        return {
            "updates": [
                {"key": key, "previous_value": previous, "new_value": value}
                for key, value, _, previous in prepared
            ],
            "archivos_modificados": files,
            "backups_generados": backups,
        }

    def reset(self, payload: dict[str, Any]) -> dict[str, Any]:
        backup_name = str(payload.get("backup_filename", "")).strip()
        if not backup_name or Path(backup_name).name != backup_name:
            raise PrincipalVariableError("backup_filename requerido y debe ser un nombre de archivo.")
        backup_path = self.backups_dir / backup_name
        if not backup_path.exists():
            raise PrincipalVariableError("backup_no_encontrado")
        backup = self._read_json(backup_path)
        source_file = str(backup.get("_variables_principales_source_file", ""))
        if source_file not in {meta.get("storage_file", meta["source_file"]) for meta in self.catalog.values()}:
            raise PrincipalVariableError("backup_incompatible")
        current_backup = self._backup_file(source_file)
        restored = deepcopy(backup)
        restored.pop("_variables_principales_source_file", None)
        restored.pop("_variables_principales_backup_at", None)
        self._write_json(self.project_root / source_file, restored)
        return {"archivo_restaurado": source_file, "backup_previo_generado": current_backup}

    def _read_value(self, meta: dict[str, Any]) -> float:
        data = self._read_json(self.project_root / meta.get("storage_file", meta["source_file"]))
        current: Any = data
        for part in meta["path"]:
            current = current[part]
        return float(current)

    def _backup_file(self, relative: str) -> str:
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        source = self.project_root / relative
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        destination = self.backups_dir / f"{stamp}_{source.name}"
        document = self._read_json(source)
        document["_variables_principales_source_file"] = relative
        document["_variables_principales_backup_at"] = datetime.now(timezone.utc).isoformat()
        self._write_json(destination, document)
        return str(destination.relative_to(self.project_root))

    @staticmethod
    def _set_nested(data: dict[str, Any], path: list[str], value: float) -> None:
        current = data
        for part in path[:-1]:
            current = current[part]
        current[path[-1]] = value

    @staticmethod
    def _read_json(path: Path) -> dict[str, Any]:
        return json.loads(path.read_text(encoding="utf-8-sig"))

    @staticmethod
    def _write_json(path: Path, data: dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
