import json
import sys
import threading
import unittest
from io import BytesIO
from pathlib import Path
from urllib import error, request

from openpyxl import Workbook

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from api.main import create_server
from export import PricesExcelExporter, PricesTablesBuilder


class TestImportExcelMaestroApi(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.watched_paths = [
            ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_final.json",
            ROOT / "data" / "stickers_circulares" / "formula_editable_config.json",
            ROOT / "data" / "stickers_corte_recto" / "formula_editable_config.json",
            ROOT / "data" / "imanes_corte_recto" / "formula_editable_config.json",
            ROOT / "data" / "bajadas_autoadhesivas" / "autoadhesivas_v1_config.json",
            ROOT / "data" / "variables_principales" / "variables_madre.json",
        ]
        cls.originals = {path: path.read_text(encoding="utf-8") for path in cls.watched_paths if path.exists()}
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

    def call_raw(self, path):
        with request.urlopen(f"http://127.0.0.1:{self.port}{path}", timeout=10) as resp:
            return resp.status, dict(resp.headers.items()), resp.read()

    def upload(self, filename, content, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"):
        boundary = "----codex-preview-boundary"
        body = b"\r\n".join([
            f"--{boundary}".encode(),
            f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode(),
            f"Content-Type: {content_type}".encode(),
            b"",
            content,
            f"--{boundary}--".encode(),
            b"",
        ])
        req = request.Request(
            f"http://127.0.0.1:{self.port}/import/excel-maestro/preview",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=10) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            try:
                return exc.code, json.loads(exc.read().decode("utf-8"))
            finally:
                exc.close()

    def workbook_from_rows(self, rows, sheet_name="01_VARIABLES_MADRE"):
        wb = Workbook()
        ws = wb.active
        ws.title = sheet_name
        headers = ["key", "label", "value", "unit", "editable_en_sistema", "impacta_hoy", "estado_operativo"]
        ws.append(headers)
        for row in rows:
            ws.append([row.get(header) for header in headers])
        stream = BytesIO()
        wb.save(stream)
        return stream.getvalue()

    def valid_export_payload(self):
        filename, payload = PricesExcelExporter(ROOT).render(PricesTablesBuilder(ROOT).build())
        return filename, payload

    def test_preview_valido_detecta_cambios_y_bloqueos(self):
        payload = self.workbook_from_rows([
            {"key": "tipo_cambio_usd", "label": "Tipo de cambio USD", "value": 1450, "unit": "ARS/USD", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "click_color", "label": "Click color", "value": 301, "unit": "ARS", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "obra_90g", "label": "Obra 90g", "value": 19.5, "unit": "USD", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "multiplicador_general", "label": "Multiplicador", "value": 1.9, "unit": "factor", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "adicional_tinta_blanca_base_1_copia", "label": "Tinta blanca", "value": 650, "unit": "ARS/unidad", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "coeficiente_formato_stickers_corte_recto_10x7", "label": "Coef Sticker", "value": 2.2, "unit": "factor", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "coeficiente_formato_imanes_corte_recto_10x7", "label": "Coef Iman", "value": 2.4, "unit": "factor", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "ilustracion_150g_65x95_usd", "label": "Ilustracion", "value": 12.3, "unit": "USD", "editable_en_sistema": False, "impacta_hoy": False, "estado_operativo": "preparada_no_conectada"},
            {"key": "variable_desconocida", "label": "Nueva", "value": 1, "unit": "ARS", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
        ])
        status, body = self.upload("cotizador_digital_maestro.xlsx", payload)
        self.assertEqual(status, 200)
        self.assertTrue(body["ok"])
        self.assertEqual(body["hoja_leida"], "01_VARIABLES_MADRE")
        changed_keys = {item["key"] for item in body["cambios"]}
        self.assertIn("tipo_cambio_usd", changed_keys)
        self.assertIn("click_color", changed_keys)
        self.assertIn("adicional_tinta_blanca_base_1_copia", changed_keys)
        self.assertIn("coeficiente_formato_stickers_corte_recto_10x7", changed_keys)
        self.assertIn("coeficiente_formato_imanes_corte_recto_10x7", changed_keys)
        self.assertIn("ilustracion_150g_65x95_usd", {item["key"] for item in body["bloqueados"]})
        self.assertIn("variable_desconocida", {item["key"] for item in body["advertencias"]})

    def test_ignora_variables_sin_cambios(self):
        filename, payload = self.valid_export_payload()
        status, body = self.upload(filename, payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["resumen"]["cambios_importables"], 0)

    def test_bloquea_valor_vacio_no_numerico_y_negativo(self):
        payload = self.workbook_from_rows([
            {"key": "click_color", "label": "Click", "value": None, "unit": "ARS", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "obra_90g", "label": "Obra", "value": "abc", "unit": "USD", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
            {"key": "multiplicador_general", "label": "Mult", "value": -1, "unit": "factor", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
        ])
        status, body = self.upload("cotizador_digital_maestro.xlsx", payload)
        self.assertEqual(status, 200)
        self.assertGreaterEqual(body["resumen"]["cambios_bloqueados"], 3)

    def test_falla_si_falta_hoja_o_columnas(self):
        status, body = self.upload("cotizador_digital_maestro.xlsx", self.workbook_from_rows([], sheet_name="OTRA_HOJA"))
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "hoja_requerida_faltante")

        wb = Workbook()
        ws = wb.active
        ws.title = "01_VARIABLES_MADRE"
        ws.append(["key", "value"])
        stream = BytesIO()
        wb.save(stream)
        status, body = self.upload("cotizador_digital_maestro.xlsx", stream.getvalue())
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "columnas_requeridas_faltantes")

    def test_rechaza_no_xlsx_y_excel_roto(self):
        status, body = self.upload("archivo.txt", b"hola", content_type="text/plain")
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "archivo_invalido")

        status, body = self.upload("archivo.xlsx", b"no es excel")
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "excel_no_parseable")

    def test_no_modifica_config_y_exports_siguen(self):
        before = {path: path.read_text(encoding="utf-8") for path in self.originals}
        status, _ = self.upload("cotizador_digital_maestro.xlsx", self.workbook_from_rows([
            {"key": "click_color", "label": "Click", "value": 999, "unit": "ARS", "editable_en_sistema": True, "impacta_hoy": True, "estado_operativo": "operativa"},
        ]))
        self.assertEqual(status, 200)
        after = {path: path.read_text(encoding="utf-8") for path in self.originals}
        self.assertEqual(before, after)

        status, headers, pdf = self.call_raw("/export/precios/pdf")
        self.assertEqual(status, 200)
        self.assertTrue(pdf.startswith(b"%PDF-"))
        status, headers, excel = self.call_raw("/export/precios/excel")
        self.assertEqual(status, 200)
        self.assertGreater(len(excel), 1000)


if __name__ == "__main__":
    unittest.main()
