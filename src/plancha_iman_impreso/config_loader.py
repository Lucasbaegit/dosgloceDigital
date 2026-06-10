from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class PlanchaImanImpresoBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]


def load_plancha_iman_impreso_bundle(project_root: Path) -> PlanchaImanImpresoBundle:
    base = project_root / "data" / "plancha_iman_impreso"
    rows = json.loads((base / "precios_pdf_objetivo_plancha_iman_impreso.json").read_text(encoding="utf-8-sig"))
    trace = json.loads((base / "plancha_iman_impreso_excel_trace.json").read_text(encoding="utf-8-sig"))
    return PlanchaImanImpresoBundle(rows=rows, excel_trace=trace)
