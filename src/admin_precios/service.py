"""Administrative price-variable editing with preview, backup and audit log."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

from pricing_trace.impact_map import VariableImpactMap
from pricing_variables import PrincipalVariableError, PrincipalVariablesService


class AdminPricesService:
    """Safe write facade for the small set of operational variables."""

    EDITABLE_KEYS = {
        "tipo_cambio_usd",
        "click_color",
        "obra_90g",
        "multiplicador_general",
        "adicional_tinta_blanca_base_1_copia",
    }

    def __init__(self, project_root: Path, principal_variables: PrincipalVariablesService):
        self.project_root = project_root
        self.principal_variables = principal_variables
        self.impact_map = VariableImpactMap(project_root)
        self.history_path = project_root / "data" / "admin_precios" / "historial_cambios.json"

    def variables_editables(self) -> dict[str, Any]:
        variables = []
        grouped = self.principal_variables.get_grouped()
        for group in PrincipalVariablesService.GROUP_ORDER:
            for item in grouped.get(group, []):
                if item["key"] not in self.EDITABLE_KEYS:
                    continue
                impacts = self._impacts_for_variable(item["key"])
                variables.append({
                    "key": item["key"],
                    "label": item["label"],
                    "value": item["value"],
                    "unit": item["unit"],
                    "description": item["description"],
                    "impacta_hoy": item.get("impacta_hoy", False),
                    "editable": True,
                    "estado": "editable" if item.get("impacta_hoy") else "documentado_no_conectado",
                    "productos_afectados": sorted({impact["producto"] for impact in impacts}),
                    "impactos": impacts,
                    "min": item.get("min"),
                    "max": item.get("max"),
                    "step": item.get("step"),
                })
        variables.sort(key=lambda item: item["label"].lower())
        return {
            "ok": True,
            "variables": variables,
            "warning": "El Excel maestro es soporte/auditoria. La edicion operativa se hace desde este administrador.",
        }

    def preview(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        validation = self._validate_payload(payload)
        if validation[0] != 200:
            return validation
        _, data = validation
        variable = data["variable"]
        nuevo_valor = data["nuevo_valor"]
        current = self._current_variable(variable)
        valor_actual = float(current["value"])
        diferencia = nuevo_valor - valor_actual
        diferencia_porcentual = (diferencia / valor_actual * 100) if valor_actual else None
        impactos = self._impacts_for_variable(variable)
        warnings = []
        if any(not item["impacta_hoy"] for item in impactos):
            warnings.append("Hay relaciones documentadas que no recalculan precios actuales.")
        if not impactos:
            warnings.append("No hay impactos registrados en el mapa read-only.")
        return 200, {
            "ok": True,
            "variable": variable,
            "label": current["label"],
            "valor_actual": valor_actual,
            "nuevo_valor": nuevo_valor,
            "unidad": current["unit"],
            "diferencia": diferencia,
            "diferencia_porcentual": diferencia_porcentual,
            "impactos": impactos,
            "precios_ejemplo": self._example_prices(variable, valor_actual, nuevo_valor),
            "advertencias": warnings,
            "requiere_confirmacion": True,
        }

    def apply(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        if payload.get("confirmado") is not True:
            return 400, {
                "ok": False,
                "error": "confirmacion_requerida",
                "detail": "Ejecutar preview y enviar confirmado=true para guardar.",
            }
        status, preview = self.preview(payload)
        if status != 200:
            return status, preview
        variable = preview["variable"]
        nuevo_valor = preview["nuevo_valor"]
        try:
            update_result = self.principal_variables.update({
                "updates": [{"key": variable, "value": nuevo_valor}]
            })
        except PrincipalVariableError as exc:
            return 400, {"ok": False, "error": "admin_precios_validation_error", "detail": str(exc)}
        history_entry = self._append_history(preview, update_result)
        return 200, {
            "ok": True,
            "aplicado": True,
            "variable": variable,
            "valor_anterior": preview["valor_actual"],
            "valor_nuevo": nuevo_valor,
            "preview": preview,
            "backup": update_result.get("backups_generados", []),
            "archivos_modificados": update_result.get("archivos_modificados", []),
            "historial": history_entry,
        }

    def history(self) -> dict[str, Any]:
        return {
            "ok": True,
            "historial": self._read_history(),
        }

    def _validate_payload(self, payload: dict[str, Any]) -> tuple[int, dict[str, Any]]:
        variable = str(payload.get("variable", "")).strip()
        if variable not in self.EDITABLE_KEYS:
            return 400, {
                "ok": False,
                "error": "variable_no_editable",
                "detail": f"La variable no es editable desde Administrador de precios: {variable}",
            }
        raw_value = payload.get("nuevo_valor")
        if isinstance(raw_value, bool):
            return 400, {"ok": False, "error": "valor_no_numerico", "detail": "nuevo_valor debe ser numerico."}
        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            return 400, {"ok": False, "error": "valor_no_numerico", "detail": "nuevo_valor debe ser numerico."}
        if value <= 0:
            return 400, {"ok": False, "error": "valor_fuera_de_rango", "detail": "nuevo_valor debe ser mayor a cero."}
        current = self._current_variable(variable)
        min_value = float(current.get("min") or 0)
        max_value = float(current.get("max") or 10**12)
        if value < min_value or value > max_value:
            return 400, {
                "ok": False,
                "error": "valor_fuera_de_rango",
                "detail": f"nuevo_valor debe estar entre {min_value} y {max_value}.",
            }
        return 200, {"variable": variable, "nuevo_valor": value}

    def _current_variable(self, variable: str) -> dict[str, Any]:
        grouped = self.principal_variables.get_grouped()
        for group in PrincipalVariablesService.GROUP_ORDER:
            for item in grouped.get(group, []):
                if item.get("key") == variable:
                    return item
        raise KeyError(variable)

    def _impacts_for_variable(self, variable: str) -> list[dict[str, Any]]:
        status, body = self.impact_map.by_variable(variable)
        if status != 200:
            return []
        return body.get("relaciones", [])

    @staticmethod
    def _example_prices(variable: str, current: float, new: float) -> list[dict[str, Any]]:
        if variable == "adicional_tinta_blanca_base_1_copia":
            quantity = 30
            return [{
                "nombre": "Autoadhesivas tinta blanca x30",
                "antes": current * quantity,
                "despues": new * quantity,
                "detalle": "Subtotal adicional proporcional: valor base 1 copia x cantidad.",
            }]
        if variable in {"click_color", "obra_90g", "multiplicador_general", "tipo_cambio_usd"}:
            return [{
                "nombre": "Stickers Circulares formula editable calibrada",
                "antes": None,
                "despues": None,
                "detalle": "Impacto real visible en formula/base; el precio final conserva calibracion PDF por combinacion.",
            }]
        return []

    def _append_history(self, preview: dict[str, Any], update_result: dict[str, Any]) -> dict[str, Any]:
        history = self._read_history()
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "variable": preview["variable"],
            "valor_anterior": preview["valor_actual"],
            "valor_nuevo": preview["nuevo_valor"],
            "fuente": "sistema",
            "backup": update_result.get("backups_generados", []),
            "impactos_resumen": [
                {
                    "producto": item.get("producto"),
                    "impacta_hoy": item.get("impacta_hoy"),
                    "estado": item.get("estado"),
                    "componente": item.get("componente"),
                }
                for item in preview.get("impactos", [])
            ],
        }
        history.append(entry)
        self.history_path.parent.mkdir(parents=True, exist_ok=True)
        self.history_path.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return entry

    def _read_history(self) -> list[dict[str, Any]]:
        if not self.history_path.exists():
            return []
        payload = json.loads(self.history_path.read_text(encoding="utf-8-sig"))
        return payload if isinstance(payload, list) else []
