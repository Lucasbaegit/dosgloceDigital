import json
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / 'data' / 'bajadas_v2'
DOCS = BASE / 'docs' / 'bajadas_v2'

SRC_CSV = DATA / 'precios_pdf_objetivo_limpio.csv'
SRC_JSON = DATA / 'precios_pdf_objetivo_limpio.json'

OUT_VALID_JSON = DATA / 'precios_pdf_objetivo_validado.json'
OUT_VALID_MD = DOCS / '05_validacion_csv_limpio.md'
OUT_CFG = DATA / 'bajadas_v2_config_recalibrada.json'
OUT_A = DATA / 'comparativa_modelo_a.json'
OUT_B = DATA / 'comparativa_modelo_b.json'
OUT_C = DATA / 'comparativa_modelo_c.json'
OUT_RECALI_MD = DOCS / '06_recalibracion_desde_csv_limpio.md'
OUT_RECO_MD = DOCS / '07_modelo_recomendado_bajadas_v2.md'

EXPECTED_COLS = [
    'categoria','modo_color','formato','tipo_papel','material','gramaje','cantidad_rango','caras',
    'terminacion','precio_sin_iva','pagina_pdf','fuente','notas'
]

URG = {
    'normal': 0,
    'express': 0.15,
    'super_express': 0.30,
    'ya_24hs': 0.50,
}


def estado(diff_pct):
    if diff_pct is None or pd.isna(diff_pct):
        return 'SIN_COMPARACION'
    d = abs(diff_pct)
    if d <= 2:
        return 'OK'
    if d <= 5:
        return 'DIFERENCIA_LEVE'
    if d <= 10:
        return 'DIFERENCIA_MEDIA'
    return 'DIFERENCIA_ALTA'


def parse_rango_min(r):
    if pd.isna(r):
        return None
    s = str(r).strip().lower().replace('u.', '').replace('u', '').strip()
    if s == '1':
        return 1
    if ' a ' in s:
        try:
            return int(float(s.split(' a ')[0]))
        except Exception:
            return None
    return None


def integridad(df):
    issues = {}
    issues['cantidad_total_registros'] = int(len(df))
    issues['formatos_detectados'] = sorted(df['formato'].dropna().astype(str).unique().tolist())
    issues['categorias_detectadas'] = sorted(df['categoria'].dropna().astype(str).unique().tolist())
    issues['modos_color_detectados'] = sorted(df['modo_color'].dropna().astype(str).unique().tolist())

    precios = pd.to_numeric(df['precio_sin_iva'], errors='coerce')
    issues['precios_vacios'] = int(df['precio_sin_iva'].isna().sum())
    issues['precios_no_numericos'] = int(precios.isna().sum() - issues['precios_vacios'])

    dup_cols = EXPECTED_COLS
    issues['duplicados_exactos'] = int(df.duplicated(subset=dup_cols, keep=False).sum())

    key_cols = ['categoria','modo_color','formato','tipo_papel','material','gramaje','cantidad_rango','caras','terminacion']
    missing_price = df[precios.isna()]
    issues['combinaciones_sin_precio'] = int(len(missing_price[key_cols].drop_duplicates()))

    # 4/4 < 4/0 anomalies
    pair_cols = ['categoria','modo_color','formato','tipo_papel','material','gramaje','cantidad_rango','terminacion']
    anom_44_lt_40 = []
    temp = df.copy()
    temp['precio_num'] = precios
    for _, g in temp.groupby(pair_cols, dropna=False):
        p40 = g[g['caras']=='4/0']['precio_num']
        p44 = g[g['caras']=='4/4']['precio_num']
        if len(p40) and len(p44):
            if float(p44.iloc[0]) < float(p40.iloc[0]):
                anom_44_lt_40.append({
                    'clave': {c: (None if pd.isna(g.iloc[0][c]) else g.iloc[0][c]) for c in pair_cols},
                    'precio_4_0': float(p40.iloc[0]),
                    'precio_4_4': float(p44.iloc[0]),
                })
    issues['registros_4_4_menor_que_4_0'] = len(anom_44_lt_40)

    # higher qty more expensive per unit without justification (simple heuristic)
    anom_unit = []
    unit_cols = ['categoria','modo_color','formato','tipo_papel','material','gramaje','caras','terminacion']
    temp['qmin'] = temp['cantidad_rango'].apply(parse_rango_min)
    for _, g in temp.groupby(unit_cols, dropna=False):
        g = g.dropna(subset=['precio_num','qmin']).sort_values('qmin')
        if len(g) < 2:
            continue
        g = g.copy()
        g['unit'] = g['precio_num'] / g['qmin']
        prev = None
        prev_row = None
        for _, row in g.iterrows():
            if prev is not None and row['qmin'] > prev_row['qmin'] and row['unit'] > prev * 1.02:
                anom_unit.append({
                    'clave': {c: (None if pd.isna(row[c]) else row[c]) for c in unit_cols},
                    'rango_prev': prev_row['cantidad_rango'],
                    'unit_prev': float(prev),
                    'rango_actual': row['cantidad_rango'],
                    'unit_actual': float(row['unit']),
                })
            prev = row['unit']
            prev_row = row
    issues['registros_cantidad_mayor_mas_cara_unitaria'] = len(anom_unit)

    return issues, anom_44_lt_40, anom_unit


def build_base_index(df):
    # A3+ base index for derivations
    base = df[(df['formato']=='A3+')].copy()
    key_cols = ['categoria','modo_color','tipo_papel','material','gramaje','cantidad_rango','caras','terminacion']
    base_idx = {}
    for _, r in base.iterrows():
        k = tuple(r[c] if not pd.isna(r[c]) else None for c in key_cols)
        base_idx[k] = float(r['precio_num']) if not pd.isna(r['precio_num']) else None
    return base_idx, key_cols


def median_ratio(df, target_format, extra_group_cols=None):
    extra_group_cols = extra_group_cols or []
    d = df[df['formato'].isin(['A3+', target_format])].copy()
    base_idx, key_cols = build_base_index(d)

    ratios = []
    rows = []
    target = d[d['formato']==target_format]
    for _, r in target.iterrows():
        k = tuple(r[c] if not pd.isna(r[c]) else None for c in key_cols)
        b = base_idx.get(k)
        t = r['precio_num']
        if b is None or pd.isna(t) or b == 0:
            continue
        ratio = float(t) / float(b)
        rows.append((r, ratio))
        ratios.append(ratio)

    if not extra_group_cols:
        return {'global': float(np.median(ratios)) if ratios else None}

    out = {}
    tmp = pd.DataFrame([
        {**{c: rr[c] if not pd.isna(rr[c]) else None for c in rr.index}, 'ratio': ratio}
        for rr, ratio in rows
    ])
    if len(tmp)==0:
        return out
    for keys, g in tmp.groupby(extra_group_cols, dropna=False):
        if not isinstance(keys, tuple):
            keys = (keys,)
        key = '|'.join([str(k) if k is not None else 'NULL' for k in keys])
        out[key] = float(np.median(g['ratio']))
    return out


def estimate_price(row, model, fxl, fa4, base_idx, key_cols):
    fmt = row['formato']
    if fmt == 'A3+':
        return row['precio_num']
    if fmt == 'XA3':
        k = tuple(row[c] if not pd.isna(row[c]) else None for c in key_cols)
        b = base_idx.get(k)
        return None if b is None else b * 1.10
    if fmt not in ('XL','A4'):
        return None

    k = tuple(row[c] if not pd.isna(row[c]) else None for c in key_cols)
    b = base_idx.get(k)
    if b is None:
        return None

    if model == 'A':
        f = fxl['global'] if fmt=='XL' else fa4['global']
        return None if f is None else b * f

    if model == 'B':
        m = row['modo_color'] if not pd.isna(row['modo_color']) else 'NULL'
        fdict = fxl if fmt=='XL' else fa4
        f = fdict.get(str(m), fdict.get('global'))
        return None if f is None else b * f

    # model C: by modo+tipo_papel fallback to modo then global
    m = row['modo_color'] if not pd.isna(row['modo_color']) else 'NULL'
    tp = row['tipo_papel'] if not pd.isna(row['tipo_papel']) else 'NULL'
    key_mt = f"{m}|{tp}"
    fdict = fxl if fmt=='XL' else fa4
    f = fdict.get(key_mt)
    if f is None:
        f = fdict.get(str(m))
    if f is None:
        f = fdict.get('global')
    return None if f is None else b * f


def run_model(df, model_name, fxl, fa4):
    base_idx, key_cols = build_base_index(df)
    out = []
    for _, r in df.iterrows():
        target = r['precio_num']
        est = estimate_price(r, model_name, fxl, fa4, base_idx, key_cols)
        if est is None or pd.isna(target) or target == 0:
            diff_abs = None
            diff_pct = None
        else:
            diff_abs = float(est - target)
            diff_pct = float((diff_abs / target) * 100)
        st = estado(diff_pct)
        out.append({
            'categoria': r['categoria'],
            'modo_color': r['modo_color'],
            'formato': r['formato'],
            'tipo_papel': r['tipo_papel'],
            'material': r['material'],
            'gramaje': r['gramaje'],
            'cantidad_rango': r['cantidad_rango'],
            'caras': r['caras'],
            'terminacion': r['terminacion'] if not pd.isna(r['terminacion']) else None,
            'precio_objetivo_csv': None if pd.isna(target) else float(target),
            'precio_estimado_v2': None if est is None else float(est),
            'diferencia_absoluta': diff_abs,
            'diferencia_porcentual': diff_pct,
            'estado': st,
        })
    return out


def score(comp):
    c = Counter(x['estado'] for x in comp)
    return c


def weighted_score(c):
    # lower better
    return c.get('DIFERENCIA_ALTA',0)*4 + c.get('DIFERENCIA_MEDIA',0)*2 + c.get('DIFERENCIA_LEVE',0)


def main():
    df = pd.read_csv(SRC_CSV)

    missing_cols = [c for c in EXPECTED_COLS if c not in df.columns]
    if missing_cols:
        raise ValueError(f'Faltan columnas esperadas: {missing_cols}')

    df['precio_num'] = pd.to_numeric(df['precio_sin_iva'], errors='coerce')

    issues, an44, anunit = integridad(df)

    # factors
    fxl_A = median_ratio(df[df['formato'].isin(['A3+','XL'])], 'XL', [])
    fa4_A = median_ratio(df[df['formato'].isin(['A3+','A4'])], 'A4', [])

    fxl_B = median_ratio(df[df['formato'].isin(['A3+','XL'])], 'XL', ['modo_color'])
    fa4_B = median_ratio(df[df['formato'].isin(['A3+','A4'])], 'A4', ['modo_color'])

    fxl_C = median_ratio(df[df['formato'].isin(['A3+','XL'])], 'XL', ['modo_color','tipo_papel'])
    fa4_C = median_ratio(df[df['formato'].isin(['A3+','A4'])], 'A4', ['modo_color','tipo_papel'])

    # ensure fallbacks
    if 'global' not in fxl_B:
        fxl_B['global'] = fxl_A.get('global')
    if 'global' not in fa4_B:
        fa4_B['global'] = fa4_A.get('global')
    if 'global' not in fxl_C:
        fxl_C['global'] = fxl_A.get('global')
    if 'global' not in fa4_C:
        fa4_C['global'] = fa4_A.get('global')

    for m in ['fullcolor','blanco_y_negro']:
        fxl_C.setdefault(m, fxl_B.get(m))
        fa4_C.setdefault(m, fa4_B.get(m))

    compA = run_model(df, 'A', fxl_A, fa4_A)
    compB = run_model(df, 'B', fxl_B, fa4_B)
    compC = run_model(df, 'C', fxl_C, fa4_C)

    OUT_A.write_text(json.dumps(compA, ensure_ascii=False, indent=2), encoding='utf-8')
    OUT_B.write_text(json.dumps(compB, ensure_ascii=False, indent=2), encoding='utf-8')
    OUT_C.write_text(json.dumps(compC, ensure_ascii=False, indent=2), encoding='utf-8')

    scoreA = score(compA)
    scoreB = score(compB)
    scoreC = score(compC)

    # choose simplest acceptable: A if not too many altas, else B, else C
    # threshold heuristic
    def alta_ratio(sc):
        den = sum(sc.values()) - sc.get('SIN_COMPARACION',0)
        return (sc.get('DIFERENCIA_ALTA',0)/den) if den>0 else 1

    if alta_ratio(scoreA) <= 0.08:
        recommended = 'A'
    elif alta_ratio(scoreB) <= 0.08:
        recommended = 'B'
    else:
        recommended = 'C'

    fxl_rec = {'A': fxl_A, 'B': fxl_B, 'C': fxl_C}[recommended]
    fa4_rec = {'A': fa4_A, 'B': fa4_B, 'C': fa4_C}[recommended]

    cfg = {
        'dolar_anterior_excel': 650,
        'dolar_actual': 1410,
        'factor_dolar': 2.169230769,
        'iva_incluido': False,
        'base_formato': 'A3+',
        'factor_xa3': 1.10,
        'modelo_recomendado': recommended,
        'factores_xl': fxl_rec,
        'factores_a4': fa4_rec,
        'recargos_urgencia': URG,
        'redondeo': {
            'tipo': 'comercial',
            'unidad': 'configurable'
        },
        'fuente_objetivo': str(SRC_CSV),
        'sin_ocr_pdf': True,
    }
    OUT_CFG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding='utf-8')

    valid = {
        'fuente_csv_limpio': str(SRC_CSV),
        'fuente_json_limpio': str(SRC_JSON),
        'columnas_esperadas': EXPECTED_COLS,
        'columnas_presentes': list(df.columns),
        'validacion_integridad': issues,
        'anomalias_4_4_menor_que_4_0': an44,
        'anomalias_unitario': anunit,
        'status': 'OK'
    }
    OUT_VALID_JSON.write_text(json.dumps(valid, ensure_ascii=False, indent=2), encoding='utf-8')

    # docs
    OUT_VALID_MD.write_text('\n'.join([
        '# 05 - Validación CSV limpio',
        '',
        f"- Registros totales: {issues['cantidad_total_registros']}",
        f"- Formatos: {', '.join(issues['formatos_detectados'])}",
        f"- Categorías: {', '.join(issues['categorias_detectadas'])}",
        f"- Modos de color: {', '.join(issues['modos_color_detectados'])}",
        f"- Precios vacíos: {issues['precios_vacios']}",
        f"- Precios no numéricos: {issues['precios_no_numericos']}",
        f"- Duplicados exactos: {issues['duplicados_exactos']}",
        f"- Combinaciones sin precio: {issues['combinaciones_sin_precio']}",
        f"- Casos 4/4 < 4/0: {issues['registros_4_4_menor_que_4_0']}",
        f"- Casos de mayor cantidad más caro unitario: {issues['registros_cantidad_mayor_mas_cara_unitaria']}",
    ]), encoding='utf-8')

    def fmt_sc(name, sc):
        return [
            f"## Modelo {name}",
            f"- OK: {sc.get('OK',0)}",
            f"- DIFERENCIA_LEVE: {sc.get('DIFERENCIA_LEVE',0)}",
            f"- DIFERENCIA_MEDIA: {sc.get('DIFERENCIA_MEDIA',0)}",
            f"- DIFERENCIA_ALTA: {sc.get('DIFERENCIA_ALTA',0)}",
            f"- SIN_COMPARACION: {sc.get('SIN_COMPARACION',0)}",
        ]

    OUT_RECALI_MD.write_text('\n'.join([
        '# 06 - Recalibración desde CSV limpio',
        '',
        'Fuente única: precios_pdf_objetivo_limpio.csv/json (sin PDF, sin OCR).',
        '',
        '## Factores Modelo A',
        f"- factor_xl_global: {fxl_A.get('global')}",
        f"- factor_a4_global: {fa4_A.get('global')}",
        '',
        '## Factores Modelo B',
        f"- factores_xl: {fxl_B}",
        f"- factores_a4: {fa4_B}",
        '',
        '## Factores Modelo C',
        f"- factores_xl: {fxl_C}",
        f"- factores_a4: {fa4_C}",
        '',
        *fmt_sc('A', scoreA),
        '',
        *fmt_sc('B', scoreB),
        '',
        *fmt_sc('C', scoreC),
    ]), encoding='utf-8')

    OUT_RECO_MD.write_text('\n'.join([
        '# 07 - Modelo recomendado Bajadas v2',
        '',
        f"- Modelo recomendado: {recommended}",
        '- Criterio: elegir el más simple con tasa de diferencias altas razonable.',
        f"- Score ponderado A: {weighted_score(scoreA)}",
        f"- Score ponderado B: {weighted_score(scoreB)}",
        f"- Score ponderado C: {weighted_score(scoreC)}",
        '',
        'Si faltan comparaciones por ausencia de base A3+, se mantiene SIN_COMPARACION sin inventar precios.',
    ]), encoding='utf-8')

    print(json.dumps({
        'used_clean_source_only': True,
        'rows': int(len(df)),
        'integrity': issues,
        'factors_model_a': {'factor_xl_global': fxl_A.get('global'), 'factor_a4_global': fa4_A.get('global')},
        'factors_model_b': {'factores_xl': fxl_B, 'factores_a4': fa4_B},
        'factors_model_c': {'factores_xl': fxl_C, 'factores_a4': fa4_C},
        'scores': {'A': dict(scoreA), 'B': dict(scoreB), 'C': dict(scoreC)},
        'recommended_model': recommended,
        'files': [
            str(OUT_VALID_JSON), str(OUT_VALID_MD), str(OUT_A), str(OUT_B), str(OUT_C),
            str(OUT_CFG), str(OUT_RECALI_MD), str(OUT_RECO_MD)
        ]
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
