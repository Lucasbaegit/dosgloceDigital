import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _safe_get_config_version(config: dict[str, Any]) -> str | None:
    return config.get("config_version") or config.get("version") or None


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    data_dir = root / "data" / "bajadas_v2"
    tests_fixture = root / "tests" / "bajadas_v2" / "fixtures" / "regresion_bajadas_v2_cases.json"

    comparativa_path = data_dir / "comparativa_bajadas_v2_final.json"
    config_path = data_dir / "bajadas_v2_config_final.json"
    precios_path = data_dir / "precios_pdf_objetivo_validado.json"

    comparativa = json.load(comparativa_path.open("r", encoding="utf-8"))
    config = json.load(config_path.open("r", encoding="utf-8"))
    fixture = json.load(tests_fixture.open("r", encoding="utf-8"))

    rows = comparativa.get("comparativa", [])
    estados = Counter(r.get("estado", "DESCONOCIDO") for r in rows)
    fixed_cases = config.get("precios_fijos_csv", {}).get("casos", [])
    reglas_especiales = 1 if config.get("regla_especial_xl_byn", {}).get("activa") else 0

    payload = {
        "fecha_generacion": datetime.now(timezone.utc).isoformat(),
        "cantidad_total_comparativa": len(rows),
        "conteo_estados": {
            "OK": int(estados.get("OK", 0)),
            "DIFERENCIA_LEVE": int(estados.get("DIFERENCIA_LEVE", 0)),
            "DIFERENCIA_MEDIA": int(estados.get("DIFERENCIA_MEDIA", 0)),
            "DIFERENCIA_ALTA": int(estados.get("DIFERENCIA_ALTA", 0)),
            "SIN_COMPARACION": int(estados.get("SIN_COMPARACION", 0)),
        },
        "cantidad_casos_regresion": int(fixture.get("meta", {}).get("total_cases", len(fixture.get("cases", [])))),
        "cantidad_precio_fijo_csv": len(fixed_cases),
        "cantidad_reglas_especiales": reglas_especiales,
        "config_version": _safe_get_config_version(config),
        "checksums": {
            "bajadas_v2_config_final.json": _sha256(config_path),
            "precios_pdf_objetivo_validado.json": _sha256(precios_path),
            "regresion_bajadas_v2_cases.json": _sha256(tests_fixture),
        },
        "paths": {
            "comparativa": str(comparativa_path),
            "config_final": str(config_path),
            "precios_objetivo_validado": str(precios_path),
            "fixture_regresion": str(tests_fixture),
        },
    }

    out_dir = data_dir / "snapshots"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "bajadas_v2_metrics_snapshot.json"
    with out_path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)

    print(f"[OK] Snapshot generado: {out_path}")
    print(f"[OK] Conteo estados: {payload['conteo_estados']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
