import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestTarjetasPostalesFolletosApi(unittest.TestCase):
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

    def _url(self, path):
        return f"http://127.0.0.1:{self.port}{path}"

    def _post(self, path, payload):
        req = request.Request(self._url(path), data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")
        try:
            with request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            try:
                return exc.code, json.loads(exc.read().decode("utf-8"))
            finally:
                exc.close()

    def test_tarjetas_postales_ok(self):
        status, body = self._post("/tarjetas-postales/cotizar", {
            "categoria": "Tarjetas Postales",
            "producto": "postal",
            "formato": "postal",
            "papel": "300g Ilustracion",
            "gramaje": "300g",
            "terminacion": "sin_laminar",
            "caras": "4/0",
            "cantidad_unidades": 100,
            "urgencia": "normal"
        })
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 10932, places=6)

    def test_tarjetas_postales_fuera_matriz(self):
        status, body = self._post("/tarjetas-postales/cotizar", {
            "categoria": "Tarjetas Postales",
            "producto": "postal",
            "formato": "postal",
            "papel": "300g Ilustracion",
            "gramaje": "300g",
            "terminacion": "sin_laminar",
            "caras": "4/0",
            "cantidad_unidades": 750,
            "urgencia": "normal"
        })
        self.assertEqual(status, 404)
        self.assertEqual(body["error"], "cantidad_fuera_de_matriz")

    def test_folletos_ok(self):
        status, body = self._post("/folletos/cotizar", {
            "categoria": "Folletos",
            "producto": "folleto",
            "formato": "A4",
            "papel": "80g Ilustracion",
            "gramaje": "80g",
            "modo_color": "escala_grises",
            "caras": "1/1",
            "cantidad_unidades": 1000,
            "urgencia": "normal"
        })
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 119247, places=6)

    def test_folletos_caras_incompatibles(self):
        status, body = self._post("/folletos/cotizar", {
            "categoria": "Folletos",
            "producto": "folleto",
            "formato": "A4",
            "papel": "80g Ilustracion",
            "gramaje": "80g",
            "modo_color": "escala_grises",
            "caras": "4/4",
            "cantidad_unidades": 1000,
            "urgencia": "normal"
        })
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "caras_no_compatibles")


if __name__ == "__main__":
    unittest.main()
