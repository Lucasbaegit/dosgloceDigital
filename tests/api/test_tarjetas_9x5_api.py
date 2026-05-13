import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestTarjetas9x5Api(unittest.TestCase):
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

    def _post_json(self, path: str, payload: dict):
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(self._url(path), data=data, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            try:
                return exc.code, json.loads(exc.read().decode("utf-8"))
            finally:
                exc.close()

    def _payload(self, cantidad: int, terminacion: str, caras: str, urgencia: str = "normal") -> dict:
        return {
            "categoria": "Tarjetas Personales",
            "producto": "9x5",
            "formato": "9x5",
            "papel": "300g Ilustración",
            "gramaje": "300g",
            "terminacion": terminacion,
            "caras": caras,
            "cantidad_unidades": cantidad,
            "urgencia": urgencia,
        }

    def test_tarjetas_100_sin_laminar_4_0(self):
        status, body = self._post_json("/tarjetas-9x5/cotizar", self._payload(100, "sin_laminar", "4/0"))
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 5139, places=6)
        self.assertEqual(body["regla_aplicada"], "TARJETAS_9X5_MATRIZ_PDF_P12")
        self.assertEqual(body["trazabilidad"]["modo_precio"], "pdf_fijo")
        self.assertEqual(body["trazabilidad"]["futuro_modo_precio"], "formula_editable_calibrada")
        self.assertEqual(body["trazabilidad"]["modo_calculo"], "matriz_pdf_con_variables_detectadas")
        self.assertIn("variables_detectadas", body["trazabilidad"])
        self.assertIn("variables_usadas", body["trazabilidad"])
        self.assertIn("precio_pdf_objetivo", body["trazabilidad"])
        self.assertIn("config_variables_base", body["trazabilidad"])
        self.assertIn("motivo_no_formula_pura", body["trazabilidad"])

    def test_tarjetas_1000_laminado_mate_4_4(self):
        status, body = self._post_json("/tarjetas-9x5/cotizar", self._payload(1000, "laminado_mate", "4/4"))
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 48401, places=6)

    def test_tarjetas_cantidad_fuera_de_matriz(self):
        status, body = self._post_json("/tarjetas-9x5/cotizar", self._payload(750, "sin_laminar", "4/0"))
        self.assertEqual(status, 404)
        self.assertEqual(body["error"], "cantidad_fuera_de_matriz")

    def test_tarjetas_terminacion_invalida(self):
        status, body = self._post_json("/tarjetas-9x5/cotizar", self._payload(100, "barniz", "4/0"))
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "terminacion_no_soportada")


if __name__ == "__main__":
    unittest.main()
