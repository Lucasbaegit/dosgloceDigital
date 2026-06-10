from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class AgendasCuadernosBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]


def load_agendas_cuadernos_bundle(project_root: Path) -> AgendasCuadernosBundle:
    base = project_root / "data" / "agendas_cuadernos"
    rows = json.loads((base / "precios_pdf_objetivo_agendas_cuadernos.json").read_text(encoding="utf-8-sig"))
    trace = json.loads((base / "agendas_cuadernos_excel_trace.json").read_text(encoding="utf-8-sig"))
    return AgendasCuadernosBundle(rows=rows, excel_trace=trace)
