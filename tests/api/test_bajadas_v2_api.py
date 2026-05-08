import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestBajadasV2Api(unittest.TestCase):
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

    def _post_json(self, path: str, payload: dict):
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(
            self._url(path),
            data=data,
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

    def test_get_health(self):
        status, body = self._get_json("/health")
        self.assertEqual(status, 200)
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["service"], "bajadas_v2_api")

    def test_get_bajadas_health(self):
        status, body = self._get_json("/bajadas-v2/health")
        self.assertEqual(status, 200)
        self.assertEqual(body["status"], "ok")
        self.assertTrue(all(body["checks"].values()))

    def test_get_metrics(self):
        status, body = self._get_json("/bajadas-v2/metrics")
        self.assertEqual(status, 200)
        for key in [
            "OK",
            "DIFERENCIA_LEVE",
            "DIFERENCIA_MEDIA",
            "DIFERENCIA_ALTA",
            "SIN_COMPARACION",
            "casos_regresion",
            "precio_fijo_csv",
        ]:
            self.assertIn(key, body)

    def test_post_cotizar_caso_normal(self):
        payload = {
            "categoria": "Bajadas Fullcolor",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "liviano",
            "material": "Ilustracion",
            "gramaje": "150g",
            "cantidad_unidades": 30,
            "cantidad_rango": "1",
            "caras": "4/0",
            "urgencia": "normal",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertIn("precio_sin_iva", body)
        self.assertIn("precio_unitario_sin_iva", body)
        self.assertIn("total_sin_iva", body)
        self.assertIn("trazabilidad", body)
        self.assertEqual(body["cantidad_unidades"], 30)
        self.assertEqual(body["trazabilidad"]["recargo_urgencia_aplicado"], 0.0)
        self.assertAlmostEqual(body["precio_unitario_sin_iva"], body["precio_unitario_con_urgencia"], places=6)
        self.assertAlmostEqual(body["total_sin_iva"], body["total_con_urgencia"], places=6)
        self.assertEqual(body["fuente"], "modelo_d")

    def test_post_cotizar_express_aplica_15_y_total(self):
        payload = {
            "categoria": "Bajadas Fullcolor",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "liviano",
            "material": "Ilustracion",
            "gramaje": "150g",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "express",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["trazabilidad"]["recargo_urgencia_aplicado"], 0.15)
        self.assertAlmostEqual(body["precio_unitario_con_urgencia"], body["precio_unitario_sin_iva"] * 1.15, places=6)
        self.assertAlmostEqual(body["total_sin_iva"], body["precio_unitario_sin_iva"] * 30, places=6)
        self.assertAlmostEqual(body["total_con_urgencia"], body["precio_unitario_con_urgencia"] * 30, places=6)

    def test_post_cotizar_caso_precio_fijo_csv(self):
        payload = {
            "categoria": "Bajadas Blanco y Negro",
            "modo_color": "blanco_y_negro",
            "formato": "XL",
            "tipo_papel": "pesado",
            "material": "Triplex",
            "gramaje": "Triplex",
            "cantidad_unidades": 30,
            "cantidad_rango": "2 a 50",
            "caras": "1/0",
            "urgencia": "normal",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["fuente"], "precio_fijo_csv")
        self.assertEqual(body["regla_aplicada"], "PRECIO_FIJO_CSV")

    def test_error_urgencia_invalida(self):
        payload = {
            "categoria": "Bajadas Fullcolor",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "liviano",
            "material": "Ilustracion",
            "gramaje": "150g",
            "cantidad_unidades": 30,
            "cantidad_rango": "1",
            "caras": "4/0",
            "urgencia": "hoy",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "urgencia_invalida")

    def test_error_combinacion_inexistente(self):
        payload = {
            "categoria": "Bajadas Fullcolor",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "liviano",
            "material": "NO_EXISTE",
            "gramaje": "999g",
            "cantidad_unidades": 30,
            "cantidad_rango": "999",
            "caras": "4/0",
            "urgencia": "normal",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 404)
        self.assertEqual(body["error"], "combinacion_no_encontrada")


if __name__ == "__main__":
    unittest.main()
