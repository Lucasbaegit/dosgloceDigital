import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestStickersCircularesApi(unittest.TestCase):
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

    def _post(self, path: str, payload: dict):
        req = request.Request(
            self._url(path),
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            return exc.code, json.loads(exc.read().decode("utf-8"))

    def test_min_case(self):
        status, payload = self._post(
            "/stickers-circulares/cotizar",
            {
                "categoria": "Stickers Circulares",
                "producto": "sticker_circular",
                "material": "obra_ilustracion_90g",
                "formato": "1cm",
                "terminacion": "sin_laca_uv",
                "cantidad_unidades": 100,
                "urgencia": "normal",
            },
        )
        self.assertEqual(status, 200)
        self.assertAlmostEqual(payload["total_sin_iva"], 2313, places=6)
        self.assertEqual(payload["trazabilidad"]["modo_precio"], "formula_editable_calibrada")
        self.assertIn("factor_ajuste_pdf", payload["trazabilidad"])
        self.assertIn("arbol_calculo", payload["trazabilidad"])

    def test_max_case(self):
        status, payload = self._post(
            "/stickers-circulares/cotizar",
            {
                "categoria": "Stickers Circulares",
                "producto": "sticker_circular",
                "material": "fluo_kraft_marron",
                "formato": "18-20cm",
                "terminacion": "con_laca_uv",
                "cantidad_unidades": 1000,
                "urgencia": "normal",
            },
        )
        self.assertEqual(status, 200)
        self.assertAlmostEqual(payload["total_sin_iva"], 481291, places=6)

    def test_invalid_qty(self):
        status, payload = self._post(
            "/stickers-circulares/cotizar",
            {
                "categoria": "Stickers Circulares",
                "producto": "sticker_circular",
                "material": "obra_ilustracion_90g",
                "formato": "1cm",
                "terminacion": "sin_laca_uv",
                "cantidad_unidades": 750,
                "urgencia": "normal",
            },
        )
        self.assertEqual(status, 404)
        self.assertEqual(payload.get("error"), "cantidad_fuera_de_matriz")

    def test_pdf_fijo_mode_explicit(self):
        status, payload = self._post(
            "/stickers-circulares/cotizar",
            {
                "categoria": "Stickers Circulares",
                "producto": "sticker_circular",
                "material": "obra_ilustracion_90g",
                "formato": "1cm",
                "terminacion": "sin_laca_uv",
                "cantidad_unidades": 100,
                "urgencia": "normal",
                "modo_precio": "pdf_fijo",
            },
        )
        self.assertEqual(status, 200)
        self.assertEqual(payload["trazabilidad"]["modo_precio"], "pdf_fijo")

    def test_experimental_override_changes_base_not_final(self):
        common = {
            "categoria": "Stickers Circulares",
            "producto": "sticker_circular",
            "material": "obra_ilustracion_90g",
            "formato": "10cm",
            "terminacion": "con_laca_uv",
            "cantidad_unidades": 300,
            "urgencia": "normal",
        }
        s1, p1 = self._post("/stickers-circulares/cotizar", common)
        s2, p2 = self._post(
            "/stickers-circulares/cotizar",
            {**common, "variables_override": {"click_color_base": 4.4}},
        )
        self.assertEqual(s1, 200)
        self.assertEqual(s2, 200)
        self.assertEqual(p1["total_sin_iva"], p2["total_sin_iva"])
        self.assertNotEqual(p1["trazabilidad"]["precio_base_estimado"], p2["trazabilidad"]["precio_base_estimado"])


if __name__ == "__main__":
    unittest.main()
