import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean, median

import pdfplumber

BASE = Path(__file__).resolve().parents[2]
PDF_PATH = Path(r"C:/Users/baezl/Desktop/proyectos/desgloceExcel/lista-low.pdf")

DATA_DIR = BASE / "data" / "bajadas_v2"
DOCS_DIR = BASE / "docs" / "bajadas_v2"

OBJ_JSON = DATA_DIR / "precios_pdf_objetivo.json"
OBJ_CSV = DATA_DIR / "precios_pdf_objetivo.csv"
CONFIG_JSON = DATA_DIR / "bajadas_v2_config.json"
CMP_JSON = DATA_DIR / "comparativa_bajadas_v2_vs_pdf.json"

DOC01 = DOCS_DIR / "01_modelo_bajadas_v2.md"
DOC02 = DOCS_DIR / "02_comparativa_bajadas_v2_vs_pdf.md"
DOC03 = DOCS_DIR / "03_factores_calibrados.md"
DOC04 = DOCS_DIR / "04_pendientes_y_decisiones.md"

for d in (DATA_DIR, DOCS_DIR):
    d.mkdir(parents=True, exist_ok=True)


def parse_number(tok: str):
    t = tok.strip().replace("$", "")
    t = t.replace(" ", "")
    if not t:
        return None
    if "," in t:
        # decimal comma
        t = t.replace(".", "")
        t = t.replace(",", ".")
        try:
            return float(t)
        except Exception:
            return None
    # thousands dots
    if t.count(".") >= 1:
        parts = t.split(".")
        if all(p.isdigit() for p in parts):
            t = "".join(parts)
    try:
        return float(t)
    except Exception:
        return None


def extract_pages_text(pdf_path, pages_1_based):
    out = {}
    with pdfplumber.open(pdf_path) as pdf:
        for p in pages_1_based:
            out[p] = (pdf.pages[p - 1].extract_text() or "").splitlines()
    return out


def nums_after_label(line, label, expected):
    if label not in line:
        return None
    right = line.split(label, 1)[1]
    toks = re.findall(r"\d+[\.,]?\d*", right)
    vals = []
    for t in toks:
        v = parse_number(t)
        if v is None:
            continue
        vals.append(v)
        if len(vals) == expected:
            break
    return vals if len(vals) == expected else None


def find_line_with(lines, needle):
    for i, l in enumerate(lines):
        if needle in l:
            return i
    return -1

def find_all_lines(lines, needle):
    return [i for i, l in enumerate(lines) if needle in l]


def parse_table(lines, start_needle, end_needle, qty_labels, expected_cols, column_specs):
    si = find_line_with(lines, start_needle)
    if si < 0:
        return []
    ei = find_line_with(lines, end_needle) if end_needle else len(lines)
    if ei < 0:
        ei = len(lines)
    chunk = lines[si:ei]

    rows = []
    for q in qty_labels:
        line_hit = None
        for l in chunk:
            if q in l:
                line_hit = l
                break
        if not line_hit:
            continue
        vals = nums_after_label(line_hit, q, expected_cols)
        if not vals:
            continue
        rows.append((q, vals))

    recs = []
    for q, vals in rows:
        for idx, spec in enumerate(column_specs):
            rec = {
                "cantidad_rango": q,
                "papel": spec.get("papel"),
                "gramaje": spec.get("gramaje"),
                "caras": spec.get("caras"),
                "precio_pdf_objetivo_sin_iva": vals[idx],
            }
            recs.append(rec)
    return recs


def attach_common(records, **kwargs):
    out = []
    for r in records:
        x = dict(r)
        x.update(kwargs)
        out.append(x)
    return out


pages = extract_pages_text(PDF_PATH, [4, 5, 6])

# qty labels
qty_1_1000 = ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500", "501 a 1000"]
qty_1_5000 = ["1", "2 a 50", "51 a 100", "101 a 500", "501 a 1000", "1001 a 5000"]
qty_term = ["0 - 10 u.", "2 a 10 u.", "11 a 50 u.", "51 a 100 u."]

# column specs
cols_liv_fc = [
    {"papel": "A3 150g", "gramaje": "150g", "caras": "4/0"},
    {"papel": "A3 150g", "gramaje": "150g", "caras": "4/4"},
    {"papel": "A3 115g", "gramaje": "115g", "caras": "4/0"},
    {"papel": "A3 115g", "gramaje": "115g", "caras": "4/4"},
    {"papel": "A3 90g", "gramaje": "90g", "caras": "4/0"},
    {"papel": "A3 90g", "gramaje": "90g", "caras": "4/4"},
    {"papel": "A3 80g", "gramaje": "80g", "caras": "4/0"},
    {"papel": "A3 80g", "gramaje": "80g", "caras": "4/4"},
]

cols_heavy_fc = [
    {"papel": "Triplex 350g", "gramaje": "350g", "caras": "4/0"},
    {"papel": "Triplex 350g", "gramaje": "350g", "caras": "4/4"},
    {"papel": "Triplex 300g", "gramaje": "300g", "caras": "4/0"},
    {"papel": "Triplex 300g", "gramaje": "300g", "caras": "4/4"},
    {"papel": "Triplex 200g", "gramaje": "200g", "caras": "4/0"},
    {"papel": "Triplex 200g", "gramaje": "200g", "caras": "4/4"},
    {"papel": "PENDIENTE_REVISION_MANUAL", "gramaje": "PENDIENTE_REVISION_MANUAL", "caras": "4/0"},
    {"papel": "PENDIENTE_REVISION_MANUAL", "gramaje": "PENDIENTE_REVISION_MANUAL", "caras": "4/4"},
]

cols_liv_bn = [
    {"papel": "A3 150g", "gramaje": "150g", "caras": "1/0"},
    {"papel": "A3 150g", "gramaje": "150g", "caras": "1/1"},
    {"papel": "A3 115g", "gramaje": "115g", "caras": "1/0"},
    {"papel": "A3 115g", "gramaje": "115g", "caras": "1/1"},
    {"papel": "A3 90g", "gramaje": "90g", "caras": "1/0"},
    {"papel": "A3 90g", "gramaje": "90g", "caras": "1/1"},
    {"papel": "A3 80g", "gramaje": "80g", "caras": "1/0"},
    {"papel": "A3 80g", "gramaje": "80g", "caras": "1/1"},
]

cols_heavy_bn = [
    {"papel": "Triplex 350g", "gramaje": "350g", "caras": "1/0"},
    {"papel": "Triplex 350g", "gramaje": "350g", "caras": "1/1"},
    {"papel": "Triplex 300g", "gramaje": "300g", "caras": "1/0"},
    {"papel": "Triplex 300g", "gramaje": "300g", "caras": "1/1"},
    {"papel": "Triplex 200g", "gramaje": "200g", "caras": "1/0"},
    {"papel": "Triplex 200g", "gramaje": "200g", "caras": "1/1"},
    {"papel": "PENDIENTE_REVISION_MANUAL", "gramaje": "PENDIENTE_REVISION_MANUAL", "caras": "1/0"},
    {"papel": "PENDIENTE_REVISION_MANUAL", "gramaje": "PENDIENTE_REVISION_MANUAL", "caras": "1/1"},
]

all_records = []

# Page 4 A3+ fullcolor liv/pes
p4 = pages[4]
r = parse_table(p4, "A3+ Papeles Livianos", "Papeles Pesados", qty_1_1000, 8, cols_liv_fc)
all_records += attach_common(r, familia="Bajadas Fullcolor", modo_color="fullcolor", formato="A3+", tipo_papel="liviano", fuente_pdf_pagina=4)

r = parse_table(p4, "Papeles Pesados", "Bajadas Autoadhesivas", qty_1_1000, 8, cols_heavy_fc)
all_records += attach_common(r, familia="Bajadas Fullcolor", modo_color="fullcolor", formato="A3+", tipo_papel="pesado", fuente_pdf_pagina=4)

# Page4 autoadhesivas (3 columns)
auto_cols = [
    {"papel": "Obra/Ilustración", "gramaje": "90g", "caras": "4/0"},
    {"papel": "Autoadhesivo OPP blanco", "gramaje": "PENDIENTE_REVISION_MANUAL", "caras": "4/0"},
    {"papel": "Papel especial tinta blanca/laca UV", "gramaje": "PENDIENTE_REVISION_MANUAL", "caras": "4/0"},
]
qty_auto = ["1 u.", "2 a 25 u.", "26 a 50 u.", "51 a 100 u.", "101 a 300 u.", "301 a 500 u.", "501 a 1000 u."]
r = parse_table(p4, "Bajadas Autoadhesivas", "Terminaciones Bajadas", qty_auto, 3, auto_cols)
for x in r:
    x["cantidad_rango"] = x["cantidad_rango"].replace(" u.", "")
all_records += attach_common(r, familia="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+", tipo_papel="autoadhesivo", fuente_pdf_pagina=4)

# Page4 terminaciones (plasitificado pouch a4/oficio/a3)
term_cols = [
    {"papel": "Plastificado Pouch A4", "gramaje": "N/A", "caras": "N/A"},
    {"papel": "Plastificado Pouch Oficio", "gramaje": "N/A", "caras": "N/A"},
    {"papel": "Plastificado Pouch A3", "gramaje": "N/A", "caras": "N/A"},
]
r = parse_table(p4, "Terminaciones Bajadas", "Los precios detallados", qty_term, 3, term_cols)
for x in r:
    x["cantidad_rango"] = x["cantidad_rango"].replace(" u.", "")
all_records += attach_common(r, familia="Terminaciones Bajadas", modo_color="fullcolor", formato="A3+", tipo_papel="auxiliar", fuente_pdf_pagina=4)

# Page5 XL and A4 fullcolor + kraft
p5 = pages[5]
r = parse_table(p5, "Papeles Livianos", "Papeles Pesados", qty_1_1000, 8, cols_liv_fc)
all_records += attach_common(r, familia="Bajadas Fullcolor", modo_color="fullcolor", formato="XL", tipo_papel="liviano", fuente_pdf_pagina=5)

r = parse_table(p5, "XL Triplex 350g 300g 200g", "Papeles Livianos Precios sin IVA", qty_1_1000, 8, cols_heavy_fc)
all_records += attach_common(r, familia="Bajadas Fullcolor", modo_color="fullcolor", formato="XL", tipo_papel="pesado", fuente_pdf_pagina=5)

r = parse_table(p5, "A4 150g 115g 90g 80g", "Papeles Pesados Precios sin IVA", qty_1_1000, 8, cols_liv_fc)
all_records += attach_common(r, familia="Bajadas Fullcolor", modo_color="fullcolor", formato="A4", tipo_papel="liviano", fuente_pdf_pagina=5)

r = parse_table(p5, "A4 Triplex 350g 300g 200g", "A3 Kraft", qty_1_1000, 8, cols_heavy_fc)
all_records += attach_common(r, familia="Bajadas Fullcolor", modo_color="fullcolor", formato="A4", tipo_papel="pesado", fuente_pdf_pagina=5)

kraft_cols = [
    {"papel": "Kraft 80g", "gramaje": "80g", "caras": "1/0"},
    {"papel": "Kraft 80g", "gramaje": "80g", "caras": "1/1"},
    {"papel": "Kraft 200g", "gramaje": "200g", "caras": "1/0"},
    {"papel": "Kraft 200g", "gramaje": "200g", "caras": "1/1"},
    {"papel": "Kraft 80g", "gramaje": "80g", "caras": "4/0"},
    {"papel": "Kraft 80g", "gramaje": "80g", "caras": "4/4"},
    {"papel": "Kraft 200g", "gramaje": "200g", "caras": "4/0"},
    {"papel": "Kraft 200g", "gramaje": "200g", "caras": "4/4"},
]
qty_kraft = ["1", "2 a 25", "26 a 50", "51 a 100", "101 a 300", "301 a 500"]
r = parse_table(p5, "A3 Kraft", "Los precios detallados", qty_kraft, 8, kraft_cols)
all_records += attach_common(r, familia="Bajadas Fullcolor", modo_color="fullcolor", formato="Kraft", tipo_papel="kraft", fuente_pdf_pagina=5)

# Page6 blanco y negro A3+/XL/A4 + autoadhesivo
p6 = pages[6]

# A3+ livianos BN with extra 2 columns autoadhesivo (10 nums)
bn_liv_10_cols = cols_liv_bn + [
    {"papel": "Autoadhesivo Papel", "gramaje": "PENDIENTE_REVISION_MANUAL", "caras": "1/0"},
    {"papel": "Autoadhesivo Opp", "gramaje": "PENDIENTE_REVISION_MANUAL", "caras": "1/0"},
]
# p6 blocks by explicit occurrence slicing (more robust with repeated headers)
idx_pesados_all = find_all_lines(p6, "Papeles Pesados")
idx_a3_triplex_all = find_all_lines(p6, "A3+ Triplex 350g 300g 200g")
idx_xl_header_all = find_all_lines(p6, "XL A3+ 150g 115g 90g 80g")
idx_a4_header_all = find_all_lines(p6, "A4 A3+ 150g 115g 90g 80g")
idx_normal = find_line_with(p6, "Normal")
idx_promos = find_line_with(p6, "Promociones válidas")

# A3+ liviano BN
start_a3_liv = find_line_with(p6, "A3+ 150g 115g 90g 80g Autoadhesivo")
end_a3_liv = idx_pesados_all[0] if idx_pesados_all else len(p6)
r = parse_table(p6[start_a3_liv:end_a3_liv], "A3+ 150g 115g 90g 80g Autoadhesivo", "", qty_1_5000, 10, bn_liv_10_cols)
main_bn = []
auto_bn = []
for x in r:
    if x["papel"].startswith("Autoadhesivo"):
        auto_bn.append(x)
    else:
        main_bn.append(x)
all_records += attach_common(main_bn, familia="Bajadas Blanco y Negro", modo_color="blanco_y_negro", formato="A3+", tipo_papel="liviano", fuente_pdf_pagina=6)
all_records += attach_common(auto_bn, familia="Bajadas Blanco y Negro", modo_color="blanco_y_negro", formato="A3+", tipo_papel="autoadhesivo", fuente_pdf_pagina=6)

# A3+ pesado BN (first A3+ Triplex block until Normal)
start_a3_pes = idx_a3_triplex_all[0] if idx_a3_triplex_all else -1
end_a3_pes = idx_normal if idx_normal > 0 else len(p6)
r = parse_table(p6[start_a3_pes:end_a3_pes], "A3+ Triplex 350g 300g 200g", "", qty_1_5000, 8, cols_heavy_bn)
all_records += attach_common(r, familia="Bajadas Blanco y Negro", modo_color="blanco_y_negro", formato="A3+", tipo_papel="pesado", fuente_pdf_pagina=6)

# XL liviano BN (XL header to second Papeles Pesados)
start_xl_liv = idx_xl_header_all[0] if idx_xl_header_all else -1
end_xl_liv = idx_pesados_all[1] if len(idx_pesados_all) > 1 else len(p6)
r = parse_table(p6[start_xl_liv:end_xl_liv], "XL A3+ 150g 115g 90g 80g", "", qty_1_5000, 8, cols_liv_bn)
all_records += attach_common(r, familia="Bajadas Blanco y Negro", modo_color="blanco_y_negro", formato="XL", tipo_papel="liviano", fuente_pdf_pagina=6)

# XL pesado BN (second A3+ Triplex after XL until A4 header)
start_xl_pes = idx_a3_triplex_all[1] if len(idx_a3_triplex_all) > 1 else -1
end_xl_pes = idx_a4_header_all[0] if idx_a4_header_all else len(p6)
r = parse_table(p6[start_xl_pes:end_xl_pes], "A3+ Triplex 350g 300g 200g", "", qty_1_5000, 8, cols_heavy_bn)
all_records += attach_common(r, familia="Bajadas Blanco y Negro", modo_color="blanco_y_negro", formato="XL", tipo_papel="pesado", fuente_pdf_pagina=6)

# A4 liviano BN
start_a4_liv = idx_a4_header_all[0] if idx_a4_header_all else -1
idx_a4_pes_header = find_line_with(p6, "Papeles Pesados Precios sin IVA")
end_a4_liv = idx_a4_pes_header if idx_a4_pes_header > 0 else len(p6)
r = parse_table(p6[start_a4_liv:end_a4_liv], "A4 A3+ 150g 115g 90g 80g", "", qty_1_5000, 8, cols_liv_bn)
all_records += attach_common(r, familia="Bajadas Blanco y Negro", modo_color="blanco_y_negro", formato="A4", tipo_papel="liviano", fuente_pdf_pagina=6)

# A4 pesado BN (third A3+ Triplex block to promos)
start_a4_pes = idx_a3_triplex_all[2] if len(idx_a3_triplex_all) > 2 else -1
end_a4_pes = idx_promos if idx_promos > 0 else len(p6)
r = parse_table(p6[start_a4_pes:end_a4_pes], "A3+ Triplex 350g 300g 200g", "", qty_1_5000, 8, cols_heavy_bn)
all_records += attach_common(r, familia="Bajadas Blanco y Negro", modo_color="blanco_y_negro", formato="A4", tipo_papel="pesado", fuente_pdf_pagina=6)

# clean potential duplicates by key
unique = {}
for r in all_records:
    key = (r["familia"], r["modo_color"], r["formato"], r["tipo_papel"], r["papel"], r["gramaje"], r["cantidad_rango"], r["caras"], r["fuente_pdf_pagina"])
    unique[key] = r
records = list(unique.values())

# save objective
OBJ_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

with OBJ_CSV.open("w", newline="", encoding="utf-8-sig") as f:
    fields = [
        "familia", "modo_color", "formato", "tipo_papel", "papel", "gramaje", "cantidad_rango", "caras", "precio_pdf_objetivo_sin_iva", "fuente_pdf_pagina"
    ]
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    for r in records:
        w.writerow(r)

# ---- calibracion ----
# build map by base key for A3+
def key_base(x):
    return (x["modo_color"], x["tipo_papel"], x["papel"], x["gramaje"], x["cantidad_rango"], x["caras"])

base_a3 = {key_base(r): r for r in records if r["formato"] == "A3+" and r["familia"] in ("Bajadas Fullcolor", "Bajadas Blanco y Negro")}

ratios_xl = []
ratios_a4 = []
ratios_xl_by_mode = defaultdict(list)
ratios_a4_by_mode = defaultdict(list)
for r in records:
    if r["formato"] not in ("XL", "A4"):
        continue
    k = key_base(r)
    b = base_a3.get(k)
    if not b:
        continue
    bval = float(b["precio_pdf_objetivo_sin_iva"])
    tval = float(r["precio_pdf_objetivo_sin_iva"])
    if bval > 0:
        ratio = tval / bval
        if r["formato"] == "XL":
            ratios_xl.append(ratio)
            ratios_xl_by_mode[r["modo_color"]].append(ratio)
        else:
            ratios_a4.append(ratio)
            ratios_a4_by_mode[r["modo_color"]].append(ratio)

factor_xl = round(median(ratios_xl), 6) if ratios_xl else None
factor_a4 = round(median(ratios_a4), 6) if ratios_a4 else None
factor_xl_por_modo = {k: round(median(v), 6) for k, v in ratios_xl_by_mode.items() if v}
factor_a4_por_modo = {k: round(median(v), 6) for k, v in ratios_a4_by_mode.items() if v}
factor_xa3 = 1.10
factor_dolar = 1410 / 650

config = {
    "dolar_anterior_excel": 650,
    "dolar_actual": 1410,
    "factor_dolar": round(factor_dolar, 9),
    "iva_incluido": False,
    "base_formato": "A3+",
    "factor_xa3": factor_xa3,
    "factor_xl": factor_xl if factor_xl is not None else "PENDIENTE_CALIBRACION",
    "factor_a4": factor_a4 if factor_a4 is not None else "PENDIENTE_CALIBRACION",
    "factor_xl_por_modo_color": factor_xl_por_modo if factor_xl_por_modo else "PENDIENTE_CALIBRACION",
    "factor_a4_por_modo_color": factor_a4_por_modo if factor_a4_por_modo else "PENDIENTE_CALIBRACION",
    "recargos_urgencia": {
        "normal": 0,
        "express": 0.15,
        "super_express": 0.30,
        "ya_24hs": 0.50,
    },
    "redondeo": {
        "tipo": "comercial",
        "unidad": "configurable",
    },
    "notas": [
        "Fuente de verdad: PDF lista-low.pdf páginas 4,5,6.",
        "XA3 se deriva de A3+ con +10% fijo.",
        "XL y A4 calibrados por mediana de razón contra A3+ en pares comparables.",
    ],
}
CONFIG_JSON.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")

# comparativa v2 vs pdf
comparativa = []
for r in records:
    formato = r["formato"]
    modo = r["modo_color"]
    fam = r["familia"]
    key = key_base(r)
    base = base_a3.get(key)

    est = None
    motivo = None
    if formato == "A3+":
        est = float(r["precio_pdf_objetivo_sin_iva"])
    elif formato == "XA3":
        if base:
            est = float(base["precio_pdf_objetivo_sin_iva"]) * factor_xa3
    elif formato == "XL" and base and factor_xl:
        fxl = factor_xl_por_modo.get(modo, factor_xl)
        est = float(base["precio_pdf_objetivo_sin_iva"]) * fxl
    elif formato == "A4" and base and factor_a4:
        fa4 = factor_a4_por_modo.get(modo, factor_a4)
        est = float(base["precio_pdf_objetivo_sin_iva"]) * fa4
    else:
        motivo = "SIN_COMPARACION_POR_FALTA_DE_BASE_O_FACTOR"

    target = float(r["precio_pdf_objetivo_sin_iva"])
    if est is None:
        diff_abs = None
        diff_pct = None
        estado = "SIN_COMPARACION"
    else:
        diff_abs = est - target
        diff_pct = (diff_abs / target) * 100 if target else None
        ad = abs(diff_pct) if diff_pct is not None else None
        if ad is None:
            estado = "SIN_COMPARACION"
        elif ad <= 2:
            estado = "OK"
        elif ad <= 5:
            estado = "DIFERENCIA_LEVE"
        elif ad <= 10:
            estado = "DIFERENCIA_MEDIA"
        else:
            estado = "DIFERENCIA_ALTA"

    comparativa.append({
        **r,
        "precio_v2_estimado": round(est, 4) if est is not None else None,
        "diferencia_absoluta": round(diff_abs, 4) if diff_abs is not None else None,
        "diferencia_porcentual": round(diff_pct, 4) if diff_pct is not None else None,
        "estado": estado,
        "motivo_sin_comparacion": motivo,
    })

CMP_JSON.write_text(json.dumps(comparativa, ensure_ascii=False, indent=2), encoding="utf-8")

# stats
comp_vals = [x for x in comparativa if x["estado"] != "SIN_COMPARACION" and x["diferencia_porcentual"] is not None]
avg_diff = mean(abs(x["diferencia_porcentual"]) for x in comp_vals) if comp_vals else None
state_counts = Counter(x["estado"] for x in comparativa)

# docs
DOC01.write_text(
    "\n".join([
        "# 01 - Modelo Bajadas v2",
        "",
        "## Principios",
        "- Fuente de verdad de precio final: PDF actualizado (págs. 4-6).",
        "- Excel histórico: referencia de lógica, no copia 1:1.",
        "- Base de cálculo: A3+.",
        f"- XA3 derivado: A3+ * {factor_xa3}.",
        f"- XL derivado: A3+ * {factor_xl if factor_xl is not None else 'PENDIENTE_CALIBRACION'}.",
        f"- A4 derivado: A3+ * {factor_a4 if factor_a4 is not None else 'PENDIENTE_CALIBRACION'}.",
        f"- XL por modo color: {factor_xl_por_modo if factor_xl_por_modo else 'PENDIENTE_CALIBRACION'}.",
        f"- A4 por modo color: {factor_a4_por_modo if factor_a4_por_modo else 'PENDIENTE_CALIBRACION'}.",
        "",
        "## Dólar e insumos",
        f"- Dólar histórico Excel: 650.",
        f"- Dólar actual: 1410.",
        f"- Factor dólar: {round(factor_dolar,9)}.",
        "- El impacto del dólar se considera transversal para insumos dolarizados (papel, laminado, laca y otros).",
        "",
        "## Recargos de urgencia (sobre precio final, sin IVA)",
        "- Normal 5/7 días: +0%",
        "- Express 3/4 días: +15%",
        "- Super Express 48hs: +30%",
        "- YA 24hs: +50%",
        "",
        "## Nota",
        "- Si el PDF no permite extraer algo con seguridad, se marca PENDIENTE_REVISION_MANUAL.",
    ]),
    encoding="utf-8",
)

DOC02.write_text(
    "\n".join([
        "# 02 - Comparativa Bajadas v2 vs PDF",
        "",
        f"- Registros objetivos extraídos: {len(records)}",
        f"- Registros comparables: {len(comp_vals)}",
        f"- Promedio de diferencia absoluta %: {round(avg_diff,4) if avg_diff is not None else 'N/A'}",
        "",
        "## Estados",
        f"- OK: {state_counts.get('OK',0)}",
        f"- DIFERENCIA_LEVE: {state_counts.get('DIFERENCIA_LEVE',0)}",
        f"- DIFERENCIA_MEDIA: {state_counts.get('DIFERENCIA_MEDIA',0)}",
        f"- DIFERENCIA_ALTA: {state_counts.get('DIFERENCIA_ALTA',0)}",
        f"- SIN_COMPARACION: {state_counts.get('SIN_COMPARACION',0)}",
        "",
        "Ver detalle completo en data/bajadas_v2/comparativa_bajadas_v2_vs_pdf.json.",
    ]),
    encoding="utf-8",
)

DOC03.write_text(
    "\n".join([
        "# 03 - Factores Calibrados",
        "",
        f"- factor_dolar: {round(factor_dolar,9)}",
        f"- factor_xa3 (fijo): {factor_xa3}",
        f"- factor_xl (propuesto): {factor_xl if factor_xl is not None else 'PENDIENTE_CALIBRACION'}",
        f"- factor_a4 (propuesto): {factor_a4 if factor_a4 is not None else 'PENDIENTE_CALIBRACION'}",
        f"- factor_xl_por_modo_color: {factor_xl_por_modo if factor_xl_por_modo else 'PENDIENTE_CALIBRACION'}",
        f"- factor_a4_por_modo_color: {factor_a4_por_modo if factor_a4_por_modo else 'PENDIENTE_CALIBRACION'}",
        "",
        "## Método",
        "- Se tomó A3+ como base.",
        "- Para XL y A4 se calculó la razón (precio_pdf_formato / precio_pdf_A3+) en pares comparables.",
        "- Se propuso el factor por mediana para robustez ante outliers.",
    ]),
    encoding="utf-8",
)

pending = []
if PDF_PATH.name != "lista-low(1).pdf":
    pending.append("PENDIENTE_REVISION_MANUAL: El archivo encontrado es lista-low.pdf; validar si reemplaza a lista-low(1).pdf.")
pending.append("PENDIENTE_REVISION_MANUAL: Algunas columnas en papeles pesados incluyen un cuarto bloque no etiquetado claramente en OCR.")
pending.append("PENDIENTE_REVISION_MANUAL: Terminaciones (laminado/plastificado) parcialmente legibles; verificar tabla completa visualmente.")
pending.append("PENDIENTE_REVISION_MANUAL: Kraft contiene combinaciones 1/0,1/1,4/0,4/4 en un mismo bloque; requiere validación comercial final.")

DOC04.write_text(
    "\n".join([
        "# 04 - Pendientes y Decisiones",
        "",
        *[f"- {x}" for x in pending],
        "",
        "## Decisiones sugeridas",
        "- Confirmar PDF fuente final vigente.",
        "- Validar columnas ambiguas antes de cerrar factores finales.",
        "- Ajustar manualmente factor_xl y factor_a4 por segmento si los errores altos no son aceptables.",
    ]),
    encoding="utf-8",
)

familias = sorted(set(r["familia"] for r in records))
formatos = sorted(set(r["formato"] for r in records))

print(json.dumps({
    "status": "ok",
    "pdf_used": str(PDF_PATH),
    "records_extracted": len(records),
    "familias": familias,
    "formatos": formatos,
    "factor_dolar": round(factor_dolar,9),
    "factor_xa3": factor_xa3,
    "factor_xl": factor_xl,
    "factor_a4": factor_a4,
    "avg_diff_pct_abs": round(avg_diff,4) if avg_diff is not None else None,
    "state_counts": dict(state_counts),
    "files": [
        str(OBJ_JSON),
        str(OBJ_CSV),
        str(CONFIG_JSON),
        str(CMP_JSON),
        str(DOC01),
        str(DOC02),
        str(DOC03),
        str(DOC04),
    ],
}, ensure_ascii=False, indent=2))
