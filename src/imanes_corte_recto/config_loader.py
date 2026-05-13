from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ImanesCorteRectoBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]


def load_imanes_corte_recto_bundle(project_root: Path) -> ImanesCorteRectoBundle:
    data_path = project_root / "data" / "imanes_corte_recto" / "precios_pdf_objetivo_imanes_corte_recto.json"
    trace_path = project_root / "data" / "imanes_corte_recto" / "imanes_corte_recto_excel_trace.json"
    rows = json.loads(data_path.read_text(encoding="utf-8-sig"))
    trace = json.loads(trace_path.read_text(encoding="utf-8-sig"))
    if not isinstance(rows, list) or not rows:
        raise ValueError("Imanes Corte Recto dataset inválido.")
    return ImanesCorteRectoBundle(rows=rows, excel_trace=trace)
