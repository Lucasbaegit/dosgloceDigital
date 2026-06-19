#!/usr/bin/env python
from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib import error, request


DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_FRONTEND_URL = "http://127.0.0.1:5174"
DEFAULT_TIMEOUT = 10.0


PROJECT_ROOT = Path(__file__).resolve().parents[2]
QA_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(QA_DIR))

from qa_precios_masivo import DEFAULT_TOLERANCE, build_cases, evaluate_case  # noqa: E402


API_GET_CHECKS = [
    {"id": "HEALTH-001", "grupo": "salud", "nombre": "Backend health", "endpoint": "/health", "kind": "json"},
    {"id": "HEALTH-002", "grupo": "salud", "nombre": "Bajadas v2 health", "endpoint": "/bajadas-v2/health", "kind": "json"},
    {"id": "CFG-001", "grupo": "config", "nombre": "Variables principales", "endpoint": "/variables-principales", "kind": "json"},
    {"id": "CFG-002", "grupo": "config", "nombre": "Admin precios editables", "endpoint": "/admin-precios/variables-editables", "kind": "json"},
    {"id": "TRACE-001", "grupo": "trazabilidad", "nombre": "Grafo click bajadas", "endpoint": "/trazabilidad/grafo?caso=click_bajadas", "kind": "json"},
    {"id": "TRACE-002", "grupo": "trazabilidad", "nombre": "Impacto variables resumen", "endpoint": "/variables-impacto/resumen", "kind": "json"},
    {"id": "EXPORT-001", "grupo": "exports", "nombre": "Export precios JSON", "endpoint": "/export/precios/json", "kind": "json"},
    {"id": "EXPORT-002", "grupo": "exports", "nombre": "Export Excel maestro", "endpoint": "/export/precios/excel", "kind": "binary"},
    {"id": "PROD-001", "grupo": "productos", "nombre": "Tarjetas 9x5 health", "endpoint": "/tarjetas-9x5/health", "kind": "json"},
    {"id": "PROD-002", "grupo": "productos", "nombre": "Folletos health", "endpoint": "/folletos/health", "kind": "json"},
    {"id": "PROD-003", "grupo": "productos", "nombre": "Stickers circulares health", "endpoint": "/stickers-circulares/health", "kind": "json"},
    {"id": "PROD-004", "grupo": "productos", "nombre": "Plancha iman health", "endpoint": "/plancha-iman-impreso/health", "kind": "json"},
    {"id": "PROD-005", "grupo": "productos", "nombre": "Agendas/Cuadernos health", "endpoint": "/agendas-cuadernos/health", "kind": "json"},
]


UNITTEST_COMMANDS = [
    ["python", "-m", "unittest", "tests/api/test_admin_precios_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_admin_precios_rollback_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_variables_impacto_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_variables_principales_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_trazabilidad_grafo_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_bajadas_v2_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_import_excel_maestro_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_tarjetas_9x5_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_tarjetas_postales_folletos_api.py", "-v"],
    ["python", "-m", "unittest", "tests/api/test_productos_restantes_api.py", "-v"],
]


def http_get(base_url: str, endpoint: str, timeout_s: float) -> tuple[int, bytes, str]:
    url = f"{base_url.rstrip('/')}{endpoint}"
    req = request.Request(url, method="GET")
    try:
        with request.urlopen(req, timeout=timeout_s) as resp:
            return int(resp.status), resp.read(), resp.headers.get("Content-Type", "")
    except error.HTTPError as exc:
        return int(exc.code), exc.read(), exc.headers.get("Content-Type", "")


def check_api_available(base_url: str, timeout_s: float) -> bool:
    try:
        status, _, _ = http_get(base_url, "/health", timeout_s)
        return status == 200
    except Exception:
        return False


def evaluate_get_check(check: dict, base_url: str, timeout_s: float) -> dict:
    started = time.time()
    try:
        status, body, content_type = http_get(base_url, check["endpoint"], timeout_s)
        duration_s = round(time.time() - started, 3)
        ok = status == 200
        details: dict[str, object] = {}
        if ok and check["kind"] == "json":
            try:
                parsed = json.loads(body.decode("utf-8"))
                details["json_keys"] = sorted(parsed.keys())[:20] if isinstance(parsed, dict) else []
            except Exception as exc:
                ok = False
                details["parse_error"] = str(exc)
        if ok and check["kind"] == "binary":
            details["bytes"] = len(body)
            ok = len(body) > 0
        return {
            **check,
            "endpoint": check["endpoint"],
            "status": "PASS" if ok else "FAIL",
            "message": "PASS" if ok else f"status={status}",
            "expected_status": 200,
            "actual_status": status,
            "duration_s": duration_s,
            "content_type": content_type,
            "details": details,
        }
    except Exception as exc:
        return {
            **check,
            "status": "ERROR",
            "message": str(exc),
            "expected_status": 200,
            "actual_status": None,
            "duration_s": round(time.time() - started, 3),
            "details": {},
        }


def run_command(case_id: str, grupo: str, nombre: str, cmd: list[str], cwd: Path, timeout_s: int) -> dict:
    started = time.time()
    try:
        completed = subprocess.run(
            cmd,
            cwd=str(cwd),
            stdout=None,
            stderr=None,
            text=True,
            timeout=timeout_s,
            shell=False,
        )
        ok = completed.returncode == 0
        return {
            "id": case_id,
            "grupo": grupo,
            "nombre": nombre,
            "command": " ".join(cmd),
            "status": "PASS" if ok else "FAIL",
            "message": "PASS" if ok else f"exit_code={completed.returncode}",
            "exit_code": completed.returncode,
            "duration_s": round(time.time() - started, 3),
            "stdout_tail": "",
            "stderr_tail": "",
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "id": case_id,
            "grupo": grupo,
            "nombre": nombre,
            "command": " ".join(cmd),
            "status": "ERROR",
            "message": f"timeout {timeout_s}s",
            "exit_code": None,
            "duration_s": round(time.time() - started, 3),
            "stdout_tail": "",
            "stderr_tail": "",
        }


def write_reports(results: list[dict], output_dir: Path, base_url: str, frontend_url: str, started_at: float) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = output_dir / f"qa_integral_app_{ts}.json"
    csv_path = output_dir / f"qa_integral_app_{ts}.csv"
    summary = {
        "total": len(results),
        "pass": sum(1 for r in results if r["status"] == "PASS"),
        "fail": sum(1 for r in results if r["status"] == "FAIL"),
        "error": sum(1 for r in results if r["status"] == "ERROR"),
        "skipped": sum(1 for r in results if r["status"] == "SKIPPED"),
        "duration_s": round(time.time() - started_at, 3),
    }
    payload = {
        "metadata": {
            "script": "qa_integral_app.py",
            "description": "QA integral de endpoints, cotizaciones contra datos reales, tests API, build y E2E.",
        },
        "base_url": base_url,
        "frontend_url": frontend_url,
        "timestamp": datetime.now().isoformat(),
        "resumen": summary,
        "resultados": results,
    }
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "grupo", "nombre", "status", "message", "duration_s"])
        writer.writeheader()
        for result in results:
            writer.writerow({
                "id": result.get("id"),
                "grupo": result.get("grupo"),
                "nombre": result.get("nombre"),
                "status": result.get("status"),
                "message": result.get("message"),
                "duration_s": result.get("duration_s"),
            })
    return json_path, csv_path


def print_result(result: dict) -> None:
    print(f"[{result['status']}] {result['id']} {result['nombre']} :: {result['message']}")


def main() -> int:
    parser = argparse.ArgumentParser(description="QA integral funcional del cotizador digital")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--frontend-url", default=DEFAULT_FRONTEND_URL)
    parser.add_argument("--output-dir", default="reports/qa")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument("--command-timeout", type=int, default=240)
    parser.add_argument("--fail-fast", action="store_true")
    parser.add_argument("--skip-unittest", action="store_true")
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--skip-e2e", action="store_true")
    parser.add_argument("--list", action="store_true")
    args = parser.parse_args()

    price_cases = build_cases()
    if args.list:
        print("Checks GET:")
        for check in API_GET_CHECKS:
            print(f"- {check['id']} [{check['grupo']}] {check['endpoint']} :: {check['nombre']}")
        print("\nCotizaciones:")
        for case in price_cases:
            print(f"- {case['id']} [{case['grupo']}] {case['nombre']}")
        print("\nComandos:")
        if not args.skip_unittest:
            for index, cmd in enumerate(UNITTEST_COMMANDS, start=1):
                print(f"- UNIT-{index:03d} {' '.join(cmd)}")
        if not args.skip_build:
            print("- BUILD-001 cmd /c npm run build")
        if not args.skip_e2e:
            print("- E2E-001 python scripts\\bajadas_v2\\run_e2e_stack.py --use-existing-api <base-url>")
        return 0

    if not check_api_available(args.base_url, args.timeout):
        print("API no disponible. Levantá scripts/local/iniciar_cotizador_local.ps1")
        return 1

    started = time.time()
    results: list[dict] = []

    print("== Endpoints, exports y trazabilidad ==")
    for check in API_GET_CHECKS:
        result = evaluate_get_check(check, args.base_url, args.timeout)
        results.append(result)
        print_result(result)
        if args.fail_fast and result["status"] != "PASS":
            break

    if not (args.fail_fast and any(r["status"] != "PASS" for r in results)):
        print("\n== Cotizaciones contra datos reales ==")
        for case in price_cases:
            result = evaluate_case(case, args.base_url, args.timeout, DEFAULT_TOLERANCE)
            result["id"] = f"PRICE-{result['id']}"
            result["grupo"] = f"precios/{result['grupo']}"
            results.append(result)
            print_result(result)
            if args.fail_fast and result["status"] != "PASS":
                break

    if not args.skip_unittest and not (args.fail_fast and any(r["status"] != "PASS" for r in results)):
        print("\n== Tests API/unittest ==")
        for index, cmd in enumerate(UNITTEST_COMMANDS, start=1):
            result = run_command(f"UNIT-{index:03d}", "unittest", " ".join(cmd[3:-1]), cmd, PROJECT_ROOT, args.command_timeout)
            results.append(result)
            print_result(result)
            if args.fail_fast and result["status"] != "PASS":
                break

    if not args.skip_build and not (args.fail_fast and any(r["status"] != "PASS" for r in results)):
        print("\n== Build frontend ==")
        result = run_command("BUILD-001", "frontend", "npm run build", ["cmd", "/c", "npm", "run", "build"], PROJECT_ROOT / "frontend", args.command_timeout)
        results.append(result)
        print_result(result)

    if not args.skip_e2e and not (args.fail_fast and any(r["status"] != "PASS" for r in results)):
        print("\n== E2E funcional ==")
        result = run_command(
            "E2E-001",
            "e2e",
            "Playwright stack con API existente",
            ["python", "scripts\\bajadas_v2\\run_e2e_stack.py", "--use-existing-api", args.base_url],
            PROJECT_ROOT,
            max(args.command_timeout, 300),
        )
        results.append(result)
        print_result(result)

    json_path, csv_path = write_reports(results, Path(args.output_dir), args.base_url, args.frontend_url, started)
    summary = {
        "total": len(results),
        "pass": sum(1 for r in results if r["status"] == "PASS"),
        "fail": sum(1 for r in results if r["status"] == "FAIL"),
        "error": sum(1 for r in results if r["status"] == "ERROR"),
    }
    print("\nResumen integral:")
    print(f"- total: {summary['total']}")
    print(f"- PASS: {summary['pass']}")
    print(f"- FAIL: {summary['fail']}")
    print(f"- ERROR: {summary['error']}")
    print(f"- JSON: {json_path}")
    print(f"- CSV : {csv_path}")
    return 0 if summary["fail"] == 0 and summary["error"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
