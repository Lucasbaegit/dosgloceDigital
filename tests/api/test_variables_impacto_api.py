import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestVariablesImpactoApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config_paths = [
            ROOT / "data" / "variables_principales" / "variables_madre.json",
            ROOT / "data" / "bajadas_autoadhesivas" / "autoadhesivas_v1_config.json",
            ROOT / "data" / "stickers_circulares" / "formula_editable_config.json",
            ROOT / "data" / "stickers_corte_recto" / "formula_editable_config.json",
            ROOT / "data" / "imanes_corte_recto" / "formula_editable_config.json",
        ]
        cls.before = {path: path.read_text(encoding="utf-8") for path in cls.config_paths if path.exists()}
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
        try:
            with request.urlopen(self._url(path), timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            try:
                return exc.code, json.loads(exc.read().decode("utf-8"))
            finally:
                exc.close()

    def test_mapa_completo_incluye_variables_minimas(self):
        status, body = self._get_json("/variables-impacto")
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        keys = {item["key"] for item in body["variables"]}
        for expected in [
            "tipo_cambio_usd",
            "click_color",
            "obra_90g",
            "multiplicador_general",
            "laca_uv_factor_stickers_circulares",
            "corte_circular_factor_stickers_circulares",
            "multiplicador_comercial_stickers_circulares",
            "coeficiente_tamano_stickers_circulares_10cm",
            "coeficiente_cantidad_stickers_circulares_1000",
            "factor_laca_uv_stickers_corte_recto",
            "coeficiente_formato_stickers_corte_recto_10x7",
            "coeficiente_cantidad_stickers_corte_recto_1000",
            "factor_laca_uv_imanes_corte_recto",
            "coeficiente_formato_imanes_corte_recto_10x7",
            "coeficiente_cantidad_imanes_corte_recto_1000",
            "adicional_tinta_blanca_base_1_copia",
            "matriz_pdf",
            "factor_ajuste_pdf",
            "rango_fijo",
            "bloqueado",
        ]:
            self.assertIn(expected, keys)
        self.assertTrue(all("impacta_hoy" in rel for rel in body["relaciones"]))

    def test_resumen_devuelve_conteos(self):
        status, body = self._get_json("/variables-impacto/resumen")
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertGreaterEqual(body["variables_editables"], 5)
        self.assertGreaterEqual(body["relaciones_conectadas"], 10)
        self.assertGreaterEqual(body["relaciones_documentadas_no_conectadas"], 1)
        self.assertGreaterEqual(body["productos_bloqueados"], 2)

    def test_variable_click_color_devuelve_productos(self):
        status, body = self._get_json("/variables-impacto/variable/click_color")
        self.assertEqual(status, 200)
        productos = {rel["producto_key"] for rel in body["relaciones"]}
        self.assertIn("stickers_circulares", productos)
        self.assertIn("bajadas_fullcolor_byn", productos)
        self.assertTrue(any(rel["impacta_hoy"] for rel in body["relaciones"]))
        self.assertTrue(any(rel["estado"] == "preparado_no_conectado" for rel in body["relaciones"]))

    def test_obra_90g_no_sobregeneraliza_autoadhesivas(self):
        status, body = self._get_json("/variables-impacto/variable/obra_90g")
        self.assertEqual(status, 200)
        productos = {rel["producto_key"] for rel in body["relaciones"]}
        self.assertIn("stickers_circulares", productos)
        self.assertNotIn("bajadas_autoadhesivas", productos)
        self.assertTrue(all(rel["producto_key"] != "bajadas_autoadhesivas" for rel in body["relaciones"]))
        self.assertTrue(any(rel["impacta_hoy"] and rel["producto_key"] == "stickers_circulares" for rel in body["relaciones"]))

    def test_variables_editables_stickers_circulares_tienen_scope_contextual(self):
        status, body = self._get_json("/variables-impacto/variable/coeficiente_tamano_stickers_circulares_10cm")
        self.assertEqual(status, 200)
        self.assertEqual(body["variable"], "coeficiente_tamano_stickers_circulares_10cm")
        rel = body["relaciones"][0]
        self.assertEqual(rel["producto_key"], "stickers_circulares")
        self.assertTrue(rel["editable"])
        self.assertTrue(rel["impacta_hoy"])
        self.assertEqual(rel["aplica_a"], {"formatos": ["10cm"]})

        status, body = self._get_json("/variables-impacto/variable/coeficiente_cantidad_stickers_circulares_1000")
        self.assertEqual(status, 200)
        rel = body["relaciones"][0]
        self.assertEqual(rel["aplica_a"], {"cantidades": [1000]})

        status, body = self._get_json("/variables-impacto/variable/laca_uv_factor_stickers_circulares")
        self.assertEqual(status, 200)
        rel = body["relaciones"][0]
        self.assertEqual(rel["aplica_a"], {"terminaciones": ["con_laca_uv", "con_laca_uv_brillo"]})

    def test_tinta_blanca_es_variable_operativa_autoadhesivas(self):
        status, body = self._get_json("/variables-impacto/variable/adicional_tinta_blanca_base_1_copia")
        self.assertEqual(status, 200)
        productos = {rel["producto_key"] for rel in body["relaciones"]}
        self.assertIn("bajadas_autoadhesivas", productos)
        self.assertTrue(any(rel["impacta_hoy"] and rel["producto_key"] == "bajadas_autoadhesivas" for rel in body["relaciones"]))

    def test_variables_corte_recto_tienen_scope_contextual(self):
        status, body = self._get_json("/variables-impacto/variable/coeficiente_formato_stickers_corte_recto_10x7")
        self.assertEqual(status, 200)
        rel = body["relaciones"][0]
        self.assertEqual(rel["producto_key"], "stickers_corte_recto")
        self.assertEqual(rel["aplica_a"], {"formatos": ["10x7"]})
        self.assertTrue(rel["impacta_hoy"])

        status, body = self._get_json("/variables-impacto/variable/coeficiente_cantidad_imanes_corte_recto_1000")
        self.assertEqual(status, 200)
        rel = body["relaciones"][0]
        self.assertEqual(rel["producto_key"], "imanes_corte_recto")
        self.assertEqual(rel["aplica_a"], {"cantidades": [1000]})
        self.assertTrue(rel["impacta_hoy"])

    def test_variables_corte_recto_no_contaminan_bajadas(self):
        status, body = self._get_json("/variables-impacto/producto/bajadas_fullcolor_byn")
        self.assertEqual(status, 200)
        variables = {rel["variable"] for rel in body["relaciones"]}
        self.assertNotIn("factor_laca_uv_stickers_corte_recto", variables)
        self.assertNotIn("factor_laca_uv_imanes_corte_recto", variables)
        self.assertFalse(any(variable.startswith("coeficiente_formato_stickers_corte_recto_") for variable in variables))
        self.assertFalse(any(variable.startswith("coeficiente_formato_imanes_corte_recto_") for variable in variables))

    def test_variable_desconocida_devuelve_404_controlado(self):
        status, body = self._get_json("/variables-impacto/variable/no_existe")
        self.assertEqual(status, 404)
        self.assertEqual(body["error"], "variable_no_encontrada")

    def test_producto_conocido_devuelve_variables(self):
        status, body = self._get_json("/variables-impacto/producto/bajadas_fullcolor_byn")
        self.assertEqual(status, 200)
        variables = {rel["variable"] for rel in body["relaciones"]}
        self.assertIn("click_color", variables)
        self.assertIn("rango_fijo", variables)
        self.assertTrue(all("ruta_calculo" in rel for rel in body["relaciones"]))

    def test_bloqueados_aparecen_como_bloqueado(self):
        status, body = self._get_json("/variables-impacto")
        self.assertEqual(status, 200)
        blocked = {item["key"]: item for item in body["productos"] if item["estado"] == "bloqueado"}
        self.assertIn("membretes", blocked)
        self.assertIn("opp_stickers_circulares", blocked)
        blocked_rels = [rel for rel in body["relaciones"] if rel["estado"] == "bloqueado"]
        self.assertTrue(blocked_rels)
        self.assertTrue(all(not rel["impacta_hoy"] for rel in blocked_rels))

    def test_endpoint_no_modifica_configs(self):
        for path in [
            "/variables-impacto",
            "/variables-impacto/resumen",
            "/variables-impacto/variable/adicional_tinta_blanca_base_1_copia",
            "/variables-impacto/producto/stickers_circulares",
        ]:
            status, body = self._get_json(path)
            self.assertEqual(status, 200)
            self.assertTrue(body["ok"])
        after = {path: path.read_text(encoding="utf-8") for path in self.before}
        self.assertEqual(self.before, after)


if __name__ == "__main__":
    unittest.main()
