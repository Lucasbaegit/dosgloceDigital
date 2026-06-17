"""Route handlers for Bajadas v2 internal API."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any

from admin_precios import AdminPricesService
from bajadas_v2 import BajadasV2PricingEngine, load_bajadas_v2_bundle
from bajadas_v2.config_loader import BajadasV2Bundle
from bajadas_v2.exceptions import PriceNotFoundError, QuoteInputError
from bajadas_autoadhesivas import AutoadhesivasPricingEngine, load_autoadhesivas_bundle
from bajadas_autoadhesivas.exceptions import PriceNotFoundError as AutoadhesivasPriceNotFoundError
from bajadas_autoadhesivas.exceptions import QuoteInputError as AutoadhesivasQuoteInputError
from bajadas_autoadhesivas.types import AutoadhesivasQuoteInput
from bajadas_adicionales_laminado import LaminadoAdicionalesPricingEngine, QuoteInputError as LaminadoQuoteInputError, load_laminado_bundle
from bajadas_adicionales_laminado.types import LaminadoQuoteInput
from tarjetas_9x5 import Tarjetas9x5PricingEngine, load_tarjetas_9x5_bundle
from tarjetas_9x5.exceptions import PriceNotFoundError as TarjetasPriceNotFoundError
from tarjetas_9x5.exceptions import QuoteInputError as TarjetasQuoteInputError
from tarjetas_9x5.types import Tarjetas9x5QuoteInput
from tarjetas_postales import TarjetasPostalesPricingEngine, load_tarjetas_postales_bundle
from tarjetas_postales.exceptions import PriceNotFoundError as TarjetasPostalesPriceNotFoundError
from tarjetas_postales.exceptions import QuoteInputError as TarjetasPostalesQuoteInputError
from tarjetas_postales.types import TarjetasPostalesQuoteInput
from folletos import FolletosPricingEngine, load_folletos_bundle
from folletos.exceptions import PriceNotFoundError as FolletosPriceNotFoundError
from folletos.exceptions import QuoteInputError as FolletosQuoteInputError
from folletos.types import FolletosQuoteInput
from carpetas import CarpetasPricingEngine, load_carpetas_bundle
from carpetas.exceptions import PriceNotFoundError as CarpetasPriceNotFoundError
from carpetas.exceptions import QuoteInputError as CarpetasQuoteInputError
from carpetas.types import CarpetasQuoteInput
from sobres import SobresPricingEngine, load_sobres_bundle
from sobres.exceptions import PriceNotFoundError as SobresPriceNotFoundError
from sobres.exceptions import QuoteInputError as SobresQuoteInputError
from sobres.types import SobresQuoteInput
from stickers_corte_recto import StickersCorteRectoPricingEngine, load_stickers_corte_recto_bundle
from stickers_corte_recto.exceptions import PriceNotFoundError as StickersCorteRectoPriceNotFoundError
from stickers_corte_recto.exceptions import QuoteInputError as StickersCorteRectoQuoteInputError
from stickers_corte_recto.types import StickersCorteRectoQuoteInput
from imanes_corte_recto import ImanesCorteRectoPricingEngine, load_imanes_corte_recto_bundle
from imanes_corte_recto.exceptions import PriceNotFoundError as ImanesCorteRectoPriceNotFoundError
from imanes_corte_recto.exceptions import QuoteInputError as ImanesCorteRectoQuoteInputError
from imanes_corte_recto.types import ImanesCorteRectoQuoteInput
from stickers_circulares import StickersCircularesPricingEngine, load_stickers_circulares_bundle
from stickers_circulares.exceptions import PriceNotFoundError as StickersCircularesPriceNotFoundError
from stickers_circulares.exceptions import QuoteInputError as StickersCircularesQuoteInputError
from stickers_circulares.types import StickersCircularesQuoteInput
from troquelado_digital import TroqueladoDigitalPricingEngine, load_troquelado_digital_bundle
from troquelado_digital.exceptions import PriceNotFoundError as TroqueladoDigitalPriceNotFoundError
from troquelado_digital.exceptions import QuoteInputError as TroqueladoDigitalQuoteInputError
from troquelado_digital.types import TroqueladoDigitalQuoteInput
from tarjetas_troqueladas_circulares import TarjetasTroqueladasCircularesPricingEngine, load_tarjetas_troqueladas_circulares_bundle
from tarjetas_troqueladas_circulares.exceptions import PriceNotFoundError as TarjetasTroqCircPriceNotFoundError
from tarjetas_troqueladas_circulares.exceptions import QuoteInputError as TarjetasTroqCircQuoteInputError
from tarjetas_troqueladas_circulares.types import TarjetasTroqueladasCircularesQuoteInput
from plancha_iman_impreso import PlanchaImanImpresoPricingEngine, load_plancha_iman_impreso_bundle
from plancha_iman_impreso.exceptions import PriceNotFoundError as PlanchaImanPriceNotFoundError
from plancha_iman_impreso.exceptions import QuoteInputError as PlanchaImanQuoteInputError
from plancha_iman_impreso.types import PlanchaImanImpresoQuoteInput
from agendas_cuadernos import AgendasCuadernosPricingEngine, load_agendas_cuadernos_bundle
from agendas_cuadernos.exceptions import PriceNotFoundError as AgendasCuadernosPriceNotFoundError
from agendas_cuadernos.exceptions import QuoteInputError as AgendasCuadernosQuoteInputError
from agendas_cuadernos.types import AgendasCuadernosQuoteInput
from pricing_variables import PrincipalVariableError, PrincipalVariablesService
from pricing_trace.graph_builder import PriceTraceGraphBuilder
from pricing_trace.impact_map import VariableImpactMap
from export import PricesExcelExporter, PricesPdfExporter, PricesTablesBuilder
from importers import ExcelMaestroImporter, ExcelMasterPreviewError

from .schemas import (
    ApiValidationError,
    CarpetasQuoteRequestSchema,
    FolletosQuoteRequestSchema,
    ImanesCorteRectoQuoteRequestSchema,
    QuoteRequestSchema,
    StickersCircularesQuoteRequestSchema,
    TroqueladoDigitalQuoteRequestSchema,
    TarjetasTroqueladasCircularesQuoteRequestSchema,
    PlanchaImanImpresoQuoteRequestSchema,
    AgendasCuadernosQuoteRequestSchema,
    SobresQuoteRequestSchema,
    StickersCorteRectoQuoteRequestSchema,
    Tarjetas9x5QuoteRequestSchema,
    TarjetasPostalesQuoteRequestSchema,
)


class BajadasV2ApiService:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(project_root))
        self.autoadhesivas_engine = AutoadhesivasPricingEngine(load_autoadhesivas_bundle(project_root))
        self.laminado_engine = LaminadoAdicionalesPricingEngine(load_laminado_bundle(project_root))
        self.tarjetas_9x5_engine = Tarjetas9x5PricingEngine(load_tarjetas_9x5_bundle(project_root))
        self.tarjetas_postales_engine = TarjetasPostalesPricingEngine(load_tarjetas_postales_bundle(project_root))
        self.folletos_engine = FolletosPricingEngine(load_folletos_bundle(project_root))
        self.carpetas_engine = CarpetasPricingEngine(load_carpetas_bundle(project_root))
        self.sobres_engine = SobresPricingEngine(load_sobres_bundle(project_root))
        self.stickers_corte_recto_engine = StickersCorteRectoPricingEngine(load_stickers_corte_recto_bundle(project_root))
        self.imanes_corte_recto_engine = ImanesCorteRectoPricingEngine(load_imanes_corte_recto_bundle(project_root))
        self.stickers_circulares_engine = StickersCircularesPricingEngine(
            load_stickers_circulares_bundle(project_root),
            project_root=project_root,
        )
        self.troquelado_digital_engine = TroqueladoDigitalPricingEngine(load_troquelado_digital_bundle(project_root))
        self.tarjetas_troqueladas_circulares_engine = TarjetasTroqueladasCircularesPricingEngine(
            load_tarjetas_troqueladas_circulares_bundle(project_root)
        )
        self.plancha_iman_impreso_engine = PlanchaImanImpresoPricingEngine(load_plancha_iman_impreso_bundle(project_root))
        self.agendas_cuadernos_engine = AgendasCuadernosPricingEngine(load_agendas_cuadernos_bundle(project_root))
        self.principal_variables = PrincipalVariablesService(project_root)
        self.price_trace_graph = PriceTraceGraphBuilder(project_root)
        self.variable_impact_map = VariableImpactMap(project_root)
        self.admin_prices = AdminPricesService(project_root, self.principal_variables)
        self.excel_maestro_importer = ExcelMaestroImporter(project_root)
        self.prices_tables_builder = PricesTablesBuilder(project_root)
        self.prices_pdf_exporter = PricesPdfExporter()
        self.prices_excel_exporter = PricesExcelExporter(project_root)
        self.usar_adicionales_laminado_v1 = False
        self.config_path = project_root / "data" / "bajadas_v2" / "bajadas_v2_config_final.json"
        self.config_editable_path = project_root / "data" / "bajadas_v2" / "bajadas_v2_config_editable.json"
        self.config_history_path = project_root / "data" / "bajadas_v2" / "config_history.json"
        self.config_candidates_path = project_root / "data" / "bajadas_v2" / "config_candidates.json"
        self.backups_dir = project_root / "data" / "bajadas_v2" / "backups"
        self.snapshot_path = project_root / "data" / "bajadas_v2" / "snapshots" / "bajadas_v2_metrics_snapshot.json"
        self._ensure_editable_config()

    def get_principal_variables(self) -> tuple[int, dict[str, Any]]:
        return 200, self.principal_variables.get_grouped()

    def audit_principal_variables(self) -> tuple[int, dict[str, Any]]:
        return 200, self.principal_variables.audit()

    def principal_variables_ranges(self) -> tuple[int, dict[str, Any]]:
        return 200, self.principal_variables.ranges()

    def trace_graph(self, params: dict[str, str] | None = None) -> tuple[int, dict[str, Any]]:
        return 200, self.price_trace_graph.build(params or {})

    def variables_impacto(self) -> tuple[int, dict[str, Any]]:
        return 200, self.variable_impact_map.build()

    def variables_impacto_resumen(self) -> tuple[int, dict[str, Any]]:
        return 200, self.variable_impact_map.summary()

    def variables_impacto_variable(self, variable_key: str) -> tuple[int, dict[str, Any]]:
        return self.variable_impact_map.by_variable(variable_key)

    def variables_impacto_producto(self, product_key: str) -> tuple[int, dict[str, Any]]:
        return self.variable_impact_map.by_product(product_key)

    def admin_precios_variables_editables(self) -> tuple[int, dict[str, Any]]:
        return 200, self.admin_prices.variables_editables()

    def admin_precios_preview(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        return self.admin_prices.preview(payload)

    def admin_precios_aplicar(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        status, result = self.admin_prices.apply(payload)
        if status == 200:
            self._reload_engines_after_principal_variables_update()
        return status, result

    def admin_precios_historial(self) -> tuple[int, dict[str, Any]]:
        return 200, self.admin_prices.history()

    def export_prices_json(self) -> tuple[int, dict[str, Any]]:
        return 200, self.prices_tables_builder.build()

    def export_prices_pdf(self) -> tuple[str, bytes]:
        return self.prices_pdf_exporter.render(self.prices_tables_builder.build())

    def export_prices_excel(self) -> tuple[str, bytes]:
        return self.prices_excel_exporter.render(self.prices_tables_builder.build())

    def preview_excel_maestro_import(self, filename: str, content: bytes) -> tuple[int, dict[str, Any]]:
        try:
            return 200, self.excel_maestro_importer.preview(filename, content)
        except ExcelMasterPreviewError as exc:
            return 400, {"ok": False, "error": exc.error, "detail": exc.detail}

    def update_principal_variables(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            result = self.principal_variables.update(payload)
            self._reload_engines_after_principal_variables_update()
            return 200, result
        except PrincipalVariableError as exc:
            return 400, {"error": "variables_principales_validation_error", "detail": str(exc)}

    def reset_principal_variables(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            result = self.principal_variables.reset(payload)
            self._reload_engines_after_principal_variables_update()
            return 200, result
        except PrincipalVariableError as exc:
            return 400, {"error": "variables_principales_validation_error", "detail": str(exc)}

    def _reload_engines_after_principal_variables_update(self) -> None:
        self.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(self.project_root))
        self.stickers_circulares_engine = StickersCircularesPricingEngine(
            load_stickers_circulares_bundle(self.project_root),
            project_root=self.project_root,
        )

    def health(self) -> dict[str, Any]:
        return {"status": "ok", "service": "bajadas_v2_api"}

    def bajadas_health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "checks": {
                "config_final_exists": self.config_path.exists(),
                "snapshot_exists": self.snapshot_path.exists(),
                "engine_import_ok": self.engine is not None,
                "autoadhesivas_engine_import_ok": self.autoadhesivas_engine is not None,
            },
        }

    def autoadhesivas_health(self) -> tuple[int, dict[str, Any]]:
        return 200, self.autoadhesivas_engine.health()

    def autoadhesivas_config(self) -> tuple[int, dict[str, Any]]:
        return 200, self.autoadhesivas_engine.get_config()

    def metrics(self) -> dict[str, Any]:
        with self.snapshot_path.open("r", encoding="utf-8") as fh:
            snapshot = json.load(fh)
        estados = snapshot.get("conteo_estados", {})
        return {
            "OK": estados.get("OK", 0),
            "DIFERENCIA_LEVE": estados.get("DIFERENCIA_LEVE", 0),
            "DIFERENCIA_MEDIA": estados.get("DIFERENCIA_MEDIA", 0),
            "DIFERENCIA_ALTA": estados.get("DIFERENCIA_ALTA", 0),
            "SIN_COMPARACION": estados.get("SIN_COMPARACION", 0),
            "casos_regresion": snapshot.get("cantidad_casos_regresion"),
            "precio_fijo_csv": snapshot.get("cantidad_precio_fijo_csv"),
        }

    def cotizar(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = QuoteRequestSchema.from_payload(payload)
            if req.categoria == "Bajadas Autoadhesivas":
                autoadh_request = AutoadhesivasQuoteInput(
                    categoria=req.categoria,
                    modo_color=req.modo_color,
                    formato=req.formato,
                    tipo_producto=(req.tipo_producto or "autoadhesiva"),
                    columna_precio=(req.columna_precio or req.tipo_papel).lower(),
                    cantidad_unidades=req.cantidad_unidades or 1,
                    cantidad_rango=req.cantidad_rango,
                    urgencia=req.urgencia,
                )
                result = self.autoadhesivas_engine.quote_as_dict(autoadh_request)
            else:
                result = self.engine.quote_as_dict(req.to_quote_input())
            if req.categoria == "Bajadas Autoadhesivas":
                result = self._apply_autoadhesivas_adicionales_opt_in(result, req)
            else:
                result = self._apply_laminado_adicional_opt_in(result, req, req.adicional_laminado)
            result = self._apply_hoja4_adicionales_opt_in(result, req)
            result = self._apply_troquelado_adicional_opt_in(result, req)
            return 200, result
        except ApiValidationError as exc:
            detail = str(exc)
            if detail in {"complejidad_troquelado_requerida", "complejidad_troquelado_no_soportada", "cantidad_fuera_de_matriz", "tinta_blanca_bloqueada_por_falta_de_datos", "tinta_blanca_bloqueada_por_falta_de_valor_base_1_copia", "adicional_no_soportado_para_liviano", "adicional_no_soportado_para_autoadhesivas"}:
                return 400, {"error": detail, "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except QuoteInputError as exc:
            return 400, {"error": "urgencia_invalida", "detail": str(exc)}
        except PriceNotFoundError as exc:
            return 404, {"error": "combinacion_no_encontrada", "detail": str(exc)}
        except AutoadhesivasQuoteInputError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except AutoadhesivasPriceNotFoundError as exc:
            return 404, {"error": "combinacion_no_encontrada", "detail": str(exc)}
        except LaminadoQuoteInputError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except TroqueladoDigitalQuoteInputError as exc:
            detail = str(exc)
            if detail in {"complejidad_troquelado_requerida", "complejidad_troquelado_no_soportada"}:
                return 400, {"error": detail, "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except TroqueladoDigitalPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_tarjetas_9x5(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = Tarjetas9x5QuoteRequestSchema.from_payload(payload)
            quote = Tarjetas9x5QuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                formato=req.formato,
                papel=req.papel,
                gramaje=req.gramaje,
                terminacion=req.terminacion,
                caras=req.caras,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
                terminaciones_extra=req.terminaciones_extra,
            )
            return 200, self.tarjetas_9x5_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except TarjetasQuoteInputError as exc:
            detail = str(exc)
            if "terminacion_no_soportada" in detail:
                return 400, {"error": "terminacion_no_soportada", "detail": detail}
            if "caras_no_soportadas" in detail:
                return 400, {"error": "caras_no_soportadas", "detail": detail}
            if "terminacion_extra_bloqueada_por_falta_de_datos" in detail:
                return 400, {"error": "terminacion_extra_bloqueada_por_falta_de_datos", "detail": detail}
            if "urgencia_invalida" in detail:
                return 400, {"error": "urgencia_invalida", "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except TarjetasPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_tarjetas_postales(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = TarjetasPostalesQuoteRequestSchema.from_payload(payload)
            quote = TarjetasPostalesQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                formato=req.formato,
                papel=req.papel,
                gramaje=req.gramaje,
                terminacion=req.terminacion,
                caras=req.caras,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
                terminaciones_extra=req.terminaciones_extra,
            )
            return 200, self.tarjetas_postales_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except TarjetasPostalesQuoteInputError as exc:
            detail = str(exc)
            if "terminacion_no_soportada" in detail:
                return 400, {"error": "terminacion_no_soportada", "detail": detail}
            if "terminacion_extra_bloqueada_por_falta_de_datos" in detail:
                return 400, {"error": "terminacion_extra_bloqueada_por_falta_de_datos", "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except TarjetasPostalesPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_folletos(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = FolletosQuoteRequestSchema.from_payload(payload)
            quote = FolletosQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                formato=req.formato,
                papel=req.papel,
                gramaje=req.gramaje,
                modo_color=req.modo_color,
                caras=req.caras,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
            )
            return 200, self.folletos_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except FolletosQuoteInputError as exc:
            detail = str(exc)
            if "formato_no_soportado" in detail:
                return 400, {"error": "formato_no_soportado", "detail": detail}
            if "caras_no_compatibles" in detail:
                return 400, {"error": "caras_no_compatibles", "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except FolletosPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_carpetas(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = CarpetasQuoteRequestSchema.from_payload(payload)
            quote = CarpetasQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                formato=req.formato,
                papel=req.papel,
                gramaje=req.gramaje,
                terminacion=req.terminacion,
                caras=req.caras,
                cantidad_unidades=req.cantidad_unidades,
                solapa_impresa=req.solapa_impresa,
                urgencia=req.urgencia,
            )
            return 200, self.carpetas_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except CarpetasQuoteInputError as exc:
            detail = str(exc)
            if "terminacion_no_soportada" in detail:
                return 400, {"error": "terminacion_no_soportada", "detail": detail}
            if "caras_no_soportadas" in detail:
                return 400, {"error": "caras_no_soportadas", "detail": detail}
            if "urgencia_invalida" in detail:
                return 400, {"error": "urgencia_invalida", "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except CarpetasPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_sobres(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = SobresQuoteRequestSchema.from_payload(payload)
            quote = SobresQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                tipo_sobre=req.tipo_sobre,
                papel=req.papel,
                color=req.color,
                caras=req.caras,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
            )
            return 200, self.sobres_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except SobresQuoteInputError as exc:
            detail = str(exc)
            if "caras_no_soportadas" in detail:
                return 400, {"error": "caras_no_soportadas", "detail": detail}
            if "tipo_sobre_no_soportado" in detail:
                return 400, {"error": "tipo_sobre_no_soportado", "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except SobresPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_stickers_corte_recto(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = StickersCorteRectoQuoteRequestSchema.from_payload(payload)
            quote = StickersCorteRectoQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                formato=req.formato,
                terminacion=req.terminacion,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
            )
            return 200, self.stickers_corte_recto_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except StickersCorteRectoQuoteInputError as exc:
            detail = str(exc)
            if "formato_no_soportado" in detail:
                return 400, {"error": "formato_no_soportado", "detail": detail}
            if "terminacion_no_soportada" in detail:
                return 400, {"error": "terminacion_no_soportada", "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except StickersCorteRectoPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_imanes_corte_recto(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = ImanesCorteRectoQuoteRequestSchema.from_payload(payload)
            quote = ImanesCorteRectoQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                formato=req.formato,
                papel=req.papel,
                gramaje=req.gramaje,
                terminacion=req.terminacion,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
            )
            return 200, self.imanes_corte_recto_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except ImanesCorteRectoQuoteInputError as exc:
            detail = str(exc)
            if "formato_no_soportado" in detail:
                return 400, {"error": "formato_no_soportado", "detail": detail}
            if "terminacion_no_soportada" in detail:
                return 400, {"error": "terminacion_no_soportada", "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except ImanesCorteRectoPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_stickers_circulares(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = StickersCircularesQuoteRequestSchema.from_payload(payload)
            quote = StickersCircularesQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                material=req.material,
                formato=req.formato,
                terminacion=req.terminacion,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
                modo_precio=req.modo_precio,
                variables_override=req.variables_override,
            )
            return 200, self.stickers_circulares_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except StickersCircularesQuoteInputError as exc:
            detail = str(exc)
            if "material_opp_pendiente_datos" in detail:
                return 400, {"error": "material_opp_pendiente_datos", "detail": detail}
            if "material_no_soportado" in detail:
                return 400, {"error": "material_no_soportado", "detail": detail}
            if "formato_no_soportado" in detail:
                return 400, {"error": "formato_no_soportado", "detail": detail}
            if "terminacion_no_soportada" in detail:
                return 400, {"error": "terminacion_no_soportada", "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except StickersCircularesPriceNotFoundError as exc:
            detail = str(exc)
            if detail == "cantidad_fuera_de_matriz":
                return 404, {"error": "cantidad_fuera_de_matriz", "detail": detail}
            return 404, {"error": "combinacion_no_encontrada", "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_troquelado_digital(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = TroqueladoDigitalQuoteRequestSchema.from_payload(payload)
            quote = TroqueladoDigitalQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                familia_tamano=req.familia_tamano,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
            )
            return 200, self.troquelado_digital_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except TroqueladoDigitalQuoteInputError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except TroqueladoDigitalPriceNotFoundError as exc:
            detail = str(exc)
            code = "cantidad_fuera_de_matriz" if detail == "cantidad_fuera_de_matriz" else "combinacion_no_encontrada"
            return 404, {"error": code, "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_tarjetas_troqueladas_circulares(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = TarjetasTroqueladasCircularesQuoteRequestSchema.from_payload(payload)
            quote = TarjetasTroqueladasCircularesQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                formato=req.formato,
                caras=req.caras,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
                adicional_laminado=req.adicional_laminado or "sin_adicional",
                caras_adicional_laminado=int(req.caras_adicional_laminado or 0),
            )
            return 200, self.tarjetas_troqueladas_circulares_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except TarjetasTroqCircQuoteInputError as exc:
            detail = str(exc)
            if detail in {"laminado_no_soportado", "caras_laminado_no_soportadas"}:
                return 400, {"error": detail, "detail": detail}
            return 400, {"error": "validation_error", "detail": detail}
        except TarjetasTroqCircPriceNotFoundError as exc:
            detail = str(exc)
            code = "cantidad_fuera_de_matriz" if detail == "cantidad_fuera_de_matriz" else "combinacion_no_encontrada"
            return 404, {"error": code, "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_plancha_iman_impreso(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = PlanchaImanImpresoQuoteRequestSchema.from_payload(payload)
            quote = PlanchaImanImpresoQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                variante=req.variante,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
            )
            return 200, self.plancha_iman_impreso_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except PlanchaImanQuoteInputError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except PlanchaImanPriceNotFoundError as exc:
            detail = str(exc)
            code = "cantidad_fuera_de_matriz" if detail == "cantidad_fuera_de_matriz" else "combinacion_no_encontrada"
            return 404, {"error": code, "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def cotizar_agendas_cuadernos(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            req = AgendasCuadernosQuoteRequestSchema.from_payload(payload)
            quote = AgendasCuadernosQuoteInput(
                categoria=req.categoria,
                producto=req.producto,
                formato=req.formato,
                paginas=req.paginas,
                cantidad_unidades=req.cantidad_unidades,
                urgencia=req.urgencia,
            )
            return 200, self.agendas_cuadernos_engine.quote_as_dict(quote)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except AgendasCuadernosQuoteInputError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except AgendasCuadernosPriceNotFoundError as exc:
            detail = str(exc)
            code = "cantidad_minima_no_alcanzada" if detail == "cantidad_minima_no_alcanzada" else "combinacion_no_encontrada"
            return 404, {"error": code, "detail": detail}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def _apply_laminado_adicional_opt_in(
        self,
        result: dict[str, Any],
        req: QuoteRequestSchema,
        adicional_effective: str | None = None,
    ) -> dict[str, Any]:
        adicional = (adicional_effective if adicional_effective is not None else req.adicional_laminado or "sin_adicional").lower()
        valid = {"sin_adicional", "laca", "laminado_brillo", "laminado_mate", "tinta_blanca"}
        if adicional not in valid:
            raise ApiValidationError("adicional_laminado inválido. Valores permitidos: sin_adicional, laca, laminado_brillo, laminado_mate.")
        if adicional == "tinta_blanca":
            if req.categoria != "Bajadas Autoadhesivas":
                raise ApiValidationError("tinta_blanca_bloqueada_por_falta_de_datos")
            base_1 = self._resolve_tinta_blanca_base_1_copia()
            if base_1 is None:
                raise ApiValidationError("tinta_blanca_bloqueada_por_falta_de_valor_base_1_copia")
            qty = int(result.get("cantidad_unidades", req.cantidad_unidades or 1))
            recargo = float(result.get("trazabilidad", {}).get("recargo_urgencia_aplicado", 0.0))
            factor_urgencia = 1.0 + recargo
            base_unit = float(result["precio_unitario_sin_iva"])
            adicional_unit = float(base_1)
            total_adicional_sin_iva = adicional_unit * qty
            total_adicional_con_urgencia = total_adicional_sin_iva * factor_urgencia
            precio_unitario_con_adicional = round(base_unit + adicional_unit, 6)
            total_sin_iva = round(precio_unitario_con_adicional * qty, 6)
            total_con_urgencia = round(total_sin_iva * factor_urgencia, 6)

            result["adicional_laminado"] = adicional
            result["adicional_unitario_sin_iva"] = round(adicional_unit, 6)
            result["adicional_unitario_con_urgencia"] = round(adicional_unit * factor_urgencia, 6)
            result["total_adicional_sin_iva"] = round(total_adicional_sin_iva, 6)
            result["total_adicional_con_urgencia"] = round(total_adicional_con_urgencia, 6)
            result["caras_adicional_laminado"] = 1
            result["precio_unitario_base_sin_iva"] = round(base_unit, 6)
            result["precio_unitario_con_adicional_sin_iva"] = precio_unitario_con_adicional
            result["regla_adicional_aplicada"] = "ADICIONAL_TINTA_BLANCA_PROPORCIONAL_1_COPIA"
            result["fuente_adicional"] = "autoadhesivas_v1_config.adicional_tinta_blanca_base_1_copia"
            result["total_sin_iva"] = total_sin_iva
            result["total_con_urgencia"] = total_con_urgencia
            trace = result.setdefault("trazabilidad", {})
            trace["adicional_laminado"] = {
                "seleccion": "tinta_blanca",
                "valor_base_1_copia": round(base_1, 6),
                "regla": "proporcional_por_cantidad_desde_1_copia",
                "cantidad_unidades": qty,
                "subtotal_adicional": round(total_adicional_sin_iva, 6),
                "fuente": "autoadhesivas_v1_config.adicional_tinta_blanca_base_1_copia",
                "nota": "Sin rastro confiable en Excel/PDF: se aplica proporcional desde valor base de 1 copia.",
            }
            return result
        if req.categoria in {"Bajadas Fullcolor", "Bajadas Blanco y Negro"} and str(req.tipo_papel).strip().lower() == "liviano":
            if adicional in {"laminado_brillo", "laminado_mate"}:
                raise ApiValidationError("adicional_no_soportado_para_liviano")

        # Opt-in behavior: if field is omitted, keep previous behavior unchanged.
        if req.adicional_laminado is None and adicional_effective is None:
            result["adicional_laminado"] = "sin_adicional"
            return result

        qty = int(result.get("cantidad_unidades", req.cantidad_unidades or 1))
        caras_multiplier = int(req.caras_adicional_laminado or 1)
        if req.categoria == "Bajadas Autoadhesivas":
            caras_multiplier = 1
        if adicional == "laca":
            adicional_unit = self._resolve_laca_uv_unit_by_qty(qty)
            recargo_loca = float(result.get("trazabilidad", {}).get("recargo_urgencia_aplicado", 0.0))
            laminado_out = {
                "adicional_unitario_sin_iva": adicional_unit,
                "adicional_unitario_con_urgencia": (adicional_unit * caras_multiplier) * (1.0 + recargo_loca),
                "total_adicional_sin_iva": (adicional_unit * qty) * caras_multiplier,
                "total_adicional_con_urgencia": ((adicional_unit * qty) * caras_multiplier) * (1.0 + recargo_loca),
                "rango_aplicado": self._resolve_laca_uv_label_by_qty(qty),
                "regla_aplicada": "ADICIONAL_LACA_UV_A3PLUS",
                "fuente": "matriz_laca_uv_bajadas",
            }
        else:
            laminado_out = self.laminado_engine.quote_as_dict(
                LaminadoQuoteInput(
                    adicional=adicional,
                    formato="A3+",
                    cantidad_unidades=qty,
                    urgencia=req.urgencia,
                )
            )

        base_unit = float(result["precio_unitario_sin_iva"])
        recargo = float(result.get("trazabilidad", {}).get("recargo_urgencia_aplicado", 0.0))
        factor_urgencia = 1.0 + recargo
        adicional_unit = float(laminado_out["adicional_unitario_sin_iva"]) * caras_multiplier
        adicional_unit_con_urgencia = adicional_unit * factor_urgencia
        total_adicional_sin_iva = adicional_unit * qty
        total_adicional_con_urgencia = total_adicional_sin_iva * factor_urgencia

        precio_unitario_con_adicional = round(base_unit + adicional_unit, 6)
        total_sin_iva = round(precio_unitario_con_adicional * qty, 6)
        total_con_urgencia = round(total_sin_iva * factor_urgencia, 6)

        result["adicional_laminado"] = adicional
        result["adicional_unitario_sin_iva"] = round(adicional_unit, 6)
        result["adicional_unitario_con_urgencia"] = round(adicional_unit_con_urgencia, 6)
        result["total_adicional_sin_iva"] = round(total_adicional_sin_iva, 6)
        result["total_adicional_con_urgencia"] = round(total_adicional_con_urgencia, 6)
        result["caras_adicional_laminado"] = caras_multiplier
        result["precio_unitario_base_sin_iva"] = round(base_unit, 6)
        result["precio_unitario_con_adicional_sin_iva"] = precio_unitario_con_adicional
        result["regla_adicional_aplicada"] = laminado_out["regla_aplicada"]
        result["fuente_adicional"] = laminado_out["fuente"]

        # Keep compatibility fields untouched for base unit:
        # precio_unitario_sin_iva, precio_sin_iva remain base.
        # Totals are updated to combined base+adicional before urgencia.
        result["total_sin_iva"] = total_sin_iva
        result["total_con_urgencia"] = total_con_urgencia

        trace = result.setdefault("trazabilidad", {})
        trace["adicional_laminado"] = {
            "seleccion": adicional,
            "hoja_origen": "Laminado",
            "formato_base": "A3+",
            "rango_aplicado": laminado_out["rango_aplicado"],
            "caras_aplicadas": caras_multiplier,
            "multiplicador_caras_adicional": caras_multiplier,
            "adicional_unitario": round(adicional_unit, 6),
            "regla_aplicada": laminado_out["regla_aplicada"],
            "fuente": laminado_out["fuente"],
            "nota": "Se suma antes de urgencia.",
            "no_combinable": True,
        }
        return result

    def _apply_autoadhesivas_adicionales_opt_in(self, result: dict[str, Any], req: QuoteRequestSchema) -> dict[str, Any]:
        adicional_legacy = (req.adicional_laminado or "sin_adicional").lower()
        if adicional_legacy in {"laminado_brillo", "laminado_mate"}:
            raise ApiValidationError("adicional_no_soportado_para_autoadhesivas")

        wants_laca = bool(req.adicional_laca_uv) or adicional_legacy == "laca"
        wants_tinta = bool(req.adicional_tinta_blanca) or adicional_legacy == "tinta_blanca"

        if not wants_laca and not wants_tinta:
            result["adicional_laminado"] = "sin_adicional"
            result["caras_adicional_laminado"] = 1
            return result

        qty = int(result.get("cantidad_unidades", req.cantidad_unidades or 1))
        recargo = float(result.get("trazabilidad", {}).get("recargo_urgencia_aplicado", 0.0))
        factor_urgencia = 1.0 + recargo
        base_unit = float(result["precio_unitario_sin_iva"])

        laca_unit = 0.0
        tinta_unit = 0.0
        details: dict[str, Any] = {}

        if wants_laca:
            laca_unit = self._resolve_laca_uv_unit_by_qty(qty)
            details["laca_uv"] = {
                "rango_aplicado": self._resolve_laca_uv_label_by_qty(qty),
                "adicional_unitario": round(laca_unit, 6),
                "cantidad_unidades": qty,
                "subtotal": round(laca_unit * qty, 6),
                "fuente": "matriz_laca_uv_bajadas",
            }

        if wants_tinta:
            base_1 = self._resolve_tinta_blanca_base_1_copia()
            if base_1 is None:
                raise ApiValidationError("tinta_blanca_bloqueada_por_falta_de_valor_base_1_copia")
            tinta_unit = float(base_1)
            details["tinta_blanca"] = {
                "valor_base_1_copia": round(base_1, 6),
                "regla": "proporcional_por_cantidad_desde_1_copia",
                "cantidad_unidades": qty,
                "subtotal": round(tinta_unit * qty, 6),
                "fuente": "autoadhesivas_v1_config.adicional_tinta_blanca_base_1_copia",
            }

        adicional_unit = laca_unit + tinta_unit
        total_adicional_sin_iva = adicional_unit * qty
        total_adicional_con_urgencia = total_adicional_sin_iva * factor_urgencia
        precio_unitario_con_adicional = round(base_unit + adicional_unit, 6)
        total_sin_iva = round(precio_unitario_con_adicional * qty, 6)
        total_con_urgencia = round(total_sin_iva * factor_urgencia, 6)

        if wants_laca and wants_tinta:
            adicional_out = "laca+tinta_blanca"
            regla_out = "ADICIONALES_AUTOADHESIVAS_ACUMULABLES"
        elif wants_laca:
            adicional_out = "laca"
            regla_out = "ADICIONAL_LACA_UV_A3PLUS"
        else:
            adicional_out = "tinta_blanca"
            regla_out = "ADICIONAL_TINTA_BLANCA_PROPORCIONAL_1_COPIA"

        result["adicional_laminado"] = adicional_out
        result["adicional_unitario_sin_iva"] = round(adicional_unit, 6)
        result["adicional_unitario_con_urgencia"] = round(adicional_unit * factor_urgencia, 6)
        result["total_adicional_sin_iva"] = round(total_adicional_sin_iva, 6)
        result["total_adicional_con_urgencia"] = round(total_adicional_con_urgencia, 6)
        result["caras_adicional_laminado"] = 1
        result["precio_unitario_base_sin_iva"] = round(base_unit, 6)
        result["precio_unitario_con_adicional_sin_iva"] = precio_unitario_con_adicional
        result["regla_adicional_aplicada"] = regla_out
        result["fuente_adicional"] = "autoadhesivas_adicionales_acumulables"
        result["total_sin_iva"] = total_sin_iva
        result["total_con_urgencia"] = total_con_urgencia

        trace = result.setdefault("trazabilidad", {})
        trace["adicionales_autoadhesiva"] = details
        trace["variables_principales_usadas"] = (
            [
                {
                    "key": "adicional_tinta_blanca_base_1_copia",
                    "label": "Tinta blanca Autoadhesivas (1 copia)",
                    "value": round(tinta_unit, 6),
                    "unit": "ARS/unidad",
                }
            ]
            if wants_tinta
            else []
        )
        trace["adicional_laminado"] = {
            "seleccion": adicional_out,
            "adicional_unitario": round(adicional_unit, 6),
            "cantidad_unidades": qty,
            "subtotal_adicional": round(total_adicional_sin_iva, 6),
            "fuente": "autoadhesivas_adicionales_acumulables",
            "nota": "Laca UV y Tinta blanca son acumulables en autoadhesivas.",
        }
        return result

    def _apply_hoja4_adicionales_opt_in(self, result: dict[str, Any], req: QuoteRequestSchema) -> dict[str, Any]:
        if req.categoria not in {"Bajadas Fullcolor", "Bajadas Blanco y Negro", "Bajadas Autoadhesivas", "Bajadas Kraft"}:
            return result
        if req.categoria == "Bajadas Autoadhesivas":
            if (req.adicional_laminado_por_lado or "sin_adicional").lower() != "sin_adicional" or bool(req.adicional_plastificado):
                raise ApiValidationError("adicional_no_soportado_para_autoadhesivas")
            return result
        if req.categoria in {"Bajadas Fullcolor", "Bajadas Blanco y Negro"} and str(req.tipo_papel).strip().lower() == "liviano":
            if (req.adicional_laminado_por_lado or "sin_adicional").lower() != "sin_adicional" or bool(req.adicional_plastificado):
                raise ApiValidationError("adicional_no_soportado_para_liviano")
            return result

        formato = str(req.formato or "").upper()
        is_a3_family = formato in {"A3+", "XA3"}
        por_lado = (req.adicional_laminado_por_lado or "sin_adicional").lower()
        plastificado = bool(req.adicional_plastificado) if req.adicional_plastificado is not None else False
        if por_lado == "sin_adicional" and not plastificado:
            return result
        if not is_a3_family:
            raise ApiValidationError("adicionales_hoja4_solo_a3plus_xa3")

        qty = int(result.get("cantidad_unidades", req.cantidad_unidades or 1))
        extra_unit = 0.0
        detalle: dict[str, Any] = {}

        por_lado_matrix = {
            "laminado_brillo_por_lado": {"1": 163.5152453, "2 a 25": 151.2516019, "26 a 50": 151.2516019, "51 a 100": 138.9879585, "101 a 300": 126.7243151, "301 a 500": 126.7243151, "501 a 1000": 118.5485529},
            "laminado_mate_por_lado": {"1": 189.6776846, "2 a 25": 175.4518583, "26 a 50": 175.4518583, "51 a 100": 161.2260319, "101 a 300": 147.0002056, "301 a 500": 147.0002056, "501 a 1000": 137.5163213},
            "laminado_soft_touch_por_lado": {"1": 8.6, "2 a 25": 6.6, "26 a 50": 6.6, "51 a 100": 6.0, "101 a 300": 5.7, "301 a 500": 5.7, "501 a 1000": 5.2},
        }
        plastificado_unit = 25.0
        range_label = self._resolve_laca_uv_label_by_qty(qty)

        if por_lado != "sin_adicional":
            if por_lado not in por_lado_matrix:
                raise ApiValidationError("adicional_laminado_por_lado_invalido")
            unit_pl = float(por_lado_matrix[por_lado][range_label])
            extra_unit += unit_pl
            detalle["laminado_por_lado"] = {
                "seleccion": por_lado,
                "rango_aplicado": range_label,
                "unitario": round(unit_pl, 6),
                "fuente": "Excel Laminado!F/G/K fila 7-11 (hoja 4)",
            }

        if plastificado:
            extra_unit += plastificado_unit
            detalle["plastificado"] = {
                "seleccion": True,
                "medida_excel": "A3",
                "mapeo_formato": formato,
                "unitario": plastificado_unit,
                "fuente": "Excel Laminado!G17 (hoja 4)",
            }

        if extra_unit <= 0:
            return result

        recargo = float(result.get("trazabilidad", {}).get("recargo_urgencia_aplicado", 0.0))
        factor_urgencia = 1.0 + recargo
        qty = int(result.get("cantidad_unidades", req.cantidad_unidades or 1))
        base_unit = float(result.get("precio_unitario_con_adicional_sin_iva", result.get("precio_unitario_sin_iva", 0.0)))
        new_unit = round(base_unit + extra_unit, 6)
        total_sin = round(new_unit * qty, 6)
        total_con = round(total_sin * factor_urgencia, 6)

        result["adicional_laminado_por_lado"] = por_lado
        result["adicional_plastificado"] = plastificado
        result["adicional_hoja4_unitario_sin_iva"] = round(extra_unit, 6)
        result["total_adicional_hoja4_sin_iva"] = round(extra_unit * qty, 6)
        result["precio_unitario_con_adicional_sin_iva"] = new_unit
        result["total_sin_iva"] = total_sin
        result["total_con_urgencia"] = total_con

        trace = result.setdefault("trazabilidad", {})
        trace["adicionales_hoja4"] = {
            "formato": formato,
            "aplica_a3plus_xa3": True,
            "oficio_habilitado": False,
            "detalle": detalle,
            "unitario_total_hoja4": round(extra_unit, 6),
            "cantidad": qty,
            "subtotal": round(extra_unit * qty, 6),
            "nota": "Adicionales hoja 4 sumados antes de urgencia.",
        }
        return result

    def _resolve_tinta_blanca_base_1_copia(self) -> float | None:
        cfg_path = self.project_root / "data" / "bajadas_autoadhesivas" / "autoadhesivas_v1_config.json"
        if not cfg_path.exists():
            return None
        cfg = self._read_json(cfg_path)
        raw = cfg.get("adicional_tinta_blanca_base_1_copia")
        if raw in (None, ""):
            return None
        try:
            numeric = float(raw)
        except (TypeError, ValueError):
            return None
        if numeric <= 0:
            return None
        return numeric

    @staticmethod
    def _resolve_laca_uv_label_by_qty(qty: int) -> str:
        if qty == 1:
            return "1"
        if 2 <= qty <= 25:
            return "2 a 25"
        if 26 <= qty <= 50:
            return "26 a 50"
        if 51 <= qty <= 100:
            return "51 a 100"
        if 101 <= qty <= 300:
            return "101 a 300"
        if 301 <= qty <= 500:
            return "301 a 500"
        if 501 <= qty <= 1000:
            return "501 a 1000"
        return "501 a 1000"

    @staticmethod
    def _resolve_laca_uv_unit_by_qty(qty: int) -> float:
        label = BajadasV2ApiService._resolve_laca_uv_label_by_qty(qty)
        matrix = {
            "1": 136.0,
            "2 a 25": 126.0,
            "26 a 50": 116.0,
            "51 a 100": 106.0,
            "101 a 300": 99.0,
            "301 a 500": 92.0,
            "501 a 1000": 85.0,
        }
        return float(matrix[label])

    def _apply_troquelado_adicional_opt_in(self, result: dict[str, Any], req: QuoteRequestSchema) -> dict[str, Any]:
        if req.adicional_troquelado is None:
            result["adicional_troquelado"] = False
            return result
        if req.adicional_troquelado is False:
            result["adicional_troquelado"] = False
            return result

        complejidad = (req.complejidad_troquelado or "").strip().lower()
        if not complejidad:
            raise ApiValidationError("complejidad_troquelado_requerida")

        complejidad_map = {
            "simple": "1x1_a_2x2",
            "medio": "2x2_a_4x4",
            "complejo": "5x5_a_9x9",
            "muy_complejo": "10x10_a_14x14",
            "ultra_complejo": "mas_de_15x15",
        }
        familia_tamano = complejidad_map.get(complejidad)
        if not familia_tamano:
            raise ApiValidationError("complejidad_troquelado_no_soportada")

        qty = int(result.get("cantidad_unidades", req.cantidad_unidades or 1))
        if qty < 1:
            raise ApiValidationError("cantidad_fuera_de_matriz")

        troquelado_out = self.troquelado_digital_engine.quote_as_dict(
            TroqueladoDigitalQuoteInput(
                categoria="Troquelado Digital",
                producto="troquelado_digital",
                familia_tamano=familia_tamano,
                cantidad_unidades=qty,
                urgencia="normal",
            )
        )

        recargo = float(result.get("trazabilidad", {}).get("recargo_urgencia_aplicado", 0.0))
        factor_urgencia = 1.0 + recargo

        base_unit_for_total = float(
            result.get("precio_unitario_con_adicional_sin_iva", result.get("precio_unitario_sin_iva", 0.0))
        )
        troquelado_unit = float(troquelado_out["precio_unitario_sin_iva"])
        total_unit_con_adicionales = round(base_unit_for_total + troquelado_unit, 6)
        total_sin_iva = round(total_unit_con_adicionales * qty, 6)
        total_con_urgencia = round(total_sin_iva * factor_urgencia, 6)

        result["adicional_troquelado"] = True
        result["complejidad_troquelado"] = complejidad
        result["adicional_troquelado_unitario_sin_iva"] = round(troquelado_unit, 6)
        result["total_adicional_troquelado_sin_iva"] = round(troquelado_unit * qty, 6)
        result["regla_troquelado_aplicada"] = troquelado_out["regla_aplicada"]
        result["fuente_troquelado"] = troquelado_out["fuente"]
        result["precio_unitario_con_adicionales_sin_iva"] = total_unit_con_adicionales
        result["total_sin_iva"] = total_sin_iva
        result["total_con_urgencia"] = total_con_urgencia

        trace = result.setdefault("trazabilidad", {})
        trace["adicional_troquelado"] = {
            "seleccion": True,
            "complejidad_aplicada": complejidad,
            "rango_aplicado": troquelado_out.get("cantidad_rango_aplicado"),
            "precio_unitario_troquelado": round(troquelado_unit, 6),
            "cantidad_unidades": qty,
            "subtotal_troquelado": round(troquelado_unit * qty, 6),
            "total_bajada_sin_troquelado": round(base_unit_for_total * qty, 6),
            "total_final_con_troquelado": total_sin_iva,
            "fuente": "PDF Troqueles digitales / página 11",
            "nota": "No incluye costo de impresión; se suma como adicional.",
            "regla_aplicada": troquelado_out["regla_aplicada"],
        }
        return result

    def get_config(self) -> tuple[int, dict[str, Any]]:
        return 200, self._read_json(self.config_editable_path)

    def get_config_history(self) -> tuple[int, dict[str, Any]]:
        return 200, {"history": self._read_json(self.config_history_path)}

    def get_config_tree(self) -> tuple[int, dict[str, Any]]:
        cfg = self._read_json(self.config_editable_path)
        return 200, {
            "version": cfg.get("editable_meta", {}).get("version", 1),
            "tree": {
                "dolar": {
                    "dolar_anterior_excel": cfg.get("dolar_anterior_excel"),
                    "dolar_actual": cfg.get("dolar_actual"),
                    "factor_dolar": cfg.get("factor_dolar"),
                },
                "factores": {
                    "factor_xa3": cfg.get("factor_xa3"),
                    "factores_xl_a4": cfg.get("factores_xl_a4", {}),
                    "factores_xl_byn": cfg.get("regla_especial_xl_byn", {}).get("factores", {}),
                },
                "recargos_urgencia": cfg.get("recargos_urgencia", {}),
                "escalas_cantidad": cfg.get("escalas_cantidad", []),
                "reglas_activas": {
                    "regla_especial_xl_byn": cfg.get("regla_especial_xl_byn", {}).get("activa"),
                    "correccion_xl_byn_1_1_parentesis": cfg.get("correccion_xl_byn_1_1_parentesis", {}).get("activa"),
                    "precios_fijos_csv": cfg.get("precios_fijos_csv", {}).get("activos"),
                },
            },
        }

    def get_config_diff(self) -> tuple[int, dict[str, Any]]:
        final_cfg = self._read_json(self.config_path)
        editable_cfg = self._read_json(self.config_editable_path)
        rows = self._build_diff_rows(final_cfg, editable_cfg)
        return 200, {
            "summary": {
                "total": len(rows),
                "modified": len([r for r in rows if r["estado"] == "modificado"]),
                "added": len([r for r in rows if r["estado"] == "agregado"]),
                "deleted": len([r for r in rows if r["estado"] == "eliminado"]),
            },
            "diff": rows,
        }

    def validate_config(self, payload: dict[str, Any] | None = None) -> tuple[int, dict[str, Any]]:
        cfg = self._read_json(self.config_editable_path)
        errors: list[str] = []
        warnings: list[str] = []
        self._validate_full_config(cfg, errors, warnings)
        return 200, {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}

    def simulate_config(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            quote_payload = payload.get("quote", payload)
            req = QuoteRequestSchema.from_payload(quote_payload).to_quote_input()
            use_cfg = bool(payload.get("use_config_editable", True))
            final_quote = self.engine.quote_as_dict(req)
            if not use_cfg:
                return 200, {
                    "precio_config_final": final_quote,
                    "precio_config_editable": None,
                    "diferencia_absoluta": 0.0,
                    "diferencia_porcentual": 0.0,
                    "trazabilidad_comparativa": {"mode": "solo_final"},
                }
            editable_cfg = self._read_json(self.config_editable_path)
            sim_engine = self._engine_with_config(editable_cfg)
            editable_quote = sim_engine.quote_as_dict(req)
            final_total = float(final_quote["total_con_urgencia"])
            editable_total = float(editable_quote["total_con_urgencia"])
            diff_abs = round(editable_total - final_total, 6)
            diff_pct = round((diff_abs / final_total * 100.0), 6) if final_total else 0.0
            return 200, {
                "precio_config_final": final_quote,
                "precio_config_editable": editable_quote,
                "diferencia_absoluta": diff_abs,
                "diferencia_porcentual": diff_pct,
                "trazabilidad_comparativa": {
                    "regla_final": final_quote.get("regla_aplicada"),
                    "regla_editable": editable_quote.get("regla_aplicada"),
                    "factor_final": final_quote.get("trazabilidad", {}).get("factor_aplicado"),
                    "factor_editable": editable_quote.get("trazabilidad", {}).get("factor_aplicado"),
                    "recargo_final": final_quote.get("trazabilidad", {}).get("recargo_urgencia_aplicado"),
                    "recargo_editable": editable_quote.get("trazabilidad", {}).get("recargo_urgencia_aplicado"),
                },
            }
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except QuoteInputError as exc:
            return 400, {"error": "urgencia_invalida", "detail": str(exc)}
        except PriceNotFoundError as exc:
            return 404, {"error": "combinacion_no_encontrada", "detail": str(exc)}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def create_candidate(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        motivo = str(payload.get("motivo", "staging_manual")).strip() or "staging_manual"
        validation_status, validation = self.validate_config({})
        if validation_status != 200:
            return validation_status, validation
        if not validation.get("valid", False):
            return 400, {
                "error": "validation_error",
                "detail": "Config editable inválida. No se creó candidato.",
                "validacion": validation,
            }

        _, diff_payload = self.get_config_diff()
        diff_rows = diff_payload.get("diff", [])
        changed = [r for r in diff_rows if r.get("estado") != "igual"]
        editable = self._read_json(self.config_editable_path)
        version = int(editable.get("editable_meta", {}).get("version", 1))
        candidate_id = f"CAND-{version:04d}-{self._now_compact()}"
        criticidad_max = self._max_criticidad(changed)
        candidate = {
            "candidate_id": candidate_id,
            "fecha": self._now_iso(),
            "version": version,
            "estado": "PENDIENTE_APROBACION",
            "resumen_diff": diff_payload.get("summary", {}),
            "cantidad_cambios": len(changed),
            "criticidad_maxima": criticidad_max,
            "config_snapshot": editable,
            "motivo": motivo,
            "usuario": "local",
            "hash_config": self._hash_json(editable),
            "validacion": validation,
            "warnings": validation.get("warnings", []),
        }
        candidates = self._read_json(self.config_candidates_path)
        if not isinstance(candidates, list):
            candidates = []
        candidates.append(candidate)
        self._write_json(self.config_candidates_path, candidates)
        return 200, {"status": "ok", "candidate_id": candidate_id, "estado": candidate["estado"]}

    def list_candidates(self) -> tuple[int, dict[str, Any]]:
        items = self._read_json(self.config_candidates_path)
        if not isinstance(items, list):
            items = []
        resumen = [
            {
                "candidate_id": c.get("candidate_id"),
                "fecha": c.get("fecha"),
                "version": c.get("version"),
                "estado": c.get("estado"),
                "cantidad_cambios": c.get("cantidad_cambios"),
                "criticidad_maxima": c.get("criticidad_maxima"),
                "motivo": c.get("motivo"),
            }
            for c in items
        ]
        return 200, {"candidates": resumen}

    def get_candidate(self, candidate_id: str) -> tuple[int, dict[str, Any]]:
        items = self._read_json(self.config_candidates_path)
        if not isinstance(items, list):
            items = []
        for c in items:
            if c.get("candidate_id") == candidate_id:
                return 200, c
        return 404, {"error": "not_found", "detail": f"Candidato no encontrado: {candidate_id}"}

    def reject_candidate(self, candidate_id: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        motivo = str(payload.get("motivo_rechazo", "rechazo_manual")).strip() or "rechazo_manual"
        items = self._read_json(self.config_candidates_path)
        if not isinstance(items, list):
            items = []
        for c in items:
            if c.get("candidate_id") == candidate_id:
                c["estado"] = "RECHAZADO"
                c["fecha_rechazo"] = self._now_iso()
                c["motivo_rechazo"] = motivo
                c["usuario_rechazo"] = "local"
                self._write_json(self.config_candidates_path, items)
                return 200, {"status": "ok", "candidate_id": candidate_id, "estado": "RECHAZADO"}
        return 404, {"error": "not_found", "detail": f"Candidato no encontrado: {candidate_id}"}

    def approve_candidate(self, candidate_id: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        motivo = str(payload.get("motivo_aprobacion", "aprobacion_manual")).strip() or "aprobacion_manual"
        items = self._read_json(self.config_candidates_path)
        if not isinstance(items, list):
            items = []
        for c in items:
            if c.get("candidate_id") != candidate_id:
                continue
            if c.get("estado") != "PENDIENTE_APROBACION":
                return 400, {"error": "validation_error", "detail": "Solo candidatos PENDIENTE_APROBACION se pueden aprobar."}
            c["estado"] = "APROBADO"
            c["fecha_aprobacion"] = self._now_iso()
            c["motivo_aprobacion"] = motivo
            c["usuario_aprobacion"] = "local"
            self._write_json(self.config_candidates_path, items)
            return 200, {"status": "ok", "candidate_id": candidate_id, "estado": "APROBADO"}
        return 404, {"error": "not_found", "detail": f"Candidato no encontrado: {candidate_id}"}

    def promote_candidate(self, candidate_id: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        confirm = str(payload.get("confirmacion", "")).strip()
        if confirm != "PROMOVER_CONFIG_BAJADAS_V2":
            return 400, {"error": "validation_error", "detail": "Confirmación inválida."}
        motivo = str(payload.get("motivo", "promocion_manual")).strip() or "promocion_manual"
        usuario = str(payload.get("usuario", "local")).strip() or "local"

        items = self._read_json(self.config_candidates_path)
        if not isinstance(items, list):
            items = []
        candidate = None
        for c in items:
            if c.get("candidate_id") == candidate_id:
                candidate = c
                break
        if not candidate:
            return 404, {"error": "not_found", "detail": f"Candidato no encontrado: {candidate_id}"}
        if candidate.get("estado") != "APROBADO":
            return 400, {"error": "validation_error", "detail": "Solo candidatos APROBADO pueden promoverse."}
        snapshot = candidate.get("config_snapshot")
        if not isinstance(snapshot, dict):
            return 400, {"error": "validation_error", "detail": "Snapshot de candidato inválido."}
        if self._hash_json(snapshot) != candidate.get("hash_config"):
            return 400, {"error": "validation_error", "detail": "Hash de candidato no coincide."}
        errors: list[str] = []
        warnings: list[str] = []
        self._validate_full_config(snapshot, errors, warnings)
        if errors:
            return 400, {"error": "validation_error", "detail": "Snapshot inválido para promoción.", "errors": errors}

        self.backups_dir.mkdir(parents=True, exist_ok=True)
        backup_name = f"bajadas_v2_config_final_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
        backup_path = self.backups_dir / backup_name
        current_final = self._read_json(self.config_path)
        self._write_json(backup_path, current_final)

        self._write_json(self.config_path, snapshot)
        self.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(self.project_root))

        candidate["estado"] = "PROMOVIDO"
        candidate["fecha_promocion"] = self._now_iso()
        candidate["backup_creado"] = str(backup_path)
        candidate["usuario_promocion"] = usuario
        candidate["motivo_promocion"] = motivo
        self._write_json(self.config_candidates_path, items)

        hist = self._read_json(self.config_history_path)
        if not isinstance(hist, list):
            hist = []
        hist.append(
            {
                "fecha": self._now_iso(),
                "campo": "promote_candidate",
                "valor_anterior": "config_final_prev",
                "valor_nuevo": candidate_id,
                "motivo": motivo,
                "version": snapshot.get("editable_meta", {}).get("version", 0),
                "usuario": usuario,
                "backup_creado": str(backup_path),
            }
        )
        self._write_json(self.config_history_path, hist)
        return 200, {
            "status": "ok",
            "candidate_id": candidate_id,
            "estado": "PROMOVIDO",
            "backup_creado": str(backup_path),
        }

    def get_active_version(self) -> tuple[int, dict[str, Any]]:
        final_cfg = self._read_json(self.config_path)
        candidates = self._read_json(self.config_candidates_path)
        if not isinstance(candidates, list):
            candidates = []
        promoted = [c for c in candidates if c.get("estado") == "PROMOVIDO"]
        promoted.sort(key=lambda c: c.get("fecha_promocion", ""), reverse=True)
        latest = promoted[0] if promoted else None
        return 200, {
            "version_activa": final_cfg.get("editable_meta", {}).get("version"),
            "fecha_ultima_promocion": latest.get("fecha_promocion") if latest else None,
            "candidato_origen": latest.get("candidate_id") if latest else None,
            "hash_config_final": self._hash_json(final_cfg),
            "ruta_config_final": str(self.config_path),
            "estado": "productiva",
        }

    def get_backups(self) -> tuple[int, dict[str, Any]]:
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        rows = []
        for p in sorted(self.backups_dir.glob("bajadas_v2_config_final*.json"), reverse=True):
            hashv = None
            warnings: list[str] = []
            valid = False
            try:
                payload = self._read_json(p)
                hashv = self._hash_json(payload)
                errors: list[str] = []
                self._validate_full_config(payload, errors, warnings)
                valid = len(errors) == 0
            except Exception:
                warnings.append("No se pudo parsear JSON del backup.")
            rows.append(
                {
                    "archivo": p.name,
                    "fecha": datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc).isoformat(),
                    "tamano_bytes": p.stat().st_size,
                    "hash": hashv,
                    "valid": valid,
                    "warnings": warnings,
                }
            )
        return 200, {"backups": rows}

    def get_backup_detail(self, backup_filename: str) -> tuple[int, dict[str, Any]]:
        path_or_err = self._resolve_backup_filename(backup_filename)
        if isinstance(path_or_err, tuple):
            return path_or_err
        backup_path = path_or_err
        if not backup_path.exists():
            return 404, {"error": "not_found", "detail": f"Backup no encontrado: {backup_filename}"}
        errors: list[str] = []
        warnings: list[str] = []
        hashv = None
        try:
            payload = self._read_json(backup_path)
            hashv = self._hash_json(payload)
            self._validate_full_config(payload, errors, warnings)
        except Exception as exc:
            errors.append(f"JSON inválido: {exc}")
        return 200, {
            "archivo": backup_path.name,
            "fecha": datetime.fromtimestamp(backup_path.stat().st_mtime, tz=timezone.utc).isoformat(),
            "tamano_bytes": backup_path.stat().st_size,
            "hash": hashv,
            "valid": len(errors) == 0,
            "warnings": warnings,
            "errors": errors,
        }

    def restore_from_backup(self, backup_filename: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        confirm = str(payload.get("confirmacion", "")).strip()
        if confirm != "RESTAURAR_BACKUP_BAJADAS_V2":
            return 400, {"error": "validation_error", "detail": "Confirmación inválida."}
        motivo = str(payload.get("motivo", "restore_backup_manual")).strip() or "restore_backup_manual"
        usuario = str(payload.get("usuario", "local")).strip() or "local"

        path_or_err = self._resolve_backup_filename(backup_filename)
        if isinstance(path_or_err, tuple):
            return path_or_err
        backup_path = path_or_err
        if not backup_path.exists():
            return 404, {"error": "not_found", "detail": f"Backup no encontrado: {backup_filename}"}

        try:
            backup_payload = self._read_json(backup_path)
        except Exception:
            return 400, {"error": "validation_error", "detail": "Backup inválido: JSON no parseable."}
        errors: list[str] = []
        warnings: list[str] = []
        self._validate_full_config(backup_payload, errors, warnings)
        if errors:
            return 400, {"error": "validation_error", "detail": "Backup inválido para restaurar.", "errors": errors}

        self.backups_dir.mkdir(parents=True, exist_ok=True)
        pre_restore_name = f"bajadas_v2_config_final_pre_restore_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
        pre_restore_path = self.backups_dir / pre_restore_name
        current_final = self._read_json(self.config_path)
        self._write_json(pre_restore_path, current_final)

        self._write_json(self.config_path, backup_payload)
        self.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(self.project_root))

        final_payload = self._read_json(self.config_path)
        restored_hash = self._hash_json(backup_payload)
        final_hash = self._hash_json(final_payload)

        hist = self._read_json(self.config_history_path)
        if not isinstance(hist, list):
            hist = []
        hist.append(
            {
                "tipo": "RESTORE_BACKUP",
                "fecha": self._now_iso(),
                "usuario": usuario,
                "motivo": motivo,
                "backup_restaurado": backup_path.name,
                "backup_pre_restore_creado": pre_restore_path.name,
                "hash_backup_restaurado": restored_hash,
                "hash_config_final_resultante": final_hash,
                "campo": "restore_backup",
                "valor_anterior": "config_final_prev",
                "valor_nuevo": backup_path.name,
                "version": final_payload.get("editable_meta", {}).get("version", 0),
            }
        )
        self._write_json(self.config_history_path, hist)
        return 200, {
            "status": "ok",
            "detail": "Backup restaurado sobre configuración productiva.",
            "backup_restaurado": backup_path.name,
            "backup_pre_restore_creado": pre_restore_path.name,
            "hash_config_final_resultante": final_hash,
        }

    def restore_preview_from_backup(self, backup_filename: str) -> tuple[int, dict[str, Any]]:
        path_or_err = self._resolve_backup_filename(backup_filename)
        if isinstance(path_or_err, tuple):
            return path_or_err
        backup_path = path_or_err
        if not backup_path.exists():
            return 404, {"error": "not_found", "detail": f"Backup no encontrado: {backup_filename}"}

        errors: list[str] = []
        warnings: list[str] = []
        try:
            backup_payload = self._read_json(backup_path)
        except Exception as exc:
            return 400, {"error": "validation_error", "detail": f"Backup inválido: {exc}"}
        self._validate_full_config(backup_payload, errors, warnings)

        current_final = self._read_json(self.config_path)
        diff_rows = self._build_diff_rows(current_final, backup_payload)
        changed = [r for r in diff_rows if r.get("estado") != "igual"]
        criticidad_max = self._max_criticidad(changed)
        return 200, {
            "backup_filename": backup_path.name,
            "backup_hash": self._hash_json(backup_payload),
            "config_final_hash_actual": self._hash_json(current_final),
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "diff_preview": [
                {
                    "campo": r["campo"],
                    "valor_actual": r["valor_final"],
                    "valor_backup": r["valor_editable"],
                    "estado": r["estado"],
                    "criticidad": r["criticidad"],
                    "descripcion": r["descripcion"],
                }
                for r in diff_rows
            ],
            "resumen": {
                "cantidad_cambios": len(changed),
                "criticidad_maxima": criticidad_max,
                "puede_restaurarse": len(errors) == 0,
            },
            "mensaje": "Dry-run: no se modificó la configuración productiva.",
        }

    def restore_simulate_from_backup(self, backup_filename: str, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        path_or_err = self._resolve_backup_filename(backup_filename)
        if isinstance(path_or_err, tuple):
            return path_or_err
        backup_path = path_or_err
        if not backup_path.exists():
            return 404, {"error": "not_found", "detail": f"Backup no encontrado: {backup_filename}"}

        quote_payload = payload.get("cotizacion")
        if not isinstance(quote_payload, dict):
            return 400, {"error": "validation_error", "detail": "cotizacion es obligatoria."}

        try:
            backup_payload = self._read_json(backup_path)
        except Exception:
            return 400, {"error": "validation_error", "detail": "Backup inválido: JSON no parseable."}
        errors: list[str] = []
        warnings: list[str] = []
        self._validate_full_config(backup_payload, errors, warnings)
        if errors:
            return 400, {"error": "validation_error", "detail": "Backup inválido para simulación.", "errors": errors}

        try:
            req = QuoteRequestSchema.from_payload(quote_payload).to_quote_input()
            result_final = self.engine.quote_as_dict(req)
            sim_engine = self._engine_with_config(backup_payload)
            result_backup = sim_engine.quote_as_dict(req)
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except QuoteInputError as exc:
            return 400, {"error": "urgencia_invalida", "detail": str(exc)}
        except PriceNotFoundError as exc:
            return 404, {
                "error": "combinacion_no_encontrada",
                "detail": f"Simulación con backup no pudo cotizar: {exc}",
            }
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

        unit_final = float(result_final["precio_unitario_sin_iva"])
        unit_backup = float(result_backup["precio_unitario_sin_iva"])
        total_final = float(result_final["total_sin_iva"])
        total_backup = float(result_backup["total_sin_iva"])
        total_u_final = float(result_final["total_con_urgencia"])
        total_u_backup = float(result_backup["total_con_urgencia"])
        diff_total = total_u_backup - total_u_final
        diff_pct = (diff_total / total_u_final * 100.0) if total_u_final else 0.0

        return 200, {
            "backup_filename": backup_path.name,
            "backup_hash": self._hash_json(backup_payload),
            "config_final_hash_actual": self._hash_json(self._read_json(self.config_path)),
            "resultado_config_final": result_final,
            "resultado_backup": result_backup,
            "diferencia_unitaria_sin_iva": round(unit_backup - unit_final, 6),
            "diferencia_total_sin_iva": round(total_backup - total_final, 6),
            "diferencia_total_con_urgencia": round(diff_total, 6),
            "diferencia_porcentual_total": round(diff_pct, 6),
            "trazabilidad_comparativa": {
                "regla_final": result_final.get("regla_aplicada"),
                "regla_backup": result_backup.get("regla_aplicada"),
                "fuente_final": result_final.get("fuente"),
                "fuente_backup": result_backup.get("fuente"),
                "factor_final": result_final.get("trazabilidad", {}).get("factor_aplicado"),
                "factor_backup": result_backup.get("trazabilidad", {}).get("factor_aplicado"),
                "recargo_final": result_final.get("trazabilidad", {}).get("recargo_urgencia_aplicado"),
                "recargo_backup": result_backup.get("trazabilidad", {}).get("recargo_urgencia_aplicado"),
            },
            "mensaje": "Simulación dry-run: no se modificó la configuración productiva.",
        }

    def restore_config_from_final(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        motivo = str(payload.get("motivo", "restauracion_desde_final")).strip() or "restauracion_desde_final"
        old_cfg = self._read_json(self.config_editable_path)
        self._write_json(self.config_editable_path, self._build_editable_from_final())
        new_cfg = self._read_json(self.config_editable_path)
        self._append_history(
            field="restore_from_final",
            previous=old_cfg.get("editable_meta", {}).get("version"),
            new=new_cfg.get("editable_meta", {}).get("version"),
            motivo=motivo,
            version=new_cfg.get("editable_meta", {}).get("version", 1),
        )
        return 200, {"status": "ok", "detail": "Configuración editable restaurada desde config final."}

    def update_config(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        try:
            field = str(payload.get("field", "")).strip()
            value = payload.get("value")
            motivo = str(payload.get("motivo", "actualizacion_manual")).strip() or "actualizacion_manual"
            if not field:
                raise ApiValidationError("field es obligatorio.")
            cfg = self._read_json(self.config_editable_path)
            old_value = self._deep_get(cfg, field)
            if old_value is None and field not in {"escalas_cantidad"}:
                raise ApiValidationError(f"Campo no editable o inexistente: {field}")

            if field == "dolar_actual":
                numeric = self._require_positive_number(value, field)
                cfg["dolar_actual"] = numeric
                cfg["factor_dolar"] = round(numeric / float(cfg["dolar_anterior_excel"]), 9)
            elif field == "dolar_anterior_excel":
                numeric = self._require_positive_number(value, field)
                cfg["dolar_anterior_excel"] = numeric
                cfg["factor_dolar"] = round(float(cfg["dolar_actual"]) / numeric, 9)
            elif field == "factor_xa3":
                cfg["factor_xa3"] = self._require_positive_number(value, field)
            elif field.startswith("recargos_urgencia."):
                key = field.split(".", 1)[1]
                numeric = self._require_percentage(value, field)
                if key not in cfg.get("recargos_urgencia", {}):
                    raise ApiValidationError(f"Recargo no reconocido: {key}")
                cfg["recargos_urgencia"][key] = numeric
            elif field.startswith("regla_especial_xl_byn.factores."):
                key = field.split(".", 2)[2]
                numeric = self._require_positive_number(value, field)
                factors = cfg.setdefault("regla_especial_xl_byn", {}).setdefault("factores", {})
                if key not in factors:
                    raise ApiValidationError(f"Factor XL ByN no reconocido: {key}")
                factors[key] = numeric
            elif field == "escalas_cantidad":
                cfg["escalas_cantidad"] = self._validate_scales(value)
            elif field.startswith("factores_xl_a4."):
                key = field.split(".", 1)[1]
                numeric = self._require_positive_number(value, field)
                factors = cfg.setdefault("factores_xl_a4", {})
                factors[key] = numeric
            else:
                raise ApiValidationError(f"Campo no editable o no soportado en esta etapa: {field}")

            meta = cfg.setdefault("editable_meta", {"version": 1, "last_updated": None})
            meta["version"] = int(meta.get("version", 1)) + 1
            meta["last_updated"] = self._now_iso()
            self._write_json(self.config_editable_path, cfg)
            self._append_history(
                field=field,
                previous=old_value,
                new=self._deep_get(cfg, field),
                motivo=motivo,
                version=meta["version"],
            )
            return 200, {"status": "ok", "field": field, "version": meta["version"]}
        except ApiValidationError as exc:
            return 400, {"error": "validation_error", "detail": str(exc)}
        except Exception as exc:  # pragma: no cover
            return 500, {"error": "internal_error", "detail": str(exc)}

    def _ensure_editable_config(self) -> None:
        self.config_editable_path.parent.mkdir(parents=True, exist_ok=True)
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        if not self.config_editable_path.exists():
            self._write_json(self.config_editable_path, self._build_editable_from_final())
        if not self.config_history_path.exists():
            self._write_json(self.config_history_path, [])
        if not self.config_candidates_path.exists():
            self._write_json(self.config_candidates_path, [])

    def _build_editable_from_final(self) -> dict[str, Any]:
        base = self._read_json(self.config_path)
        base["editable_meta"] = {"version": 1, "last_updated": self._now_iso(), "usuario": "local"}
        base["escalas_cantidad"] = self._build_scales_from_options()
        base.setdefault("factores_xl_a4", {"xl_global": 1.0, "a4_global": 1.0})
        return base

    def _build_scales_from_options(self) -> list[dict[str, Any]]:
        options_path = self.project_root / "frontend" / "src" / "data" / "bajadasOptions.json"
        if not options_path.exists():
            return []
        rows = self._read_json(options_path)
        labels = sorted({str(r.get("cantidad_rango", "")).strip() for r in rows if r.get("cantidad_rango")})
        parsed = []
        for label in labels:
            if label == "1":
                parsed.append({"desde": 1, "hasta": 1, "etiqueta": "1", "activa": True})
                continue
            parts = label.split("a")
            if len(parts) != 2:
                continue
            try:
                desde = int(parts[0].strip())
                hasta = int(parts[1].strip())
            except ValueError:
                continue
            parsed.append({"desde": desde, "hasta": hasta, "etiqueta": f"{desde} a {hasta}", "activa": True})
        parsed.sort(key=lambda x: (x["desde"], x["hasta"]))
        canonical: list[dict[str, Any]] = []
        last_end = 0
        i = 0
        while i < len(parsed):
            start = parsed[i]["desde"]
            group: list[dict[str, Any]] = []
            while i < len(parsed) and parsed[i]["desde"] == start:
                group.append(parsed[i])
                i += 1
            group.sort(key=lambda r: (r["hasta"] - r["desde"], r["hasta"]))
            chosen = group[0]
            if chosen["desde"] > last_end:
                canonical.append(chosen)
                last_end = chosen["hasta"]
        for idx, row in enumerate(canonical, start=1):
            row["orden"] = idx
        return canonical

    def _validate_scales(self, scales: Any) -> list[dict[str, Any]]:
        if not isinstance(scales, list) or not scales:
            raise ApiValidationError("escalas_cantidad debe ser una lista no vacía.")
        validated: list[dict[str, Any]] = []
        for idx, raw in enumerate(scales, start=1):
            if not isinstance(raw, dict):
                raise ApiValidationError("Cada escala debe ser un objeto.")
            etiqueta = str(raw.get("etiqueta", "")).strip()
            if not etiqueta:
                raise ApiValidationError("Etiqueta de escala vacía.")
            try:
                desde = int(raw.get("desde"))
                hasta = int(raw.get("hasta"))
            except (TypeError, ValueError):
                raise ApiValidationError("Escalas inválidas: desde/hasta deben ser enteros.")
            if desde < 1 or hasta < 1 or desde > hasta:
                raise ApiValidationError("Escalas inválidas: desde/hasta fuera de rango o invertidos.")
            activa = bool(raw.get("activa", True))
            orden = int(raw.get("orden", idx))
            validated.append(
                {"desde": desde, "hasta": hasta, "etiqueta": etiqueta, "activa": activa, "orden": orden}
            )
        active = sorted([r for r in validated if r["activa"]], key=lambda x: (x["desde"], x["hasta"]))
        for i in range(len(active) - 1):
            current = active[i]
            nxt = active[i + 1]
            if nxt["desde"] <= current["hasta"]:
                raise ApiValidationError("Escalas superpuestas detectadas.")
        return sorted(validated, key=lambda x: x["orden"])

    def _append_history(self, *, field: str, previous: Any, new: Any, motivo: str, version: int) -> None:
        history = self._read_json(self.config_history_path)
        if not isinstance(history, list):
            history = []
        history.append(
            {
                "fecha": self._now_iso(),
                "campo": field,
                "valor_anterior": previous,
                "valor_nuevo": new,
                "motivo": motivo,
                "version": version,
                "usuario": "local",
            }
        )
        self._write_json(self.config_history_path, history)

    def _engine_with_config(self, config: dict[str, Any]) -> BajadasV2PricingEngine:
        bundle = BajadasV2Bundle(
            config=config,
            comparativa_final=self.engine.bundle.comparativa_final,
            precios_objetivo=self.engine.bundle.precios_objetivo,
        )
        return BajadasV2PricingEngine(bundle)

    def _validate_full_config(self, cfg: dict[str, Any], errors: list[str], warnings: list[str]) -> None:
        required_top = [
            "dolar_anterior_excel",
            "dolar_actual",
            "factor_xa3",
            "recargos_urgencia",
            "regla_especial_xl_byn",
            "precios_fijos_csv",
            "escalas_cantidad",
        ]
        for key in required_top:
            if key not in cfg:
                errors.append(f"Falta campo obligatorio: {key}")

        try:
            self._require_positive_number(cfg.get("dolar_anterior_excel"), "dolar_anterior_excel")
            self._require_positive_number(cfg.get("dolar_actual"), "dolar_actual")
            self._require_positive_number(cfg.get("factor_xa3"), "factor_xa3")
        except ApiValidationError as exc:
            errors.append(str(exc))

        recargos = cfg.get("recargos_urgencia", {})
        for k in ["normal", "express", "super_express", "ya_24hs"]:
            if k not in recargos:
                errors.append(f"Falta recargo: {k}")
                continue
            try:
                self._require_percentage(recargos.get(k), f"recargos_urgencia.{k}")
            except ApiValidationError as exc:
                errors.append(str(exc))

        try:
            self._validate_scales(cfg.get("escalas_cantidad", []))
        except ApiValidationError as exc:
            errors.append(str(exc))

        fixed = cfg.get("precios_fijos_csv", {}).get("casos", [])
        if not isinstance(fixed, list):
            errors.append("precios_fijos_csv.casos debe ser lista.")
        else:
            for idx, case in enumerate(fixed, start=1):
                if not isinstance(case, dict):
                    errors.append(f"Caso fijo {idx} inválido.")
                    continue
                if "id" not in case or "precio_objetivo_csv" not in case:
                    errors.append(f"Caso fijo {idx} incompleto (id/precio_objetivo_csv).")
                else:
                    try:
                        self._require_positive_number(case.get("precio_objetivo_csv"), f"precios_fijos_csv.casos[{idx}]")
                    except ApiValidationError as exc:
                        errors.append(str(exc))

        if cfg.get("editable_meta", {}).get("version", 0) < 1:
            warnings.append("editable_meta.version no inicializada correctamente.")

    def _build_diff_rows(self, final_cfg: Any, editable_cfg: Any) -> list[dict[str, Any]]:
        final_flat = self._flatten(final_cfg)
        editable_flat = self._flatten(editable_cfg)
        all_fields = sorted(set(final_flat.keys()) | set(editable_flat.keys()))
        rows: list[dict[str, Any]] = []
        for field in all_fields:
            in_final = field in final_flat
            in_edit = field in editable_flat
            if in_final and in_edit and final_flat[field] == editable_flat[field]:
                estado = "igual"
            elif in_final and in_edit:
                estado = "modificado"
            elif in_edit and not in_final:
                estado = "agregado"
            else:
                estado = "eliminado"
            rows.append(
                {
                    "campo": field,
                    "valor_final": final_flat.get(field),
                    "valor_editable": editable_flat.get(field),
                    "estado": estado,
                    "criticidad": self._criticidad_for_field(field, estado),
                    "descripcion": self._descripcion_for_field(field, estado),
                }
            )
        return rows

    @staticmethod
    def _flatten(data: Any, prefix: str = "") -> dict[str, Any]:
        out: dict[str, Any] = {}
        if isinstance(data, dict):
            for k, v in data.items():
                new_prefix = f"{prefix}.{k}" if prefix else str(k)
                out.update(BajadasV2ApiService._flatten(v, new_prefix))
        elif isinstance(data, list):
            out[prefix] = deepcopy(data)
        else:
            out[prefix] = data
        return out

    @staticmethod
    def _criticidad_for_field(field: str, estado: str) -> str:
        if estado == "igual":
            return "baja"
        high_keys = ("dolar", "factor", "recargos_urgencia", "precios_fijos_csv", "regla_especial_xl_byn")
        mid_keys = ("escalas_cantidad", "editable_meta")
        if any(k in field for k in high_keys):
            return "alta"
        if any(k in field for k in mid_keys):
            return "media"
        return "baja"

    @staticmethod
    def _descripcion_for_field(field: str, estado: str) -> str:
        return f"Campo {field} en estado {estado} entre config final y editable."

    @staticmethod
    def _hash_json(data: Any) -> str:
        raw = json.dumps(data, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    @staticmethod
    def _max_criticidad(rows: list[dict[str, Any]]) -> str:
        if not rows:
            return "baja"
        rank = {"baja": 1, "media": 2, "alta": 3}
        best = "baja"
        for r in rows:
            c = str(r.get("criticidad", "baja"))
            if rank.get(c, 1) > rank.get(best, 1):
                best = c
        return best

    @staticmethod
    def _require_positive_number(value: Any, field: str) -> float:
        try:
            numeric = float(value)
        except (TypeError, ValueError) as exc:
            raise ApiValidationError(f"{field} debe ser numérico.") from exc
        if numeric <= 0:
            raise ApiValidationError(f"{field} debe ser mayor a 0.")
        return numeric

    @staticmethod
    def _require_percentage(value: Any, field: str) -> float:
        try:
            numeric = float(value)
        except (TypeError, ValueError) as exc:
            raise ApiValidationError(f"{field} debe ser numérico.") from exc
        if numeric < 0 or numeric > 1:
            raise ApiValidationError(f"{field} debe estar entre 0 y 1.")
        return numeric

    @staticmethod
    def _deep_get(data: dict[str, Any], dotted: str) -> Any:
        parts = dotted.split(".")
        current: Any = data
        for part in parts:
            if not isinstance(current, dict) or part not in current:
                return None
            current = current[part]
        return deepcopy(current)

    @staticmethod
    def _read_json(path: Path) -> Any:
        with path.open("r", encoding="utf-8-sig") as fh:
            return json.load(fh)

    @staticmethod
    def _write_json(path: Path, payload: Any) -> None:
        with path.open("w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _now_compact() -> str:
        return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    def _resolve_backup_filename(self, backup_filename: str) -> Path | tuple[int, dict[str, Any]]:
        name = str(backup_filename or "").strip()
        if not name:
            return 400, {"error": "validation_error", "detail": "backup_filename requerido."}
        if (
            ".." in name
            or "/" in name
            or "\\" in name
            or Path(name).is_absolute()
            or ":" in name
        ):
            return 400, {"error": "validation_error", "detail": "backup_filename inválido."}
        if not name.endswith(".json"):
            return 400, {"error": "validation_error", "detail": "backup_filename debe terminar en .json."}
        return self.backups_dir / name
