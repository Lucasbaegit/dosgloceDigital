import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestTrazabilidadGrafoApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = create_server(host="127.0.0.1", port=0, project_root=ROOT)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def _url(self, path: str) -> str:
        return f"http://127.0.0.1:{self.port}{path}"

    def _get_json(self, path: str):
        with request.urlopen(self._url(path), timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def test_click_bajadas_deriva_xl_y_a4_desde_a3(self):
        status, body = self._get_json("/trazabilidad/grafo?caso=click_bajadas&formato=XL")
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        nodes = {node["id"]: node for node in body["nodes"]}
        edges = {(edge["source"], edge["target"]) for edge in body["edges"]}

        self.assertIn("click_color", nodes)
        self.assertIn("precio_click_A3", nodes)
        self.assertIn(("click_color", "precio_click_A3"), edges)
        self.assertIn(("precio_click_A3", "precio_click_XL"), edges)
        self.assertIn(("precio_click_A3", "precio_click_A4"), edges)
        self.assertNotIn(("click_color", "precio_click_XL"), edges)
        self.assertNotIn(("click_color", "precio_click_A4"), edges)
        self.assertNotEqual(nodes["precio_click_XL"]["type"], "variable_madre")
        self.assertNotEqual(nodes["precio_click_A4"]["type"], "variable_madre")
        self.assertFalse(nodes["precio_click_XL"]["editable_en_sistema"])
        self.assertFalse(nodes["precio_click_A4"]["editable_en_sistema"])

    def test_stickers_circulares_incluye_variables_y_total(self):
        status, body = self._get_json("/trazabilidad/grafo?caso=stickers_circulares")
        self.assertEqual(status, 200)
        nodes = {node["id"]: node for node in body["nodes"]}
        for node_id in ["obra_90g", "click_color", "factor_ajuste_pdf", "total_final"]:
            self.assertIn(node_id, nodes)
        self.assertEqual(nodes["total_final"]["value"], 85980)

    def test_tarjetas_9x5_muestra_matriz_pdf_a_precio_final(self):
        status, body = self._get_json("/trazabilidad/grafo?caso=tarjetas_9x5")
        self.assertEqual(status, 200)
        nodes = {node["id"]: node for node in body["nodes"]}
        edges = {(edge["source"], edge["target"]) for edge in body["edges"]}
        self.assertEqual(nodes["matriz_pdf_tarjetas_9x5"]["type"], "tabla_pdf")
        self.assertIn(("matriz_pdf_tarjetas_9x5", "precio_final_5139"), edges)
        self.assertIn(("matriz_pdf_tarjetas_9x5", "precio_final_48401"), edges)

    def test_endpoint_no_modifica_configs(self):
        paths = [
            ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_final.json",
            ROOT / "data" / "stickers_circulares" / "formula_editable_config.json",
            ROOT / "data" / "bajadas_autoadhesivas" / "autoadhesivas_v1_config.json",
        ]
        before = {path: path.read_text(encoding="utf-8") for path in paths if path.exists()}
        for case in ["click_bajadas", "stickers_circulares", "autoadhesivas_tinta_blanca", "tarjetas_9x5"]:
            status, body = self._get_json(f"/trazabilidad/grafo?caso={case}")
            self.assertEqual(status, 200)
            self.assertTrue(body["ok"])
        after = {path: path.read_text(encoding="utf-8") for path in before}
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
