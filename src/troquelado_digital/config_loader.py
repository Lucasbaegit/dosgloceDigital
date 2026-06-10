from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class TroqueladoDigitalBundle:
    rows: list[dict[str, Any]]
    excel_trace: dict[str, Any]


def load_troquelado_digital_bundle(project_root: Path) -> TroqueladoDigitalBundle:
    base = project_root / "data" / "troquelado_digital"
    rows = json.loads((base / "precios_pdf_objetivo_troquelado_digital.json").read_text(encoding="utf-8-sig"))
    trace = json.loads((base / "troquelado_digital_excel_trace.json").read_text(encoding="utf-8-sig"))
    return TroqueladoDigitalBundle(rows=rows, excel_trace=trace)
