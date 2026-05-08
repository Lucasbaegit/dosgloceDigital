import argparse
import json
import random
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


ESTADOS_INCLUIDOS = {"OK", "DIFERENCIA_LEVE", "DIFERENCIA_MEDIA"}
DEFAULT_SAMPLE_SIZE = 160


def _norm_terminacion(value: Any) -> Any:
    if value in ("", "null", "None"):
        return None
    return value


def _build_case(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": "|".join(
            [
                str(row.get("categoria", "")),
                str(row.get("modo_color", "")),
                str(row.get("formato", "")),
                str(row.get("tipo_papel", "")),
                str(row.get("material", "")),
                str(row.get("gramaje", "")),
                str(row.get("cantidad_rango", "")),
                str(row.get("caras", "")),
                str(row.get("terminacion", "")),
            ]
        ),
        "input": {
            "categoria": row.get("categoria"),
            "modo_color": row.get("modo_color"),
            "formato": row.get("formato"),
            "tipo_papel": row.get("tipo_papel"),
            "material": row.get("material"),
            "gramaje": row.get("gramaje"),
            "cantidad_rango": row.get("cantidad_rango"),
            "caras": row.get("caras"),
            "terminacion": _norm_terminacion(row.get("terminacion")),
            "urgencia": "normal",
        },
        "expected": {
            "precio_sin_iva": float(row.get("precio_estimado_v2")),
            "estado_referencia": row.get("estado"),
            "precio_fijo_csv_aplicado": bool(row.get("precio_fijo_csv_aplicado", False)),
            "regla_correccion_xl_byn_1_1_parentesis_activa": bool(
                row.get("regla_correccion_xl_byn_1_1_parentesis_activa", False)
            ),
            "segmento_xl_byn_recalibrado": bool(row.get("segmento_xl_byn_recalibrado", False)),
        },
    }


def _stratified_sample(rows: list[dict[str, Any]], sample_size: int, seed: int) -> list[dict[str, Any]]:
    random.seed(seed)
    buckets: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        key = (str(row.get("modo_color", "")), str(row.get("formato", "")))
        buckets[key].append(row)

    all_keys = sorted(buckets.keys())
    if not all_keys:
        return []

    per_bucket = max(1, sample_size // len(all_keys))
    selected = []
    for key in all_keys:
        bucket = buckets[key]
        take = min(len(bucket), per_bucket)
        selected.extend(random.sample(bucket, take))

    # fill remaining slots randomly without duplicates
    selected_ids = {id(r) for r in selected}
    remaining = [r for r in rows if id(r) not in selected_ids]
    needed = max(0, sample_size - len(selected))
    if needed > 0 and remaining:
        selected.extend(random.sample(remaining, min(needed, len(remaining))))

    return selected


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera fixture de regresión Bajadas v2")
    parser.add_argument("--mode", choices=["full", "sample"], default="full")
    parser.add_argument("--sample-size", type=int, default=DEFAULT_SAMPLE_SIZE)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[2]
    input_path = project_root / "data" / "bajadas_v2" / "comparativa_bajadas_v2_final.json"
    output_dir = project_root / "tests" / "bajadas_v2" / "fixtures"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "regresion_bajadas_v2_cases.json"

    with input_path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    raw_rows = data.get("comparativa", [])
    rows = [r for r in raw_rows if r.get("estado") in ESTADOS_INCLUIDOS]

    if args.mode == "sample":
        selected_rows = _stratified_sample(rows, args.sample_size, args.seed)
    else:
        selected_rows = rows

    cases = [_build_case(row) for row in selected_rows]
    estado_counts = Counter(case["expected"]["estado_referencia"] for case in cases)
    formato_counts = Counter(case["input"]["formato"] for case in cases)
    color_counts = Counter(case["input"]["modo_color"] for case in cases)
    fixed_count = sum(1 for case in cases if case["expected"]["precio_fijo_csv_aplicado"])
    xl_byn_count = sum(
        1
        for case in cases
        if case["input"]["categoria"] == "Bajadas Blanco y Negro" and case["input"]["formato"] == "XL"
    )

    payload = {
        "meta": {
            "source": str(input_path),
            "mode": args.mode,
            "sample_size_requested": args.sample_size if args.mode == "sample" else None,
            "seed": args.seed,
            "tolerancia_absoluta_default": 1.0,
            "tolerancia_porcentual_default": 0.5,
            "total_cases": len(cases),
            "estado_counts": dict(estado_counts),
            "formato_counts": dict(formato_counts),
            "modo_color_counts": dict(color_counts),
            "precio_fijo_csv_count": fixed_count,
            "xl_byn_count": xl_byn_count,
            "incluye_estados": sorted(ESTADOS_INCLUIDOS),
        },
        "cases": cases,
    }

    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)

    print(f"[OK] Fixture generado: {output_path}")
    print(f"[OK] Casos generados: {len(cases)}")
    print(f"[OK] Estado counts: {dict(estado_counts)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
