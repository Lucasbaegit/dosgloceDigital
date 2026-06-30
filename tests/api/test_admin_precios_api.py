import json
import sys
import threading
import unittest
from pathlib import Path
from urllib import error, request

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server


class TestAdminPreciosApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.paths = [
            ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_final.json",
            ROOT / "data" / "variables_globales" / "costos_base.json",
            ROOT / "data" / "stickers_circulares" / "formula_editable_config.json",
            ROOT / "data" / "stickers_corte_recto" / "formula_editable_config.json",
            ROOT / "data" / "imanes_corte_recto" / "formula_editable_config.json",
            ROOT / "data" / "bajadas_v2" / "formula_editable_config.json",
            ROOT / "data" / "tarjetas_9x5" / "formula_editable_config.json",
            ROOT / "data" / "tarjetas_postales" / "formula_editable_config.json",
            ROOT / "data" / "folletos" / "formula_editable_config.json",
            ROOT / "data" / "carpetas" / "formula_editable_config.json",
            ROOT / "data" / "sobres" / "formula_editable_config.json",
            ROOT / "data" / "plancha_iman_impreso" / "formula_editable_config.json",
            ROOT / "data" / "agendas_cuadernos" / "formula_editable_config.json",
            ROOT / "data" / "bajadas_autoadhesivas" / "autoadhesivas_v1_config.json",
            ROOT / "data" / "variables_principales" / "variables_madre.json",
        ]
        cls.history_path = ROOT / "data" / "admin_precios" / "historial_cambios.json"
        cls.originals = {path: path.read_text(encoding="utf-8") for path in cls.paths if path.exists()}
        cls.history_original = cls.history_path.read_text(encoding="utf-8") if cls.history_path.exists() else None
        cls.backup_dir = ROOT / "data" / "backups" / "variables_principales"
        cls.backups_before = set(cls.backup_dir.glob("*.json")) if cls.backup_dir.exists() else set()
        cls.server = create_server(host="127.0.0.1", port=0, project_root=ROOT)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)
        for path, content in cls.originals.items():
            path.write_text(content, encoding="utf-8")
        if cls.history_original is None:
            if cls.history_path.exists():
                cls.history_path.unlink()
        else:
            cls.history_path.parent.mkdir(parents=True, exist_ok=True)
            cls.history_path.write_text(cls.history_original, encoding="utf-8")
        if cls.backup_dir.exists():
            for path in set(cls.backup_dir.glob("*.json")) - cls.backups_before:
                path.unlink()

    def _url(self, path: str) -> str:
        return f"http://127.0.0.1:{self.port}{path}"

    def call(self, method: str, path: str, payload=None):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        req = request.Request(
            self._url(path),
            data=data,
            headers={"Content-Type": "application/json"},
            method=method,
        )
        try:
            with request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            try:
                return exc.code, json.loads(exc.read().decode("utf-8"))
            finally:
                exc.close()

    def test_get_variables_editables_controladas(self):
        status, body = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        keys = {item["key"] for item in body["variables"]}
        self.assertIn("click_color", keys)
        self.assertIn("tipo_cambio_usd", keys)
        self.assertIn("obra_90g", keys)
        self.assertIn("multiplicador_general", keys)
        self.assertIn("adicional_tinta_blanca_base_1_copia", keys)
        self.assertIn("laca_uv_factor_stickers_circulares", keys)
        self.assertIn("corte_circular_factor_stickers_circulares", keys)
        self.assertIn("multiplicador_comercial_stickers_circulares", keys)
        self.assertIn("coeficiente_tamano_stickers_circulares_10cm", keys)
        self.assertIn("coeficiente_cantidad_stickers_circulares_1000", keys)
        self.assertIn("factor_laca_uv_stickers_corte_recto", keys)
        self.assertIn("coeficiente_formato_stickers_corte_recto_10x7", keys)
        self.assertIn("coeficiente_cantidad_stickers_corte_recto_1000", keys)
        self.assertIn("factor_laca_uv_imanes_corte_recto", keys)
        self.assertIn("coeficiente_formato_imanes_corte_recto_10x7", keys)
        self.assertIn("coeficiente_cantidad_imanes_corte_recto_1000", keys)
        self.assertIn("factor_laca_uv_bajadas", keys)
        self.assertIn("factor_tinta_blanca_autoadhesivas", keys)
        self.assertIn("coeficiente_formato_bajadas_A3plus", keys)
        self.assertIn("factor_gramaje_tarjetas_9x5_350g", keys)
        self.assertIn("factor_gramaje_tarjetas_postales_350g", keys)
        self.assertIn("factor_formato_folletos_A4", keys)
        self.assertIn("factor_solapa_carpetas", keys)
        self.assertIn("coeficiente_tipo_sobre_sobre_bolsa_27x37", keys)
        self.assertIn("papel_300g_ilustracion_plancha_iman", keys)
        self.assertIn("coeficiente_paginas_agendas_72", keys)
        self.assertNotIn("tabla_pdf", keys)
        self.assertTrue(all(item["editable"] for item in body["variables"]))

    def test_multiplicadores_comerciales_por_familia_expuestos(self):
        status, body = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        variables = {item["key"]: item for item in body["variables"]}
        expected = [
            "multiplicador_comercial_bajadas",
            "multiplicador_comercial_carpetas",
            "multiplicador_comercial_folletos",
            "multiplicador_comercial_sobres",
            "multiplicador_comercial_agendas",
            "multiplicador_comercial_tarjetas_9x5",
            "multiplicador_comercial_tarjetas_postales",
            "multiplicador_comercial_stickers_circulares",
            "multiplicador_comercial_stickers_corte_recto",
            "multiplicador_comercial_imanes_corte_recto",
            "multiplicador_comercial_plancha_iman",
        ]
        for key in expected:
            with self.subTest(key=key):
                self.assertIn(key, variables)
                self.assertTrue(variables[key]["editable"])
                self.assertEqual(variables[key]["unit"], "factor")
                self.assertGreater(float(variables[key]["value"]), 0)

    def test_preview_click_color_funciona(self):
        status, body = self.call("POST", "/admin-precios/preview", {"variable": "click_color", "nuevo_valor": 39})
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertEqual(body["variable"], "click_color")
        self.assertEqual(body["nuevo_valor"], 39)
        self.assertIn("diferencia", body)
        self.assertIn("impactos", body)
        self.assertTrue(body["requiere_confirmacion"])

    def test_preview_rechaza_variable_desconocida_y_valor_invalido(self):
        status, body = self.call("POST", "/admin-precios/preview", {"variable": "no_existe", "nuevo_valor": 1})
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "variable_no_editable")
        status, body = self.call("POST", "/admin-precios/preview", {"variable": "click_color", "nuevo_valor": "abc"})
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "valor_no_numerico")

    def test_aplicar_rechaza_sin_confirmacion_y_variable_no_editable(self):
        status, body = self.call("POST", "/admin-precios/aplicar", {"variable": "click_color", "nuevo_valor": 40})
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "confirmacion_requerida")
        status, body = self.call(
            "POST",
            "/admin-precios/aplicar",
            {"variable": "matriz_pdf", "nuevo_valor": 40, "confirmado": True},
        )
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "variable_no_editable")

    def test_aplicar_crea_backup_historial_y_refleja_valor(self):
        status, before = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        current = next(item for item in before["variables"] if item["key"] == "adicional_tinta_blanca_base_1_copia")
        new_value = float(current["value"]) + 1

        status, body = self.call(
            "POST",
            "/admin-precios/aplicar",
            {
                "variable": "adicional_tinta_blanca_base_1_copia",
                "nuevo_valor": new_value,
                "confirmado": True,
            },
        )
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertTrue(body["backup"])
        self.assertIn("historial", body)

        status, after = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        updated = next(item for item in after["variables"] if item["key"] == "adicional_tinta_blanca_base_1_copia")
        self.assertEqual(updated["value"], new_value)

        status, history = self.call("GET", "/admin-precios/historial")
        self.assertEqual(status, 200)
        self.assertTrue(any(item["variable"] == "adicional_tinta_blanca_base_1_copia" for item in history["historial"]))

    def test_no_modifica_precio_pdf_fijo_tarjetas(self):
        payload = {
            "categoria": "Tarjetas Personales",
            "producto": "9x5",
            "formato": "9x5",
            "papel": "300g Ilustracion",
            "gramaje": "300g",
            "terminacion": "sin_laminar",
            "caras": "4/0",
            "cantidad_unidades": 100,
            "terminaciones_extra": {"puntas_redondeadas": False, "agujerado": False},
            "urgencia": "normal",
        }
        status, before = self.call("POST", "/tarjetas-9x5/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(before["total_sin_iva"], 5139)

        status, preview = self.call("POST", "/admin-precios/preview", {"variable": "click_color", "nuevo_valor": 41})
        self.assertEqual(status, 200)
        self.assertTrue(preview["ok"])

        status, after = self.call("POST", "/tarjetas-9x5/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(after["total_sin_iva"], 5139)

    def test_variable_stickers_circulares_cambia_base_y_preserva_total_pdf(self):
        quote_payload = {
            "categoria": "Stickers Circulares",
            "producto": "sticker_circular",
            "material": "obra_ilustracion_90g",
            "formato": "10cm",
            "terminacion": "con_laca_uv",
            "cantidad_unidades": 1000,
            "urgencia": "normal",
        }
        status, before_quote = self.call("POST", "/stickers-circulares/cotizar", quote_payload)
        self.assertEqual(status, 200)
        self.assertEqual(before_quote["total_sin_iva"], 85980)
        before_base = before_quote["trazabilidad"]["precio_base_estimado"]

        status, variables = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        current = next(item for item in variables["variables"] if item["key"] == "coeficiente_tamano_stickers_circulares_10cm")
        new_value = float(current["value"]) + 0.1

        status, preview = self.call(
            "POST",
            "/admin-precios/preview",
            {"variable": "coeficiente_tamano_stickers_circulares_10cm", "nuevo_valor": new_value},
        )
        self.assertEqual(status, 200)
        self.assertTrue(preview["ok"])
        self.assertTrue(any(item["producto_key"] == "stickers_circulares" for item in preview["impactos"]))
        self.assertIn("precio final conserva calibracion PDF", preview["precios_ejemplo"][0]["detalle"])

        status, applied = self.call(
            "POST",
            "/admin-precios/aplicar",
            {
                "variable": "coeficiente_tamano_stickers_circulares_10cm",
                "nuevo_valor": new_value,
                "confirmado": True,
            },
        )
        self.assertEqual(status, 200)
        self.assertTrue(applied["backup"])

        status, after_quote = self.call("POST", "/stickers-circulares/cotizar", quote_payload)
        self.assertEqual(status, 200)
        self.assertEqual(after_quote["total_sin_iva"], 85980)
        self.assertNotEqual(after_quote["trazabilidad"]["precio_base_estimado"], before_base)

    def test_variable_stickers_corte_recto_cambia_base_y_preserva_total_pdf(self):
        quote_payload = {
            "categoria": "Stickers Corte Recto",
            "producto": "sticker_corte_recto",
            "formato": "10x7",
            "terminacion": "con_laca_uv",
            "cantidad_unidades": 1000,
            "urgencia": "normal",
        }
        status, before_quote = self.call("POST", "/stickers-corte-recto/cotizar", quote_payload)
        self.assertEqual(status, 200)
        self.assertEqual(before_quote["total_sin_iva"], 61703)
        before_base = before_quote["trazabilidad"]["precio_base_estimado"]

        status, variables = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        current = next(item for item in variables["variables"] if item["key"] == "coeficiente_formato_stickers_corte_recto_10x7")
        new_value = float(current["value"]) + 0.1

        status, preview = self.call(
            "POST",
            "/admin-precios/preview",
            {"variable": "coeficiente_formato_stickers_corte_recto_10x7", "nuevo_valor": new_value},
        )
        self.assertEqual(status, 200)
        self.assertTrue(preview["ok"])
        self.assertTrue(any(item["producto_key"] == "stickers_corte_recto" for item in preview["impactos"]))
        self.assertIn("precio final conserva calibracion PDF", preview["precios_ejemplo"][0]["detalle"])

        status, applied = self.call(
            "POST",
            "/admin-precios/aplicar",
            {
                "variable": "coeficiente_formato_stickers_corte_recto_10x7",
                "nuevo_valor": new_value,
                "confirmado": True,
            },
        )
        self.assertEqual(status, 200)
        self.assertTrue(applied["backup"])
        self.assertTrue(any("data/stickers_corte_recto/formula_editable_config.json" in path for path in applied["archivos_modificados"]))

        status, after_quote = self.call("POST", "/stickers-corte-recto/cotizar", quote_payload)
        self.assertEqual(status, 200)
        self.assertEqual(after_quote["total_sin_iva"], 61703)
        self.assertNotEqual(after_quote["trazabilidad"]["precio_base_estimado"], before_base)

    def test_variables_bajadas_tarjetas_folletos_preview_y_preservan_precios(self):
        cases = [
            (
                "factor_laca_uv_bajadas",
                "/bajadas-v2/cotizar",
                {
                    "categoria": "Bajadas Fullcolor",
                    "modo_color": "fullcolor",
                    "formato": "A3+",
                    "tipo_papel": "liviano",
                    "material": "Ilustracion",
                    "gramaje": "150g",
                    "cantidad_unidades": 53,
                    "cantidad_rango": "51 a 100",
                    "caras": "4/0",
                    "urgencia": "normal",
                    "adicional_laminado": "laca",
                    "caras_adicional_laminado": 1,
                    "adicional_troquelado": False,
                },
                38584,
            ),
            (
                "factor_gramaje_tarjetas_9x5_350g",
                "/tarjetas-9x5/cotizar",
                {
                    "categoria": "Tarjetas Personales",
                    "producto": "9x5",
                    "formato": "9x5",
                    "papel": "350g Ilustracion",
                    "gramaje": "350g",
                    "terminacion": "sin_laminar",
                    "caras": "4/0",
                    "cantidad_unidades": 100,
                    "terminaciones_extra": {"puntas_redondeadas": False, "agujerado": False},
                    "urgencia": "normal",
                },
                5652.9,
            ),
            (
                "factor_gramaje_tarjetas_postales_350g",
                "/tarjetas-postales/cotizar",
                {
                    "categoria": "Tarjetas Postales",
                    "producto": "postal",
                    "formato": "postal",
                    "papel": "350g Ilustracion",
                    "gramaje": "350g",
                    "terminacion": "sin_laminar",
                    "caras": "4/0",
                    "cantidad_unidades": 100,
                    "terminaciones_extra": {"puntas_redondeadas": False, "agujerado": False},
                    "urgencia": "normal",
                },
                12025.2,
            ),
            (
                "factor_formato_folletos_A4",
                "/folletos/cotizar",
                {
                    "categoria": "Folletos",
                    "producto": "folleto",
                    "formato": "A4",
                    "papel": "80g Ilustracion",
                    "gramaje": "80g",
                    "modo_color": "escala_grises",
                    "caras": "1/1",
                    "cantidad_unidades": 1000,
                    "urgencia": "normal",
                },
                119247,
            ),
        ]
        for variable, endpoint, quote_payload, expected_total in cases:
            with self.subTest(variable=variable):
                status, before_quote = self.call("POST", endpoint, quote_payload)
                self.assertEqual(status, 200)
                self.assertEqual(before_quote["total_sin_iva"], expected_total)

                status, variables = self.call("GET", "/admin-precios/variables-editables")
                current = next(item for item in variables["variables"] if item["key"] == variable)
                new_value = float(current["value"]) + 0.01

                status, preview = self.call("POST", "/admin-precios/preview", {"variable": variable, "nuevo_valor": new_value})
                self.assertEqual(status, 200)
                self.assertTrue(preview["ok"])
                self.assertTrue(preview["precios_ejemplo"])

                status, applied = self.call(
                    "POST",
                    "/admin-precios/aplicar",
                    {"variable": variable, "nuevo_valor": new_value, "confirmado": True},
                )
                self.assertEqual(status, 200)
                self.assertTrue(applied["backup"])
                self.assertIn("historial", applied)

                status, after_quote = self.call("POST", endpoint, quote_payload)
                self.assertEqual(status, 200)
                self.assertEqual(after_quote["total_sin_iva"], expected_total)


    def test_variables_carpetas_sobres_plancha_agendas_preview_y_preservan_precios(self):
        cases = [
            (
                "factor_solapa_carpetas",
                "/carpetas/cotizar",
                {
                    "categoria": "Carpetas",
                    "producto": "carpeta_a4",
                    "formato": "A4",
                    "papel": "300g Ilustracion",
                    "gramaje": "300g",
                    "terminacion": "sin_laminar",
                    "caras": "4/0",
                    "cantidad_unidades": 1,
                    "solapa_impresa": True,
                    "urgencia": "normal",
                },
                2017,
            ),
            (
                "coeficiente_tipo_sobre_sobre_bolsa_27x37",
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
                536000,
            ),
            (
                "papel_300g_ilustracion_plancha_iman",
                "/plancha-iman-impreso/cotizar",
                {
                    "categoria": "Plancha de Im?n Impreso",
                    "producto": "plancha_iman_impreso",
                    "variante": "papel_300g_ilustracion",
                    "cantidad_unidades": 500,
                    "urgencia": "normal",
                },
                965500,
            ),
            (
                "coeficiente_paginas_agendas_72",
                "/agendas-cuadernos/cotizar",
                {
                    "categoria": "Agendas / Cuadernos",
                    "producto": "agenda_2026",
                    "formato": "A5",
                    "paginas": 72,
                    "cantidad_unidades": 2,
                    "urgencia": "normal",
                },
                6000,
            ),
        ]
        for variable, endpoint, quote_payload, expected_total in cases:
            with self.subTest(variable=variable):
                status, before_quote = self.call("POST", endpoint, quote_payload)
                self.assertEqual(status, 200)
                self.assertEqual(before_quote["total_sin_iva"], expected_total)

                status, variables = self.call("GET", "/admin-precios/variables-editables")
                self.assertEqual(status, 200)
                current = next(item for item in variables["variables"] if item["key"] == variable)
                new_value = float(current["value"]) + 0.01

                status, preview = self.call("POST", "/admin-precios/preview", {"variable": variable, "nuevo_valor": new_value})
                self.assertEqual(status, 200)
                self.assertTrue(preview["ok"])
                self.assertTrue(preview["precios_ejemplo"])

                status, applied = self.call(
                    "POST",
                    "/admin-precios/aplicar",
                    {"variable": variable, "nuevo_valor": new_value, "confirmado": True},
                )
                self.assertEqual(status, 200)
                self.assertTrue(applied["backup"])
                self.assertIn("historial", applied)

                status, after_quote = self.call("POST", endpoint, quote_payload)
                self.assertEqual(status, 200)
                self.assertEqual(after_quote["total_sin_iva"], expected_total)

    def test_variable_imanes_corte_recto_cambia_base_y_preserva_total_pdf(self):
        quote_payload = {
            "categoria": "Imanes Corte Recto",
            "producto": "iman_corte_recto",
            "formato": "10x7",
            "papel": "300g Ilustracion",
            "gramaje": "300g",
            "terminacion": "con_laca_uv",
            "cantidad_unidades": 1000,
            "urgencia": "normal",
        }
        status, before_quote = self.call("POST", "/imanes-corte-recto/cotizar", quote_payload)
        self.assertEqual(status, 200)
        self.assertEqual(before_quote["total_sin_iva"], 153680)
        before_base = before_quote["trazabilidad"]["precio_base_estimado"]

        status, variables = self.call("GET", "/admin-precios/variables-editables")
        self.assertEqual(status, 200)
        current = next(item for item in variables["variables"] if item["key"] == "coeficiente_formato_imanes_corte_recto_10x7")
        new_value = float(current["value"]) + 0.1

        status, preview = self.call(
            "POST",
            "/admin-precios/preview",
            {"variable": "coeficiente_formato_imanes_corte_recto_10x7", "nuevo_valor": new_value},
        )
        self.assertEqual(status, 200)
        self.assertTrue(preview["ok"])
        self.assertTrue(any(item["producto_key"] == "imanes_corte_recto" for item in preview["impactos"]))

        status, applied = self.call(
            "POST",
            "/admin-precios/aplicar",
            {
                "variable": "coeficiente_formato_imanes_corte_recto_10x7",
                "nuevo_valor": new_value,
                "confirmado": True,
            },
        )
        self.assertEqual(status, 200)
        self.assertTrue(applied["backup"])
        self.assertTrue(any("data/imanes_corte_recto/formula_editable_config.json" in path for path in applied["archivos_modificados"]))

        status, after_quote = self.call("POST", "/imanes-corte-recto/cotizar", quote_payload)
        self.assertEqual(status, 200)
        self.assertEqual(after_quote["total_sin_iva"], 153680)
        self.assertNotEqual(after_quote["trazabilidad"]["precio_base_estimado"], before_base)


if __name__ == "__main__":
    unittest.main()
