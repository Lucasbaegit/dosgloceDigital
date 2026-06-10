"""Normalize the internal price datasets for JSON and PDF exports."""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any


class PricesTablesBuilder:
    DATASETS = [
        ("Bajadas Fullcolor / ByN / Kraft", "data/bajadas_v2/precios_pdf_objetivo_limpio.json"),
        ("Bajadas Autoadhesivas", "data/bajadas_autoadhesivas/precios_autoadhesivas_objetivo.json"),
        ("Stickers Circulares", "data/stickers_circulares/precios_pdf_objetivo_stickers_circulares.json"),
        ("Troquelado Digital", "data/troquelado_digital/precios_pdf_objetivo_troquelado_digital.json"),
        ("Tarjetas Troqueladas Circulares", "data/tarjetas_troqueladas_circulares/precios_pdf_objetivo_tarjetas_troqueladas_circulares.json"),
        ("Tarjetas Personales", "data/tarjetas_9x5/precios_pdf_objetivo_tarjetas_9x5.json"),
        ("Tarjetas Postales", "data/tarjetas_postales/precios_pdf_objetivo_tarjetas_postales.json"),
        ("Folletos", "data/folletos/precios_pdf_objetivo_folletos.json"),
        ("Carpetas", "data/carpetas/precios_pdf_objetivo_carpetas.json"),
        ("Sobres", "data/sobres/precios_pdf_objetivo_sobres.json"),
        ("Stickers Corte Recto", "data/stickers_corte_recto/precios_pdf_objetivo_stickers_corte_recto.json"),
        ("Imanes Corte Recto", "data/imanes_corte_recto/precios_pdf_objetivo_imanes_corte_recto.json"),
        ("Plancha de Imán Impreso", "data/plancha_iman_impreso/precios_pdf_objetivo_plancha_iman_impreso.json"),
        ("Agendas / Cuadernos", "data/agendas_cuadernos/precios_pdf_objetivo_agendas_cuadernos.json"),
    ]
    BLOCKED = [
        {
            "titulo": "Terminaciones Tarjetas",
            "estado": "bloqueado",
            "motivo": "Bloqueado por falta de datos confiables",
            "fuente": "docs/auditorias",
            "columnas": [],
            "filas": [],
        },
        {
            "titulo": "Membretes",
            "estado": "bloqueado",
            "motivo": "Bloqueado por falta de datos confiables",
            "fuente": "data/membretes/membretes_bloqueado_por_falta_de_datos.json",
            "columnas": [],
            "filas": [],
        },
    ]

    def __init__(self, project_root: Path):
        self.project_root = project_root

    def build(self) -> dict[str, Any]:
        tables = [self._build_table(title, relative) for title, relative in self.DATASETS]
        tables.extend(self.BLOCKED)
        active_empty = [table["titulo"] for table in tables if table["estado"] == "activo" and not table["filas"]]
        if active_empty:
            raise ValueError(f"tablas_activas_vacias:{','.join(active_empty)}")
        return {
            "metadata": {
                "titulo": "Lista de precios generada por Cotizador Digital",
                "generado_en": datetime.now(timezone.utc).isoformat(),
                "nota": "Precios sin IVA",
                "origen": "Matrices internas versionadas del sistema",
            },
            "productos_excluidos": ["DTF UV", "DTF Textil", "PegaManía"],
            "tablas": tables,
        }

    def _build_table(self, title: str, relative: str) -> dict[str, Any]:
        document = json.loads((self.project_root / relative).read_text(encoding="utf-8-sig"))
        rows = document.get("rows", []) if isinstance(document, dict) else document
        rows = rows if isinstance(rows, list) else []
        dict_rows = [row for row in rows if isinstance(row, dict)]
        columns: list[str] = []
        for row in dict_rows:
            for key in row:
                if key not in columns:
                    columns.append(key)
        return {
            "titulo": title,
            "estado": "activo",
            "fuente": relative,
            "columnas": columns,
            "filas": [[row.get(column) for column in columns] for row in dict_rows],
        }
