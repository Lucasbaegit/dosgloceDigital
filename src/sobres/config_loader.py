from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class SobresBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]


def load_sobres_bundle(project_root: Path) -> SobresBundle:
    data_path = project_root / 'data' / 'sobres' / 'precios_pdf_objetivo_sobres.json'
    trace_path = project_root / 'data' / 'sobres' / 'sobres_excel_trace.json'
    rows = json.loads(data_path.read_text(encoding='utf-8-sig'))
    trace = json.loads(trace_path.read_text(encoding='utf-8-sig'))
    if not isinstance(rows, list) or not rows:
        raise ValueError('Sobres dataset inválido.')
    return SobresBundle(rows=rows, excel_trace=trace)
