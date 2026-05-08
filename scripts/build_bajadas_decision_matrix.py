import csv
import json
from collections import Counter, defaultdict
from pathlib import Path
from openpyxl.utils.cell import coordinate_from_string, column_index_from_string

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / 'data' / 'bajadas'
DOCS = BASE / 'docs' / 'bajadas'

IN_REVIEW = DATA / 'bajadas_high_alerts_review.json'
IN_TREE = DATA / 'bajadas_price_trace_tree.json'
IN_ALERTS = DATA / 'bajadas_price_trace_alerts.json'
IN_BLOCKS = DATA / 'bajadas_blocks_semantic.json'
IN_FORMULAS = DATA / 'bajadas_formulas.json'

OUT_CSV = DOCS / '10_matriz_decisiones_bajadas.csv'
OUT_MD = DOCS / '10_matriz_decisiones_bajadas.md'
OUT_JSON = DATA / 'bajadas_decision_matrix.json'

PRIORITY_RULES = [
    (1, 'XL 32x70', 'SB04'),
    (2, 'A3 PLUS pack color', 'SB07'),
    (3, 'XA3 ByN', 'SB08'),
    (4, 'XL ByN', 'SB09'),
]

OPTIONS = [
    'CONSERVAR_PRECIO_EXCEL',
    'RECALCULAR_DESDE_COSTO_PAPEL',
    'RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION',
    'CREAR_REGLA_NUEVA',
    'DESCARTAR_COMO_OBSOLETO',
    'REQUIERE_REVISION_MANUAL',
]


def priority_for(family, block):
    for p, f, b in PRIORITY_RULES:
        if family == f and block == b:
            return p
    return 99


def get_block_title(blocks, block_id):
    for b in blocks:
        if b['id'] == block_id:
            return b.get('title_detected', '')
    return ''


def row_col(cell):
    col, row = coordinate_from_string(cell)
    return row, col, column_index_from_string(col)


def summarize_origin(trace):
    if not trace:
        return 'PENDIENTE_DE_INTERPRETACION'
    nodes = trace.get('arbol_de_origen', [])
    sample = nodes[:5]
    parts = []
    for n in sample:
        parts.append(f"{n.get('hoja')}!{n.get('celda')}")
    return ' <- '.join(parts) if parts else 'PENDIENTE_DE_INTERPRETACION'


def has_papel_ref(trace):
    if not trace:
        return False, []
    refs = []
    for n in trace.get('arbol_de_origen', []):
        if n.get('hoja') == 'PAPEL US$':
            refs.append(f"PAPEL US$!{n.get('celda')}")
    return len(refs) > 0, sorted(set(refs))


def default_recommendation(problem, clasif):
    if clasif == 'NO_MIGRAR_TAL_CUAL':
        return 'REQUIERE_REVISION_MANUAL'
    if problem == 'salida_sin_explicacion_coste_papel':
        return 'RECALCULAR_DESDE_COSTO_PAPEL'
    if problem == 'salida_sin_explicacion_coste_impresion':
        return 'RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION'
    return 'REQUIERE_REVISION_MANUAL'


def what_is_missing(problem, has_papel):
    if problem == 'salida_sin_explicacion_coste_papel':
        if has_papel:
            return 'Falta etiquetado semántico claro del coste de papel.'
        return 'No aparece coste de papel explícito/trazable en la salida.'
    if problem == 'salida_sin_explicacion_coste_impresion':
        return 'No aparece coste de impresión/clic explícito o no está etiquetado.'
    return 'PENDIENTE_DE_INTERPRETACION'


def simple_explanation(problem, clasif):
    if clasif == 'NO_MIGRAR_TAL_CUAL':
        return 'La salida no tiene explicación trazable suficiente para migrarse automáticamente.'
    if problem == 'salida_sin_explicacion_coste_papel':
        return 'La salida no muestra de forma clara el componente de coste de papel.'
    if problem == 'salida_sin_explicacion_coste_impresion':
        return 'La salida no muestra de forma clara el componente de coste de impresión.'
    return 'PENDIENTE_DE_INTERPRETACION'


def main():
    review = json.loads(IN_REVIEW.read_text(encoding='utf-8'))
    tree = json.loads(IN_TREE.read_text(encoding='utf-8'))
    _alerts = json.loads(IN_ALERTS.read_text(encoding='utf-8'))
    blocks = json.loads(IN_BLOCKS.read_text(encoding='utf-8'))
    formulas = json.loads(IN_FORMULAS.read_text(encoding='utf-8'))

    traces = {(t['familia'], t['bloque'], t['celda_salida']): t for t in tree['precio_traces']}
    formula_map = {f['cell']: f for f in formulas['formulas']}

    cases = [
        x for x in review['reviewed_alerts']
        if x['clasificacion_final'] in ('ERROR_REAL_PROBABLE', 'NO_MIGRAR_TAL_CUAL')
    ]

    # dedupe by family/block/cell/alert
    uniq = {}
    for c in cases:
        k = (c['familia'], c['bloque'], c['celda_salida'], c['tipo_alerta'])
        uniq[k] = c
    cases = list(uniq.values())

    cases.sort(key=lambda x: (priority_for(x['familia'], x['bloque']), x['familia'], x['bloque'], x['tipo_alerta'], x['celda_salida']))

    rows = []
    for i, c in enumerate(cases, 1):
        fam = c['familia']
        block = c['bloque']
        cell = c['celda_salida']
        trace = traces.get((fam, block, cell))
        fobj = formula_map.get(cell)

        r, col_letter, col_num = row_col(cell)
        encabezado = c.get('arbol_resumido', '')
        if trace and trace.get('encabezado_detectado'):
            encabezado = trace['encabezado_detectado']
        if not encabezado:
            encabezado = get_block_title(blocks['blocks'], block)

        valor = trace.get('valor_actual') if trace else None
        formula = c.get('formula') or (fobj['formula'] if fobj else '')

        has_papel, papel_refs = has_papel_ref(trace)
        origin = summarize_origin(trace)

        rec_default = default_recommendation(c['tipo_alerta'], c['clasificacion_final'])

        row = {
            'id_decision': f"DEC-{i:03d}",
            'prioridad': priority_for(fam, block),
            'familia': fam,
            'bloque': block,
            'celda': cell,
            'fila': r,
            'columna': col_letter,
            'encabezado_detectado': encabezado,
            'valor_actual': valor,
            'formula_actual': formula,
            'problema_detectado': c['tipo_alerta'],
            'clasificacion_actual': c['clasificacion_final'],
            'explicacion_simple': simple_explanation(c['tipo_alerta'], c['clasificacion_final']),
            'origen_del_precio': origin,
            'referencia_papel_usd': '; '.join(papel_refs) if papel_refs else '',
            'falta_para_justificar': what_is_missing(c['tipo_alerta'], has_papel),
            'decision_recomendada_por_defecto': rec_default,
            'opciones_decision_usuario': ' | '.join(OPTIONS),
            'decision_usuario': '',
            'comentario_usuario': '',
            'requiere_decision_usuario': True,
        }
        rows.append(row)

    by_family = Counter(r['familia'] for r in rows)
    by_default = Counter(r['decision_recomendada_por_defecto'] for r in rows)

    # CSV
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        'id_decision', 'prioridad', 'familia', 'bloque', 'celda', 'fila', 'columna',
        'encabezado_detectado', 'valor_actual', 'formula_actual',
        'problema_detectado', 'clasificacion_actual', 'explicacion_simple',
        'origen_del_precio', 'referencia_papel_usd', 'falta_para_justificar',
        'decision_recomendada_por_defecto', 'opciones_decision_usuario',
        'decision_usuario', 'comentario_usuario'
    ]
    with OUT_CSV.open('w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, '') for k in fields})

    # JSON structured
    out = {
        'total_decisiones': len(rows),
        'prioridad_orden': [
            {'prioridad': p, 'familia': fam, 'bloque': b} for p, fam, b in PRIORITY_RULES
        ],
        'conteo_por_familia': dict(by_family),
        'conteo_por_decision_recomendada': dict(by_default),
        'opciones_decision_usuario': OPTIONS,
        'decisiones': rows,
        'status': 'PENDIENTE_DE_INTERPRETACION'
    }
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')

    # Markdown
    md = []
    md.append('# 10 - Matriz de Decisiones Funcionales (Bajadas)')
    md.append('')
    md.append('Estado: PENDIENTE_DE_INTERPRETACION')
    md.append('')
    md.append(f"- Decisiones generadas: `{len(rows)}`")
    md.append('')
    md.append('## Conteo por familia')
    for fam, cnt in sorted(by_family.items(), key=lambda x: (priority_for(x[0], {'XL 32x70':'SB04','A3 PLUS pack color':'SB07','XA3 ByN':'SB08','XL ByN':'SB09'}.get(x[0], 'ZZ')), x[0])):
        md.append(f"- {fam}: `{cnt}`")
    md.append('')
    md.append('## Conteo por decisión recomendada')
    for k, v in by_default.items():
        md.append(f"- {k}: `{v}`")

    sections = [
        (1, 'XL 32x70', 'SB04'),
        (2, 'A3 PLUS pack color', 'SB07'),
        (3, 'XA3 ByN', 'SB08'),
        (4, 'XL ByN', 'SB09'),
    ]

    for p, fam, block in sections:
        md.append('')
        md.append(f"## Prioridad {p}: {fam} / {block}")
        md.append('')
        md.append('| id_decision | celda | fila | problema | clasificación | recomendación por defecto | falta para justificar |')
        md.append('|---|---|---:|---|---|---|---|')
        for r in rows:
            if r['familia'] == fam and r['bloque'] == block:
                md.append(f"| {r['id_decision']} | {r['celda']} | {r['fila']} | {r['problema_detectado']} | {r['clasificacion_actual']} | {r['decision_recomendada_por_defecto']} | {r['falta_para_justificar']} |")

    # special SB04 section
    sb04_cells = [r for r in rows if r['bloque'] == 'SB04' and r['celda'] in ['W22','W23','W24','W25','W26','W27','X22','X23','X24','X25','X26','X27']]
    md.append('')
    md.append('## Por qué XL 32x70 no debe migrarse tal cual')
    md.append('')
    md.append('Las celdas `W22:W27` y `X22:X27` presentan alertas altas sin justificación completa de componentes de precio. ')
    md.append('En la revisión quedaron como `NO_MIGRAR_TAL_CUAL` (impresión no explícita) y/o `ERROR_REAL_PROBABLE` (papel no explícito).')
    md.append('Sin decisión funcional explícita, migrarlas trasladaría ambigüedad al sistema nuevo.')
    md.append('')
    md.append('| celda | problema | clasificación | recomendación |')
    md.append('|---|---|---|---|')
    for r in sb04_cells:
        md.append(f"| {r['celda']} | {r['problema_detectado']} | {r['clasificacion_actual']} | {r['decision_recomendada_por_defecto']} |")

    OUT_MD.write_text('\n'.join(md), encoding='utf-8')

    print(json.dumps({
        'status': 'ok',
        'total_decisiones': len(rows),
        'conteo_por_familia': dict(by_family),
        'conteo_por_decision_recomendada': dict(by_default),
        'files': [str(OUT_CSV), str(OUT_MD), str(OUT_JSON)]
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
