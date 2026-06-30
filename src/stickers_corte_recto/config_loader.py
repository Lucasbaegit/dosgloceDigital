from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pricing_variables import merge_global_base_costs


@dataclass(frozen=True)
class StickersCorteRectoBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]
    formula_config: dict[str, Any]


def load_stickers_corte_recto_bundle(project_root: Path) -> StickersCorteRectoBundle:
    data_path = project_root / "data" / "stickers_corte_recto" / "precios_pdf_objetivo_stickers_corte_recto.json"
    trace_path = project_root / "data" / "stickers_corte_recto" / "stickers_corte_recto_excel_trace.json"
    formula_path = project_root / "data" / "stickers_corte_recto" / "formula_editable_config.json"
    rows = json.loads(data_path.read_text(encoding="utf-8-sig"))
    trace = json.loads(trace_path.read_text(encoding="utf-8-sig"))
    formula_config = json.loads(formula_path.read_text(encoding="utf-8-sig"))
    formula_config = merge_global_base_costs(formula_config, project_root)
    if not isinstance(rows, list) or not rows:
        raise ValueError("Stickers Corte Recto dataset inválido.")
    return StickersCorteRectoBundle(rows=rows, excel_trace=trace, formula_config=formula_config)
