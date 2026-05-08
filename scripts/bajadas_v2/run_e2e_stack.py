import argparse
import os
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


def wait_http(url: str, timeout_sec: int = 60, step_sec: float = 1.0) -> bool:
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=5) as resp:
                if 200 <= resp.status < 400:
                    return True
        except Exception:
            pass
        time.sleep(step_sec)
    return False


def is_port_open(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.6)
        return sock.connect_ex((host, port)) == 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Supervisor E2E para API + frontend + Playwright")
    parser.add_argument(
        "--use-existing-api",
        default="",
        help="URL de API ya levantada (ej: http://127.0.0.1:8000). Si se define, NO inicia API.",
    )
    parser.add_argument(
        "--use-existing-frontend",
        default="",
        help="URL de frontend ya levantado (ej: http://127.0.0.1:5173). Si se define, NO inicia Vite.",
    )
    parser.add_argument("--api-url", default="http://127.0.0.1:8000", help="Base URL de API para healthchecks")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(__file__).resolve().parents[2]
    frontend_dir = root / "frontend"

    existing_api = args.use_existing_api.strip()
    api_base = existing_api.rstrip("/") if existing_api else args.api_url.rstrip("/")
    api_health = f"{api_base}/health"
    api_b2_health = f"{api_base}/bajadas-v2/health"

    existing_frontend = args.use_existing_frontend.strip()
    if existing_frontend:
        frontend_base = existing_frontend.rstrip("/")
        mode = "existing_frontend"
    else:
        frontend_base = "http://127.0.0.1:5173"
        mode = "supervisor_full"

    if existing_api and existing_frontend:
        mode = "existing_api_and_frontend"
    elif existing_api:
        mode = "existing_api"

    print(f"[stack] modo_ejecucion: {mode}")
    print(f"[stack] frontend_url_usada: {frontend_base}")
    print(f"[stack] api_url_usada: {api_base}")
    print(f"[stack] base_url_playwright: {frontend_base}")

    api_cmd = [sys.executable, "scripts/bajadas_v2/run_api_bajadas_v2.py", "--host", "127.0.0.1", "--port", "8000"]
    fe_cmd = ["cmd", "/c", "npm run dev -- --host 127.0.0.1 --port 5173"]
    e2e_cmd = ["cmd", "/c", "npx playwright test --workers=1"]

    api_proc = None
    fe_proc = None
    api_started_by_supervisor = False
    frontend_started_by_supervisor = False

    try:
        # API
        if existing_api:
            print("[stack] API existente: no se inicia API desde supervisor.")
        else:
            if wait_http(api_health, timeout_sec=2, step_sec=0.5):
                print("[stack] API ya levantada, se reutiliza.")
            else:
                print("[stack] Iniciando API...")
                api_proc = subprocess.Popen(api_cmd, cwd=str(root))
                api_started_by_supervisor = True

        # Frontend
        if existing_frontend:
            print("[stack] Frontend existente: no se inicia Vite desde supervisor.")
        else:
            if is_port_open("127.0.0.1", 5173):
                print("[stack] ERROR: Puerto 5173 ocupado. Cerra procesos Vite anteriores o usa el supervisor para limpiar.")
                return 3
            print("[stack] Iniciando frontend...")
            fe_proc = subprocess.Popen(fe_cmd, cwd=str(frontend_dir))
            frontend_started_by_supervisor = True

        print(f"[stack] frontend_iniciado_por_supervisor: {frontend_started_by_supervisor}")
        print(f"[stack] api_iniciada_por_supervisor: {api_started_by_supervisor}")

        print("[stack] Esperando healthchecks...")
        checks = [
            ("API /health", api_health),
            ("API /bajadas-v2/health", api_b2_health),
            ("Frontend", frontend_base),
        ]
        for label, url in checks:
            ok = wait_http(url, timeout_sec=90)
            print(f" - {label}: {'OK' if ok else 'FAIL'}")
            if not ok:
                return 2

        print("[stack] Ejecutando Playwright...")
        env = os.environ.copy()
        env["BASE_URL"] = frontend_base
        env["API_URL"] = api_base
        run = subprocess.run(e2e_cmd, cwd=str(frontend_dir), env=env)
        return run.returncode
    finally:
        # Cerrar solo procesos iniciados por el supervisor
        if fe_proc and frontend_started_by_supervisor and fe_proc.poll() is None:
            print(f"[stack] Cerrando frontend (pid={fe_proc.pid})")
            fe_proc.terminate()
            try:
                fe_proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                fe_proc.kill()

        if api_proc and api_started_by_supervisor and api_proc.poll() is None:
            print(f"[stack] Cerrando api (pid={api_proc.pid})")
            api_proc.terminate()
            try:
                api_proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                api_proc.kill()


if __name__ == "__main__":
    raise SystemExit(main())
