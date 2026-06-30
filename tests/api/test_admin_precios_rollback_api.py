import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestAdminPreciosRollbackApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.paths = [
            ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_final.json",
            ROOT / "data" / "variables_globales" / "costos_base.json",
            ROOT / "data" / "stickers_circulares" / "formula_editable_config.json",
            ROOT / "data" / "bajadas_autoadhesivas" / "autoadhesivas_v1_config.json",
            ROOT / "data" / "variables_principales" / "variables_madre.json",
        ]
        cls.history_path = ROOT / "data" / "admin_precios" / "historial_cambios.json"
        cls.originals = {path: path.read_text(encoding="utf-8") for path in cls.paths if path.exists()}
        cls.history_original = cls.history_path.read_text(encoding="utf-8") if cls.history_path.exists() else None
        cls.backup_dir = ROOT / "data" / "backups" / "variables_principales"
        cls.backups_before = set(cls.backup_dir.glob("*.json")) if cls.backup_dir.exists() else set()
        cls.server = create_server(host="127.0.0.1", port=0, project_root=ROOT)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)
        cls._restore_state()

    @classmethod
    def _restore_state(cls):
        for path, content in cls.originals.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        if cls.history_original is None:
            if cls.history_path.exists():
                cls.history_path.unlink()
        else:
            cls.history_path.parent.mkdir(parents=True, exist_ok=True)
            cls.history_path.write_text(cls.history_original, encoding="utf-8")
        if cls.backup_dir.exists():
            for path in set(cls.backup_dir.glob("*.json")) - cls.backups_before:
                path.unlink()

    def setUp(self):
        self._restore_state()

    def tearDown(self):
        self._restore_state()

    def _url(self, path: str) -> str:
        return f"http://127.0.0.1:{self.port}{path}"

    def call(self, method: str, path: str, payload=None):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        req = request.Request(
            self._url(path),
            data=data,
            headers={"Content-Type": "application/json"},
            method=method,
        )
        try:
            with request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            try:
                return exc.code, json.loads(exc.read().decode("utf-8"))
            finally:
                exc.close()

    def _current_value(self, variable: str) -> float:
        status, body = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        item = next(row for row in body["variables"] if row["key"] == variable)
        return float(item["value"])

    def _apply_change_and_get_history_id(self, variable="adicional_tinta_blanca_base_1_copia", delta=1.0):
        current = self._current_value(variable)
        status, body = self.call(
            "POST",
            "/admin-precios/aplicar",
            {"variable": variable, "nuevo_valor": current + delta, "confirmado": True},
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["backup"])
        history_id = body["historial"]["id"]
        self.assertTrue(history_id)
        return current, current + delta, history_id

    def test_get_historial_devuelve_ids_y_tipo(self):
        self._apply_change_and_get_history_id()
        status, body = self.call("GET", "/admin-precios/historial")
        self.assertEqual(status, 200)
        self.assertTrue(body["historial"])
        last = body["historial"][-1]
        self.assertIn("id", last)
        self.assertEqual(last["tipo"], "cambio")
        self.assertIn("descripcion", last)

    def test_preview_rollback_valido(self):
        old_value, new_value, history_id = self._apply_change_and_get_history_id()
        status, body = self.call("POST", "/admin-precios/rollback/preview", {"historial_id": history_id})
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertEqual(body["accion"], "rollback_preview")
        self.assertEqual(body["valor_actual"], new_value)
        self.assertEqual(body["valor_rollback"], old_value)
        self.assertTrue(body["requiere_confirmacion"])
        self.assertTrue(body["advertencias"])

    def test_preview_rollback_id_inexistente(self):
        status, body = self.call("POST", "/admin-precios/rollback/preview", {"historial_id": "hist_no_existe"})
        self.assertEqual(status, 404)
        self.assertEqual(body["error"], "historial_no_encontrado")

    def test_aplicar_rollback_requiere_confirmacion(self):
        _, _, history_id = self._apply_change_and_get_history_id()
        status, body = self.call("POST", "/admin-precios/rollback/aplicar", {"historial_id": history_id})
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "confirmacion_requerida")

    def test_aplicar_rollback_restaura_crea_backup_y_evento(self):
        old_value, new_value, history_id = self._apply_change_and_get_history_id()
        self.assertEqual(self._current_value("adicional_tinta_blanca_base_1_copia"), new_value)

        status, body = self.call(
            "POST",
            "/admin-precios/rollback/aplicar",
            {"historial_id": history_id, "confirmado": True},
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertEqual(body["accion"], "rollback")
        self.assertEqual(body["valor_anterior"], new_value)
        self.assertEqual(body["valor_nuevo"], old_value)
        self.assertTrue(body["backup"])
        self.assertEqual(body["historial"]["tipo"], "rollback")
        self.assertEqual(body["historial"]["rollback_de"], history_id)
        self.assertEqual(self._current_value("adicional_tinta_blanca_base_1_copia"), old_value)

    def test_no_permite_rollback_de_variable_no_editable(self):
        self.history_path.parent.mkdir(parents=True, exist_ok=True)
        self.history_path.write_text(
            json.dumps([
                {
                    "id": "hist_matriz_pdf",
                    "timestamp": "2026-06-18T00:00:00Z",
                    "tipo": "cambio",
                    "variable": "matriz_pdf",
                    "valor_anterior": 1,
                    "valor_nuevo": 2,
                }
            ]),
            encoding="utf-8",
        )
        status, body = self.call("POST", "/admin-precios/rollback/preview", {"historial_id": "hist_matriz_pdf"})
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "variable_no_editable")

    def test_no_permite_rollback_si_valor_actual_ya_coincide(self):
        current = self._current_value("click_color")
        self.history_path.parent.mkdir(parents=True, exist_ok=True)
        self.history_path.write_text(
            json.dumps([
                {
                    "id": "hist_sin_cambios",
                    "timestamp": "2026-06-18T00:00:00Z",
                    "tipo": "cambio",
                    "variable": "click_color",
                    "valor_anterior": current,
                    "valor_nuevo": current + 1,
                }
            ]),
            encoding="utf-8",
        )
        status, body = self.call("POST", "/admin-precios/rollback/preview", {"historial_id": "hist_sin_cambios"})
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "rollback_sin_cambios")

    def test_get_variables_editables_sigue_funcionando(self):
        status, body = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        keys = {item["key"] for item in body["variables"]}
        self.assertIn("click_color", keys)
        self.assertIn("adicional_tinta_blanca_base_1_copia", keys)


if __name__ == "__main__":
    unittest.main()
