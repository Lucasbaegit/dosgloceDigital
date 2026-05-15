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

    def _postales_payload(self, gramaje="300g"):
        return {
            "categoria": "Tarjetas Postales",
            "producto": "postal",
            "formato": "postal",
            "papel": f"{gramaje} Ilustracion",
            "gramaje": gramaje,
            "terminacion": "sin_laminar",
            "caras": "4/0",
            "cantidad_unidades": 100,
            "urgencia": "normal",
            "terminaciones_extra": {
                "puntas_redondeadas": False,
                "agujerado": False,
            },
        }

    def test_tarjetas_postales_ok(self):
        status, body = self._post("/tarjetas-postales/cotizar", self._postales_payload("300g"))
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 10932, places=6)

    def test_tarjetas_postales_350g_aplica_10_pct(self):
        status_base, body_base = self._post("/tarjetas-postales/cotizar", self._postales_payload("300g"))
        status_plus, body_plus = self._post("/tarjetas-postales/cotizar", self._postales_payload("350g"))
        self.assertEqual(status_base, 200)
        self.assertEqual(status_plus, 200)
        self.assertAlmostEqual(body_plus["total_sin_iva"], round(body_base["total_sin_iva"] * 1.10, 6), places=6)

    def test_tarjetas_postales_extra_bloqueada(self):
        payload = self._postales_payload("300g")
        payload["terminaciones_extra"]["puntas_redondeadas"] = True
        status, body = self._post("/tarjetas-postales/cotizar", payload)
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "terminacion_extra_bloqueada_por_falta_de_datos")

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


if __name__ == "__main__":
    unittest.main()
