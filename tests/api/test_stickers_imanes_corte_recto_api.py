import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestStickersImanesCorteRectoApi(unittest.TestCase):
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
            try:
                return exc.code, json.loads(exc.read().decode("utf-8"))
            finally:
                exc.close()

    def test_stickers_ok(self):
        status, body = self._post("/stickers-corte-recto/cotizar", {
            "categoria": "Stickers Corte Recto",
            "producto": "sticker_corte_recto",
            "formato": "10x7",
            "terminacion": "con_laca_uv",
            "cantidad_unidades": 1000,
            "urgencia": "normal",
        })
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 61703, places=6)
        self.assertEqual(body["trazabilidad"]["modo_precio"], "formula_editable_calibrada")
        self.assertEqual(body["trazabilidad"]["modo_calculo"], "formula_calibrada_con_factor_pdf")
        self.assertIn("arbol_calculo", body["trazabilidad"])

    def test_stickers_override_preserva_total_pdf(self):
        base_payload = {
            "categoria": "Stickers Corte Recto",
            "producto": "sticker_corte_recto",
            "formato": "10x7",
            "terminacion": "con_laca_uv",
            "cantidad_unidades": 1000,
            "urgencia": "normal",
        }
        status, before = self._post("/stickers-corte-recto/cotizar", base_payload)
        self.assertEqual(status, 200)
        status, after = self._post("/stickers-corte-recto/cotizar", {
            **base_payload,
            "variables_override": {"coeficiente_formato_stickers_corte_recto_10x7": 3.0},
        })
        self.assertEqual(status, 200)
        self.assertAlmostEqual(after["total_sin_iva"], 61703, places=6)
        self.assertNotEqual(
            before["trazabilidad"]["precio_base_estimado"],
            after["trazabilidad"]["precio_base_estimado"],
        )

    def test_stickers_cantidad_fuera(self):
        status, body = self._post("/stickers-corte-recto/cotizar", {
            "categoria": "Stickers Corte Recto",
            "producto": "sticker_corte_recto",
            "formato": "6x4",
            "terminacion": "sin_laca_uv",
            "cantidad_unidades": 750,
            "urgencia": "normal",
        })
        self.assertEqual(status, 404)
        self.assertEqual(body["error"], "cantidad_fuera_de_matriz")

    def test_imanes_ok(self):
        status, body = self._post("/imanes-corte-recto/cotizar", {
            "categoria": "Imanes Corte Recto",
            "producto": "iman_corte_recto",
            "formato": "10x7",
            "papel": "300g Ilustracion",
            "gramaje": "300g",
            "terminacion": "con_laca_uv",
            "cantidad_unidades": 1000,
            "urgencia": "normal",
        })
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 153680, places=6)
        self.assertEqual(body["trazabilidad"]["modo_precio"], "formula_editable_calibrada")
        self.assertEqual(body["trazabilidad"]["modo_calculo"], "formula_calibrada_con_factor_pdf")
        self.assertIn("arbol_calculo", body["trazabilidad"])

    def test_imanes_override_preserva_total_pdf(self):
        base_payload = {
            "categoria": "Imanes Corte Recto",
            "producto": "iman_corte_recto",
            "formato": "10x7",
            "papel": "300g Ilustracion",
            "gramaje": "300g",
            "terminacion": "con_laca_uv",
            "cantidad_unidades": 1000,
            "urgencia": "normal",
        }
        status, before = self._post("/imanes-corte-recto/cotizar", base_payload)
        self.assertEqual(status, 200)
        status, after = self._post("/imanes-corte-recto/cotizar", {
            **base_payload,
            "variables_override": {"coeficiente_formato_imanes_corte_recto_10x7": 3.0},
        })
        self.assertEqual(status, 200)
        self.assertAlmostEqual(after["total_sin_iva"], 153680, places=6)
        self.assertNotEqual(
            before["trazabilidad"]["precio_base_estimado"],
            after["trazabilidad"]["precio_base_estimado"],
        )

    def test_imanes_terminacion_invalida(self):
        status, body = self._post("/imanes-corte-recto/cotizar", {
            "categoria": "Imanes Corte Recto",
            "producto": "iman_corte_recto",
            "formato": "6x4",
            "papel": "300g Ilustracion",
            "gramaje": "300g",
            "terminacion": "laca",
            "cantidad_unidades": 100,
            "urgencia": "normal",
        })
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "terminacion_no_soportada")


if __name__ == "__main__":
    unittest.main()
