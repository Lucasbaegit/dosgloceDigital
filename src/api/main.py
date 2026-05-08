"""Minimal internal HTTP API for Bajadas v2."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from .bajadas_v2_routes import BajadasV2ApiService


class ApiHandler(BaseHTTPRequestHandler):
    service: BajadasV2ApiService | None = None

    def _send_json(self, status_code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
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
        self._send_json(404, {"error": "not_found", "detail": "Endpoint no encontrado"})

    def do_POST(self) -> None:  # noqa: N802
        if self.service is None:
            self._send_json(500, {"error": "internal_error", "detail": "Service no inicializado"})
            return
        path = urlparse(self.path).path
        if path != "/bajadas-v2/cotizar":
            self._send_json(404, {"error": "not_found", "detail": "Endpoint no encontrado"})
            return
        try:
            content_len = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(content_len) if content_len > 0 else b"{}"
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "validation_error", "detail": "JSON inválido"})
            return
        status, response = self.service.cotizar(payload)
        self._send_json(status, response)

    def log_message(self, format: str, *args: Any) -> None:
        return


def create_server(host: str = "127.0.0.1", port: int = 8000, project_root: Path | None = None) -> ThreadingHTTPServer:
    root = project_root or Path(__file__).resolve().parents[2]
    service = BajadasV2ApiService(root)
    ApiHandler.service = service
    return ThreadingHTTPServer((host, port), ApiHandler)


def run(host: str = "127.0.0.1", port: int = 8000) -> None:
    server = create_server(host=host, port=port)
    print(f"Bajadas v2 API running on http://{host}:{port}")
    server.serve_forever()
