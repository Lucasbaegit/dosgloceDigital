"""Read-only graph descriptions for price traceability."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pricing_variables import PrincipalVariablesService, merge_global_base_costs


class PriceTraceGraphBuilder:
    LEGEND = {
        "variable_madre": "Editable si impacta hoy",
        "derivado": "Calculado desde otra variable o regla",
        "tabla_pdf": "Precio fijo PDF",
        "preparada": "Detectada/preparada, no conectada al cálculo actual",
        "bloqueado": "Sin datos confiables",
        "factor": "Factor o multiplicador de fórmula",
    }

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.variables = PrincipalVariablesService(project_root)

    def build(self, params: dict[str, str] | None = None) -> dict[str, Any]:
        params = params or {}
        case = self._normalize(params.get("caso") or params.get("producto") or "click_bajadas")
        if case in {"stickers_circulares", "circulares", "sticker_circular"}:
            graph = self._stickers_circulares_graph()
        elif case in {"autoadhesivas", "autoadhesivas_tinta_blanca", "tinta_blanca"}:
            graph = self._autoadhesivas_tinta_blanca_graph(params)
        elif case in {"tarjetas_9x5", "tarjetas", "tarjetas_personales"}:
            graph = self._tarjetas_9x5_graph()
        else:
            graph = self._click_bajadas_graph(params)
        graph["ok"] = True
        graph["legend"] = self.LEGEND
        return graph

    def _click_bajadas_graph(self, params: dict[str, str]) -> dict[str, Any]:
        variables = self._variables_by_key()
        click = variables.get("click_color", {})
        click_a3 = variables.get("click_color_a3_excel", {})
        a3_value = click_a3.get("value", 195)
        nodes = [
            self._node(
                "click_color",
                "Click color",
                "variable_madre",
                value=click.get("value"),
                unit=click.get("unit", "ARS"),
                editable_en_sistema=True,
                impacta_hoy=True,
                description="Variable madre operativa usada en fórmulas editables calibradas.",
                source=click.get("source_file"),
                operation="valor base editable",
                observation="En Bajadas sirve para visualizar dependencia futura/proporcional; el precio final actual sigue en matriz PDF.",
            ),
            self._node(
                "precio_click_A3",
                "Precio click A3",
                "derivado",
                value=a3_value,
                unit="ARS",
                editable_en_sistema=False,
                impacta_hoy=False,
                description="A3 es la base proporcional del click para derivar otros formatos.",
                source=click_a3.get("source_file", "Excel histórico"),
                operation="click_color escalado a base A3",
                observation="No es variable madre editable.",
            ),
            self._node(
                "precio_click_XL",
                "Precio click XL",
                "derivado",
                value=a3_value * 2 if isinstance(a3_value, (int, float)) else None,
                unit="ARS",
                editable_en_sistema=False,
                impacta_hoy=False,
                description="XL deriva desde A3.",
                source="regla visual de trazabilidad",
                operation="precio_click_A3 x 2",
                observation="XL deriva de A3, no directamente de click_color.",
            ),
            self._node(
                "precio_click_A4",
                "Precio click A4",
                "derivado",
                value=a3_value / 2 if isinstance(a3_value, (int, float)) else None,
                unit="ARS",
                editable_en_sistema=False,
                impacta_hoy=False,
                description="A4 deriva desde A3.",
                source="regla visual de trazabilidad",
                operation="precio_click_A3 x 0.5",
                observation="A4 deriva de A3, no directamente de click_color.",
            ),
            self._node(
                "precio_final_bajadas_pdf",
                "Precio final Bajadas",
                "tabla_pdf",
                value=None,
                unit="ARS",
                editable_en_sistema=False,
                impacta_hoy=False,
                description="Precio final actual tomado de matriz PDF.",
                source="data/bajadas_v2/precios_pdf_objetivo_limpio.json",
                operation="precio tomado directo de matriz PDF",
                observation="Las derivaciones de click se muestran como lectura técnica, no recalculan hoy la tabla fija.",
            ),
        ]
        edges = [
            self._edge("e_click_a3", "click_color", "precio_click_A3", "escala a A3"),
            self._edge("e_a3_xl", "precio_click_A3", "precio_click_XL", "x 2"),
            self._edge("e_a3_a4", "precio_click_A3", "precio_click_A4", "x 0.5"),
            self._edge("e_a3_pdf", "precio_click_A3", "precio_final_bajadas_pdf", "referencia técnica"),
        ]
        return {"producto": "Bajadas Fullcolor", "caso": "click_bajadas", "nodes": nodes, "edges": edges}

    def _stickers_circulares_graph(self) -> dict[str, Any]:
        variables = self._variables_by_key()
        config = merge_global_base_costs(
            self._read_json("data/stickers_circulares/formula_editable_config.json"),
            self.project_root,
        )
        factors = self._find_circular_factor()
        cfg_vars = config.get("variables", {})
        material_base = (cfg_vars.get("material_base") or {}).get("obra_ilustracion_90g")
        nodes = [
            self._node_from_variable("obra_90g", variables, value=material_base),
            self._node_from_variable("click_color", variables, value=cfg_vars.get("click_color_base")),
            self._node("laca_uv_factor", "Factor Laca UV", "factor", cfg_vars.get("laca_uv_factor"), "factor", False, True, "Factor de laca UV brillo para Stickers Circulares.", "data/stickers_circulares/formula_editable_config.json", "subtotal x factor", "No es variable madre; participa en fórmula calibrada."),
            self._node("corte_circular_factor", "Factor corte circular", "factor", cfg_vars.get("corte_circular_factor"), "factor", False, True, "Factor de corte circular.", "data/stickers_circulares/formula_editable_config.json", "subtotal x factor", "Derivado/configurado para la fórmula."),
            self._node("coeficiente_tamano", "Coeficiente tamaño 10cm", "factor", (cfg_vars.get("coeficiente_tamano") or {}).get("10cm"), "factor", False, True, "Coeficiente por diámetro/formato.", "data/stickers_circulares/formula_editable_config.json", "valor x coeficiente", "Coeficiente técnico, no variable madre."),
            self._node("coeficiente_cantidad", "Coeficiente cantidad 1000", "factor", (cfg_vars.get("coeficiente_cantidad") or {}).get("1000"), "factor", False, True, "Coeficiente por cantidad.", "data/stickers_circulares/formula_editable_config.json", "valor x coeficiente", "Coeficiente técnico, no variable madre."),
            self._node_from_variable("multiplicador_general", variables, value=cfg_vars.get("multiplicador_comercial")),
            self._node("subtotal_formula", "Subtotal fórmula", "derivado", factors.get("precio_base_excel"), "ARS", False, True, "Subtotal reconstruido antes de calibración PDF.", "data/stickers_circulares/factores_ajuste_pdf.json", "suma y multiplicación de componentes", "Base estimada por fórmula Excel reconstruida."),
            self._node("factor_ajuste_pdf", "Factor ajuste PDF", "factor", factors.get("factor_ajuste_pdf"), "factor", False, True, "Factor para calibrar contra PDF vigente.", "data/stickers_circulares/factores_ajuste_pdf.json", "subtotal x factor", "No es variable madre editable."),
            self._node("total_final", "Total final", "derivado", factors.get("precio_pdf_objetivo", 85980), "ARS", False, True, "Precio final publicado.", "lista-low.pdf hoja 8", "subtotal_formula x factor_ajuste_pdf", "Debe coincidir con PDF."),
        ]
        component_sources = ["obra_90g", "click_color", "laca_uv_factor", "corte_circular_factor", "coeficiente_tamano", "coeficiente_cantidad", "multiplicador_general"]
        edges = [self._edge(f"e_{source}_subtotal", source, "subtotal_formula", "compone") for source in component_sources]
        edges.extend([
            self._edge("e_subtotal_factor", "subtotal_formula", "factor_ajuste_pdf", "calibra"),
            self._edge("e_factor_total", "factor_ajuste_pdf", "total_final", "aplica"),
        ])
        return {"producto": "Stickers Circulares", "caso": "stickers_circulares_10cm_con_laca_1000", "nodes": nodes, "edges": edges}

    def _autoadhesivas_tinta_blanca_graph(self, params: dict[str, str]) -> dict[str, Any]:
        variables = self._variables_by_key()
        cantidad = int(params.get("cantidad") or 30)
        base = variables.get("adicional_tinta_blanca_base_1_copia", {}).get("value")
        subtotal = base * cantidad if isinstance(base, (int, float)) else None
        nodes = [
            self._node_from_variable("adicional_tinta_blanca_base_1_copia", variables),
            self._node("cantidad", f"Cantidad {cantidad}", "derivado", cantidad, "unidades", False, False, "Cantidad ingresada por el usuario.", "payload de cotización", "valor de entrada", "No es editable como variable madre."),
            self._node("subtotal_tinta_blanca", "Subtotal tinta blanca", "derivado", subtotal, "ARS", False, True, "Subtotal del adicional Tinta Blanca.", "data/bajadas_autoadhesivas/autoadhesivas_v1_config.json", "valor_base x cantidad", "Adicional proporcional operativo."),
            self._node("precio_final_autoadhesiva", "Precio final / adicional", "derivado", subtotal, "ARS", False, True, "Total adicional que se suma a la bajada autoadhesiva.", "motor Bajadas Autoadhesivas", "suma al precio base", "Si también hay Laca UV, ambos adicionales se acumulan."),
        ]
        edges = [
            self._edge("e_tinta_subtotal", "adicional_tinta_blanca_base_1_copia", "subtotal_tinta_blanca", "x cantidad"),
            self._edge("e_cantidad_subtotal", "cantidad", "subtotal_tinta_blanca", "multiplica"),
            self._edge("e_subtotal_final", "subtotal_tinta_blanca", "precio_final_autoadhesiva", "suma"),
        ]
        return {"producto": "Bajadas Autoadhesivas", "caso": "autoadhesivas_tinta_blanca", "nodes": nodes, "edges": edges}

    def _tarjetas_9x5_graph(self) -> dict[str, Any]:
        nodes = [
            self._node("matriz_pdf_tarjetas_9x5", "Matriz PDF Tarjetas 9x5", "tabla_pdf", None, None, False, False, "Tabla final de PDF página 12.", "data/tarjetas_9x5/precios_pdf_objetivo_tarjetas_9x5.json", "precio tomado directo de matriz PDF", "No hay variable madre editable para este precio final."),
            self._node("precio_final_5139", "Precio final 100 4/0", "tabla_pdf", 5139, "ARS", False, False, "100 tarjetas 9x5 sin laminar 4/0 300g.", "lista-low.pdf página 12", "precio tomado directo de matriz PDF", "Precio final cerrado por matriz PDF."),
            self._node("precio_final_48401", "Precio final 1000 mate 4/4", "tabla_pdf", 48401, "ARS", False, False, "1000 tarjetas 9x5 laminado mate 4/4 300g.", "lista-low.pdf página 12", "precio tomado directo de matriz PDF", "Terminación incluida en matriz final."),
        ]
        edges = [
            self._edge("e_matriz_5139", "matriz_pdf_tarjetas_9x5", "precio_final_5139", "lookup"),
            self._edge("e_matriz_48401", "matriz_pdf_tarjetas_9x5", "precio_final_48401", "lookup"),
        ]
        return {"producto": "Tarjetas 9x5", "caso": "tarjetas_9x5_pdf", "nodes": nodes, "edges": edges}

    def _node_from_variable(self, key: str, variables: dict[str, dict[str, Any]], value: Any | None = None) -> dict[str, Any]:
        raw = variables.get(key, {})
        return self._node(
            key,
            raw.get("label", key),
            "variable_madre",
            raw.get("value") if value is None else value,
            raw.get("unit"),
            bool(raw.get("impacta_hoy")),
            bool(raw.get("impacta_hoy")),
            raw.get("description", "Variable madre base."),
            raw.get("source_file"),
            "valor base editable",
            raw.get("impact", ""),
        )

    @staticmethod
    def _node(
        node_id: str,
        label: str,
        node_type: str,
        value: Any = None,
        unit: Any = None,
        editable_en_sistema: bool = False,
        impacta_hoy: bool = False,
        description: str | None = None,
        source: str | None = None,
        operation: str | None = None,
        observation: str | None = None,
    ) -> dict[str, Any]:
        return {
            "id": node_id,
            "label": PriceTraceGraphBuilder._clean_text(label),
            "type": node_type,
            "value": value,
            "unit": unit,
            "editable_en_sistema": editable_en_sistema,
            "impacta_hoy": impacta_hoy,
            "description": PriceTraceGraphBuilder._clean_text(description),
            "source": PriceTraceGraphBuilder._clean_text(source),
            "operation": PriceTraceGraphBuilder._clean_text(operation),
            "observation": PriceTraceGraphBuilder._clean_text(observation),
        }

    @staticmethod
    def _edge(edge_id: str, source: str, target: str, label: str) -> dict[str, str]:
        return {"id": edge_id, "source": source, "target": target, "label": label}

    def _variables_by_key(self) -> dict[str, dict[str, Any]]:
        grouped = self.variables.get_grouped()
        result: dict[str, dict[str, Any]] = {}
        for group in PrincipalVariablesService.GROUP_ORDER:
            for item in grouped.get(group, []):
                result[str(item.get("key"))] = item
        return result

    def _find_circular_factor(self) -> dict[str, Any]:
        rows = self._read_json("data/stickers_circulares/factores_ajuste_pdf.json")
        if isinstance(rows, dict):
            rows = rows.get("rows", [])
        for row in rows if isinstance(rows, list) else []:
            if (
                row.get("material") == "obra_ilustracion_90g"
                and row.get("formato") == "10cm"
                and row.get("terminacion") == "con_laca_uv"
                and row.get("cantidad_unidades") == 1000
            ):
                return row
        return {"precio_base_excel": None, "precio_pdf_objetivo": 85980, "factor_ajuste_pdf": None}

    def _read_json(self, relative: str) -> Any:
        return json.loads((self.project_root / relative).read_text(encoding="utf-8-sig"))

    @staticmethod
    def _normalize(value: str) -> str:
        return str(value or "").strip().lower().replace(" ", "_").replace("-", "_").replace("/", "_")

    @staticmethod
    def _clean_text(value: Any) -> Any:
        if not isinstance(value, str):
            return value
        replacements = {
            "ilustraci?n": "ilustración",
            "f?rmula": "fórmula",
            "configuraci?n": "configuración",
            "informaci?n": "información",
            "hist?rico": "histórico",
            "t?cnica": "técnica",
            "t?cnico": "técnico",
            "cotizaci?n": "cotización",
            "calibraci?n": "calibración",
            "p?gina": "página",
            "Terminaci?n": "Terminación",
        }
        cleaned = value
        for old, new in replacements.items():
            cleaned = cleaned.replace(old, new)
        return cleaned
