# -*- coding: utf-8 -*-
import json
from pathlib import Path
from statistics import mean, median

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data" / "bajadas_autoadhesivas"
DOCS = BASE / "docs" / "bajadas_autoadhesivas"

UMBRALS = {
    "OK": 1.0,
    "DIFERENCIA_LEVE": 3.0,
    "DIFERENCIA_MEDIA": 7.0,
}

SHORT = {"1", "2 a 25", "26 a 50"}
MED = {"51 a 100", "101 a 300"}
LONG = {"301 a 500", "501 a 1000"}


def state_from_pct(pct_abs: float) -> str:
    if pct_abs <= UMBRALS["OK"]:
        return "OK"
    if pct_abs <= UMBRALS["DIFERENCIA_LEVE"]:
        return "DIFERENCIA_LEVE"
    if pct_abs <= UMBRALS["DIFERENCIA_MEDIA"]:
        return "DIFERENCIA_MEDIA"
    return "DIFERENCIA_ALTA"


def load_rows():
    comp = json.loads((DATA / "autoadhesivas_excel_vs_objetivo.json").read_text(encoding="utf-8"))
    rows = []
    for r in comp:
        rng = str(r["cantidad_rango"])
        rows.append({
            "cantidad_rango": rng,
            "papel_base": float(r["papel"]["precio_excel_historico_formula_stickers"]),
            "papel_target": float(r["papel"]["precio_objetivo_pdf"]),
            "especial_base": float(r["especial"]["precio_excel_historico_formula_opp"]),
            "especial_target": float(r["especial"]["precio_objetivo_pdf"]),
        })
    return rows


def global_factor(rows, base_key, target_key):
    # least squares through origin
    num = sum(r[base_key] * r[target_key] for r in rows)
    den = sum(r[base_key] ** 2 for r in rows)
    return (num / den) if den else 0.0


def evaluate(rows, factor_map, map_fn, base_key, target_key):
    out = []
    for r in rows:
        k = map_fn(r)
        f = factor_map[k]
        base = r[base_key]
        target = r[target_key]
        calibrated = base * f
        diff_abs = calibrated - target
        diff_pct = (diff_abs / target) * 100 if target else 0.0
        out.append({
            "cantidad_rango": r["cantidad_rango"],
            "key": k,
            "factor": f,
            "precio_base_excel": base,
            "precio_calibrado": calibrated,
            "precio_objetivo": target,
            "diferencia_abs": diff_abs,
            "diferencia_pct": diff_pct,
            "estado": state_from_pct(abs(diff_pct)),
        })
    return out


def summarize(items):
    c = {"OK": 0, "DIFERENCIA_LEVE": 0, "DIFERENCIA_MEDIA": 0, "DIFERENCIA_ALTA": 0}
    pcts = []
    for i in items:
        c[i["estado"]] += 1
        pcts.append(abs(i["diferencia_pct"]))
    return {
        "counts": c,
        "error_promedio_abs_pct": mean(pcts) if pcts else 0.0,
        "error_mediano_abs_pct": median(pcts) if pcts else 0.0,
        "error_max_abs_pct": max(pcts) if pcts else 0.0,
    }


def range_family(rng: str):
    if rng in SHORT:
        return "tirada_corta"
    if rng in MED:
        return "tirada_media"
    return "tirada_larga"


def main():
    DOCS.mkdir(parents=True, exist_ok=True)
    rows = load_rows()

    # structural sanity for papel formula
    papel_ratios = [r["papel_base"] / r["papel_target"] for r in rows if r["papel_target"]]
    papel_unusable = median(papel_ratios) > 100.0

    # B1 global factors
    f_p_b1 = global_factor(rows, "papel_base", "papel_target")
    f_e_b1 = global_factor(rows, "especial_base", "especial_target")
    b1_p = evaluate(rows, {"global": f_p_b1}, lambda _r: "global", "papel_base", "papel_target")
    b1_e = evaluate(rows, {"global": f_e_b1}, lambda _r: "global", "especial_base", "especial_target")

    # B2 per range
    f_p_b2 = {r["cantidad_rango"]: (r["papel_target"] / r["papel_base"]) for r in rows}
    f_e_b2 = {r["cantidad_rango"]: (r["especial_target"] / r["especial_base"]) for r in rows}
    b2_p = evaluate(rows, f_p_b2, lambda r: r["cantidad_rango"], "papel_base", "papel_target")
    b2_e = evaluate(rows, f_e_b2, lambda r: r["cantidad_rango"], "especial_base", "especial_target")

    # B3 by range family
    fams = ["tirada_corta", "tirada_media", "tirada_larga"]
    f_p_b3 = {}
    f_e_b3 = {}
    for fam in fams:
        sub = [r for r in rows if range_family(r["cantidad_rango"]) == fam]
        f_p_b3[fam] = global_factor(sub, "papel_base", "papel_target")
        f_e_b3[fam] = global_factor(sub, "especial_base", "especial_target")
    b3_p = evaluate(rows, f_p_b3, lambda r: range_family(r["cantidad_rango"]), "papel_base", "papel_target")
    b3_e = evaluate(rows, f_e_b3, lambda r: range_family(r["cantidad_rango"]), "especial_base", "especial_target")

    models = {
        "B1": {
            "factors": {
                "factor_autoadhesivo_papel": f_p_b1,
                "factor_autoadhesivo_especial": f_e_b1,
            },
            "papel": b1_p,
            "especial": b1_e,
            "summary": {
                "papel": summarize(b1_p),
                "especial": summarize(b1_e),
                "global": summarize(b1_p + b1_e),
            },
        },
        "B2": {
            "factors": {
                "papel_por_rango": f_p_b2,
                "especial_por_rango": f_e_b2,
            },
            "papel": b2_p,
            "especial": b2_e,
            "summary": {
                "papel": summarize(b2_p),
                "especial": summarize(b2_e),
                "global": summarize(b2_p + b2_e),
            },
        },
        "B3": {
            "factors": {
                "papel_por_familia": f_p_b3,
                "especial_por_familia": f_e_b3,
            },
            "papel": b3_p,
            "especial": b3_e,
            "summary": {
                "papel": summarize(b3_p),
                "especial": summarize(b3_e),
                "global": summarize(b3_p + b3_e),
            },
        },
    }

    # recommendation
    especial_usable = models["B3"]["summary"]["especial"]["error_promedio_abs_pct"] <= 7.0
    rec = {
        "papel": {
            "formula_usable_directa": not papel_unusable,
            "status": "PAPEL_FORMULA_EXCEL_NO_USABLE_DIRECTA" if papel_unusable else "FORMULA_USABLE",
            "modelo_recomendado": "Hibrido_B_a_C" if papel_unusable else "B3",
            "decision": "Mantener árbol Excel como trazabilidad técnica y usar tabla calibrada por rango como valor operativo"
            if papel_unusable else "Usar calibración Modelo B3",
        },
        "especial": {
            "formula_usable_directa": True,
            "status": "FORMULA_USABLE",
            "modelo_recomendado": "B3" if especial_usable else "Hibrido_B_a_C",
            "decision": "Mantener Modelo B3 (columna especial calibrable con error aceptable)" if especial_usable else "Pasar a híbrido por irregularidad",
        },
        "tinta_blanca_laca_uv_fuera_alcance": True,
    }

    (DATA / "calibracion_modelo_b.json").write_text(json.dumps(models, ensure_ascii=False, indent=2), encoding="utf-8")

    comparativa = {
        "by_model": {
            m: {
                "papel": models[m]["papel"],
                "especial": models[m]["especial"],
                "summary": models[m]["summary"],
            }
            for m in ["B1", "B2", "B3"]
        }
    }
    (DATA / "comparativa_autoadhesivas_modelo_b.json").write_text(json.dumps(comparativa, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "modelo_recomendado_autoadhesivas.json").write_text(json.dumps(rec, ensure_ascii=False, indent=2), encoding="utf-8")

    # docs 05
    d5 = ["# 05 Calibración Modelo B - Autoadhesivas", "", "## Umbrales", "- OK <= 1%", "- DIFERENCIA_LEVE <= 3%", "- DIFERENCIA_MEDIA <= 7%", "- DIFERENCIA_ALTA > 7%", ""]
    d5.append("## Factores B1")
    d5.append(f"- factor_autoadhesivo_papel: `{f_p_b1:.12f}`")
    d5.append(f"- factor_autoadhesivo_especial: `{f_e_b1:.12f}`")
    d5.append(f"- Resumen B1 global: `{models['B1']['summary']['global']}`")
    d5.append("")
    d5.append("## Factores B2 (por rango)")
    d5.append("- Papel:")
    for k, v in f_p_b2.items():
        d5.append(f"  - `{k}`: `{v:.12f}`")
    d5.append("- Especial:")
    for k, v in f_e_b2.items():
        d5.append(f"  - `{k}`: `{v:.12f}`")
    d5.append(f"- Resumen B2 global: `{models['B2']['summary']['global']}`")
    d5.append("")
    d5.append("## Factores B3 (familia de rango)")
    for fam in fams:
        d5.append(f"- Papel `{fam}`: `{f_p_b3[fam]:.12f}`")
    for fam in fams:
        d5.append(f"- Especial `{fam}`: `{f_e_b3[fam]:.12f}`")
    d5.append(f"- Resumen B3 global: `{models['B3']['summary']['global']}`")
    d5.append("")
    d5.append("## Evaluación papel")
    d5.append(f"- Median(base/target) papel: `{median(papel_ratios):.2f}`")
    d5.append(f"- Estado: `{'PAPEL_FORMULA_EXCEL_NO_USABLE_DIRECTA' if papel_unusable else 'FORMULA_USABLE'}`")
    d5.append("## Evaluación especial")
    d5.append("- La columna especial es calibrable manteniendo estructura de fórmula U4:U10.")
    d5.append("")
    d5.append("## Recomendación")
    d5.append("- Papel: híbrido B→C (trazabilidad Excel + tabla calibrada operativa).")
    d5.append("- Especial: Modelo B3 por familia de rango.")
    (DOCS / "05_calibracion_modelo_b.md").write_text("\n".join(d5), encoding="utf-8")

    # docs 06
    d6 = ["# 06 Modelo Final Recomendado - Autoadhesivas", "", "## Decisión final por columna", f"- Papel: `{rec['papel']['modelo_recomendado']}`", f"- Especial: `{rec['especial']['modelo_recomendado']}`", "", "## Trazabilidad", "- Se mantiene árbol técnico Excel (`S4:S10` y `U4:U10`) como origen y auditoría.", "- Para operación, el valor final de papel se toma de calibración por rango (híbrido) por inconsistencia de magnitud de la fórmula histórica.", "- Para especial se mantiene estructura de fórmula con calibración Modelo B3.", "", "## Fuera de alcance (se mantiene)", "- tinta blanca", "- laca UV", "- adicionales", "- terminaciones", "- precorte / medio corte", "", "## Próximo paso técnico", "- construir módulo aislado `bajadas_autoadhesivas_v1` (no productivo) y contrastarlo contra objetivo en API de simulación."]
    (DOCS / "06_modelo_final_recomendado.md").write_text("\n".join(d6), encoding="utf-8")

    print("OK: calibración modelo B generada")


if __name__ == "__main__":
    main()
