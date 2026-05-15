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

    def _payload(self, cantidad: int, terminacion: str, caras: str, urgencia: str = "normal", gramaje: str = "300g") -> dict:
        return {
            "categoria": "Tarjetas Personales",
            "producto": "9x5",
            "formato": "9x5",
            "papel": f"{gramaje} Ilustracion",
            "gramaje": gramaje,
            "terminacion": terminacion,
            "caras": caras,
            "cantidad_unidades": cantidad,
            "urgencia": urgencia,
            "terminaciones_extra": {
                "puntas_redondeadas": False,
                "agujerado": False,
            },
        }

    def test_tarjetas_100_sin_laminar_4_0(self):
        status, body = self._post_json("/tarjetas-9x5/cotizar", self._payload(100, "sin_laminar", "4/0"))
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 5139, places=6)

    def test_tarjetas_350g_aplica_10_pct(self):
        status_base, body_base = self._post_json("/tarjetas-9x5/cotizar", self._payload(100, "sin_laminar", "4/0", gramaje="300g"))
        status_plus, body_plus = self._post_json("/tarjetas-9x5/cotizar", self._payload(100, "sin_laminar", "4/0", gramaje="350g"))
        self.assertEqual(status_base, 200)
        self.assertEqual(status_plus, 200)
        self.assertAlmostEqual(body_plus["total_sin_iva"], round(body_base["total_sin_iva"] * 1.10, 6), places=6)

    def test_tarjetas_terminacion_extra_bloqueada(self):
        payload = self._payload(100, "sin_laminar", "4/0")
        payload["terminaciones_extra"]["agujerado"] = True
        status, body = self._post_json("/tarjetas-9x5/cotizar", payload)
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "terminacion_extra_bloqueada_por_falta_de_datos")


if __name__ == "__main__":
    unittest.main()
