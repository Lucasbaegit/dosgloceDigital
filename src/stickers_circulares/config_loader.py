import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pricing_variables import merge_global_base_costs


@dataclass(frozen=True)
class StickersCircularesBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]
    formula_config: dict[str, Any]


def load_stickers_circulares_bundle(project_root: Path) -> StickersCircularesBundle:
    base = project_root / "data" / "stickers_circulares"
    rows = json.loads((base / "precios_pdf_objetivo_stickers_circulares.json").read_text(encoding="utf-8"))
    excel_trace = json.loads((base / "stickers_circulares_excel_trace.json").read_text(encoding="utf-8"))
    formula_config = json.loads((base / "formula_editable_config.json").read_text(encoding="utf-8-sig"))
    formula_config = merge_global_base_costs(formula_config, project_root)
    if not isinstance(rows, list):
        raise ValueError("precios_pdf_objetivo_stickers_circulares.json debe ser una lista")
    return StickersCircularesBundle(rows=rows, excel_trace=excel_trace, formula_config=formula_config)
