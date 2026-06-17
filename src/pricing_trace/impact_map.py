"""Read-only map of commercial variable impact.

This module intentionally does not load or mutate pricing engines. It is an
administrative map that explains which variables, fixed tables and blockers are
connected to each product today.
"""

from __future__ import annotations

from copy import deepcopy
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
                modo_precio="matriz_pdf_con_variables_detectadas",
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
                modo_precio="matriz_pdf_con_variables_detectadas",
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
        return relations
