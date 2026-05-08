import json
from collections import defaultdict, Counter
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data" / "bajadas"
DOCS = BASE / "docs" / "bajadas"

IN_TREE = DATA / "bajadas_price_trace_tree.json"
IN_ALERTS = DATA / "bajadas_price_trace_alerts.json"
IN_BLOCKS = DATA / "bajadas_blocks_semantic.json"
IN_FORMULAS = DATA / "bajadas_formulas.json"

OUT_JSON = DATA / "bajadas_high_alerts_review.json"
OUT_MD = DOCS / "08_revision_alertas_altas.md"
OUT_DEC = DOCS / "09_decisiones_usuario_bajadas.md"

PRIORITY = [
    "A4 color",
    "XL 32x70",
    "A3 PLUS pack color",
    "XA3 ByN",
    "XL ByN",
]



def priority_key(fam):
    try:
        return PRIORITY.index(fam)
    except ValueError:
        return 999



def summarize_tree(nodes):
    # compact string with most relevant 6 nodes
    sample = nodes[:6]
    parts = []
    for n in sample:
        parts.append(f"{n['hoja']}!{n['celda']}[{n.get('tipo_probable','?')}]={n.get('valor_actual')}")
    return " -> ".join(parts)



def has_paper_evidence(nodes):
    reasons = []
    for n in nodes:
        tp = (n.get("tipo_probable") or "").lower()
        heads = " ".join((n.get("encabezados_cercanos") or [])).lower()
        formula = (n.get("formula") or "").lower() if isinstance(n.get("formula"), str) else ""
        if n.get("hoja") == "PAPEL US$":
            reasons.append("nodo_directo_papel_usd")
        if "coste_papel" in tp or "papel" in tp:
            reasons.append("tipo_probable_coste_papel")
        if "papel" in heads or "pliego" in heads:
            reasons.append("encabezado_papel_pliego")
        if "papel us$" in formula:
            reasons.append("formula_referencia_papel_usd")
    return len(reasons) > 0, sorted(set(reasons))



def has_print_evidence(nodes):
    reasons = []
    for n in nodes:
        tp = (n.get("tipo_probable") or "").lower()
        heads = " ".join((n.get("encabezados_cercanos") or [])).lower()
        formula = (n.get("formula") or "").lower() if isinstance(n.get("formula"), str) else ""
        val = n.get("valor_actual")
        if "coste_impresion" in tp:
            reasons.append("tipo_probable_coste_impresion")
        if "clic" in heads or "impres" in heads or "toner" in heads or "color" in heads or "byn" in heads:
            reasons.append("encabezado_impresion")
        if "clic" in formula or "toner" in formula:
            reasons.append("formula_indicio_impresion")
        if isinstance(val, (int, float)) and val in (0.3, 0.6, 1.2, 1.5, 1.6, 1.7, 1.8, 2.0):
            reasons.append("constante_probable_coef_impresion")
    return len(reasons) > 0, sorted(set(reasons))



def classify(alert_type, family, nodes, formula):
    paper_ok, paper_evidence = has_paper_evidence(nodes)
    print_ok, print_evidence = has_print_evidence(nodes)

    cause = []
    classification = "REQUIERE_VALIDACION_NEGOCIO"
    recommendation = "Validar regla de negocio con responsable funcional."
    requires_user = True

    if alert_type == "salida_sin_explicacion_coste_papel":
        if paper_ok:
            classification = "FALTA_INTERPRETACION"
            cause.append("Existe evidencia de coste de papel en la traza, pero el detector no la etiquetó correctamente.")
            recommendation = "Mantener fórmula; mejorar etiquetado semántico del trazador para coste de papel."
            requires_user = False
        else:
            if family in ("A3+", "XA3", "XL 32x70", "A4 color", "A3 PLUS pack color", "XA3 ByN", "XL ByN", "A4 ByN"):
                classification = "ERROR_REAL_PROBABLE"
                cause.append("No hay evidencia de coste de papel en familia que normalmente usa papel/pliego.")
                recommendation = "Revisión funcional obligatoria: confirmar si la salida debe incorporar papel o viene precalculada por otra vía." 
                requires_user = True
            else:
                classification = "REQUIERE_VALIDACION_NEGOCIO"
                cause.append("Sin evidencia de papel y sin regla clara por familia.")
                recommendation = "Validar excepción de negocio."
                requires_user = True

    elif alert_type == "salida_sin_explicacion_coste_impresion":
        if print_ok:
            # distinguish formula válida vs redundante
            f = (formula or "")
            if "*1" in f.replace(" ", "") or "/1" in f.replace(" ", ""):
                classification = "FORMULA_REDUNDANTE"
                cause.append("Hay indicio de coste de impresión pero con operación redundante.")
                recommendation = "No corregir ahora; registrar para refactor posterior de migración."
                requires_user = False
            else:
                classification = "FALTA_INTERPRETACION"
                cause.append("Existe evidencia de impresión/clic/coeficiente, pero no quedó tipificada por el detector.")
                recommendation = "Mantener fórmula; completar diccionario semántico de impresión."
                requires_user = False
        else:
            if formula and any(op in formula for op in ["+", "*", "-"]):
                classification = "NO_MIGRAR_TAL_CUAL"
                cause.append("Salida compuesta sin evidencia explícita de coste de impresión.")
                recommendation = "Bloquear migración automática de esta salida hasta validación funcional."
                requires_user = True
            else:
                classification = "REQUIERE_VALIDACION_NEGOCIO"
                cause.append("No se observan componentes de impresión ni suficiente contexto.")
                recommendation = "Solicitar criterio de negocio para confirmar si aplica impresión."
                requires_user = True

    else:
        classification = "REQUIERE_VALIDACION_NEGOCIO"
        cause.append("Tipo de alerta alta no cubierto explícitamente por reglas de revisión.")
        recommendation = "Revisión manual."
        requires_user = True

    # escalamiento por dependencia externa no interpretada en nodos
    if any((n.get("hoja") not in ("Bajadas", "PAPEL US$") for n in nodes)):
        classification = "REQUIERE_VALIDACION_NEGOCIO"
        cause.append("La traza incluye dependencia fuera del alcance actual.")
        recommendation = "Resolver dependencia externa antes de migrar."
        requires_user = True

    details = {
        "paper_evidence": paper_evidence,
        "print_evidence": print_evidence,
    }
    return classification, " ".join(cause), recommendation, requires_user, details



def main():
    tree = json.loads(IN_TREE.read_text(encoding="utf-8"))
    alerts = json.loads(IN_ALERTS.read_text(encoding="utf-8"))
    blocks = json.loads(IN_BLOCKS.read_text(encoding="utf-8"))
    formulas = json.loads(IN_FORMULAS.read_text(encoding="utf-8"))

    formula_map = {f["cell"]: f["formula"] for f in formulas["formulas"]}

    traces_map = {(t["familia"], t["bloque"], t["celda_salida"]): t for t in tree["precio_traces"]}

    high_alerts = [a for a in alerts["alerts"] if a.get("severidad") == "alta"]

    # dedupe by family/block/cell/type to avoid repeated identical alerts from aggregated generation
    uniq = {}
    for a in high_alerts:
        key = (a["familia"], a["bloque"], a["celda_salida"], a["tipo"])
        if key not in uniq:
            uniq[key] = a

    high_items = list(uniq.values())
    high_items.sort(key=lambda x: (priority_key(x["familia"]), x["familia"], x["bloque"], x["tipo"], x["celda_salida"]))

    reviewed = []
    decision_rows = []

    for a in high_items:
        key = (a["familia"], a["bloque"], a["celda_salida"])
        trace = traces_map.get(key)
        nodes = trace["arbol_de_origen"] if trace else []
        formula = (trace.get("formula") if trace else None) or formula_map.get(a["celda_salida"]) or ""

        classification, cause, rec, needs_user, details = classify(a["tipo"], a["familia"], nodes, formula)

        record = {
            "familia": a["familia"],
            "bloque": a["bloque"],
            "celda_salida": a["celda_salida"],
            "tipo_alerta": a["tipo"],
            "formula": formula,
            "arbol_resumido": summarize_tree(nodes),
            "causa_probable": cause or "PENDIENTE_DE_INTERPRETACION",
            "clasificacion_final": classification,
            "recomendacion": rec,
            "requiere_decision_usuario": needs_user,
            "evidencia": details,
        }
        reviewed.append(record)

        decision_rows.append({
            "familia": a["familia"],
            "bloque": a["bloque"],
            "celda": a["celda_salida"],
            "alerta": a["tipo"],
            "clasificacion": classification,
            "explicacion": cause or "PENDIENTE_DE_INTERPRETACION",
            "accion_recomendada": rec,
            "requiere_decision_usuario": needs_user,
        })

    # group stats
    by_family = defaultdict(lambda: Counter())
    by_class = Counter()
    for r in reviewed:
        by_family[r["familia"]]["total"] += 1
        by_family[r["familia"]][r["clasificacion_final"]] += 1
        by_class[r["clasificacion_final"]] += 1

    output = {
        "scope": "Alertas severidad alta en Bajadas",
        "total_high_alerts_source": len(high_alerts),
        "total_high_alerts_unique_reviewed": len(reviewed),
        "priority_order": PRIORITY,
        "classification_counts": dict(by_class),
        "family_summary": [
            {
                "familia": fam,
                "total": cnt["total"],
                "ERROR_REAL_PROBABLE": cnt["ERROR_REAL_PROBABLE"],
                "FALTA_INTERPRETACION": cnt["FALTA_INTERPRETACION"],
                "FORMULA_VALIDA": cnt["FORMULA_VALIDA"],
                "FORMULA_REDUNDANTE": cnt["FORMULA_REDUNDANTE"],
                "NO_MIGRAR_TAL_CUAL": cnt["NO_MIGRAR_TAL_CUAL"],
                "REQUIERE_VALIDACION_NEGOCIO": cnt["REQUIERE_VALIDACION_NEGOCIO"],
            }
            for fam, cnt in sorted(by_family.items(), key=lambda kv: (priority_key(kv[0]), kv[0]))
        ],
        "reviewed_alerts": reviewed,
        "decision_table": decision_rows,
        "status": "PENDIENTE_DE_INTERPRETACION",
    }

    OUT_JSON.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    # doc 08
    md = []
    md.append("# 08 - Revisión de Alertas Altas (Bajadas)")
    md.append("")
    md.append("Estado: PENDIENTE_DE_INTERPRETACION")
    md.append("")
    md.append(f"- Alertas altas origen: `{len(high_alerts)}`")
    md.append(f"- Alertas altas únicas revisadas: `{len(reviewed)}`")
    md.append("")
    md.append("## Conteo por clasificación")
    for k, v in sorted(by_class.items()):
        md.append(f"- {k}: `{v}`")
    md.append("")
    md.append("## Tabla de decisión")
    md.append("| familia | bloque | celda | alerta | clasificación | explicación | acción recomendada |")
    md.append("|---|---|---|---|---|---|---|")
    for r in decision_rows:
        md.append(f"| {r['familia']} | {r['bloque']} | {r['celda']} | {r['alerta']} | {r['clasificacion']} | {r['explicacion']} | {r['accion_recomendada']} |")

    md.append("")
    md.append("## Resumen por familia")
    md.append("| Familia | Total | Error real probable | Falta interpretación | Fórmula válida | Fórmula redundante | No migrar tal cual | Requiere validación negocio |")
    md.append("|---|---:|---:|---:|---:|---:|---:|---:|")
    for row in output["family_summary"]:
        md.append(
            f"| {row['familia']} | {row['total']} | {row['ERROR_REAL_PROBABLE']} | {row['FALTA_INTERPRETACION']} | {row['FORMULA_VALIDA']} | {row['FORMULA_REDUNDANTE']} | {row['NO_MIGRAR_TAL_CUAL']} | {row['REQUIERE_VALIDACION_NEGOCIO']} |"
        )

    OUT_MD.write_text("\n".join(md), encoding="utf-8")

    # doc 09 only requires user decision
    user_cases = [r for r in decision_rows if r["requiere_decision_usuario"]]
    d9 = []
    d9.append("# 09 - Decisiones de Usuario Requeridas (Bajadas)")
    d9.append("")
    d9.append("Solo se listan casos que requieren decisión humana.")
    d9.append("")
    d9.append(f"Total casos: `{len(user_cases)}`")
    d9.append("")
    d9.append("| familia | bloque | celda | alerta | clasificación | explicación | acción recomendada |")
    d9.append("|---|---|---|---|---|---|---|")
    for r in user_cases:
        d9.append(f"| {r['familia']} | {r['bloque']} | {r['celda']} | {r['alerta']} | {r['clasificacion']} | {r['explicacion']} | {r['accion_recomendada']} |")

    OUT_DEC.write_text("\n".join(d9), encoding="utf-8")

    print(json.dumps({
        "status": "ok",
        "high_source": len(high_alerts),
        "high_unique_reviewed": len(reviewed),
        "classification_counts": dict(by_class),
        "user_decision_cases": len(user_cases),
        "files": [
            str(OUT_JSON),
            str(OUT_MD),
            str(OUT_DEC),
        ],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
