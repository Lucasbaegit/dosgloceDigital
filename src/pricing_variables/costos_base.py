from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any


GLOBAL_BASE_COSTS_RELATIVE_PATH = Path("data") / "variables_globales" / "costos_base.json"


def load_global_base_costs(project_root: Path | str | None) -> dict[str, Any]:
    if project_root is None:
        return {}
    path = Path(project_root) / GLOBAL_BASE_COSTS_RELATIVE_PATH
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8-sig"))


def merge_global_base_costs(formula_config: dict[str, Any], project_root: Path | str | None) -> dict[str, Any]:
    merged = copy.deepcopy(formula_config)
    variables = merged.setdefault("variables", {})
    global_costs = load_global_base_costs(project_root)
    if "click_color_base" in global_costs:
        variables["click_color_base"] = global_costs["click_color_base"]
    return merged
