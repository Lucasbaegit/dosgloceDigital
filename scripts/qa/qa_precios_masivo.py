#!/usr/bin/env python
from __future__ import annotations

import argparse
import csv
import json
import math
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib import error, request


DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_TIMEOUT = 10.0
DEFAULT_TOLERANCE = 0.01


def _post_json(base_url: str, endpoint: str, payload: dict, timeout_s: float) -> tuple[int, dict]:
    url = f"{base_url.rstrip('/')}{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with request.urlopen(req, timeout=timeout_s) as resp:
            return int(resp.status), json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        try:
            body = json.loads(exc.read().decode("utf-8"))
        except Exception:
            body = {"error": "http_error", "detail": str(exc)}
        return int(exc.code), body


def _get_json(base_url: str, endpoint: str, timeout_s: float) -> tuple[int, dict]:
    url = f"{base_url.rstrip('/')}{endpoint}"
    req = request.Request(url, method="GET")
    with request.urlopen(req, timeout=timeout_s) as resp:
        return int(resp.status), json.loads(resp.read().decode("utf-8"))


def _approx_equal(a: float, b: float, tol: float) -> bool:
    return math.isclose(float(a), float(b), abs_tol=tol, rel_tol=0.0)


def _get_path(data: dict, dotted_key: str):
    current = data
    for part in dotted_key.split("."):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def build_cases() -> list[dict]:
    c = []

    # BAJADAS/KRAFT
    c.append({
        "id": "BAJ-001", "grupo": "bajadas", "nombre": "Kraft 80g 4/0 cantidad 1",
        "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "expected_total_sin_iva": 782,
        "payload": {"categoria": "Bajadas Kraft", "modo_color": "fullcolor", "formato": "A3", "tipo_papel": "kraft", "material": "Kraft", "gramaje": "80g", "cantidad_unidades": 1, "cantidad_rango": "1", "caras": "4/0", "urgencia": "normal", "adicional_laminado": "sin_adicional"},
    })
    c.append({
        "id": "BAJ-002", "grupo": "bajadas", "nombre": "Kraft 80g 4/0 cantidad 100 sin troquelado",
        "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "expected_total_sin_iva": 56900,
        "payload": {"categoria": "Bajadas Kraft", "modo_color": "fullcolor", "formato": "A3", "tipo_papel": "kraft", "material": "Kraft", "gramaje": "80g", "cantidad_unidades": 100, "cantidad_rango": "51 a 100", "caras": "4/0", "urgencia": "normal", "adicional_laminado": "sin_adicional"},
    })
    c.append({
        "id": "BAJ-003", "grupo": "bajadas", "nombre": "Kraft 80g 4/0 cantidad 100 con troquelado simple",
        "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "expected_total_sin_iva": 83500,
        "checks": {"total_adicional_troquelado_sin_iva": 26600},
        "payload": {"categoria": "Bajadas Kraft", "modo_color": "fullcolor", "formato": "A3", "tipo_papel": "kraft", "material": "Kraft", "gramaje": "80g", "cantidad_unidades": 100, "cantidad_rango": "51 a 100", "caras": "4/0", "urgencia": "normal", "adicional_laminado": "sin_adicional", "adicional_troquelado": True, "complejidad_troquelado": "simple"},
    })
    c.append({
        "id": "BAJ-004", "grupo": "bajadas", "nombre": "Bajadas Fullcolor A3+ liviano laca una cara",
        "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "expected_total_sin_iva": 38584,
        "checks": {"precio_unitario_base_sin_iva": 622, "adicional_unitario_sin_iva": 106, "total_adicional_sin_iva": 5618, "total_adicional_con_urgencia": 5618},
        "payload": {"categoria": "Bajadas Fullcolor", "modo_color": "fullcolor", "formato": "A3+", "tipo_papel": "liviano", "material": "Ilustracion", "gramaje": "150g", "cantidad_unidades": 53, "cantidad_rango": "51 a 100", "caras": "4/0", "urgencia": "normal", "adicional_laminado": "laca", "caras_adicional_laminado": 1, "adicional_troquelado": False},
    })
    c.append({
        "id": "BAJ-005", "grupo": "bajadas", "nombre": "Bajadas Fullcolor A3+ liviano laca dos caras",
        "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "expected_total_sin_iva": 44202,
        "checks": {"total_adicional_sin_iva": 11236},
        "payload": {"categoria": "Bajadas Fullcolor", "modo_color": "fullcolor", "formato": "A3+", "tipo_papel": "liviano", "material": "Ilustracion", "gramaje": "150g", "cantidad_unidades": 53, "cantidad_rango": "51 a 100", "caras": "4/0", "urgencia": "normal", "adicional_laminado": "laca", "caras_adicional_laminado": 2, "adicional_troquelado": False},
    })
    for case_id, adicional, nombre in [
        ("BAJ-006", "laminado_brillo", "Liviano con laminado brillo bloqueado"),
        ("BAJ-007", "laminado_mate", "Liviano con laminado mate bloqueado"),
    ]:
        c.append({
            "id": case_id, "grupo": "bajadas", "nombre": nombre, "endpoint": "/bajadas-v2/cotizar",
            "expected_status": 400, "expected_error": "adicional_no_soportado_para_liviano",
            "payload": {"categoria": "Bajadas Fullcolor", "modo_color": "fullcolor", "formato": "A3+", "tipo_papel": "liviano", "material": "Ilustracion", "gramaje": "150g", "cantidad_unidades": 53, "cantidad_rango": "51 a 100", "caras": "4/0", "urgencia": "normal", "adicional_laminado": adicional},
        })
    c.append({
        "id": "BAJ-008", "grupo": "bajadas", "nombre": "Liviano con plastificado bloqueado",
        "endpoint": "/bajadas-v2/cotizar", "expected_status": 400, "expected_error": "adicional_no_soportado_para_liviano",
        "payload": {"categoria": "Bajadas Fullcolor", "modo_color": "fullcolor", "formato": "A3+", "tipo_papel": "liviano", "material": "Ilustracion", "gramaje": "150g", "cantidad_unidades": 53, "cantidad_rango": "51 a 100", "caras": "4/0", "urgencia": "normal", "adicional_laminado": "sin_adicional", "adicional_plastificado": True},
    })

    # AUTOADHESIVAS
    base_auto = {"categoria": "Bajadas Autoadhesivas", "modo_color": "fullcolor", "formato": "A3+", "tipo_papel": "especial", "material": "OPP blanco", "gramaje": "N/A", "cantidad_unidades": 30, "cantidad_rango": "26 a 50", "caras": "4/0", "urgencia": "normal", "tipo_producto": "autoadhesiva", "columna_precio": "especial"}
    c.append({"id": "AUTO-001", "grupo": "autoadhesivas", "nombre": "Autoadhesiva sin adicionales", "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "checks": {"adicional_laminado": "sin_adicional"}, "payload": {**base_auto, "adicional_laca_uv": False, "adicional_tinta_blanca": False}})
    c.append({"id": "AUTO-002", "grupo": "autoadhesivas", "nombre": "Autoadhesiva con Laca UV", "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "checks": {"adicional_unitario_sin_iva": 116, "total_adicional_sin_iva": 3480}, "payload": {**base_auto, "adicional_laca_uv": True, "adicional_tinta_blanca": False}})
    c.append({"id": "AUTO-003", "grupo": "autoadhesivas", "nombre": "Autoadhesiva con Tinta Blanca", "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "checks": {"adicional_unitario_sin_iva": 603, "total_adicional_sin_iva": 18090}, "payload": {**base_auto, "adicional_laca_uv": False, "adicional_tinta_blanca": True}})
    c.append({"id": "AUTO-004", "grupo": "autoadhesivas", "nombre": "Autoadhesiva Laca + Tinta Blanca", "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "checks": {"total_adicional_sin_iva": 21570}, "payload": {**base_auto, "adicional_laca_uv": True, "adicional_tinta_blanca": True}})
    c.append({"id": "AUTO-005", "grupo": "autoadhesivas", "nombre": "Legacy laca duplicada no duplica", "endpoint": "/bajadas-v2/cotizar", "expected_status": 200, "checks": {"total_adicional_sin_iva": 3480}, "payload": {**base_auto, "adicional_laminado": "laca", "adicional_laca_uv": True, "adicional_tinta_blanca": False}})
    c.append({"id": "AUTO-006", "grupo": "autoadhesivas", "nombre": "Autoadhesiva con laminado por lado bloquea", "endpoint": "/bajadas-v2/cotizar", "expected_status": 400, "expected_error": "adicional_no_soportado_para_autoadhesivas", "payload": {**base_auto, "adicional_laminado_por_lado": "laminado_brillo_por_lado"}})
    c.append({"id": "AUTO-007", "grupo": "autoadhesivas", "nombre": "Autoadhesiva con plastificado bloquea", "endpoint": "/bajadas-v2/cotizar", "expected_status": 400, "expected_error": "adicional_no_soportado_para_autoadhesivas", "payload": {**base_auto, "adicional_plastificado": True}})

    # TARJETAS 9x5
    base_t9 = {"categoria": "Tarjetas Personales", "producto": "9x5", "formato": "9x5", "terminacion": "sin_laminar", "caras": "4/0", "cantidad_unidades": 100, "terminaciones_extra": {"puntas_redondeadas": False, "agujerado": False}, "urgencia": "normal"}
    c.append({"id": "TAR-001", "grupo": "tarjetas", "nombre": "Tarjetas 9x5 300g base", "endpoint": "/tarjetas-9x5/cotizar", "expected_status": 200, "expected_total_sin_iva": 5139, "payload": {**base_t9, "papel": "300g Ilustracion", "gramaje": "300g"}})
    c.append({"id": "TAR-002", "grupo": "tarjetas", "nombre": "Tarjetas 9x5 350g +10%", "endpoint": "/tarjetas-9x5/cotizar", "expected_status": 200, "expected_total_sin_iva": 5652.9, "payload": {**base_t9, "papel": "350g Ilustracion", "gramaje": "350g"}})
    c.append({"id": "TAR-003", "grupo": "tarjetas", "nombre": "Tarjetas 9x5 1000 mate 4/4", "endpoint": "/tarjetas-9x5/cotizar", "expected_status": 200, "expected_total_sin_iva": 48401, "payload": {"categoria": "Tarjetas Personales", "producto": "9x5", "formato": "9x5", "papel": "300g Ilustracion", "gramaje": "300g", "terminacion": "laminado_mate", "caras": "4/4", "cantidad_unidades": 1000, "terminaciones_extra": {"puntas_redondeadas": False, "agujerado": False}, "urgencia": "normal"}})
    c.append({"id": "TAR-004", "grupo": "tarjetas", "nombre": "Tarjetas 9x5 puntas redondeadas bloqueado", "endpoint": "/tarjetas-9x5/cotizar", "expected_status": 400, "expected_error": "terminacion_extra_bloqueada_por_falta_de_datos", "payload": {**base_t9, "papel": "300g Ilustracion", "gramaje": "300g", "terminaciones_extra": {"puntas_redondeadas": True, "agujerado": False}}})
    c.append({"id": "TAR-005", "grupo": "tarjetas", "nombre": "Tarjetas 9x5 agujerado bloqueado", "endpoint": "/tarjetas-9x5/cotizar", "expected_status": 400, "expected_error": "terminacion_extra_bloqueada_por_falta_de_datos", "payload": {**base_t9, "papel": "300g Ilustracion", "gramaje": "300g", "terminaciones_extra": {"puntas_redondeadas": False, "agujerado": True}}})

    # POSTALES
    base_post = {"categoria": "Tarjetas Postales", "producto": "postal", "formato": "postal", "terminacion": "sin_laminar", "caras": "4/0", "cantidad_unidades": 100, "terminaciones_extra": {"puntas_redondeadas": False, "agujerado": False}, "urgencia": "normal"}
    c.append({"id": "POST-001", "grupo": "tarjetas", "nombre": "Postales 300g base", "endpoint": "/tarjetas-postales/cotizar", "expected_status": 200, "expected_total_sin_iva": 10932, "payload": {**base_post, "papel": "300g Ilustracion", "gramaje": "300g"}})
    c.append({"id": "POST-002", "grupo": "tarjetas", "nombre": "Postales 350g +10%", "endpoint": "/tarjetas-postales/cotizar", "expected_status": 200, "expected_total_sin_iva": 12025.2, "payload": {**base_post, "papel": "350g Ilustracion", "gramaje": "350g"}})
    c.append({"id": "POST-003", "grupo": "tarjetas", "nombre": "Postales 1000 mate 4/4", "endpoint": "/tarjetas-postales/cotizar", "expected_status": 200, "expected_total_sin_iva": 136795, "payload": {"categoria": "Tarjetas Postales", "producto": "postal", "formato": "postal", "papel": "300g Ilustracion", "gramaje": "300g", "terminacion": "laminado_mate", "caras": "4/4", "cantidad_unidades": 1000, "terminaciones_extra": {"puntas_redondeadas": False, "agujerado": False}, "urgencia": "normal"}})

    # FOLLETOS
    c.append({"id": "FOL-001", "grupo": "folletos", "nombre": "Folletos A4 80g grises 1000", "endpoint": "/folletos/cotizar", "expected_status": 200, "expected_total_sin_iva": 119247, "payload": {"categoria": "Folletos", "producto": "folleto", "formato": "A4", "papel": "80g Ilustracion", "gramaje": "80g", "modo_color": "escala_grises", "caras": "1/1", "cantidad_unidades": 1000, "urgencia": "normal"}})
    c.append({"id": "FOL-002", "grupo": "folletos", "nombre": "Folletos 10x15 150g fullcolor 100", "endpoint": "/folletos/cotizar", "expected_status": 200, "expected_total_sin_iva": 8445, "payload": {"categoria": "Folletos", "producto": "folleto", "formato": "10x15", "papel": "150g Ilustracion", "gramaje": "150g", "modo_color": "fullcolor", "caras": "4/0", "cantidad_unidades": 100, "urgencia": "normal"}})
    c.append({"id": "FOL-003", "grupo": "folletos", "nombre": "Folletos 10x10 150g fullcolor 100", "endpoint": "/folletos/cotizar", "expected_status": 200, "expected_total_sin_iva": 6496, "payload": {"categoria": "Folletos", "producto": "folleto", "formato": "10x10", "papel": "150g Ilustracion", "gramaje": "150g", "modo_color": "fullcolor", "caras": "4/0", "cantidad_unidades": 100, "urgencia": "normal"}})

    # CARPETAS
    c.append({"id": "CARP-001", "grupo": "carpetas", "nombre": "Carpetas 1 sin laminar 4/0 sin solapa", "endpoint": "/carpetas/cotizar", "expected_status": 200, "expected_total_sin_iva": 1762, "payload": {"categoria": "Carpetas", "producto": "carpeta_a4", "formato": "A4", "papel": "300g Ilustracion", "gramaje": "300g", "terminacion": "sin_laminar", "caras": "4/0", "cantidad_unidades": 1, "solapa_impresa": False, "urgencia": "normal"}})
    c.append({"id": "CARP-002", "grupo": "carpetas", "nombre": "Carpetas 1 sin laminar 4/0 con solapa", "endpoint": "/carpetas/cotizar", "expected_status": 200, "expected_total_sin_iva": 2017, "payload": {"categoria": "Carpetas", "producto": "carpeta_a4", "formato": "A4", "papel": "300g Ilustracion", "gramaje": "300g", "terminacion": "sin_laminar", "caras": "4/0", "cantidad_unidades": 1, "solapa_impresa": True, "urgencia": "normal"}})
    c.append({"id": "CARP-003", "grupo": "carpetas", "nombre": "Carpetas 100 laca 4/4 con solapa", "endpoint": "/carpetas/cotizar", "expected_status": 200, "expected_total_sin_iva": 187100, "payload": {"categoria": "Carpetas", "producto": "carpeta_a4", "formato": "A4", "papel": "300g Ilustracion", "gramaje": "300g", "terminacion": "laca_uv", "caras": "4/4", "cantidad_unidades": 100, "solapa_impresa": True, "urgencia": "normal"}})

    # SOBRES
    c.append({"id": "SOB-001", "grupo": "sobres", "nombre": "Sobres 100 bolsa A4", "endpoint": "/sobres/cotizar", "expected_status": 200, "expected_total_sin_iva": 63300, "payload": {"categoria": "Sobres", "producto": "sobre", "tipo_sobre": "sobre_bolsa_a4_22_9x32_4", "papel": "63g", "color": "blanco", "caras": "4/0", "cantidad_unidades": 100, "urgencia": "normal"}})
    c.append({"id": "SOB-002", "grupo": "sobres", "nombre": "Sobres 1000 bolsa 27x37", "endpoint": "/sobres/cotizar", "expected_status": 200, "expected_total_sin_iva": 536000, "payload": {"categoria": "Sobres", "producto": "sobre", "tipo_sobre": "sobre_bolsa_27x37", "papel": "63g", "color": "blanco", "caras": "4/0", "cantidad_unidades": 1000, "urgencia": "normal"}})

    # STICKERS RECTO
    c.append({"id": "ST-RECT-001", "grupo": "stickers", "nombre": "Stickers recto 100 6x4 sin laca", "endpoint": "/stickers-corte-recto/cotizar", "expected_status": 200, "expected_total_sin_iva": 2765, "payload": {"categoria": "Stickers Corte Recto", "producto": "sticker_corte_recto", "formato": "6x4", "terminacion": "sin_laca_uv", "cantidad_unidades": 100, "urgencia": "normal"}})
    c.append({"id": "ST-RECT-002", "grupo": "stickers", "nombre": "Stickers recto 1000 10x7 con laca", "endpoint": "/stickers-corte-recto/cotizar", "expected_status": 200, "expected_total_sin_iva": 61703, "payload": {"categoria": "Stickers Corte Recto", "producto": "sticker_corte_recto", "formato": "10x7", "terminacion": "con_laca_uv", "cantidad_unidades": 1000, "urgencia": "normal"}})

    # IMANES RECTO
    c.append({"id": "IM-RECT-001", "grupo": "imanes", "nombre": "Imanes recto 100 6x4 sin laca", "endpoint": "/imanes-corte-recto/cotizar", "expected_status": 200, "expected_total_sin_iva": 7526, "payload": {"categoria": "Imanes Corte Recto", "producto": "iman_corte_recto", "formato": "6x4", "papel": "300g Ilustracion", "gramaje": "300g", "terminacion": "sin_laca_uv", "cantidad_unidades": 100, "urgencia": "normal"}})
    c.append({"id": "IM-RECT-002", "grupo": "imanes", "nombre": "Imanes recto 1000 10x7 con laca", "endpoint": "/imanes-corte-recto/cotizar", "expected_status": 200, "expected_total_sin_iva": 153680, "payload": {"categoria": "Imanes Corte Recto", "producto": "iman_corte_recto", "formato": "10x7", "papel": "300g Ilustracion", "gramaje": "300g", "terminacion": "con_laca_uv", "cantidad_unidades": 1000, "urgencia": "normal"}})

    # CIRCULARES
    c.append({"id": "CIRC-001", "grupo": "circulares", "nombre": "Circulares 10cm con_laca_uv 1000", "endpoint": "/stickers-circulares/cotizar", "expected_status": 200, "expected_total_sin_iva": 85980, "checks": {"trazabilidad.modo_precio": "formula_editable_calibrada"}, "payload": {"categoria": "Stickers Circulares", "producto": "sticker_circular", "material": "obra_ilustracion_90g", "formato": "10cm", "terminacion": "con_laca_uv", "cantidad_unidades": 1000, "urgencia": "normal"}})
    c.append({"id": "CIRC-002", "grupo": "circulares", "nombre": "Circulares OPP bloqueado", "endpoint": "/stickers-circulares/cotizar", "expected_status": 400, "expected_error": "material_opp_pendiente_datos", "payload": {"categoria": "Stickers Circulares", "producto": "sticker_circular", "material": "opp", "formato": "10cm", "terminacion": "sin_laca_uv", "cantidad_unidades": 1000, "urgencia": "normal"}})

    # TTC
    ttc_base_payload = {"categoria": "Tarjetas Troqueladas Circulares", "producto": "tarjeta_troquelada_circular", "formato": "1cm", "caras": "4/0", "cantidad_unidades": 100, "urgencia": "normal"}
    c.append({"id": "TTC-001", "grupo": "tarjetas", "nombre": "TTC base 1cm 4/0 100", "endpoint": "/tarjetas-troqueladas-circulares/cotizar", "expected_status": 200, "expected_total_sin_iva": 2681, "payload": ttc_base_payload})
    c.append({"id": "TTC-002", "grupo": "tarjetas", "nombre": "TTC brillo 1 cara +10%", "endpoint": "/tarjetas-troqueladas-circulares/cotizar", "expected_status": 200, "expected_total_sin_iva": 2949.1, "payload": {**ttc_base_payload, "adicional_laminado": "laminado_brillo", "caras_adicional_laminado": 1}})
    c.append({"id": "TTC-003", "grupo": "tarjetas", "nombre": "TTC mate 2 caras +20%", "endpoint": "/tarjetas-troqueladas-circulares/cotizar", "expected_status": 200, "expected_total_sin_iva": 3217.2, "payload": {**ttc_base_payload, "adicional_laminado": "laminado_mate", "caras_adicional_laminado": 2}})

    # PLANCHA
    c.append({"id": "PLANCHA-001", "grupo": "plancha", "nombre": "Plancha iman 500", "endpoint": "/plancha-iman-impreso/cotizar", "expected_status": 200, "expected_total_sin_iva": 965500, "payload": {"categoria": "Plancha de Imán Impreso", "producto": "plancha_iman_impreso", "variante": "papel_300g_ilustracion", "cantidad_unidades": 500, "urgencia": "normal"}})

    # AGENDAS
    c.append({"id": "AGENDA-001", "grupo": "agendas", "nombre": "Agenda 2026 A5 72p x2", "endpoint": "/agendas-cuadernos/cotizar", "expected_status": 200, "expected_total_sin_iva": 6000, "payload": {"categoria": "Agendas / Cuadernos", "producto": "agenda_2026", "formato": "A5", "paginas": 72, "cantidad_unidades": 2, "urgencia": "normal"}})

    return c


ONLY_MAP = {
    "all": None,
    "bajadas": {"bajadas"},
    "autoadhesivas": {"autoadhesivas"},
    "tarjetas": {"tarjetas"},
    "folletos": {"folletos"},
    "carpetas": {"carpetas"},
    "sobres": {"sobres"},
    "stickers": {"stickers"},
    "imanes": {"imanes"},
    "circulares": {"circulares"},
    "plancha": {"plancha"},
    "agendas": {"agendas"},
}


def filter_cases(cases: list[dict], only: str) -> list[dict]:
    groups = ONLY_MAP.get(only)
    if groups is None:
        return cases
    return [case for case in cases if case["grupo"] in groups]


def evaluate_case(case: dict, base_url: str, timeout_s: float, tol: float) -> dict:
    started = time.time()
    expected_status = int(case["expected_status"])
    actual_status, response = _post_json(base_url, case["endpoint"], case["payload"], timeout_s)
    duration = round(time.time() - started, 4)
    ok = True
    msg = "PASS"
    expected_total = case.get("expected_total_sin_iva")
    actual_total = response.get("total_sin_iva")
    diff = None
    expected_error = case.get("expected_error")
    actual_error = response.get("error")
    checks_out = []

    if actual_status != expected_status:
        ok = False
        msg = f"HTTP {actual_status} != esperado {expected_status}"

    if ok and expected_status < 400:
        if expected_total is not None:
            if actual_total is None:
                ok = False
                msg = "Respuesta sin total_sin_iva"
            else:
                diff = float(actual_total) - float(expected_total)
                tol_case = float(case.get("tolerance_abs", tol))
                if not _approx_equal(actual_total, expected_total, tol_case):
                    ok = False
                    msg = f"total_sin_iva diff={diff}"
        expected_total_urg = case.get("expected_total_con_urgencia")
        if ok and expected_total_urg is not None:
            at = response.get("total_con_urgencia")
            if at is None or not _approx_equal(at, expected_total_urg, float(case.get("tolerance_abs", tol))):
                ok = False
                msg = "total_con_urgencia no coincide"
        expected_unit = case.get("expected_precio_unitario")
        if ok and expected_unit is not None:
            au = response.get("precio_unitario_sin_iva")
            if au is None or not _approx_equal(au, expected_unit, float(case.get("tolerance_abs", tol))):
                ok = False
                msg = "precio_unitario_sin_iva no coincide"
        for key, val in (case.get("checks") or {}).items():
            got = _get_path(response, key)
            check_ok = True
            if isinstance(val, (int, float)):
                check_ok = got is not None and _approx_equal(got, val, float(case.get("tolerance_abs", tol)))
            else:
                check_ok = got == val
            checks_out.append({"field": key, "expected": val, "actual": got, "ok": check_ok})
            if ok and not check_ok:
                ok = False
                msg = f"check falló: {key}"
    else:
        if expected_error is not None and actual_error != expected_error:
            ok = False
            msg = f"error '{actual_error}' != '{expected_error}'"

    status_text = "PASS" if ok else "FAIL"
    return {
        "id": case["id"],
        "grupo": case["grupo"],
        "nombre": case["nombre"],
        "endpoint": case["endpoint"],
        "status": status_text,
        "message": msg if not ok else "PASS",
        "expected_status": expected_status,
        "actual_status": actual_status,
        "expected_total": expected_total,
        "actual_total": actual_total,
        "diff": diff,
        "expected_error": expected_error,
        "actual_error": actual_error,
        "duration_s": duration,
        "payload": case["payload"],
        "response": response,
        "checks": checks_out,
    }


def write_reports(results: list[dict], output_dir: Path, base_url: str, started_at: float) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = output_dir / f"qa_precios_{ts}.json"
    csv_path = output_dir / f"qa_precios_{ts}.csv"

    summary = {
        "total": len(results),
        "pass": sum(1 for r in results if r["status"] == "PASS"),
        "fail": sum(1 for r in results if r["status"] == "FAIL"),
        "error": 0,
        "skipped": 0,
        "duration_s": round(time.time() - started_at, 3),
    }

    payload = {
        "metadata": {"script": "qa_precios_masivo.py", "version": "1.0"},
        "base_url": base_url,
        "timestamp": datetime.now().isoformat(),
        "resumen": summary,
        "resultados": results,
    }
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "id", "grupo", "nombre", "status", "endpoint", "expected_status", "actual_status",
                "expected_total", "actual_total", "diff", "expected_error", "actual_error", "message",
            ],
        )
        w.writeheader()
        for r in results:
            w.writerow({
                "id": r["id"],
                "grupo": r["grupo"],
                "nombre": r["nombre"],
                "status": r["status"],
                "endpoint": r["endpoint"],
                "expected_status": r["expected_status"],
                "actual_status": r["actual_status"],
                "expected_total": r["expected_total"],
                "actual_total": r["actual_total"],
                "diff": r["diff"],
                "expected_error": r["expected_error"],
                "actual_error": r["actual_error"],
                "message": r["message"],
            })
    return json_path, csv_path


def main() -> int:
    parser = argparse.ArgumentParser(description="QA masivo de precios contra API local")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--output-dir", default="reports/qa")
    parser.add_argument("--only", default="all", choices=list(ONLY_MAP.keys()))
    parser.add_argument("--fail-fast", action="store_true")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument("--list", action="store_true")
    args = parser.parse_args()

    cases = build_cases()
    selected = filter_cases(cases, args.only)
    if args.list:
        print(f"Casos ({len(selected)}):")
        for case in selected:
            print(f"- {case['id']} [{case['grupo']}] {case['nombre']}")
        return 0

    try:
        health_status, _ = _get_json(args.base_url, "/health", args.timeout)
        if health_status != 200:
            print("API no disponible. Levantá scripts/deploy_local/start_cotizador_local.ps1")
            return 1
    except Exception:
        print("API no disponible. Levantá scripts/deploy_local/start_cotizador_local.ps1")
        return 1

    started = time.time()
    results = []
    print(f"Ejecutando {len(selected)} casos contra {args.base_url} ...")
    for case in selected:
        res = evaluate_case(case, args.base_url, args.timeout, DEFAULT_TOLERANCE)
        results.append(res)
        print(f"[{res['status']}] {res['id']} {res['nombre']} :: {res['message']}")
        if args.fail_fast and res["status"] == "FAIL":
            break

    json_path, csv_path = write_reports(results, Path(args.output_dir), args.base_url, started)
    total = len(results)
    ok = sum(1 for r in results if r["status"] == "PASS")
    fail = sum(1 for r in results if r["status"] == "FAIL")
    duration = round(time.time() - started, 3)
    print("\nResumen:")
    print(f"- total casos: {total}")
    print(f"- PASS: {ok}")
    print(f"- FAIL: {fail}")
    print(f"- ERROR: 0")
    print(f"- SKIPPED: 0")
    print(f"- duración: {duration}s")
    print(f"- JSON: {json_path}")
    print(f"- CSV : {csv_path}")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
