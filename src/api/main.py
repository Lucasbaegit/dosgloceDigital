"""Minimal internal HTTP API for Bajadas v2."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from .bajadas_v2_routes import BajadasV2ApiService


class ApiHandler(BaseHTTPRequestHandler):
    service: BajadasV2ApiService | None = None
    static_dir: Path | None = None

    def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.service is None:
            self._send_json(500, {"error": "internal_error", "detail": "Service no inicializado"})
            return
        path = urlparse(self.path).path
        if path == "/health":
            self._send_json(200, self.service.health())
            return
        if path == "/bajadas-v2/health":
            result = self.service.bajadas_health()
            status = 200 if all(result["checks"].values()) else 503
            self._send_json(status, result)
            return
        if path == "/bajadas-v2/metrics":
            self._send_json(200, self.service.metrics())
            return
        if path == "/bajadas-v2/autoadhesivas/health":
            status, payload = self.service.autoadhesivas_health()
            self._send_json(status, payload)
            return
        if path == "/bajadas-v2/autoadhesivas/config":
            status, payload = self.service.autoadhesivas_config()
            self._send_json(status, payload)
            return
        if path == "/variables-principales":
            status, payload = self.service.get_principal_variables()
            self._send_json(status, payload)
            return
        if path == "/variables-principales/audit":
            status, payload = self.service.audit_principal_variables()
            self._send_json(status, payload)
            return
        if path == "/variables-principales/rangos":
            status, payload = self.service.principal_variables_ranges()
            self._send_json(status, payload)
            return
        if path == "/export/precios/json":
            status, payload = self.service.export_prices_json()
            self._send_json(status, payload)
            return
        if path == "/export/precios/pdf":
            filename, payload = self.service.export_prices_pdf()
            self._send_bytes(200, payload, "application/pdf", filename)
            return
        if path == "/tarjetas-9x5/health":
            self._send_json(200, self.service.tarjetas_9x5_engine.health())
            return
        if path == "/tarjetas-postales/health":
            self._send_json(200, self.service.tarjetas_postales_engine.health())
            return
        if path == "/folletos/health":
            self._send_json(200, self.service.folletos_engine.health())
            return
        if path == "/carpetas/health":
            self._send_json(200, self.service.carpetas_engine.health())
            return
        if path == "/sobres/health":
            self._send_json(200, self.service.sobres_engine.health())
            return
        if path == "/stickers-corte-recto/health":
            self._send_json(200, self.service.stickers_corte_recto_engine.health())
            return
        if path == "/imanes-corte-recto/health":
            self._send_json(200, self.service.imanes_corte_recto_engine.health())
            return
        if path == "/stickers-circulares/health":
            self._send_json(200, self.service.stickers_circulares_engine.health())
            return
        if path == "/troquelado-digital/health":
            self._send_json(200, self.service.troquelado_digital_engine.health())
            return
        if path == "/tarjetas-troqueladas-circulares/health":
            self._send_json(200, self.service.tarjetas_troqueladas_circulares_engine.health())
            return
        if path == "/plancha-iman-impreso/health":
            self._send_json(200, self.service.plancha_iman_impreso_engine.health())
            return
        if path == "/agendas-cuadernos/health":
            self._send_json(200, self.service.agendas_cuadernos_engine.health())
            return
        if path == "/bajadas-v2/config":
            status, payload = self.service.get_config()
            self._send_json(status, payload)
            return
        if path == "/bajadas-v2/config/history":
            status, payload = self.service.get_config_history()
            self._send_json(status, payload)
            return
        if path == "/bajadas-v2/config/tree":
            status, payload = self.service.get_config_tree()
            self._send_json(status, payload)
            return
        if path == "/bajadas-v2/config/diff":
            status, payload = self.service.get_config_diff()
            self._send_json(status, payload)
            return
        if path == "/bajadas-v2/config/candidates":
            status, payload = self.service.list_candidates()
            self._send_json(status, payload)
            return
        if path == "/bajadas-v2/config/active-version":
            status, payload = self.service.get_active_version()
            self._send_json(status, payload)
            return
        if path == "/bajadas-v2/config/backups":
            status, payload = self.service.get_backups()
            self._send_json(status, payload)
            return
        if path.startswith("/bajadas-v2/config/backups/"):
            backup_filename = path.split("/bajadas-v2/config/backups/", 1)[1].strip("/")
            if not backup_filename:
                self._send_json(404, {"error": "not_found", "detail": "backup_filename requerido"})
                return
            status, payload = self.service.get_backup_detail(backup_filename)
            self._send_json(status, payload)
            return
        if path.startswith("/bajadas-v2/config/candidate/"):
            candidate_id = path.split("/bajadas-v2/config/candidate/", 1)[1].strip("/")
            if not candidate_id:
                self._send_json(404, {"error": "not_found", "detail": "candidate_id requerido"})
                return
            status, payload = self.service.get_candidate(candidate_id)
            self._send_json(status, payload)
            return

        if self._try_serve_static(path):
            return
        self._send_json(404, {"error": "not_found", "detail": "Endpoint no encontrado"})

    def do_POST(self) -> None:  # noqa: N802
        if self.service is None:
            self._send_json(500, {"error": "internal_error", "detail": "Service no inicializado"})
            return
        path = urlparse(self.path).path

        allowed_exact = {
            "/bajadas-v2/cotizar",
            "/tarjetas-9x5/cotizar",
            "/tarjetas-postales/cotizar",
            "/folletos/cotizar",
            "/carpetas/cotizar",
            "/sobres/cotizar",
            "/stickers-corte-recto/cotizar",
            "/imanes-corte-recto/cotizar",
            "/stickers-circulares/cotizar",
            "/troquelado-digital/cotizar",
            "/tarjetas-troqueladas-circulares/cotizar",
            "/plancha-iman-impreso/cotizar",
            "/agendas-cuadernos/cotizar",
            "/bajadas-v2/config/update",
            "/bajadas-v2/config/restore",
            "/bajadas-v2/config/validate",
            "/bajadas-v2/config/simulate",
            "/bajadas-v2/config/candidate/create",
            "/variables-principales/reset",
        }
        is_candidate_reject = path.startswith("/bajadas-v2/config/candidate/") and path.endswith("/reject")
        is_candidate_approve = path.startswith("/bajadas-v2/config/candidate/") and path.endswith("/approve")
        is_candidate_promote = path.startswith("/bajadas-v2/config/candidate/") and path.endswith("/promote")
        is_backup_restore = path.startswith("/bajadas-v2/config/backups/") and path.endswith("/restore")
        is_backup_preview = path.startswith("/bajadas-v2/config/backups/") and path.endswith("/restore-preview")
        is_backup_simulate = path.startswith("/bajadas-v2/config/backups/") and path.endswith("/restore-simulate")
        if path not in allowed_exact and not (is_candidate_reject or is_candidate_approve or is_candidate_promote or is_backup_restore or is_backup_preview or is_backup_simulate):
            self._send_json(404, {"error": "not_found", "detail": "Endpoint no encontrado"})
            return

        try:
            content_len = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_len) if content_len > 0 else b"{}"
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "validation_error", "detail": "JSON inválido"})
            return

        if is_candidate_reject:
            candidate_id = path.split("/bajadas-v2/config/candidate/", 1)[1].rsplit("/reject", 1)[0].strip("/")
            status, response = self.service.reject_candidate(candidate_id, payload)
            self._send_json(status, response)
            return
        if is_candidate_approve:
            candidate_id = path.split("/bajadas-v2/config/candidate/", 1)[1].rsplit("/approve", 1)[0].strip("/")
            status, response = self.service.approve_candidate(candidate_id, payload)
            self._send_json(status, response)
            return
        if is_candidate_promote:
            candidate_id = path.split("/bajadas-v2/config/candidate/", 1)[1].rsplit("/promote", 1)[0].strip("/")
            status, response = self.service.promote_candidate(candidate_id, payload)
            self._send_json(status, response)
            return
        if is_backup_restore:
            backup_filename = path.split("/bajadas-v2/config/backups/", 1)[1].rsplit("/restore", 1)[0].strip("/")
            status, response = self.service.restore_from_backup(backup_filename, payload)
            self._send_json(status, response)
            return
        if is_backup_preview:
            backup_filename = path.split("/bajadas-v2/config/backups/", 1)[1].rsplit("/restore-preview", 1)[0].strip("/")
            status, response = self.service.restore_preview_from_backup(backup_filename)
            self._send_json(status, response)
            return
        if is_backup_simulate:
            backup_filename = path.split("/bajadas-v2/config/backups/", 1)[1].rsplit("/restore-simulate", 1)[0].strip("/")
            status, response = self.service.restore_simulate_from_backup(backup_filename, payload)
            self._send_json(status, response)
            return

        if path == "/bajadas-v2/cotizar":
            status, response = self.service.cotizar(payload)
        elif path == "/tarjetas-9x5/cotizar":
            status, response = self.service.cotizar_tarjetas_9x5(payload)
        elif path == "/tarjetas-postales/cotizar":
            status, response = self.service.cotizar_tarjetas_postales(payload)
        elif path == "/folletos/cotizar":
            status, response = self.service.cotizar_folletos(payload)
        elif path == "/carpetas/cotizar":
            status, response = self.service.cotizar_carpetas(payload)
        elif path == "/sobres/cotizar":
            status, response = self.service.cotizar_sobres(payload)
        elif path == "/stickers-corte-recto/cotizar":
            status, response = self.service.cotizar_stickers_corte_recto(payload)
        elif path == "/imanes-corte-recto/cotizar":
            status, response = self.service.cotizar_imanes_corte_recto(payload)
        elif path == "/stickers-circulares/cotizar":
            status, response = self.service.cotizar_stickers_circulares(payload)
        elif path == "/troquelado-digital/cotizar":
            status, response = self.service.cotizar_troquelado_digital(payload)
        elif path == "/tarjetas-troqueladas-circulares/cotizar":
            status, response = self.service.cotizar_tarjetas_troqueladas_circulares(payload)
        elif path == "/plancha-iman-impreso/cotizar":
            status, response = self.service.cotizar_plancha_iman_impreso(payload)
        elif path == "/agendas-cuadernos/cotizar":
            status, response = self.service.cotizar_agendas_cuadernos(payload)
        elif path == "/variables-principales/reset":
            status, response = self.service.reset_principal_variables(payload)
        elif path == "/bajadas-v2/config/update":
            status, response = self.service.update_config(payload)
        elif path == "/bajadas-v2/config/validate":
            status, response = self.service.validate_config(payload)
        elif path == "/bajadas-v2/config/simulate":
            status, response = self.service.simulate_config(payload)
        elif path == "/bajadas-v2/config/candidate/create":
            status, response = self.service.create_candidate(payload)
        else:
            status, response = self.service.restore_config_from_final(payload)
        self._send_json(status, response)

    def do_PUT(self) -> None:  # noqa: N802
        if self.service is None:
            self._send_json(500, {"error": "internal_error", "detail": "Service no inicializado"})
            return
        path = urlparse(self.path).path
        if path != "/variables-principales":
            self._send_json(404, {"error": "not_found", "detail": "Endpoint no encontrado"})
            return
        try:
            content_len = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_len) if content_len > 0 else b"{}"
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "validation_error", "detail": "JSON inválido"})
            return
        status, response = self.service.update_principal_variables(payload)
        self._send_json(status, response)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _try_serve_static(self, path: str) -> bool:
        """
        Serve frontend static files from build directory if present.
        For SPA routes, fallback to index.html.
        """
        if self.static_dir is None or not self.static_dir.exists():
            return False

        normalized = path.strip("/") or "index.html"
        candidate = (self.static_dir / normalized).resolve()
        try:
            candidate.relative_to(self.static_dir.resolve())
        except ValueError:
            return False

        if candidate.is_file():
            self._send_file(candidate)
            return True

        index = self.static_dir / "index.html"
        if index.exists():
            self._send_file(index)
            return True
        return False

    def _send_file(self, file_path: Path) -> None:
        data = file_path.read_bytes()
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_bytes(self, status_code: int, data: bytes, content_type: str, filename: str) -> None:
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def create_server(host: str = "127.0.0.1", port: int = 8000, project_root: Path | None = None) -> ThreadingHTTPServer:
    root = project_root or Path(__file__).resolve().parents[2]
    service = BajadasV2ApiService(root)
    ApiHandler.service = service
    static_dist = root / "frontend" / "dist"
    ApiHandler.static_dir = static_dist if static_dist.exists() else None
    return ThreadingHTTPServer((host, port), ApiHandler)


def run(host: str = "127.0.0.1", port: int = 8000) -> None:
    server = create_server(host=host, port=port)
    print(f"Bajadas v2 API running on http://{host}:{port}")
    server.serve_forever()
