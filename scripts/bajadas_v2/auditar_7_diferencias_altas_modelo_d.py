from pathlib import Path
import json
import csv
from collections import Counter


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    comp = json.loads((root / "data/bajadas_v2/comparativa_modelo_d_final.json").read_text(encoding="utf-8"))
    cfg = json.loads((root / "data/bajadas_v2/bajadas_v2_config_modelo_d.json").read_text(encoding="utf-8"))

    rows = comp["comparativa"]
    high = [r for r in rows if r.get("estado") == "DIFERENCIA_ALTA"]

    factor_map = cfg["modelo_d"]["factores_xl_byn"]

    def factor_aplicado(r: dict) -> float:
        key = f"{r.get('tipo_papel')}|{r.get('caras')}"
        return factor_map.get(key, factor_map.get("global"))

    processed = []
    for i, r in enumerate(high, 1):
        diff = float(r.get("diferencia_porcentual") or 0)
        absdiff = abs(diff)
        estimado = float(r.get("precio_estimado_v2") or 0)
        objetivo = float(r.get("precio_objetivo_csv") or 0)
        signo = "sobreestimado" if estimado > objetivo else "subestimado"

        clas = "PRECIO_FIJO_CSV"
        causa = "Outlier puntual en XL ByN no absorbido por factor D2 tipo_papel+caras"
        recomendacion = "Fijar este caso con precio fijo CSV para cierre operativo de Modelo D sin agregar subfactores."

        if absdiff >= 13:
            clas = "REGLA_ESPECIAL_REQUERIDA"
            causa = "Patron repetido de desvio alto en subsegmento XL ByN liviano 1/1 por rango de cantidad"
            recomendacion = "Evaluar mini-regla puntual por rango (sin tocar globales). Si se prioriza simplicidad, usar precio fijo CSV."

        processed.append(
            {
                "id": f"MD7-{i:02d}",
                "categoria": r.get("categoria"),
                "modo_color": r.get("modo_color"),
                "formato": r.get("formato"),
                "tipo_papel": r.get("tipo_papel"),
                "material": r.get("material"),
                "gramaje": r.get("gramaje"),
                "cantidad_rango": r.get("cantidad_rango"),
                "caras": r.get("caras"),
                "precio_objetivo_csv": objetivo,
                "precio_estimado_modelo_d": estimado,
                "diferencia_absoluta": float(r.get("diferencia_absoluta") or 0),
                "diferencia_porcentual": diff,
                "direccion_diferencia": signo,
                "factor_aplicado": factor_aplicado(r),
                "causa_probable": causa,
                "clasificacion_recomendada": clas,
                "recomendacion_concreta": recomendacion,
                "decision_usuario": "",
                "comentario_usuario": "",
            }
        )

    by_tipo = Counter(x["tipo_papel"] for x in processed)
    by_caras = Counter(x["caras"] for x in processed)
    by_rango = Counter(x["cantidad_rango"] for x in processed)
    by_causa = Counter(x["causa_probable"] for x in processed)
    by_clas = Counter(x["clasificacion_recomendada"] for x in processed)

    audit = {
        "segmento_auditado": {
            "categoria": "Bajadas Blanco y Negro",
            "formato": "XL",
            "modelo": "D2",
        },
        "total_diferencias_altas": len(processed),
        "confirmacion_7_casos": len(processed) == 7,
        "patrones": {
            "por_tipo_papel": dict(by_tipo),
            "por_caras": dict(by_caras),
            "por_cantidad_rango": dict(by_rango),
            "mismo_tipo_papel": len(by_tipo) == 1,
            "misma_cara": len(by_caras) == 1,
            "mismo_rango": len(by_rango) == 1,
            "outliers_aislados": len(by_rango) > 1,
            "resoluble_con_precio_fijo_csv": True,
            "requiere_regla_especial_puntual": by_clas.get("REGLA_ESPECIAL_REQUERIDA", 0) > 0,
        },
        "agrupacion_causa_probable": dict(by_causa),
        "conteo_clasificacion": dict(by_clas),
        "casos": processed,
    }

    json_path = root / "data/bajadas_v2/modelo_d_7_diferencias_altas_auditadas.json"
    json_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")

    csv_path = root / "docs/bajadas_v2/16_decisiones_7_casos_modelo_d.csv"
    fields = [
        "id",
        "categoria",
        "modo_color",
        "formato",
        "tipo_papel",
        "material",
        "gramaje",
        "cantidad_rango",
        "caras",
        "precio_objetivo_csv",
        "precio_estimado_modelo_d",
        "diferencia_absoluta",
        "diferencia_porcentual",
        "direccion_diferencia",
        "factor_aplicado",
        "causa_probable",
        "clasificacion_recomendada",
        "recomendacion_concreta",
        "decision_usuario",
        "comentario_usuario",
    ]
    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for row in processed:
            writer.writerow(row)

    md_path = root / "docs/bajadas_v2/15_auditoria_7_diferencias_altas_modelo_d.md"
    lines = []
    lines.append("# 15 - Auditoría de 7 diferencias altas del Modelo D\n")
    lines.append("## Resumen general")
    lines.append(f"- Casos auditados: **{len(processed)}**")
    lines.append("- Filtro aplicado: `estado = DIFERENCIA_ALTA` en `comparativa_modelo_d_final.json`.")
    lines.append("- Segmento: `Bajadas Blanco y Negro / XL`.")
    lines.append(f"- Mismo tipo de papel: **{len(by_tipo) == 1}**")
    lines.append(f"- Misma cara: **{len(by_caras) == 1}**")
    lines.append(f"- Mismo rango de cantidad: **{len(by_rango) == 1}**")
    lines.append("")
    lines.append("## Tabla de los 7 casos")
    lines.append("| id | tipo_papel | material | gramaje | cantidad_rango | caras | objetivo | estimado | dif_% | factor | clasificación |")
    lines.append("|---|---|---|---|---|---:|---:|---:|---:|---:|---|")
    for row in processed:
        lines.append(
            f"| {row['id']} | {row['tipo_papel']} | {row['material']} | {row['gramaje']} | {row['cantidad_rango']} | {row['caras']} | "
            f"{row['precio_objetivo_csv']:.2f} | {row['precio_estimado_modelo_d']:.2f} | {row['diferencia_porcentual']:.4f}% | "
            f"{row['factor_aplicado']:.10f} | {row['clasificacion_recomendada']} |"
        )
    lines.append("")
    lines.append("## Causa probable")
    for causa, count in by_causa.items():
        lines.append(f"- {causa}: **{count}** casos")
    lines.append("")
    lines.append("## Recomendación por caso")
    for row in processed:
        lines.append(
            f"- **{row['id']}** ({row['material']} {row['gramaje']} / {row['cantidad_rango']} / {row['caras']}): "
            f"{row['recomendacion_concreta']}"
        )
    lines.append("")
    lines.append("## Decisión recomendada de cierre")
    lines.append(
        "- Recomendación: **agregar precios fijos puntuales para los 7 casos** y mantener Modelo D congelado. "
        "Opcionalmente, documentar una mini-regla futura solo para el caso liviano 1/1 si se quiere eliminar el último outlier por regla."
    )
    md_path.write_text("\n".join(lines), encoding="utf-8")

    print("Archivos generados:")
    print(json_path)
    print(md_path)
    print(csv_path)


if __name__ == "__main__":
    main()
