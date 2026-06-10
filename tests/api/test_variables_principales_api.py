import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestVariablesPrincipalesApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.paths = [
            ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_final.json",
            ROOT / "data" / "stickers_circulares" / "formula_editable_config.json",
            ROOT / "data" / "bajadas_autoadhesivas" / "autoadhesivas_v1_config.json",
        ]
        cls.originals = {path: path.read_text(encoding="utf-8") for path in cls.paths}
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
        for path, content in cls.originals.items():
            path.write_text(content, encoding="utf-8")
        if cls.backup_dir.exists():
            for path in set(cls.backup_dir.glob("*.json")) - cls.backups_before:
                path.unlink()

    def call(self, method, path, payload=None):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        req = request.Request(
            f"http://127.0.0.1:{self.port}{path}",
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

    def test_get_devuelve_solo_catalogo_controlado(self):
        status, body = self.call("GET", "/variables-principales")
        self.assertEqual(status, 200)
        keys = {
            item["key"]
            for group in ["tipo_cambio", "clicks", "papeles", "multiplicadores", "adicionales"]
            for item in body[group]
        }
        self.assertIn("tipo_cambio_usd", keys)
        self.assertIn("click_color", keys)
        self.assertIn("adicional_tinta_blanca_base_1_copia", keys)
        self.assertNotIn("factor_ajuste_pdf", keys)
        self.assertTrue(all(item["editable"] for group in body.values() if isinstance(group, list) for item in group if isinstance(item, dict)))

    def test_put_rechaza_key_y_valores_invalidos(self):
        status, _ = self.call("PUT", "/variables-principales", {"updates": [{"key": "factor_ajuste_pdf", "value": 2}]})
        self.assertEqual(status, 400)
        status, _ = self.call("PUT", "/variables-principales", {"updates": [{"key": "click_color", "value": -1}]})
        self.assertEqual(status, 400)
        status, _ = self.call("PUT", "/variables-principales", {"updates": [{"key": "click_color", "value": "texto"}]})
        self.assertEqual(status, 400)

    def test_put_modifica_variables_y_crea_backup(self):
        status, before = self.call("GET", "/variables-principales")
        self.assertEqual(status, 200)
        values = {item["key"]: item["value"] for group in ["tipo_cambio", "clicks"] for item in before[group]}
        status, body = self.call(
            "PUT",
            "/variables-principales",
            {"updates": [
                {"key": "tipo_cambio_usd", "value": values["tipo_cambio_usd"] + 1},
                {"key": "click_color", "value": values["click_color"] + 0.1},
            ]},
        )
        self.assertEqual(status, 200)
        self.assertEqual(len(body["backups_generados"]), 2)
        self.assertTrue(all((ROOT / path).exists() for path in body["backups_generados"]))

    def test_tinta_blanca_actualizada_impacta_cotizacion(self):
        status, variables = self.call("GET", "/variables-principales")
        self.assertEqual(status, 200)
        original = variables["adicionales"][0]["value"]
        new_value = original + 10
        status, _ = self.call(
            "PUT",
            "/variables-principales",
            {"updates": [{"key": "adicional_tinta_blanca_base_1_copia", "value": new_value}]},
        )
        self.assertEqual(status, 200)
        payload = {
            "categoria": "Bajadas Autoadhesivas",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "especial",
            "material": "OPP blanco",
            "gramaje": "N/A",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "normal",
            "tipo_producto": "autoadhesiva",
            "columna_precio": "especial",
            "adicional_tinta_blanca": True,
        }
        status, quote = self.call("POST", "/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertAlmostEqual(quote["total_adicional_sin_iva"], new_value * 30, places=6)
        self.assertEqual(
            quote["trazabilidad"]["variables_principales_usadas"][0]["key"],
            "adicional_tinta_blanca_base_1_copia",
        )


if __name__ == "__main__":
    unittest.main()
