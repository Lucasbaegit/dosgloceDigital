from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class CarpetasBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]


def load_carpetas_bundle(project_root: Path) -> CarpetasBundle:
    data_path = project_root / 'data' / 'carpetas' / 'precios_pdf_objetivo_carpetas.json'
    trace_path = project_root / 'data' / 'carpetas' / 'carpetas_excel_trace.json'
    rows = json.loads(data_path.read_text(encoding='utf-8-sig'))
    trace = json.loads(trace_path.read_text(encoding='utf-8-sig'))
    if not isinstance(rows, list) or not rows:
        raise ValueError('Carpetas dataset inválido.')
    return CarpetasBundle(rows=rows, excel_trace=trace)
