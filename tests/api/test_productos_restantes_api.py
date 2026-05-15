import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class T(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = create_server(host="127.0.0.1", port=0, project_root=ROOT)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join(timeout=2)

    def post(self,path,payload):
        req=request.Request(f"http://127.0.0.1:{self.port}{path}",data=json.dumps(payload).encode("utf-8"),headers={"Content-Type":"application/json"},method="POST")
        try:
            with request.urlopen(req,timeout=5) as resp:
                return resp.status,json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            return exc.code,json.loads(exc.read().decode("utf-8"))

    def test_troquelado(self):
        s,p=self.post('/troquelado-digital/cotizar',{"categoria":"Troquelado Digital","producto":"troquelado_digital","familia_tamano":"mas_de_15x15","cantidad_unidades":120,"urgencia":"normal"})
        self.assertEqual(s,200); self.assertEqual(p['precio_unitario_sin_iva'],502)

    def test_tarjetas_troq(self):
        s,p=self.post('/tarjetas-troqueladas-circulares/cotizar',{"categoria":"Tarjetas Troqueladas Circulares","producto":"tarjeta_troquelada_circular","formato":"1cm","caras":"4/0","cantidad_unidades":100,"urgencia":"normal"})
        self.assertEqual(s,200); self.assertEqual(p['total_sin_iva'],2681)

    def test_tarjetas_troq_laminado_dos_caras_veinte_por_ciento(self):
        s,p=self.post('/tarjetas-troqueladas-circulares/cotizar',{"categoria":"Tarjetas Troqueladas Circulares","producto":"tarjeta_troquelada_circular","formato":"1cm","caras":"4/0","cantidad_unidades":100,"adicional_laminado":"laminado_mate","caras_adicional_laminado":2,"urgencia":"normal"})
        self.assertEqual(s,200); self.assertAlmostEqual(p['total_sin_iva'],3217.2,places=6)

    def test_tarjetas_troq_laminado_invalido(self):
        s,p=self.post('/tarjetas-troqueladas-circulares/cotizar',{"categoria":"Tarjetas Troqueladas Circulares","producto":"tarjeta_troquelada_circular","formato":"1cm","caras":"4/0","cantidad_unidades":100,"adicional_laminado":"laca","caras_adicional_laminado":1,"urgencia":"normal"})
        self.assertEqual(s,400); self.assertEqual(p['error'],'laminado_no_soportado')

    def test_plancha(self):
        s,p=self.post('/plancha-iman-impreso/cotizar',{"categoria":"Plancha de Im?n Impreso","producto":"plancha_iman_impreso","variante":"papel_300g_ilustracion","cantidad_unidades":500,"urgencia":"normal"})
        self.assertEqual(s,200); self.assertEqual(p['total_sin_iva'],965500)

    def test_agendas(self):
        s,p=self.post('/agendas-cuadernos/cotizar',{"categoria":"Agendas / Cuadernos","producto":"cuaderno_universitario_ringwire","formato":"A4","paginas":160,"cantidad_unidades":2,"urgencia":"normal"})
        self.assertEqual(s,200); self.assertEqual(p['total_sin_iva'],7800)

if __name__=="__main__":
    unittest.main()
