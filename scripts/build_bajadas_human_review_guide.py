import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / 'data' / 'bajadas'
DOCS = BASE / 'docs' / 'bajadas'

IN_MATRIX = DATA / 'bajadas_decision_matrix.json'
IN_GROUPS = DATA / 'bajadas_decision_groups.json'
IN_TRACE = DATA / 'bajadas_price_trace_tree.json'
IN_REVIEW = DATA / 'bajadas_high_alerts_review.json'

OUT_MD = DOCS / '12_guia_revision_humana_bajadas.md'
OUT_CSV = DOCS / '12_decisiones_usuario_simple.csv'
OUT_JSON = DATA / 'bajadas_user_decision_workflow.json'

OPTIONS = [
    'CONSERVAR_PRECIO_EXCEL',
    'RECALCULAR_DESDE_COSTO_PAPEL',
    'RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION',
    'CREAR_REGLA_NUEVA',
    'DESCARTAR_COMO_OBSOLETO',
    'REQUIERE_REVISION_MANUAL',
]

PRIORITY_META = {
    1: {
        'title': 'Prioridad 1: XL 32x70 / SB04',
        'risk': 'Riesgo alto: salidas con costo de papel o impresión no justificados de forma trazable.',
        'recommended': 'Si no hay evidencia clara, usar REQUIERE_REVISION_MANUAL o RECALCULAR_DESDE_COSTO_PAPEL(_E_IMPRESION).',
        'if_migrate': 'Si se migra tal cual, se arrastra ambigüedad de precio y potencial desvío comercial.',
    },
    2: {
        'title': 'Prioridad 2: A3 PLUS pack color / SB07',
        'risk': 'Riesgo medio-alto: faltan componentes explícitos de papel en varias salidas.',
        'recommended': 'Preferir RECALCULAR_DESDE_COSTO_PAPEL cuando no haya trazabilidad suficiente.',
        'if_migrate': 'Migrar sin resolver puede dejar reglas implícitas no reproducibles.',
    },
    3: {
        'title': 'Prioridad 3: XA3 ByN / SB08',
        'risk': 'Riesgo medio-alto: salidas ByN con costo de papel no explícito en múltiples casos.',
        'recommended': 'Tomar decisión por celda: conservar solo si hay justificación funcional verificable.',
        'if_migrate': 'Se puede consolidar una lógica incompleta y distorsionar precios objetivo.',
    },
    4: {
        'title': 'Prioridad 4: XL ByN / SB09',
        'risk': 'Riesgo medio: menor volumen, pero con alertas de papel no explicadas.',
        'recommended': 'Resolver una por una; si no hay contexto, marcar REQUIERE_REVISION_MANUAL.',
        'if_migrate': 'Quedan excepciones opacas que complican auditoría futura.',
    },
}


def question_for(dec):
    fam = dec['familia']
    cell = dec['celda']
    problem = dec['problema_detectado']
    if problem == 'salida_sin_explicacion_coste_papel':
        return f"Para {fam} {cell}: ¿este precio debe depender explícitamente del costo de papel (sí/no) y, si sí, desde qué referencia validada?"
    if problem == 'salida_sin_explicacion_coste_impresion':
        return f"Para {fam} {cell}: ¿este precio debe incluir costo de impresión/clic explícito (sí/no) o se mantiene por regla histórica?"
    return f"Para {fam} {cell}: ¿qué regla funcional debe prevalecer para este precio?"


def problem_simple(dec):
    p = dec['problema_detectado']
    if p == 'salida_sin_explicacion_coste_papel':
        return 'Falta costo de papel trazable'
    if p == 'salida_sin_explicacion_coste_impresion':
        return 'Falta costo de impresión trazable'
    return p


def main():
    matrix = json.loads(IN_MATRIX.read_text(encoding='utf-8'))
    groups = json.loads(IN_GROUPS.read_text(encoding='utf-8'))
    trace = json.loads(IN_TRACE.read_text(encoding='utf-8'))
    review = json.loads(IN_REVIEW.read_text(encoding='utf-8'))

    decisions = matrix['decisiones']
    decisions.sort(key=lambda d: (d['prioridad'], d['familia'], d['bloque'], d['fila'], d['columna']))

    # workflow JSON rows
    workflow_rows = []
    simple_rows = []

    for d in decisions:
        row = {
            'id_decision': d['id_decision'],
            'prioridad': d['prioridad'],
            'familia': d['familia'],
            'bloque': d['bloque'],
            'celda': d['celda'],
            'valor_actual': d['valor_actual'],
            'formula_actual': d['formula_actual'],
            'problema_detectado': d['problema_detectado'],
            'clasificacion': d['clasificacion_actual'],
            'explicacion_simple': d['explicacion_simple'],
            'falta_justificar': d['falta_para_justificar'],
            'recomendacion_tecnica': d['decision_recomendada_por_defecto'],
            'opciones_decision': OPTIONS,
            'pregunta_usuario': question_for(d),
            'decision_usuario': '',
            'comentario_usuario': '',
        }
        workflow_rows.append(row)

        simple_rows.append({
            'id_decision': d['id_decision'],
            'prioridad': d['prioridad'],
            'familia': d['familia'],
            'celda': d['celda'],
            'valor_actual': d['valor_actual'],
            'problema_simple': problem_simple(d),
            'recomendacion': d['decision_recomendada_por_defecto'],
            'decision_usuario': '',
            'comentario_usuario': '',
        })

    # JSON output
    out = {
        'total_decisiones_preparadas': len(workflow_rows),
        'source': {
            'decision_matrix_total': matrix['total_decisiones'],
            'decision_groups_total': groups['cantidad_grupos_generados'],
            'trace_total': trace['total_traces'],
            'high_alerts_reviewed': review['total_high_alerts_unique_reviewed'],
        },
        'priority_meta': PRIORITY_META,
        'workflow': workflow_rows,
        'status': 'PENDIENTE_DE_INTERPRETACION',
    }
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')

    # simplified csv
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fields = ['id_decision', 'prioridad', 'familia', 'celda', 'valor_actual', 'problema_simple', 'recomendacion', 'decision_usuario', 'comentario_usuario']
    with OUT_CSV.open('w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in simple_rows:
            w.writerow(r)

    # markdown guide
    by_pri = defaultdict(list)
    for r in workflow_rows:
        by_pri[r['prioridad']].append(r)

    md = []
    md.append('# 12 - Guía de Revisión Humana de Decisiones (Bajadas)')
    md.append('')
    md.append('Estado: PENDIENTE_DE_INTERPRETACION')
    md.append('')
    md.append(f"- Decisiones a resolver: `{len(workflow_rows)}`")
    md.append('')
    md.append('## Cómo usar esta guía')
    md.append('1. Revisar por prioridad (1 a 4).')
    md.append('2. Para cada decisión, responder la pregunta concreta.')
    md.append('3. Cargar la decisión en `12_decisiones_usuario_simple.csv` (`decision_usuario` y `comentario_usuario`).')

    for p in [1, 2, 3, 4]:
        meta = PRIORITY_META[p]
        rows = by_pri.get(p, [])
        md.append('')
        md.append(f"## {meta['title']}")
        md.append('')
        md.append(f"- Qué está en riesgo: {meta['risk']}")
        md.append(f"- Qué decisión conviene tomar: {meta['recommended']}")
        md.append(f"- Qué pasa si se migra tal cual: {meta['if_migrate']}")
        md.append(f"- Casos en esta prioridad: `{len(rows)}`")

        for r in rows:
            md.append('')
            md.append(f"### {r['id_decision']} - {r['familia']} {r['bloque']} {r['celda']}")
            md.append(f"- id_decision: {r['id_decision']}")
            md.append(f"- prioridad: {r['prioridad']}")
            md.append(f"- familia: {r['familia']}")
            md.append(f"- bloque: {r['bloque']}")
            md.append(f"- celda: {r['celda']}")
            md.append(f"- valor actual: {r['valor_actual']}")
            md.append(f"- fórmula actual: `{r['formula_actual']}`")
            md.append(f"- problema detectado: {r['problema_detectado']}")
            md.append(f"- clasificación: {r['clasificacion']}")
            md.append(f"- explicación simple: {r['explicacion_simple']}")
            md.append(f"- qué falta justificar: {r['falta_justificar']}")
            md.append(f"- recomendación técnica: {r['recomendacion_tecnica']}")
            md.append(f"- opciones de decisión: {', '.join(r['opciones_decision'])}")
            md.append(f"- pregunta concreta para el usuario: {r['pregunta_usuario']}")

    OUT_MD.write_text('\n'.join(md), encoding='utf-8')

    by_priority_summary = {p: len(by_pri.get(p, [])) for p in [1, 2, 3, 4]}

    print(json.dumps({
        'status': 'ok',
        'total_prepared': len(workflow_rows),
        'csv_path': str(OUT_CSV),
        'by_priority': by_priority_summary,
        'files': [str(OUT_MD), str(OUT_CSV), str(OUT_JSON)]
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
