import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestCarpetasSobresApi(unittest.TestCase):
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

    def test_carpetas_ok(self):
        status, body = self._post(
            "/carpetas/cotizar",
            {
                "categoria": "Carpetas",
                "producto": "carpeta_a4",
                "formato": "A4",
                "papel": "300g Ilustracion",
                "gramaje": "300g",
                "terminacion": "laca_uv",
                "caras": "4/4",
                "cantidad_unidades": 100,
                "solapa_impresa": True,
                "urgencia": "normal",
            },
        )
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 187100, places=6)
        self.assertEqual(body["trazabilidad"]["modo_precio"], "pdf_fijo")

    def test_carpetas_terminacion_invalida(self):
        status, body = self._post(
            "/carpetas/cotizar",
            {
                "categoria": "Carpetas",
                "producto": "carpeta_a4",
                "formato": "A4",
                "papel": "300g Ilustracion",
                "gramaje": "300g",
                "terminacion": "barniz",
                "caras": "4/4",
                "cantidad_unidades": 100,
                "solapa_impresa": True,
                "urgencia": "normal",
            },
        )
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "terminacion_no_soportada")

    def test_sobres_ok(self):
        status, body = self._post(
            "/sobres/cotizar",
            {
                "categoria": "Sobres",
                "producto": "sobre",
                "tipo_sobre": "sobre_bolsa_27x37",
                "papel": "63g",
                "color": "blanco",
                "caras": "4/0",
                "cantidad_unidades": 1000,
                "urgencia": "normal",
            },
        )
        self.assertEqual(status, 200)
        self.assertAlmostEqual(body["total_sin_iva"], 536000, places=6)
        self.assertEqual(body["trazabilidad"]["modo_precio"], "pdf_fijo")

    def test_sobres_caras_invalidas(self):
        status, body = self._post(
            "/sobres/cotizar",
            {
                "categoria": "Sobres",
                "producto": "sobre",
                "tipo_sobre": "sobre_bolsa_27x37",
                "papel": "63g",
                "color": "blanco",
                "caras": "4/4",
                "cantidad_unidades": 100,
                "urgencia": "normal",
            },
        )
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "caras_no_soportadas")


if __name__ == "__main__":
    unittest.main()
