import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / 'data' / 'bajadas'
DOCS = BASE / 'docs' / 'bajadas'

IN_MATRIX = DATA / 'bajadas_decision_matrix.json'
IN_REVIEW = DATA / 'bajadas_high_alerts_review.json'
IN_TRACE = DATA / 'bajadas_price_trace_tree.json'
IN_BLOCKS = DATA / 'bajadas_blocks_semantic.json'

OUT_JSON = DATA / 'bajadas_decision_groups.json'
OUT_MD = DOCS / '11_grupos_decision_bajadas.md'
OUT_CSV = DOCS / '11_grupos_decision_bajadas.csv'

OPTIONS = [
    'CONSERVAR_PRECIO_EXCEL',
    'RECALCULAR_DESDE_COSTO_PAPEL',
    'RECALCULAR_DESDE_COSTO_PAPEL_E_IMPRESION',
    'CREAR_REGLA_NUEVA',
    'DESCARTAR_COMO_OBSOLETO',
    'REQUIERE_REVISION_MANUAL',
]

PRIORITY_RULES = {
    ('XL 32x70', 'SB04'): 1,
    ('A3 PLUS pack color', 'SB07'): 2,
    ('XA3 ByN', 'SB08'): 3,
    ('XL ByN', 'SB09'): 4,
}


def priority(family, block):
    return PRIORITY_RULES.get((family, block), 99)


def rc(cell):
    m = re.match(r'([A-Z]+)(\d+)', cell)
    return m.group(1), int(m.group(2))


def norm_formula(f):
    if not f:
        return ''
    s = f.strip()
    if s.startswith('='):
        s = s[1:]
    s = re.sub(r'\$?[A-Z]{1,3}\$?\d+', 'CELL', s)
    s = re.sub(r'\s+', '', s)
    return s.upper()


def contiguous_ranges(rows):
    rows = sorted(set(rows))
    if not rows:
        return []
    out = []
    start = prev = rows[0]
    for r in rows[1:]:
        if r == prev + 1:
            prev = r
        else:
            out.append((start, prev))
            start = prev = r
    out.append((start, prev))
    return out


def compact_cells(cells):
    by_col = defaultdict(list)
    for c in sorted(set(cells), key=lambda x: (rc(x)[0], rc(x)[1])):
        col, row = rc(c)
        by_col[col].append(row)

    parts = []
    for col in sorted(by_col):
        for a, b in contiguous_ranges(by_col[col]):
            if a == b:
                parts.append(f"{col}{a}")
            else:
                parts.append(f"{col}{a}:{col}{b}")
    return parts


def main():
    matrix = json.loads(IN_MATRIX.read_text(encoding='utf-8'))
    _review = json.loads(IN_REVIEW.read_text(encoding='utf-8'))
    trace = json.loads(IN_TRACE.read_text(encoding='utf-8'))
    blocks = json.loads(IN_BLOCKS.read_text(encoding='utf-8'))

    traces = {(t['familia'], t['bloque'], t['celda_salida']): t for t in trace['precio_traces']}

    decisions = matrix['decisiones']
    original_count = len(decisions)

    # strict grouping key + safety: only contiguous rows per column
    buckets = defaultdict(list)
    for d in decisions:
        fam = d['familia']
        block = d['bloque']
        problem = d['problema_detectado']
        rec = d['decision_recomendada_por_defecto']
        col, row = rc(d['celda'])
        fpat = norm_formula(d.get('formula_actual', ''))
        head = (d.get('encabezado_detectado') or '').strip().lower()[:80]
        causa = (d.get('falta_para_justificar') or '').strip().lower()

        # Group by family/block/problem/rec/column/formula-pattern/header-cause.
        key = (fam, block, problem, rec, col, fpat, head, causa)
        buckets[key].append(d)

    groups = []
    gid = 1
    for key, items in buckets.items():
        fam, block, problem, rec, col, fpat, head, causa = key

        # split non-contiguous row islands to avoid over-grouping
        row_to_item = {rc(i['celda'])[1]: i for i in items}
        ranges = contiguous_ranges(list(row_to_item.keys()))
        for a, b in ranges:
            subset = [row_to_item[r] for r in range(a, b + 1) if r in row_to_item]
            cells = [x['celda'] for x in subset]

            p = priority(fam, block)
            trace_samples = []
            papel_refs = set()
            for x in subset[:5]:
                t = traces.get((x['familia'], x['bloque'], x['celda']))
                if t:
                    nodes = t.get('arbol_de_origen', [])[:4]
                    trace_samples.append(' <- '.join([f"{n.get('hoja')}!{n.get('celda')}" for n in nodes]))
                    for n in t.get('arbol_de_origen', []):
                        if n.get('hoja') == 'PAPEL US$':
                            papel_refs.add(f"PAPEL US$!{n.get('celda')}")

            risk = 'Riesgo alto de migrar precio sin justificación completa de componentes.'
            if rec == 'REQUIERE_REVISION_MANUAL':
                risk = 'Riesgo alto por ausencia de explicación técnica suficiente; posible desvío de precio.'

            group = {
                'id_grupo': f"GRP-{gid:03d}",
                'prioridad': p,
                'familia': fam,
                'bloque': block,
                'celdas_incluidas': sorted(cells, key=lambda c: (rc(c)[0], rc(c)[1])),
                'rango_resumido': compact_cells(cells),
                'cantidad_decisiones_agrupadas': len(subset),
                'problema_comun': problem,
                'formula_patron_comun': fpat if fpat else 'PENDIENTE_DE_INTERPRETACION',
                'encabezado_similar': head if head else 'PENDIENTE_DE_INTERPRETACION',
                'causa_probable_comun': causa if causa else 'PENDIENTE_DE_INTERPRETACION',
                'explicacion_simple': f"Casos repetidos en {col}{a}:{col}{b} con mismo problema y patrón.",
                'origen_precio_resumen': trace_samples[0] if trace_samples else 'PENDIENTE_DE_INTERPRETACION',
                'referencias_papel_usd': sorted(papel_refs),
                'riesgo_si_migra_tal_cual': risk,
                'decision_recomendada_por_defecto': rec,
                'opciones_usuario': OPTIONS,
                'decision_usuario': '',
                'comentario_usuario': '',
                'filas_contiguas': f"{a}:{b}" if a != b else str(a),
                'columna_contigua': col,
                'ids_decision_originales': [x['id_decision'] for x in subset],
            }
            groups.append(group)
            gid += 1

    groups.sort(key=lambda g: (g['prioridad'], g['familia'], g['bloque'], g['columna_contigua'], g['filas_contiguas']))

    by_family = Counter(g['familia'] for g in groups)

    out = {
        'cantidad_original_decisiones': original_count,
        'cantidad_grupos_generados': len(groups),
        'reduccion_absoluta': original_count - len(groups),
        'reduccion_porcentual': round(((original_count - len(groups)) / original_count) * 100, 2) if original_count else 0,
        'grupos_por_familia': dict(by_family),
        'decisiones_minimas_necesarias': len(groups),
        'grupos': groups,
        'status': 'PENDIENTE_DE_INTERPRETACION',
    }
    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')

    # CSV
    fields = [
        'id_grupo', 'prioridad', 'familia', 'bloque', 'celdas_incluidas', 'rango_resumido',
        'cantidad_decisiones_agrupadas', 'problema_comun', 'formula_patron_comun',
        'explicacion_simple', 'riesgo_si_migra_tal_cual', 'decision_recomendada_por_defecto',
        'opciones_usuario', 'decision_usuario', 'comentario_usuario'
    ]
    with OUT_CSV.open('w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for g in groups:
            row = {k: g.get(k, '') for k in fields}
            row['celdas_incluidas'] = '; '.join(g['celdas_incluidas'])
            row['rango_resumido'] = '; '.join(g['rango_resumido'])
            row['opciones_usuario'] = ' | '.join(g['opciones_usuario'])
            w.writerow(row)

    # Markdown
    md = []
    md.append('# 11 - Grupos de Decisión Funcional (Bajadas)')
    md.append('')
    md.append('Estado: PENDIENTE_DE_INTERPRETACION')
    md.append('')
    md.append(f"- Cantidad original de decisiones: `{original_count}`")
    md.append(f"- Cantidad de grupos generados: `{len(groups)}`")
    md.append(f"- Reducción lograda: `{original_count - len(groups)}` casos (`{out['reduccion_porcentual']}%`) ")
    md.append('')
    md.append('## Decisiones mínimas necesarias para cerrar Bajadas')
    md.append(f"Después de agrupar, el usuario debe tomar `{len(groups)}` decisiones funcionales reales.")

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
        md.append('| id_grupo | celdas | cantidad | problema común | decisión recomendada |')
        md.append('|---|---|---:|---|---|')
        for g in groups:
            if g['familia'] == fam and g['bloque'] == block:
                md.append(f"| {g['id_grupo']} | {', '.join(g['rango_resumido'])} | {g['cantidad_decisiones_agrupadas']} | {g['problema_comun']} | {g['decision_recomendada_por_defecto']} |")

    md.append('')
    md.append('## Tabla de grupos por familia')
    md.append('| Familia | Grupos |')
    md.append('|---|---:|')
    for fam, c in sorted(by_family.items(), key=lambda kv: (priority(kv[0], {'XL 32x70':'SB04','A3 PLUS pack color':'SB07','XA3 ByN':'SB08','XL ByN':'SB09'}.get(kv[0], 'ZZ')), kv[0])):
        md.append(f"| {fam} | {c} |")

    OUT_MD.write_text('\n'.join(md), encoding='utf-8')

    print(json.dumps({
        'status': 'ok',
        'original': original_count,
        'groups': len(groups),
        'reduction': original_count - len(groups),
        'reduction_pct': out['reduccion_porcentual'],
        'by_family': dict(by_family),
        'files': [str(OUT_JSON), str(OUT_MD), str(OUT_CSV)]
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
