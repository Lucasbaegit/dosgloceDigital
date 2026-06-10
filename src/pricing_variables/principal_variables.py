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
                "applies_today": False,
                "impact": "Impacta costos expresados en USD cuando el producto usa f?rmula variable; precios PDF fijos no cambian.",
            },
            "click_color": {
                "group": "clicks",
                "label": "Click color base",
                "unit": "ARS",
                "description": "Click color base usado en f?rmulas variables calibradas.",
                "tipo": "variable_madre",
                "min": 0.01,
                "max": 100000,
                "step": 0.01,
                "source_file": "data/stickers_circulares/formula_editable_config.json",
                "path": ["variables", "click_color_base"],
                "applies_today": True,
                "impact": "Cambia el precio base estimado y la trazabilidad de Stickers Circulares.",
            },
            "obra_90g": {
                "group": "papeles",
                "label": "Papel obra/ilustraci?n 90g",
                "unit": "USD",
                "description": "Costo base real del material usado en f?rmula editable de Stickers Circulares.",
                "tipo": "variable_madre",
                "min": 0.01,
                "max": 1000000,
                "step": 0.01,
                "source_file": "data/stickers_circulares/formula_editable_config.json",
                "path": ["variables", "material_base", "obra_ilustracion_90g"],
                "applies_today": True,
                "impact": "Cambia el precio base estimado y la trazabilidad de Stickers Circulares.",
            },
            "multiplicador_general": {
                "group": "multiplicadores",
                "label": "Multiplicador comercial general",
                "unit": "factor",
                "description": "Multiplicador comercial general de f?rmulas variables calibradas.",
                "tipo": "variable_madre",
                "min": 0.01,
                "max": 100,
                "step": 0.01,
                "source_file": "data/stickers_circulares/formula_editable_config.json",
                "path": ["variables", "multiplicador_comercial"],
                "applies_today": True,
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
                "applies_today": True,
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

    def get_grouped(self) -> dict[str, Any]:
        grouped = {group: [] for group in self.GROUP_ORDER}
        for key, meta in self.catalog.items():
            item = deepcopy(meta)
            item.update({
                "key": key,
                "value": self._read_value(meta),
                "editable": True,
                "impacta_hoy": bool(meta.get("applies_today")),
            })
            item.pop("path", None)
            grouped[meta["group"]].append(item)
        return {
            **grouped,
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
                {"grupo": "Troquelado Digital", "rangos": ["1 a 2", "3 a 9", "10 a 25", "26 a 50", "51 a 100", "m?s de 100"], "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/troquelado_digital/precios_pdf_objetivo_troquelado_digital.json"},
                {"grupo": "Tarjetas / Postales / Folletos / Stickers / Imanes", "rangos": package, "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "matrices PDF por producto"},
                {"grupo": "Carpetas", "rangos": standard, "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/carpetas/precios_pdf_objetivo_carpetas.json"},
                {"grupo": "Sobres", "rangos": package, "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/sobres/precios_pdf_objetivo_sobres.json"},
                {"grupo": "Plancha Im?n", "rangos": ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500"], "editable": False, "tipo": "rango_fijo", "motivo": reason, "fuente": "data/plancha_iman_impreso/precios_pdf_objetivo_plancha_iman_impreso.json"},
                {"grupo": "Agendas / Cuadernos", "rangos": ["desde 2 unidades", "m?nimos seg?n producto"], "editable": False, "tipo": "rango_fijo", "motivo": "Los m?nimos pertenecen a matrices PDF cerradas", "fuente": "data/agendas_cuadernos/precios_pdf_objetivo_agendas_cuadernos.json"},
            ],
            "warning": "Rangos fijos de matrices. No son editables en esta etapa.",
        }

    def audit(self) -> dict[str, Any]:
        files = sorted({str(meta["source_file"]) for meta in self.catalog.values()})
        mtimes = {}
        for relative in files:
            path = self.project_root / relative
            mtimes[relative] = (
                datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat() if path.exists() else None
            )
        return {
            "ultima_modificacion_por_archivo": mtimes,
            "archivos_mapeados": files,
            "variables_editables_disponibles": sorted(self.catalog),
            "variables_no_encontradas": list(self.expected_but_missing),
            "papeles_detectados_no_editables": self._detected_papers_status(),
            "advertencias": [
                "No se exponen matrices PDF, factores de ajuste PDF ni coeficientes t?cnicos internos.",
                "Los precios finales PDF fijos permanecen sin cambios.",
            ],
        }

    def _detected_papers_status(self) -> dict[str, list[dict[str, Any]]]:
        editable_keys = set(self.catalog)
        result = {}
        for family, keys in self.detected_papers.items():
            result[family] = [
                {
                    "key": key,
                    "label": key.replace("_", " ").title(),
                    "editable": key in editable_keys,
                    "tipo": "variable_madre" if key in editable_keys else "detectado_sin_costo_base",
                    "unit": "USD",
                    "estado": "variable_madre_editable" if key in editable_keys else "detectado_sin_costo_base_confiable",
                    "motivo_no_editable": None if key in editable_keys else "Detectado en tablas PDF, pero no existe costo base confiable en USD.",
                    "impacta_hoy": key in editable_keys,
                    "source_file": "data/variables_comerciales/papeles.json",
                }
                for key in keys
            ]
        return result

    @staticmethod
    def _derived_values_status() -> list[dict[str, Any]]:
        return [
            {"key": "precios_finales_por_rango", "label": "Precios finales por rango", "editable": False, "tipo": "derivado", "motivo_no_editable": "Son resultado de matrices PDF o f?rmulas controladas.", "impacta_hoy": False},
            {"key": "recargos_urgencia", "label": "Precios con urgencia", "editable": False, "tipo": "derivado", "motivo_no_editable": "Se calculan desde la cotizaci?n base y reglas internas.", "impacta_hoy": False},
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
            raise PrincipalVariableError("updates debe ser una lista no vac?a.")

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

        files = sorted({meta["source_file"] for _, _, meta, _ in prepared})
        backups = [self._backup_file(relative) for relative in files]
        documents = {relative: self._read_json(self.project_root / relative) for relative in files}

        for _, value, meta, _ in prepared:
            self._set_nested(documents[meta["source_file"]], meta["path"], value)
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
        if source_file not in {meta["source_file"] for meta in self.catalog.values()}:
            raise PrincipalVariableError("backup_incompatible")
        current_backup = self._backup_file(source_file)
        restored = deepcopy(backup)
        restored.pop("_variables_principales_source_file", None)
        restored.pop("_variables_principales_backup_at", None)
        self._write_json(self.project_root / source_file, restored)
        return {"archivo_restaurado": source_file, "backup_previo_generado": current_backup}

    def _read_value(self, meta: dict[str, Any]) -> float:
        data = self._read_json(self.project_root / meta["source_file"])
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
