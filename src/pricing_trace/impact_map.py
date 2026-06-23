"""Read-only map of commercial variable impact.

This module intentionally does not load or mutate pricing engines. It is an
administrative map that explains which variables, fixed tables and blockers are
connected to each product today.
"""

from __future__ import annotations

from copy import deepcopy
import json
from pathlib import Path
from typing import Any


class VariableImpactMap:
    """Build read-only responses for variable/product impact exploration."""

    LEGEND = {
        "impacta_hoy": "Cambiar este elemento modifica precios actuales si tambien es editable o parte activa del motor.",
        "documentado_no_conectado": "La relacion existe como logica historica o futura, pero hoy no recalcula el precio final.",
        "tabla_pdf_fija": "El precio final viene de una tabla PDF publicada, no de una variable editable.",
        "bloqueado": "No hay datos confiables suficientes para habilitar calculo o edicion.",
    }

    def __init__(self, project_root: Path):
        self.project_root = project_root

    def build(self) -> dict[str, Any]:
        relaciones = self._relations()
        variables = self._variables(relaciones)
        productos = self._products(relaciones)
        return {
            "ok": True,
            "version": "variables_impacto_v1",
            "variables": variables,
            "productos": productos,
            "relaciones": relaciones,
            "resumen": self._summary(relaciones, variables, productos),
            "leyenda": deepcopy(self.LEGEND),
        }

    def summary(self) -> dict[str, Any]:
        full = self.build()
        return {"ok": True, **full["resumen"]}

    def by_variable(self, variable_key: str) -> tuple[int, dict[str, Any]]:
        full = self.build()
        relaciones = [rel for rel in full["relaciones"] if rel["variable"] == variable_key]
        variable = next((item for item in full["variables"] if item["key"] == variable_key), None)
        if variable is None:
            return 404, {
                "ok": False,
                "error": "variable_no_encontrada",
                "detail": f"Variable no registrada en mapa de impacto: {variable_key}",
            }
        return 200, {
            "ok": True,
            "variable": variable_key,
            "variable_info": variable,
            "relaciones": relaciones,
            "leyenda": full["leyenda"],
        }

    def by_product(self, product_key: str) -> tuple[int, dict[str, Any]]:
        full = self.build()
        relaciones = [rel for rel in full["relaciones"] if rel["producto_key"] == product_key]
        product = next((item for item in full["productos"] if item["key"] == product_key), None)
        if product is None:
            return 404, {
                "ok": False,
                "error": "producto_no_encontrado",
                "detail": f"Producto no registrado en mapa de impacto: {product_key}",
            }
        return 200, {
            "ok": True,
            "producto": product_key,
            "producto_info": product,
            "relaciones": relaciones,
            "leyenda": full["leyenda"],
        }

    def _variables(self, relaciones: list[dict[str, Any]]) -> list[dict[str, Any]]:
        by_key: dict[str, dict[str, Any]] = {}
        for rel in relaciones:
            key = rel["variable"]
            by_key.setdefault(
                key,
                {
                    "key": key,
                    "label": rel["variable_label"],
                    "tipo": rel["tipo"],
                    "editable": rel["editable"],
                    "impacta_hoy": False,
                    "estado": rel["estado"],
                    "fuente": rel["fuente"],
                    "descripcion": rel["detalle"],
                },
            )
            by_key[key]["impacta_hoy"] = by_key[key]["impacta_hoy"] or bool(rel["impacta_hoy"])
            if rel["editable"]:
                by_key[key]["editable"] = True
            if rel["estado"] == "conectado":
                by_key[key]["estado"] = "conectado"
        return sorted(by_key.values(), key=lambda item: item["label"].lower())

    def _products(self, relaciones: list[dict[str, Any]]) -> list[dict[str, Any]]:
        by_key: dict[str, dict[str, Any]] = {}
        for rel in relaciones:
            key = rel["producto_key"]
            by_key.setdefault(
                key,
                {
                    "key": key,
                    "label": rel["producto"],
                    "estado": rel["producto_estado"],
                    "endpoint": rel["endpoint"],
                    "modo_precio": rel["modo_precio"],
                },
            )
            if rel["producto_estado"] == "bloqueado":
                by_key[key]["estado"] = "bloqueado"
        return sorted(by_key.values(), key=lambda item: item["label"].lower())

    def _summary(
        self,
        relaciones: list[dict[str, Any]],
        variables: list[dict[str, Any]],
        productos: list[dict[str, Any]],
    ) -> dict[str, Any]:
        return {
            "variables_editables": sum(1 for item in variables if item["editable"]),
            "productos_afectados": len(productos),
            "relaciones_conectadas": sum(1 for rel in relaciones if rel["impacta_hoy"]),
            "relaciones_documentadas_no_conectadas": sum(
                1 for rel in relaciones if not rel["impacta_hoy"] and rel["estado"] != "bloqueado"
            ),
            "productos_bloqueados": sum(1 for item in productos if item["estado"] == "bloqueado"),
            "preparados_no_conectados": sum(1 for rel in relaciones if rel["estado"] == "preparado_no_conectado"),
            "bloqueados": sum(1 for rel in relaciones if rel["estado"] == "bloqueado"),
        }

    @staticmethod
    def _rel(
        variable: str,
        variable_label: str,
        producto_key: str,
        producto: str,
        componente: str,
        *,
        impacta_hoy: bool,
        editable: bool,
        tipo: str,
        nivel_impacto: str,
        estado: str,
        detalle: str,
        ruta_calculo: list[str],
        fuente: str,
        endpoint: str,
        modo_precio: str,
        producto_estado: str = "activo",
        aplica_a: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "variable": variable,
            "variable_label": variable_label,
            "producto_key": producto_key,
            "producto": producto,
            "componente": componente,
            "impacta_hoy": impacta_hoy,
            "editable": editable,
            "tipo": tipo,
            "nivel_impacto": nivel_impacto,
            "estado": estado,
            "detalle": detalle,
            "ruta_calculo": ruta_calculo,
            "fuente": fuente,
            "endpoint": endpoint,
            "modo_precio": modo_precio,
            "producto_estado": producto_estado,
            "aplica_a": aplica_a or {},
        }

    def _relations(self) -> list[dict[str, Any]]:
        rel = self._rel
        relations = [
            rel(
                "click_color",
                "Click color",
                "stickers_circulares",
                "Stickers Circulares",
                "click / impresion",
                impacta_hoy=True,
                editable=True,
                tipo="variable_madre",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Usado por la formula editable calibrada de Stickers Circulares.",
                ruta_calculo=["click_color", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                fuente="data/stickers_circulares/formula_editable_config.json",
                endpoint="/stickers-circulares/cotizar",
                modo_precio="formula_editable_calibrada",
            ),
            rel(
                "obra_90g",
                "Papel obra/ilustracion 90g",
                "stickers_circulares",
                "Stickers Circulares",
                "material base",
                impacta_hoy=True,
                editable=True,
                tipo="variable_madre",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Costo base operativo dentro de la formula editable calibrada.",
                ruta_calculo=["obra_90g", "material", "subtotal_formula_excel", "precio_final"],
                fuente="data/stickers_circulares/formula_editable_config.json",
                endpoint="/stickers-circulares/cotizar",
                modo_precio="formula_editable_calibrada",
            ),
            rel(
                "multiplicador_general",
                "Multiplicador general",
                "stickers_circulares",
                "Stickers Circulares",
                "margen / multiplicador",
                impacta_hoy=True,
                editable=True,
                tipo="variable_madre",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Multiplicador comercial usado antes del factor de ajuste PDF.",
                ruta_calculo=["multiplicador_general", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                fuente="data/stickers_circulares/formula_editable_config.json",
                endpoint="/stickers-circulares/cotizar",
                modo_precio="formula_editable_calibrada",
            ),
            rel(
                "tipo_cambio_usd",
                "Tipo de cambio USD",
                "stickers_circulares",
                "Stickers Circulares",
                "conversion de costos historicos",
                impacta_hoy=True,
                editable=True,
                tipo="variable_madre",
                nivel_impacto="medio",
                estado="conectado",
                detalle="Variable madre operativa para costos base historicos expresados en USD.",
                ruta_calculo=["tipo_cambio_usd", "costos_base", "subtotal_formula_excel", "precio_final"],
                fuente="data/variables_principales/variables_madre.json",
                endpoint="/stickers-circulares/cotizar",
                modo_precio="formula_editable_calibrada",
            ),
            rel(
                "adicional_tinta_blanca_base_1_copia",
                "Tinta blanca base 1 copia",
                "bajadas_autoadhesivas",
                "Bajadas Autoadhesivas",
                "adicional tinta blanca",
                impacta_hoy=True,
                editable=True,
                tipo="variable_madre",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Base operativa proporcional por cantidad para el adicional de tinta blanca.",
                ruta_calculo=["adicional_tinta_blanca_base_1_copia", "cantidad", "subtotal_tinta_blanca", "precio_final"],
                fuente="data/bajadas_autoadhesivas/autoadhesivas_v1_config.json",
                endpoint="/bajadas-v2/cotizar",
                modo_precio="formula_adicional",
            ),
            rel(
                "rango_fijo",
                "Rango fijo",
                "bajadas_fullcolor_byn",
                "Bajadas Fullcolor/ByN",
                "rango por cantidad",
                impacta_hoy=True,
                editable=False,
                tipo="rango_fijo",
                nivel_impacto="medio",
                estado="conectado",
                detalle="El rango se usa para buscar precio y adicionales, pero no es editable desde variables madre.",
                ruta_calculo=["cantidad", "rango_fijo", "matriz_pdf", "precio_final"],
                fuente="data/bajadas_v2/bajadas_v2_config_final.json",
                endpoint="/bajadas-v2/cotizar",
                modo_precio="matriz_pdf",
            ),
            rel(
                "click_color",
                "Click color",
                "bajadas_fullcolor_byn",
                "Bajadas Fullcolor/ByN",
                "click / impresion",
                impacta_hoy=False,
                editable=True,
                tipo="variable_madre",
                nivel_impacto="medio",
                estado="preparado_no_conectado",
                detalle="Documentado para formulas futuras; el precio final actual de Bajadas Fullcolor/ByN sigue viniendo de matriz PDF.",
                ruta_calculo=["click_color", "derivado_A3", "referencia_tecnica", "matriz_pdf"],
                fuente="data/variables_principales/variables_madre.json",
                endpoint="/bajadas-v2/cotizar",
                modo_precio="matriz_pdf",
            ),
            rel(
                "tabla_pdf",
                "Tabla PDF",
                "bajadas_kraft",
                "Bajadas Kraft",
                "matriz comercial Kraft A3",
                impacta_hoy=True,
                editable=False,
                tipo="tabla_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Kraft A3 esta habilitado como rama PDF especifica; no depende de variables editables.",
                ruta_calculo=["tabla_pdf", "rango", "gramaje", "caras", "precio_final"],
                fuente="data/bajadas_v2/precios_pdf_objetivo_limpio.json",
                endpoint="/bajadas-v2/cotizar",
                modo_precio="matriz_pdf",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "tarjetas_9x5",
                "Tarjetas 9x5",
                "precios finales por paquete",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="La cotizacion usa tabla PDF fija; 350g aplica recargo documentado sobre base 300g.",
                ruta_calculo=["matriz_pdf", "cantidad", "terminacion", "caras", "precio_final"],
                fuente="data/tarjetas_9x5/precios_pdf_objetivo_tarjetas_9x5.json",
                endpoint="/tarjetas-9x5/cotizar",
                modo_precio="matriz_pdf_con_variables_detectadas",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "tarjetas_postales",
                "Tarjetas Postales",
                "precios finales por paquete",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="La cotizacion usa tabla PDF fija; 350g aplica recargo documentado sobre base 300g.",
                ruta_calculo=["matriz_pdf", "cantidad", "terminacion", "caras", "precio_final"],
                fuente="data/tarjetas_postales/precios_pdf_objetivo_tarjetas_postales.json",
                endpoint="/tarjetas-postales/cotizar",
                modo_precio="matriz_pdf_con_variables_detectadas",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "folletos",
                "Folletos",
                "precios finales por paquete",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Folletos usa tablas PDF fijas por papel, formato, modo color, caras y cantidad.",
                ruta_calculo=["matriz_pdf", "papel", "formato", "modo_color", "precio_final"],
                fuente="data/folletos/precios_pdf_objetivo_folletos.json",
                endpoint="/folletos/cotizar",
                modo_precio="matriz_pdf_con_variables_detectadas",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "carpetas",
                "Carpetas",
                "unitario por rango + solapa",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Carpetas usa unitario PDF por rango; solapa impresa se suma como adicional de la misma tabla.",
                ruta_calculo=["matriz_pdf", "rango", "terminacion", "solapa_impresa", "precio_final"],
                fuente="data/carpetas/precios_pdf_objetivo_carpetas.json",
                endpoint="/carpetas/cotizar",
                modo_precio="matriz_pdf_con_variables_detectadas",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "sobres",
                "Sobres",
                "unitario por cantidad",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Sobres usa precios PDF unitarios por tipo y cantidad.",
                ruta_calculo=["matriz_pdf", "tipo_sobre", "cantidad", "precio_final"],
                fuente="data/sobres/precios_pdf_objetivo_sobres.json",
                endpoint="/sobres/cotizar",
                modo_precio="matriz_pdf_con_variables_detectadas",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "stickers_corte_recto",
                "Stickers Corte Recto",
                "paquete por formato y laca",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Stickers corte recto usa matriz PDF fija por formato, cantidad y terminacion.",
                ruta_calculo=["matriz_pdf", "formato", "terminacion", "cantidad", "precio_final"],
                fuente="data/stickers_corte_recto/precios_pdf_objetivo_stickers_corte_recto.json",
                endpoint="/stickers-corte-recto/cotizar",
                modo_precio="formula_editable_calibrada",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "imanes_corte_recto",
                "Imanes Corte Recto",
                "paquete por formato y laca",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Imanes corte recto usa matriz PDF fija por formato, cantidad y terminacion.",
                ruta_calculo=["matriz_pdf", "formato", "terminacion", "cantidad", "precio_final"],
                fuente="data/imanes_corte_recto/precios_pdf_objetivo_imanes_corte_recto.json",
                endpoint="/imanes-corte-recto/cotizar",
                modo_precio="formula_editable_calibrada",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "tarjetas_troqueladas_circulares",
                "Tarjetas Troqueladas Circulares",
                "base PDF + laminado porcentual",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="La base sale de PDF; laminado brillo/mate aplica 10% o 20% como regla comercial.",
                ruta_calculo=["matriz_pdf", "laminado_porcentaje", "precio_final"],
                fuente="data/tarjetas_troqueladas_circulares/precios_pdf_objetivo_tarjetas_troqueladas_circulares.json",
                endpoint="/tarjetas-troqueladas-circulares/cotizar",
                modo_precio="matriz_pdf_con_regla_comercial",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "plancha_iman_impreso",
                "Plancha Iman",
                "precio por variante",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Plancha iman impreso usa caso confiable PDF hoja 16.",
                ruta_calculo=["matriz_pdf", "variante", "cantidad", "precio_final"],
                fuente="data/plancha_iman_impreso/precios_pdf_objetivo_plancha_iman_impreso.json",
                endpoint="/plancha-iman-impreso/cotizar",
                modo_precio="matriz_pdf_con_variables_detectadas",
            ),
            rel(
                "matriz_pdf",
                "Matriz PDF",
                "agendas_cuadernos",
                "Agendas/Cuadernos",
                "matriz de productos restantes",
                impacta_hoy=True,
                editable=False,
                tipo="matriz_pdf",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Agendas/Cuadernos usa matriz PDF implementada para casos confiables.",
                ruta_calculo=["matriz_pdf", "producto", "cantidad", "precio_final"],
                fuente="data/agendas_cuadernos/precios_pdf_objetivo_agendas_cuadernos.json",
                endpoint="/agendas-cuadernos/cotizar",
                modo_precio="matriz_pdf_con_variables_detectadas",
            ),
            rel(
                "factor_ajuste_pdf",
                "Factor ajuste PDF",
                "stickers_circulares",
                "Stickers Circulares",
                "calibracion contra PDF",
                impacta_hoy=True,
                editable=False,
                tipo="factor",
                nivel_impacto="alto",
                estado="conectado",
                detalle="Factor por combinacion que conserva el precio final PDF sobre la formula base editable.",
                ruta_calculo=["subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                fuente="data/stickers_circulares/comparativa_excel_vs_pdf.json",
                endpoint="/stickers-circulares/cotizar",
                modo_precio="formula_editable_calibrada",
            ),
            rel(
                "preparado_no_conectado",
                "Preparado no conectado",
                "folletos",
                "Folletos",
                "papeles y clicks historicos",
                impacta_hoy=False,
                editable=False,
                tipo="preparado_no_conectado",
                nivel_impacto="bajo",
                estado="preparado_no_conectado",
                detalle="Variables historicas detectadas, pero Folletos cotiza hoy desde tabla PDF fija.",
                ruta_calculo=["excel_historico", "variables_detectadas", "matriz_pdf"],
                fuente="data/folletos/folletos_excel_trace.json",
                endpoint="/folletos/cotizar",
                modo_precio="matriz_pdf_con_variables_detectadas",
            ),
            rel(
                "detectado_sin_costo_base",
                "Detectado sin costo base",
                "bajadas_fullcolor_byn",
                "Bajadas Fullcolor/ByN",
                "papeles detectados",
                impacta_hoy=False,
                editable=False,
                tipo="detectado_sin_costo_base",
                nivel_impacto="bajo",
                estado="preparado_no_conectado",
                detalle="Materiales detectados en tablas, sin costo base confiable editable conectado.",
                ruta_calculo=["papeles_detectados", "sin_costo_base", "matriz_pdf"],
                fuente="data/variables_principales/variables_madre.json",
                endpoint="/bajadas-v2/cotizar",
                modo_precio="matriz_pdf",
            ),
            rel(
                "bloqueado",
                "Bloqueado",
                "membretes",
                "Membretes bloqueado",
                "tabla incompleta",
                impacta_hoy=False,
                editable=False,
                tipo="bloqueado",
                nivel_impacto="critico",
                estado="bloqueado",
                detalle="No hay tabla de precios PDF confiable para habilitar Membretes.",
                ruta_calculo=["pdf_pagina_14", "precios_no_legibles", "bloqueado"],
                fuente="docs/auditorias/membretes_bloqueado_por_falta_de_datos.md",
                endpoint="/membretes/cotizar",
                modo_precio="bloqueado",
                producto_estado="bloqueado",
            ),
            rel(
                "bloqueado",
                "Bloqueado",
                "opp_stickers_circulares",
                "OPP bloqueado",
                "material OPP",
                impacta_hoy=False,
                editable=False,
                tipo="bloqueado",
                nivel_impacto="critico",
                estado="bloqueado",
                detalle="OPP aparece como material esperado, pero no tiene precio confiable completo.",
                ruta_calculo=["material_opp", "falta_precio_confiable", "bloqueado"],
                fuente="data/stickers_circulares/stickers_circulares_excel_trace.json",
                endpoint="/stickers-circulares/cotizar",
                modo_precio="bloqueado",
                producto_estado="bloqueado",
            ),
        ]
        relations.extend(self._stickers_circulares_editable_relations())
        relations.extend(self._corte_recto_editable_relations(
            product_key="stickers_corte_recto",
            product_label="Stickers Corte Recto",
            source_file="data/stickers_corte_recto/formula_editable_config.json",
            endpoint="/stickers-corte-recto/cotizar",
            laca_key="factor_laca_uv_stickers_corte_recto",
            laca_label="Factor Laca UV Stickers Corte Recto",
            corte_key="corte_recto_factor_stickers_corte_recto",
            corte_label="Factor corte recto Stickers Corte Recto",
            multiplicador_key="multiplicador_comercial_stickers_corte_recto",
            multiplicador_label="Multiplicador comercial Stickers Corte Recto",
            coef_formato_prefix="coeficiente_formato_stickers_corte_recto",
            coef_cantidad_prefix="coeficiente_cantidad_stickers_corte_recto",
        ))
        relations.extend(self._corte_recto_editable_relations(
            product_key="imanes_corte_recto",
            product_label="Imanes Corte Recto",
            source_file="data/imanes_corte_recto/formula_editable_config.json",
            endpoint="/imanes-corte-recto/cotizar",
            laca_key="factor_laca_uv_imanes_corte_recto",
            laca_label="Factor Laca UV Imanes Corte Recto",
            corte_key="corte_recto_factor_imanes_corte_recto",
            corte_label="Factor corte recto Imanes Corte Recto",
            multiplicador_key="multiplicador_comercial_imanes_corte_recto",
            multiplicador_label="Multiplicador comercial Imanes Corte Recto",
            coef_formato_prefix="coeficiente_formato_imanes_corte_recto",
            coef_cantidad_prefix="coeficiente_cantidad_imanes_corte_recto",
        ))
        relations.extend(self._bajadas_editable_relations())
        relations.extend(self._tarjetas_editable_relations(
            product_key="tarjetas_9x5",
            product_label="Tarjetas 9x5",
            source_file="data/tarjetas_9x5/formula_editable_config.json",
            endpoint="/tarjetas-9x5/cotizar",
            gramaje_key="factor_gramaje_tarjetas_9x5_350g",
            laca_key="factor_laca_uv_tarjetas_9x5",
            brillo_key="factor_laminado_brillo_tarjetas_9x5",
            mate_key="factor_laminado_mate_tarjetas_9x5",
            multiplicador_key="multiplicador_comercial_tarjetas_9x5",
            coef_cantidad_prefix="coeficiente_cantidad_tarjetas_9x5",
            coef_impresion_prefix="coeficiente_impresion_tarjetas_9x5",
        ))
        relations.extend(self._tarjetas_editable_relations(
            product_key="tarjetas_postales",
            product_label="Tarjetas Postales",
            source_file="data/tarjetas_postales/formula_editable_config.json",
            endpoint="/tarjetas-postales/cotizar",
            gramaje_key="factor_gramaje_tarjetas_postales_350g",
            laca_key="factor_laca_uv_tarjetas_postales",
            brillo_key="factor_laminado_brillo_tarjetas_postales",
            mate_key="factor_laminado_mate_tarjetas_postales",
            multiplicador_key="multiplicador_comercial_tarjetas_postales",
            coef_cantidad_prefix="coeficiente_cantidad_tarjetas_postales",
            coef_impresion_prefix="coeficiente_impresion_tarjetas_postales",
        ))
        relations.extend(self._folletos_editable_relations())
        relations.extend(self._productos_restantes_editable_relations())
        return relations

    def _stickers_circulares_editable_relations(self) -> list[dict[str, Any]]:
        config_path = self.project_root / "data" / "stickers_circulares" / "formula_editable_config.json"
        if not config_path.exists():
            return []
        try:
            payload = json.loads(config_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError):
            return []
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return []

        rel = self._rel
        common = {
            "producto_key": "stickers_circulares",
            "producto": "Stickers Circulares",
            "impacta_hoy": True,
            "editable": True,
            "tipo": "variable_madre",
            "nivel_impacto": "alto",
            "estado": "conectado",
            "fuente": "data/stickers_circulares/formula_editable_config.json",
            "endpoint": "/stickers-circulares/cotizar",
            "modo_precio": "formula_editable_calibrada",
        }
        relations = [
            rel(
                "laca_uv_factor_stickers_circulares",
                "Factor Laca UV Stickers Circulares",
                componente="laca UV",
                detalle="Factor editable usado cuando Stickers Circulares cotiza con Laca UV; el precio final queda calibrado contra PDF.",
                ruta_calculo=["laca_uv_factor", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                aplica_a={"terminaciones": ["con_laca_uv", "con_laca_uv_brillo"]},
                **common,
            ),
            rel(
                "corte_circular_factor_stickers_circulares",
                "Factor corte circular Stickers Circulares",
                componente="corte circular",
                detalle="Factor editable del corte circular para la familia Stickers Circulares.",
                ruta_calculo=["corte_circular_factor", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                **common,
            ),
            rel(
                "multiplicador_comercial_stickers_circulares",
                "Multiplicador comercial Stickers Circulares",
                componente="multiplicador comercial",
                detalle="Multiplicador editable propio de Stickers Circulares antes de la calibración PDF.",
                ruta_calculo=["multiplicador_comercial", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                **common,
            ),
        ]

        coef_tamano = variables.get("coeficiente_tamano", {})
        if isinstance(coef_tamano, dict):
            for formato in sorted(coef_tamano, key=str):
                safe = str(formato).replace("-", "_").replace("/", "_")
                relations.append(rel(
                    f"coeficiente_tamano_stickers_circulares_{safe}",
                    f"Coeficiente tamaño Stickers Circulares {formato}",
                    componente=f"coeficiente tamaño {formato}",
                    detalle=f"Coeficiente editable que aplica solo al formato {formato} de Stickers Circulares.",
                    ruta_calculo=[f"coeficiente_tamano.{formato}", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                    aplica_a={"formatos": [str(formato)]},
                    **common,
                ))

        coef_cantidad = variables.get("coeficiente_cantidad", {})
        if isinstance(coef_cantidad, dict):
            for cantidad in sorted(coef_cantidad, key=lambda value: (0, int(value)) if str(value).isdigit() else (1, str(value))):
                relations.append(rel(
                    f"coeficiente_cantidad_stickers_circulares_{cantidad}",
                    f"Coeficiente cantidad Stickers Circulares {cantidad}",
                    componente=f"coeficiente cantidad {cantidad}",
                    detalle=f"Coeficiente editable que aplica solo a cantidad {cantidad} de Stickers Circulares.",
                    ruta_calculo=[f"coeficiente_cantidad.{cantidad}", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                    aplica_a={"cantidades": [int(cantidad) if str(cantidad).isdigit() else str(cantidad)]},
                    **common,
                ))
        return relations

    def _bajadas_editable_relations(self) -> list[dict[str, Any]]:
        source_file = "data/bajadas_v2/formula_editable_config.json"
        config_path = self.project_root / source_file
        if not config_path.exists():
            return []
        try:
            payload = json.loads(config_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError):
            return []
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return []

        rel = self._rel
        common = {
            "impacta_hoy": True,
            "editable": True,
            "tipo": "variable_madre",
            "nivel_impacto": "medio",
            "estado": "conectado",
            "fuente": source_file,
            "endpoint": "/bajadas-v2/cotizar",
            "modo_precio": "matriz_pdf_con_variables_detectadas",
        }
        relations = [
            rel(
                "factor_laca_uv_bajadas",
                "Factor Laca UV Bajadas",
                "bajadas_fullcolor_byn",
                "Bajadas Fullcolor/ByN",
                "laca UV",
                detalle="Factor contextual para la escala Laca UV. El precio final base sigue calibrado por PDF/lista.",
                ruta_calculo=["factor_laca_uv_bajadas", "laca_uv", "matriz_pdf", "precio_final"],
                aplica_a={"adicionales": ["laca"], "terminaciones": ["laca"]},
                **common,
            ),
            rel(
                "factor_laca_uv_bajadas",
                "Factor Laca UV Bajadas",
                "bajadas_autoadhesivas",
                "Bajadas Autoadhesivas",
                "laca UV",
                detalle="Factor contextual para Laca UV en Autoadhesivas. La escala validada por rango permanece como fuente comercial.",
                ruta_calculo=["factor_laca_uv_bajadas", "laca_uv", "matriz_pdf", "precio_final"],
                aplica_a={"adicionales": ["laca", "adicional_laca_uv"]},
                **common,
            ),
            rel(
                "factor_troquelado_digital_bajadas",
                "Factor Troquelado Digital Bajadas",
                "bajadas_fullcolor_byn",
                "Bajadas Fullcolor/ByN",
                "troquelado digital",
                detalle="Factor contextual del adicional Troquelado Digital.",
                ruta_calculo=["factor_troquelado_digital_bajadas", "troquelado", "precio_final"],
                aplica_a={"adicionales": ["troquelado_digital"]},
                **common,
            ),
            rel(
                "factor_troquelado_digital_bajadas",
                "Factor Troquelado Digital Bajadas",
                "bajadas_kraft",
                "Bajadas Kraft",
                "troquelado digital",
                detalle="Factor contextual del adicional Troquelado Digital sobre Kraft.",
                ruta_calculo=["factor_troquelado_digital_bajadas", "troquelado", "precio_final"],
                aplica_a={"adicionales": ["troquelado_digital"]},
                **common,
            ),
            rel(
                "factor_tinta_blanca_autoadhesivas",
                "Factor Tinta Blanca Autoadhesivas",
                "bajadas_autoadhesivas",
                "Bajadas Autoadhesivas",
                "tinta blanca",
                detalle="Factor técnico contextual de Tinta Blanca; la base operativa real es adicional_tinta_blanca_base_1_copia.",
                ruta_calculo=["factor_tinta_blanca_autoadhesivas", "tinta_blanca", "precio_final"],
                aplica_a={"adicionales": ["tinta_blanca", "adicional_tinta_blanca"]},
                **common,
            ),
            rel(
                "multiplicador_comercial_bajadas",
                "Multiplicador comercial Bajadas",
                "bajadas_fullcolor_byn",
                "Bajadas Fullcolor/ByN",
                "multiplicador comercial",
                detalle="Multiplicador contextual preparado para futuras fórmulas de Bajadas.",
                ruta_calculo=["multiplicador_comercial_bajadas", "base_tecnica", "matriz_pdf"],
                **common,
            ),
            rel(
                "multiplicador_comercial_bajadas",
                "Multiplicador comercial Bajadas",
                "bajadas_autoadhesivas",
                "Bajadas Autoadhesivas",
                "multiplicador comercial",
                detalle="Multiplicador contextual preparado para futuras fórmulas de Autoadhesivas.",
                ruta_calculo=["multiplicador_comercial_bajadas", "base_tecnica", "matriz_pdf"],
                **common,
            ),
        ]
        for formato in sorted((variables.get("coeficiente_formato") or {}), key=str):
            safe = str(formato).replace("+", "plus").replace("-", "_").replace("/", "_")
            for product_key, product_label in [
                ("bajadas_fullcolor_byn", "Bajadas Fullcolor/ByN"),
                ("bajadas_autoadhesivas", "Bajadas Autoadhesivas"),
                ("bajadas_kraft", "Bajadas Kraft"),
            ]:
                relations.append(rel(
                    f"coeficiente_formato_bajadas_{safe}",
                    f"Coeficiente formato Bajadas {formato}",
                    product_key,
                    product_label,
                    f"formato {formato}",
                    detalle=f"Coeficiente contextual para formato {formato}.",
                    ruta_calculo=[f"coeficiente_formato.{formato}", "base_tecnica", "matriz_pdf"],
                    aplica_a={"formatos": [str(formato)]},
                    **common,
                ))
        for rango in sorted((variables.get("coeficiente_rango") or {}), key=str):
            safe = str(rango).replace(" ", "_").replace("+", "plus").replace("-", "_")
            for product_key, product_label in [
                ("bajadas_fullcolor_byn", "Bajadas Fullcolor/ByN"),
                ("bajadas_autoadhesivas", "Bajadas Autoadhesivas"),
                ("bajadas_kraft", "Bajadas Kraft"),
            ]:
                relations.append(rel(
                    f"coeficiente_rango_bajadas_{safe}",
                    f"Coeficiente rango Bajadas {rango}",
                    product_key,
                    product_label,
                    f"rango {rango}",
                    detalle=f"Coeficiente contextual para rango {rango}.",
                    ruta_calculo=[f"coeficiente_rango.{rango}", "base_tecnica", "matriz_pdf"],
                    aplica_a={"rangos": [str(rango)]},
                    **common,
                ))
        return relations

    def _tarjetas_editable_relations(
        self,
        *,
        product_key: str,
        product_label: str,
        source_file: str,
        endpoint: str,
        gramaje_key: str,
        laca_key: str,
        brillo_key: str,
        mate_key: str,
        multiplicador_key: str,
        coef_cantidad_prefix: str,
        coef_impresion_prefix: str,
    ) -> list[dict[str, Any]]:
        config_path = self.project_root / source_file
        if not config_path.exists():
            return []
        try:
            payload = json.loads(config_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError):
            return []
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return []
        rel = self._rel
        common = {
            "producto_key": product_key,
            "producto": product_label,
            "impacta_hoy": True,
            "editable": True,
            "tipo": "variable_madre",
            "nivel_impacto": "medio",
            "estado": "conectado",
            "fuente": source_file,
            "endpoint": endpoint,
            "modo_precio": "matriz_pdf_con_variables_detectadas",
        }
        relations = [
            rel(
                gramaje_key,
                f"Factor gramaje 350g {product_label}",
                componente="gramaje 350g",
                detalle="Regla contextual vigente 350g = 300g + 10%.",
                ruta_calculo=["factor_gramaje_350g", "precio_300g", "precio_final"],
                aplica_a={"gramajes": ["350g"]},
                **common,
            ),
            rel(
                laca_key,
                f"Factor Laca UV {product_label}",
                componente="laca UV",
                detalle="Factor contextual para terminación Laca UV; matriz PDF sigue siendo fuente final.",
                ruta_calculo=["factor_laca_uv", "terminacion", "matriz_pdf"],
                aplica_a={"terminaciones": ["laca_uv"]},
                **common,
            ),
            rel(
                brillo_key,
                f"Factor Laminado Brillo {product_label}",
                componente="laminado brillo",
                detalle="Factor contextual para terminación Laminado Brillo; matriz PDF sigue siendo fuente final.",
                ruta_calculo=["factor_laminado_brillo", "terminacion", "matriz_pdf"],
                aplica_a={"terminaciones": ["laminado_brillo"]},
                **common,
            ),
            rel(
                mate_key,
                f"Factor Laminado Mate {product_label}",
                componente="laminado mate",
                detalle="Factor contextual para terminación Laminado Mate; matriz PDF sigue siendo fuente final.",
                ruta_calculo=["factor_laminado_mate", "terminacion", "matriz_pdf"],
                aplica_a={"terminaciones": ["laminado_mate"]},
                **common,
            ),
            rel(
                multiplicador_key,
                f"Multiplicador comercial {product_label}",
                componente="multiplicador comercial",
                detalle="Multiplicador contextual para futuras fórmulas calibradas.",
                ruta_calculo=["multiplicador_comercial", "base_tecnica", "matriz_pdf"],
                **common,
            ),
        ]
        for cantidad in sorted((variables.get("coeficiente_cantidad") or {}), key=lambda value: int(value)):
            relations.append(rel(
                f"{coef_cantidad_prefix}_{cantidad}",
                f"Coeficiente cantidad {product_label} {cantidad}",
                componente=f"cantidad {cantidad}",
                detalle=f"Coeficiente contextual para cantidad {cantidad}.",
                ruta_calculo=[f"coeficiente_cantidad.{cantidad}", "base_tecnica", "matriz_pdf"],
                aplica_a={"cantidades": [int(cantidad)]},
                **common,
            ))
        for impresion in sorted((variables.get("coeficiente_impresion") or {}), key=str):
            safe = str(impresion).replace("/", "_")
            relations.append(rel(
                f"{coef_impresion_prefix}_{safe}",
                f"Coeficiente impresión {product_label} {impresion}",
                componente=f"impresión {impresion}",
                detalle=f"Coeficiente contextual para impresión {impresion}.",
                ruta_calculo=[f"coeficiente_impresion.{impresion}", "base_tecnica", "matriz_pdf"],
                aplica_a={"caras": [str(impresion)]},
                **common,
            ))
        return relations

    def _folletos_editable_relations(self) -> list[dict[str, Any]]:
        source_file = "data/folletos/formula_editable_config.json"
        config_path = self.project_root / source_file
        if not config_path.exists():
            return []
        try:
            payload = json.loads(config_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError):
            return []
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return []
        rel = self._rel
        common = {
            "producto_key": "folletos",
            "producto": "Folletos",
            "impacta_hoy": True,
            "editable": True,
            "tipo": "variable_madre",
            "nivel_impacto": "medio",
            "estado": "conectado",
            "fuente": source_file,
            "endpoint": "/folletos/cotizar",
            "modo_precio": "matriz_pdf_con_variables_detectadas",
        }
        relations = [
            rel(
                "multiplicador_comercial_folletos",
                "Multiplicador comercial Folletos",
                componente="multiplicador comercial",
                detalle="Multiplicador contextual para futuras fórmulas calibradas de Folletos.",
                ruta_calculo=["multiplicador_comercial_folletos", "base_tecnica", "matriz_pdf"],
                **common,
            )
        ]
        family_meta = {
            "factor_papel": ("factor_papel_folletos", "Factor papel Folletos", "gramajes"),
            "factor_formato": ("factor_formato_folletos", "Factor formato Folletos", "formatos"),
            "factor_color": ("factor_color_folletos", "Factor color Folletos", "modo_color"),
            "factor_impresion": ("factor_impresion_folletos", "Factor impresión Folletos", "caras"),
            "coeficiente_cantidad": ("coeficiente_cantidad_folletos", "Coeficiente cantidad Folletos", "cantidades"),
        }
        for family, (prefix, label, scope_key) in family_meta.items():
            values = variables.get(family, {})
            if not isinstance(values, dict):
                continue
            for raw_key in sorted(values, key=lambda value: (0, int(value)) if str(value).isdigit() else (1, str(value))):
                safe = str(raw_key).replace("/", "_").replace("+", "plus").replace(" ", "_")
                scope_value: Any = int(raw_key) if str(raw_key).isdigit() else str(raw_key)
                relations.append(rel(
                    f"{prefix}_{safe}",
                    f"{label} {raw_key}",
                    componente=f"{family} {raw_key}",
                    detalle=f"Variable contextual de Folletos para {raw_key}; matriz PDF sigue siendo fuente final.",
                    ruta_calculo=[f"{family}.{raw_key}", "base_tecnica", "matriz_pdf"],
                    aplica_a={scope_key: [scope_value]},
                    **common,
                ))
        return relations


    def _productos_restantes_editable_relations(self) -> list[dict[str, Any]]:
        product_configs = [
            {
                "product_key": "carpetas",
                "product_label": "Carpetas",
                "source_file": "data/carpetas/formula_editable_config.json",
                "endpoint": "/carpetas/cotizar",
                "simple": [
                    ("factor_solapa_carpetas", "Factor solapa Carpetas", "solapa impresa", {"adicionales": ["solapa_impresa"], "solapa_impresa": [True]}),
                    ("factor_laca_uv_carpetas", "Factor Laca UV Carpetas", "laca UV", {"terminaciones": ["laca_uv"]}),
                    ("factor_laminado_carpetas", "Factor Laminado Carpetas", "laminado", {"terminaciones": ["laminado_brillo", "laminado_mate"]}),
                    ("multiplicador_comercial_carpetas", "Multiplicador comercial Carpetas", "multiplicador comercial", {}),
                ],
                "families": [
                    ("coeficiente_terminacion", "coeficiente_terminacion_carpetas", "Coeficiente terminacion Carpetas", "terminaciones"),
                    ("coeficiente_impresion", "coeficiente_impresion_carpetas", "Coeficiente impresion Carpetas", "caras"),
                    ("coeficiente_cantidad", "coeficiente_cantidad_carpetas", "Coeficiente cantidad Carpetas", "rangos"),
                ],
            },
            {
                "product_key": "sobres",
                "product_label": "Sobres",
                "source_file": "data/sobres/formula_editable_config.json",
                "endpoint": "/sobres/cotizar",
                "simple": [
                    ("multiplicador_comercial_sobres", "Multiplicador comercial Sobres", "multiplicador comercial", {}),
                ],
                "families": [
                    ("coeficiente_tipo_sobre", "coeficiente_tipo_sobre", "Coeficiente tipo sobre", "tipos_sobre"),
                    ("coeficiente_cantidad", "coeficiente_cantidad_sobres", "Coeficiente cantidad Sobres", "cantidades"),
                ],
            },
            {
                "product_key": "plancha_iman_impreso",
                "product_label": "Plancha Iman",
                "source_file": "data/plancha_iman_impreso/formula_editable_config.json",
                "endpoint": "/plancha-iman-impreso/cotizar",
                "simple": [
                    ("base_iman_plancha", "Base iman Plancha", "base iman", {}),
                    ("papel_300g_ilustracion_plancha_iman", "Papel 300g Ilustracion Plancha Iman", "papel 300g", {"variantes": ["papel_300g_ilustracion"]}),
                    ("multiplicador_comercial_plancha_iman", "Multiplicador comercial Plancha Iman", "multiplicador comercial", {}),
                ],
                "families": [
                    ("coeficiente_variante", "coeficiente_variante_plancha_iman", "Coeficiente variante Plancha Iman", "variantes"),
                    ("coeficiente_cantidad", "coeficiente_cantidad_plancha_iman", "Coeficiente cantidad Plancha Iman", "rangos"),
                ],
            },
            {
                "product_key": "agendas_cuadernos",
                "product_label": "Agendas/Cuadernos",
                "source_file": "data/agendas_cuadernos/formula_editable_config.json",
                "endpoint": "/agendas-cuadernos/cotizar",
                "simple": [
                    ("base_agenda_2026", "Base Agenda 2026", "agenda 2026", {"productos": ["agenda_2026"]}),
                    ("factor_tapa_agendas", "Factor tapa Agendas", "tapa", {}),
                    ("factor_anillado_agendas", "Factor anillado Agendas", "anillado", {"productos": ["cuaderno_universitario_ringwire"]}),
                    ("multiplicador_comercial_agendas", "Multiplicador comercial Agendas", "multiplicador comercial", {}),
                ],
                "families": [
                    ("coeficiente_producto", "coeficiente_producto_agendas", "Coeficiente producto Agendas", "productos"),
                    ("coeficiente_formato", "coeficiente_formato_agendas", "Coeficiente formato Agendas", "formatos"),
                    ("coeficiente_paginas", "coeficiente_paginas_agendas", "Coeficiente paginas Agendas", "paginas"),
                ],
            },
        ]

        def safe_key(value: Any) -> str:
            return str(value).replace("/", "_").replace("+", "plus").replace(" ", "_").replace(".", "_")

        relations: list[dict[str, Any]] = []
        rel = self._rel
        for config in product_configs:
            source_file = config["source_file"]
            config_path = self.project_root / source_file
            if not config_path.exists():
                continue
            try:
                payload = json.loads(config_path.read_text(encoding="utf-8-sig"))
            except (OSError, json.JSONDecodeError):
                continue
            variables = payload.get("variables", {})
            if not isinstance(variables, dict):
                continue
            common = {
                "producto_key": config["product_key"],
                "producto": config["product_label"],
                "impacta_hoy": True,
                "editable": True,
                "tipo": "variable_madre",
                "nivel_impacto": "medio",
                "estado": "conectado",
                "fuente": source_file,
                "endpoint": config["endpoint"],
                "modo_precio": "matriz_pdf_con_variables_detectadas",
            }
            for key, label, component, scope in config["simple"]:
                if key not in variables:
                    continue
                relations.append(rel(
                    key,
                    label,
                    componente=component,
                    detalle=f"Variable contextual de {config['product_label']}; la matriz PDF/lista sigue siendo fuente final.",
                    ruta_calculo=[key, "base_tecnica", "matriz_pdf", "precio_final"],
                    aplica_a=scope,
                    **common,
                ))
            for family, prefix, label_base, scope_key in config["families"]:
                values = variables.get(family, {})
                if not isinstance(values, dict):
                    continue
                for raw_key in sorted(values, key=lambda value: (0, int(value)) if str(value).isdigit() else (1, str(value))):
                    safe = safe_key(raw_key)
                    scope_value: Any = int(raw_key) if str(raw_key).isdigit() else str(raw_key)
                    relations.append(rel(
                        f"{prefix}_{safe}",
                        f"{label_base} {raw_key}",
                        componente=f"{family} {raw_key}",
                        detalle=f"Variable contextual de {config['product_label']} para {raw_key}; matriz PDF/lista sigue siendo fuente final.",
                        ruta_calculo=[f"{family}.{raw_key}", "base_tecnica", "matriz_pdf", "precio_final"],
                        aplica_a={scope_key: [scope_value]},
                        **common,
                    ))
        return relations


    def _corte_recto_editable_relations(
        self,
        *,
        product_key: str,
        product_label: str,
        source_file: str,
        endpoint: str,
        laca_key: str,
        laca_label: str,
        corte_key: str,
        corte_label: str,
        multiplicador_key: str,
        multiplicador_label: str,
        coef_formato_prefix: str,
        coef_cantidad_prefix: str,
    ) -> list[dict[str, Any]]:
        config_path = self.project_root / source_file
        if not config_path.exists():
            return []
        try:
            payload = json.loads(config_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError):
            return []
        variables = payload.get("variables", {})
        if not isinstance(variables, dict):
            return []

        rel = self._rel
        common = {
            "producto_key": product_key,
            "producto": product_label,
            "impacta_hoy": True,
            "editable": True,
            "tipo": "variable_madre",
            "nivel_impacto": "alto",
            "estado": "conectado",
            "fuente": source_file,
            "endpoint": endpoint,
            "modo_precio": "formula_editable_calibrada",
        }
        relations = [
            rel(
                laca_key,
                laca_label,
                componente="laca UV",
                detalle=f"Factor editable usado cuando {product_label} cotiza con Laca UV; el precio final queda calibrado contra PDF/lista.",
                ruta_calculo=["laca_uv_factor", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                aplica_a={"terminaciones": ["con_laca_uv"]},
                **common,
            ),
            rel(
                corte_key,
                corte_label,
                componente="corte recto",
                detalle=f"Factor editable del corte recto para {product_label}.",
                ruta_calculo=["corte_recto_factor", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                **common,
            ),
            rel(
                multiplicador_key,
                multiplicador_label,
                componente="multiplicador comercial",
                detalle=f"Multiplicador editable propio de {product_label} antes de la calibracion PDF/lista.",
                ruta_calculo=["multiplicador_comercial", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                **common,
            ),
        ]

        coef_formato = variables.get("coeficiente_tamano", {})
        if isinstance(coef_formato, dict):
            for formato in sorted(coef_formato, key=str):
                safe = str(formato).replace("-", "_").replace("/", "_")
                relations.append(rel(
                    f"{coef_formato_prefix}_{safe}",
                    f"Coeficiente formato {product_label} {formato}",
                    componente=f"coeficiente formato {formato}",
                    detalle=f"Coeficiente editable que aplica solo al formato {formato} de {product_label}.",
                    ruta_calculo=[f"coeficiente_tamano.{formato}", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                    aplica_a={"formatos": [str(formato)]},
                    **common,
                ))

        coef_cantidad = variables.get("coeficiente_cantidad", {})
        if isinstance(coef_cantidad, dict):
            for cantidad in sorted(coef_cantidad, key=lambda value: (0, int(value)) if str(value).isdigit() else (1, str(value))):
                relations.append(rel(
                    f"{coef_cantidad_prefix}_{cantidad}",
                    f"Coeficiente cantidad {product_label} {cantidad}",
                    componente=f"coeficiente cantidad {cantidad}",
                    detalle=f"Coeficiente editable que aplica solo a cantidad {cantidad} de {product_label}.",
                    ruta_calculo=[f"coeficiente_cantidad.{cantidad}", "subtotal_formula_excel", "factor_ajuste_pdf", "precio_final"],
                    aplica_a={"cantidades": [int(cantidad) if str(cantidad).isdigit() else str(cantidad)]},
                    **common,
                ))
        return relations
