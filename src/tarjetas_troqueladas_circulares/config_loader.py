from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class TarjetasTroqueladasCircularesBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]


def load_tarjetas_troqueladas_circulares_bundle(project_root: Path) -> TarjetasTroqueladasCircularesBundle:
    base = project_root / "data" / "tarjetas_troqueladas_circulares"
    rows = json.loads((base / "precios_pdf_objetivo_tarjetas_troqueladas_circulares.json").read_text(encoding="utf-8-sig"))
    trace = json.loads((base / "tarjetas_troqueladas_circulares_excel_trace.json").read_text(encoding="utf-8-sig"))
    return TarjetasTroqueladasCircularesBundle(rows=rows, excel_trace=trace)
