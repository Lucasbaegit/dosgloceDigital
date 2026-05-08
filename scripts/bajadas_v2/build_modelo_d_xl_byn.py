import json
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / 'data' / 'bajadas_v2'
DOCS = BASE / 'docs' / 'bajadas_v2'

CSV_CLEAN = DATA / 'precios_pdf_objetivo_limpio.csv'
COMP_C = DATA / 'comparativa_modelo_c.json'
CFG_C = DATA / 'bajadas_v2_config_recalibrada.json'

OUT_CFG_D = DATA / 'bajadas_v2_config_modelo_d.json'
OUT_D1 = DATA / 'comparativa_modelo_d_d1.json'
OUT_D2 = DATA / 'comparativa_modelo_d_d2.json'
OUT_D3 = DATA / 'comparativa_modelo_d_d3.json'
OUT_FINAL = DATA / 'comparativa_modelo_d_final.json'
OUT_MD13 = DOCS / '13_modelo_d_xl_byn.md'
OUT_MD14 = DOCS / '14_comparativa_modelo_c_vs_modelo_d.md'


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


def stats(rows):
    c = Counter(r['estado'] for r in rows)
    diffs = [abs(r['diferencia_porcentual']) for r in rows if r['diferencia_porcentual'] is not None]
    return {
        'OK': c.get('OK', 0),
        'DIFERENCIA_LEVE': c.get('DIFERENCIA_LEVE', 0),
        'DIFERENCIA_MEDIA': c.get('DIFERENCIA_MEDIA', 0),
        'DIFERENCIA_ALTA': c.get('DIFERENCIA_ALTA', 0),
        'SIN_COMPARACION': c.get('SIN_COMPARACION', 0),
        'error_promedio_pct_abs': (float(np.mean(diffs)) if diffs else None),
        'error_mediano_pct_abs': (float(np.median(diffs)) if diffs else None),
        'diferencia_max_pct_abs': (float(np.max(diffs)) if diffs else None),
    }


def build_base_lookup(df):
    key_cols = ['categoria','modo_color','tipo_papel','material','gramaje','cantidad_rango','caras','terminacion']
    base = {}
    for _, r in df[df['formato']=='A3+'].iterrows():
        k = tuple(None if pd.isna(r[c]) else r[c] for c in key_cols)
        if not pd.isna(r['precio_num']):
            base[k] = float(r['precio_num'])
    return base, key_cols


def calc_factor(df_seg, base_lookup, key_cols, group_cols):
    work = []
    for _, r in df_seg.iterrows():
        k = tuple(None if pd.isna(r[c]) else r[c] for c in key_cols)
        b = base_lookup.get(k)
        t = r['precio_num']
        if b is None or pd.isna(t) or b == 0:
            continue
        gk = tuple(None if pd.isna(r[c]) else r[c] for c in group_cols)
        work.append((gk, float(t)/float(b)))

    out = {}
    if not work:
        return out
    tmp = {}
    for gk, ratio in work:
        tmp.setdefault(gk, []).append(ratio)
    for gk, vals in tmp.items():
        key = '|'.join('NULL' if v is None else str(v) for v in gk)
        out[key] = float(np.median(vals))
    out['global'] = float(np.median([r for _, r in work]))
    return out


def apply_model_d_variant(df, baseline_rows_by_key, base_lookup, key_cols, factors, group_cols, variant_name):
    out = []
    for _, r in df.iterrows():
        key_cmp = (
            r['categoria'], r['modo_color'], r['formato'], r['tipo_papel'], r['material'], r['gramaje'],
            r['cantidad_rango'], r['caras'], None if pd.isna(r['terminacion']) else r['terminacion']
        )
        base_row = baseline_rows_by_key.get(key_cmp)
        if base_row is None:
            continue

        # default: keep baseline C
        est = base_row['precio_estimado_v2']
        applied = False

        is_xl_byn = (
            r['categoria'] == 'Bajadas Blanco y Negro' and
            r['modo_color'] == 'blanco_y_negro' and
            r['formato'] == 'XL'
        )

        if is_xl_byn:
            # Active rule documented: CORRECCION_XL_BYN_1_1_PARENTESIS (applies to 1/1)
            k = tuple(None if pd.isna(r[c]) else r[c] for c in key_cols)
            base_a3 = base_lookup.get(k)
            if base_a3 is not None:
                gk = tuple(None if pd.isna(r[c]) else r[c] for c in group_cols)
                fk = '|'.join('NULL' if v is None else str(v) for v in gk)
                f = factors.get(fk, factors.get('global'))
                if f is not None:
                    est = float(base_a3) * float(f)
                    applied = True

        target = None if pd.isna(r['precio_num']) else float(r['precio_num'])
        if est is None or target is None or target == 0:
            diff_abs = None
            diff_pct = None
        else:
            diff_abs = float(est - target)
            diff_pct = float((diff_abs / target) * 100)

        row = dict(base_row)
        row['precio_objetivo_csv'] = target
        row['precio_estimado_v2'] = est
        row['diferencia_absoluta'] = diff_abs
        row['diferencia_porcentual'] = diff_pct
        row['estado'] = estado(diff_pct)
        row['modelo_d_variant'] = variant_name
        row['regla_correccion_xl_byn_1_1_parentesis_activa'] = bool(is_xl_byn and r['caras']=='1/1')
        row['segmento_xl_byn_recalibrado'] = applied
        out.append(row)
    return out


def main():
    df = pd.read_csv(CSV_CLEAN)
    df['precio_num'] = pd.to_numeric(df['precio_sin_iva'], errors='coerce')

    comp_c = json.loads(COMP_C.read_text(encoding='utf-8'))
    cfg_c = json.loads(CFG_C.read_text(encoding='utf-8'))

    # baseline index
    baseline_rows_by_key = {}
    for r in comp_c:
        k = (
            r['categoria'], r['modo_color'], r['formato'], r['tipo_papel'], r['material'], r['gramaje'],
            r['cantidad_rango'], r['caras'], None if r.get('terminacion') is None else r.get('terminacion')
        )
        baseline_rows_by_key[k] = r

    base_lookup, key_cols = build_base_lookup(df)

    seg = df[
        (df['categoria']=='Bajadas Blanco y Negro') &
        (df['modo_color']=='blanco_y_negro') &
        (df['formato']=='XL')
    ].copy()

    # D1: by tipo_papel
    f_d1 = calc_factor(seg, base_lookup, key_cols, ['tipo_papel'])
    comp_d1 = apply_model_d_variant(df, baseline_rows_by_key, base_lookup, key_cols, f_d1, ['tipo_papel'], 'D1')
    st_d1 = stats(comp_d1)

    # D2: by tipo_papel + caras
    f_d2 = calc_factor(seg, base_lookup, key_cols, ['tipo_papel','caras'])
    comp_d2 = apply_model_d_variant(df, baseline_rows_by_key, base_lookup, key_cols, f_d2, ['tipo_papel','caras'], 'D2')
    st_d2 = stats(comp_d2)

    # D3 only if D2 still many altas
    execute_d3 = st_d2['DIFERENCIA_ALTA'] > 20
    comp_d3 = None
    st_d3 = None
    f_d3 = None
    if execute_d3:
        f_d3 = calc_factor(seg, base_lookup, key_cols, ['tipo_papel','caras','cantidad_rango'])
        comp_d3 = apply_model_d_variant(df, baseline_rows_by_key, base_lookup, key_cols, f_d3, ['tipo_papel','caras','cantidad_rango'], 'D3')
        st_d3 = stats(comp_d3)

    # choose simplest substantial reduction
    # start D1 then D2 then D3 if executed
    baseline_stats = stats(comp_c)
    chosen = 'D1'
    chosen_comp = comp_d1
    chosen_st = st_d1
    chosen_f = f_d1

    # substantial: reduce altas by at least 25% vs baseline
    def reduced_enough(st):
        b = baseline_stats['DIFERENCIA_ALTA']
        return (b - st['DIFERENCIA_ALTA']) >= max(1, int(round(b*0.25)))

    if not reduced_enough(st_d1):
        chosen = 'D2'
        chosen_comp = comp_d2
        chosen_st = st_d2
        chosen_f = f_d2

    if chosen == 'D2' and execute_d3 and not reduced_enough(st_d2):
        chosen = 'D3'
        chosen_comp = comp_d3
        chosen_st = st_d3
        chosen_f = f_d3

    # persist outputs
    OUT_D1.write_text(json.dumps(comp_d1, ensure_ascii=False, indent=2), encoding='utf-8')
    OUT_D2.write_text(json.dumps(comp_d2, ensure_ascii=False, indent=2), encoding='utf-8')
    if execute_d3:
        OUT_D3.write_text(json.dumps(comp_d3, ensure_ascii=False, indent=2), encoding='utf-8')

    OUT_FINAL.write_text(json.dumps({
        'variant_selected': chosen,
        'comparativa': chosen_comp,
        'metricas': chosen_st,
        'baseline_modelo_c_metricas': baseline_stats,
    }, ensure_ascii=False, indent=2), encoding='utf-8')

    cfg_d = {
        'modelo_base': 'Modelo C',
        'modelo_d': {
            'descripcion': 'Modelo C + correccion XL ByN 1/1 + regla especial XL ByN',
            'regla_correccion_xl_byn_1_1_parentesis': {
                'id': 'CORRECCION_XL_BYN_1_1_PARENTESIS',
                'activa': True,
                'aplica_a': {
                    'categoria': 'Bajadas Blanco y Negro',
                    'formato': 'XL',
                    'caras': '1/1'
                },
                'antes': '(paper + variable) * AH * AG',
                'despues': '(paper + variable*AG) * AH',
                'motivo': 'Consistencia con A3+/XA3/A4 1/1'
            },
            'segmento_recalibrado_exclusivo': {
                'categoria': 'Bajadas Blanco y Negro',
                'formato': 'XL'
            },
            'variante_elegida': chosen,
            'factores_xl_byn': chosen_f,
            'sin_impacto_en_resto': [
                'A3+', 'XA3', 'A4', 'fullcolor', 'autoadhesivas', 'terminaciones', 'Kraft'
            ]
        },
        'dolar_anterior_excel': 650,
        'dolar_actual': 1410,
        'factor_dolar': 2.169230769,
        'iva_incluido': False,
        'base_formato': 'A3+',
        'factor_xa3': 1.10,
        'recargos_urgencia': {
            'normal': 0,
            'express': 0.15,
            'super_express': 0.30,
            'ya_24hs': 0.50,
        },
        'redondeo': {
            'tipo': 'comercial',
            'unidad': 'configurable'
        },
        'restricciones': {
            'no_excel_modificado': True,
            'no_csv_fuente_modificado': True,
            'no_pdf_ocr': True,
        }
    }
    OUT_CFG_D.write_text(json.dumps(cfg_d, ensure_ascii=False, indent=2), encoding='utf-8')

    def block(name, st):
        return [
            f"## {name}",
            f"- OK: {st['OK']}",
            f"- DIFERENCIA_LEVE: {st['DIFERENCIA_LEVE']}",
            f"- DIFERENCIA_MEDIA: {st['DIFERENCIA_MEDIA']}",
            f"- DIFERENCIA_ALTA: {st['DIFERENCIA_ALTA']}",
            f"- SIN_COMPARACION: {st['SIN_COMPARACION']}",
            f"- error promedio: {st['error_promedio_pct_abs']}",
            f"- error mediano: {st['error_mediano_pct_abs']}",
            f"- diferencia máxima: {st['diferencia_max_pct_abs']}",
        ]

    OUT_MD13.write_text('\n'.join([
        '# 13 - Modelo D XL ByN',
        '',
        '- Modelo C se mantiene como baseline general.',
        '- Se activa corrección lógica XL ByN 1/1: CORRECCION_XL_BYN_1_1_PARENTESIS.',
        '- Recalibración exclusiva del segmento Bajadas Blanco y Negro / XL.',
        '- No afecta A3+, XA3, A4, fullcolor, autoadhesivas, terminaciones, Kraft.',
        '',
        *block('Variante D1 (tipo_papel)', st_d1),
        '',
        *block('Variante D2 (tipo_papel + caras)', st_d2),
        '',
        *(['## Variante D3 (tipo_papel + caras + cantidad_rango)', *block('D3', st_d3)] if execute_d3 else ['## Variante D3', '- No ejecutada: D2 no superó umbral de "muchas altas" definido.']),
        '',
        f"## Variante elegida: {chosen}",
        f"- Factores XL ByN aplicados: {chosen_f}",
    ]), encoding='utf-8')

    OUT_MD14.write_text('\n'.join([
        '# 14 - Comparativa Modelo C vs Modelo D',
        '',
        '## Modelo C (antes)',
        f"- OK: {baseline_stats['OK']}",
        f"- DIFERENCIA_LEVE: {baseline_stats['DIFERENCIA_LEVE']}",
        f"- DIFERENCIA_MEDIA: {baseline_stats['DIFERENCIA_MEDIA']}",
        f"- DIFERENCIA_ALTA: {baseline_stats['DIFERENCIA_ALTA']}",
        f"- SIN_COMPARACION: {baseline_stats['SIN_COMPARACION']}",
        '',
        f"## Modelo D final ({chosen})",
        f"- OK: {chosen_st['OK']}",
        f"- DIFERENCIA_LEVE: {chosen_st['DIFERENCIA_LEVE']}",
        f"- DIFERENCIA_MEDIA: {chosen_st['DIFERENCIA_MEDIA']}",
        f"- DIFERENCIA_ALTA: {chosen_st['DIFERENCIA_ALTA']}",
        f"- SIN_COMPARACION: {chosen_st['SIN_COMPARACION']}",
        '',
        'La comparación refleja que solo se recalibró XL ByN; el resto conserva baseline C.',
    ]), encoding='utf-8')

    print(json.dumps({
        'no_excel_modificado': True,
        'no_pdf_ocr': True,
        'segmento_tocado': 'Bajadas Blanco y Negro / XL',
        'd1': st_d1,
        'd2': st_d2,
        'd3_executed': execute_d3,
        'd3': st_d3,
        'baseline_c': baseline_stats,
        'modelo_d_final': chosen_st,
        'variant_selected': chosen,
        'factors_selected': chosen_f,
        'files': [
            str(OUT_CFG_D), str(OUT_D1), str(OUT_D2), str(OUT_FINAL), str(OUT_MD13), str(OUT_MD14)
        ] + ([str(OUT_D3)] if execute_d3 else []),
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
