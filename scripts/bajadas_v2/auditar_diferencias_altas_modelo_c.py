import csv
import json
from collections import Counter
from pathlib import Path

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / 'data' / 'bajadas_v2'
DOCS = BASE / 'docs' / 'bajadas_v2'

IN_C = DATA / 'comparativa_modelo_c.json'
IN_CFG = DATA / 'bajadas_v2_config_recalibrada.json'
IN_VAL = DATA / 'precios_pdf_objetivo_validado.json'

OUT_JSON = DATA / 'modelo_c_diferencias_altas_auditadas.json'
OUT_MD = DOCS / '08_auditoria_diferencias_altas_modelo_c.md'
OUT_CSV = DOCS / '09_decisiones_diferencias_altas_modelo_c.csv'


def applied_factor(row, cfg):
    fx = cfg.get('factores_xl', {})
    if row.get('formato') != 'XL':
        return None
    modo = row.get('modo_color')
    tp = row.get('tipo_papel')
    key = f"{modo}|{tp}"
    if key in fx:
        return fx[key]
    if modo in fx:
        return fx[modo]
    return fx.get('global')


def probable_cause(row):
    # deterministic and conservative
    cat = row.get('categoria')
    fmt = row.get('formato')
    modo = row.get('modo_color')
    tp = row.get('tipo_papel')
    caras = row.get('caras')
    diff = row.get('diferencia_porcentual')

    if cat == 'Bajadas Blanco y Negro' and fmt == 'XL' and modo == 'blanco_y_negro':
        if tp == 'pesado':
            return 'Patrón repetido XL ByN pesado: el derivado desde A3+ no replica bien la curva real del CSV.'
        if tp == 'liviano':
            return 'Patrón repetido XL ByN liviano: sensibilidad de escala por rango/cara no capturada por factor fijo.'

    if abs(diff or 0) > 25:
        return 'Desvío muy alto: probable no linealidad del segmento vs base A3+.'
    return 'Caso puntual fuera del comportamiento promedio del factor aplicado.'


def classify(row):
    cat = row.get('categoria')
    fmt = row.get('formato')
    modo = row.get('modo_color')
    tp = row.get('tipo_papel')
    caras = row.get('caras')
    dr = abs(row.get('diferencia_porcentual') or 0)

    # priority: repeated clear pattern => regla especial
    if cat == 'Bajadas Blanco y Negro' and fmt == 'XL' and modo == 'blanco_y_negro':
        # very high repeated segment
        if tp in ('pesado', 'liviano'):
            return 'REGLA_ESPECIAL_REQUERIDA', 'Hay patrón repetido en segmento XL ByN; un solo factor no alcanza para estos casos.'

    # non-derivable structures (kept for completeness)
    if row.get('formato') in ('Oficio', 'A3', 'por lado'):
        return 'MODELO_DERIVADO_NO_APLICA', 'Formato fuera del esquema derivado A3+->(XA3/XL/A4).'

    if dr <= 15:
        return 'PRECIO_FIJO_CSV', 'Diferencia alta pero moderada en caso puntual; conviene fijar precio CSV sin complejizar reglas.'

    return 'REQUIERE_DECISION_MANUAL', 'No hay evidencia suficiente para corregir solo con regla simple sin riesgo.'


def direction(row):
    d = row.get('diferencia_absoluta')
    if d is None:
        return 'SIN_COMPARACION'
    return 'ESTIMADO_MAYOR' if d > 0 else ('ESTIMADO_MENOR' if d < 0 else 'IGUAL')


def main():
    C = json.loads(IN_C.read_text(encoding='utf-8'))
    cfg = json.loads(IN_CFG.read_text(encoding='utf-8'))
    val = json.loads(IN_VAL.read_text(encoding='utf-8'))

    high = [x for x in C if x.get('estado') == 'DIFERENCIA_ALTA']

    audited = []
    for i, r in enumerate(sorted(high, key=lambda x: abs(x.get('diferencia_porcentual') or 0), reverse=True), 1):
        cls, rec = classify(r)
        cause = probable_cause(r)
        item = {
            'id': f'ALT-{i:03d}',
            'categoria': r.get('categoria'),
            'modo_color': r.get('modo_color'),
            'formato': r.get('formato'),
            'tipo_papel': r.get('tipo_papel'),
            'material': r.get('material'),
            'gramaje': r.get('gramaje'),
            'cantidad_rango': r.get('cantidad_rango'),
            'caras': r.get('caras'),
            'precio_objetivo_csv': r.get('precio_objetivo_csv'),
            'precio_estimado_modelo_c': r.get('precio_estimado_v2'),
            'diferencia_absoluta': r.get('diferencia_absoluta'),
            'diferencia_porcentual': r.get('diferencia_porcentual'),
            'direccion_diferencia': direction(r),
            'factor_aplicado': applied_factor(r, cfg),
            'causa_probable': cause,
            'clasificacion_recomendada': cls,
            'recomendacion': rec,
            'decision_usuario': '',
            'comentario_usuario': ''
        }
        audited.append(item)

    # summaries
    by_cat = Counter(x['categoria'] for x in audited)
    by_fmt = Counter(x['formato'] for x in audited)
    by_causa = Counter(x['causa_probable'] for x in audited)
    by_cls = Counter(x['clasificacion_recomendada'] for x in audited)

    pattern = {
        'todos_misma_familia': len(by_cat)==1,
        'todos_mismo_tipo_papel': len(Counter(x['tipo_papel'] for x in audited))==1,
        'todos_misma_cara': len(Counter(x['caras'] for x in audited))==1,
        'todos_mismo_rango_cantidad': len(Counter(x['cantidad_rango'] for x in audited))==1,
        'todos_terminaciones_autoadhesivas_kraft': all(x['categoria'] in ('Terminaciones Bajadas','Bajadas Autoadhesivas','Bajadas Kraft') for x in audited),
        'comparando_formatos_no_derivables': any(x['formato'] in ('Oficio','A3','por lado') for x in audited),
    }

    out = {
        'total_diferencias_altas': len(audited),
        'resumen_categoria': dict(by_cat),
        'resumen_formato': dict(by_fmt),
        'resumen_causa_probable': dict(by_causa),
        'resumen_clasificacion_recomendada': dict(by_cls),
        'patrones_detectados': pattern,
        'casos_auditados': audited,
        'status': 'PENDIENTE_DE_INTERPRETACION'
    }

    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')

    # markdown
    top20 = sorted(audited, key=lambda x: abs(x.get('diferencia_porcentual') or 0), reverse=True)[:20]
    md = []
    md.append('# 08 - Auditoría diferencias altas Modelo C')
    md.append('')
    md.append(f"- Diferencias altas auditadas: `{len(audited)}`")
    md.append('')
    md.append('## Resumen general')
    for k,v in out['resumen_clasificacion_recomendada'].items():
        md.append(f"- {k}: `{v}`")

    md.append('')
    md.append('## Tabla por categoría')
    md.append('| Categoría | Cantidad |')
    md.append('|---|---:|')
    for k,v in by_cat.items():
        md.append(f'| {k} | {v} |')

    md.append('')
    md.append('## Tabla por formato')
    md.append('| Formato | Cantidad |')
    md.append('|---|---:|')
    for k,v in by_fmt.items():
        md.append(f'| {k} | {v} |')

    md.append('')
    md.append('## Tabla por causa probable')
    md.append('| Causa probable | Cantidad |')
    md.append('|---|---:|')
    for k,v in by_causa.items():
        md.append(f'| {k} | {v} |')

    md.append('')
    md.append('## Top 20 diferencias más grandes')
    md.append('| id | categoría | formato | tipo_papel | material | gramaje | rango | caras | dif_% | clasificación recomendada |')
    md.append('|---|---|---|---|---|---|---|---|---:|---|')
    for x in top20:
        md.append(f"| {x['id']} | {x['categoria']} | {x['formato']} | {x['tipo_papel']} | {x['material']} | {x['gramaje']} | {x['cantidad_rango']} | {x['caras']} | {round(x['diferencia_porcentual'],2)} | {x['clasificacion_recomendada']} |")

    md.append('')
    md.append('## Recomendación de cierre')
    md.append('- Congelar Modelo C como baseline (sin nuevos factores por ahora).')
    md.append('- Tratar el bloque XL ByN como segmento especial en próxima iteración, o fijar precios CSV para los casos críticos si se busca cierre rápido.')
    md.append('- Mantener `SIN_COMPARACION` sin inventar valores.')

    OUT_MD.write_text('\n'.join(md), encoding='utf-8')

    # csv decisions
    fields = [
        'id','categoria','modo_color','formato','tipo_papel','material','gramaje','cantidad_rango','caras',
        'precio_objetivo_csv','precio_estimado_modelo_c','diferencia_absoluta','diferencia_porcentual',
        'factor_aplicado','causa_probable','clasificacion_recomendada','recomendacion','decision_usuario','comentario_usuario'
    ]
    with OUT_CSV.open('w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in audited:
            w.writerow({k: r.get(k,'') for k in fields})

    print(json.dumps({
        'audited': len(audited),
        'by_categoria': dict(by_cat),
        'by_formato': dict(by_fmt),
        'top_causas': dict(by_causa),
        'reco_counts': dict(by_cls),
        'files': [str(OUT_JSON), str(OUT_MD), str(OUT_CSV)]
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
