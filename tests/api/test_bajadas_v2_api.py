import json
import hashlib
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

    def _read_final_config_text(self) -> str:
        config_path = ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_final.json"
        return config_path.read_text(encoding="utf-8")

    def _read_editable_config_text(self) -> str:
        config_path = ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_editable.json"
        return config_path.read_text(encoding="utf-8")

    @staticmethod
    def _hash_json_obj(payload: dict) -> str:
        raw = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    def setUp(self):
        self._paths_to_restore = [
            ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_final.json",
            ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_editable.json",
            ROOT / "data" / "bajadas_v2" / "config_candidates.json",
            ROOT / "data" / "bajadas_v2" / "config_history.json",
        ]
        self._snapshot = {}
        for path in self._paths_to_restore:
            self._snapshot[path] = path.read_text(encoding="utf-8") if path.exists() else None

    def tearDown(self):
        for path, content in self._snapshot.items():
            if content is None:
                if path.exists():
                    path.unlink()
            else:
                path.write_text(content, encoding="utf-8")

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

    def test_get_config(self):
        status, body = self._get_json("/bajadas-v2/config")
        self.assertEqual(status, 200)
        self.assertIn("dolar_actual", body)
        self.assertIn("recargos_urgencia", body)

    def test_get_config_history(self):
        status, body = self._get_json("/bajadas-v2/config/history")
        self.assertEqual(status, 200)
        self.assertIn("history", body)

    def test_get_config_diff(self):
        status, body = self._get_json("/bajadas-v2/config/diff")
        self.assertEqual(status, 200)
        self.assertIn("summary", body)
        self.assertIn("diff", body)

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
        self.assertEqual(body.get("adicional_laminado", "sin_adicional"), "sin_adicional")

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
        expected_recargo = float(body["trazabilidad"]["recargo_urgencia_aplicado"])
        self.assertGreaterEqual(expected_recargo, 0.0)
        self.assertAlmostEqual(
            body["precio_unitario_con_urgencia"],
            body["precio_unitario_sin_iva"] * (1 + expected_recargo),
            places=6,
        )
        self.assertAlmostEqual(body["total_sin_iva"], body["precio_unitario_sin_iva"] * 30, places=6)
        self.assertAlmostEqual(body["total_con_urgencia"], body["precio_unitario_con_urgencia"] * 30, places=6)

    def test_cotizar_con_laca_suma_antes_de_urgencia(self):
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
            "adicional_laminado": "laca",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["adicional_laminado"], "laca")
        self.assertIn("adicional_unitario_sin_iva", body)
        self.assertIn("precio_unitario_con_adicional_sin_iva", body)
        self.assertAlmostEqual(
            body["precio_unitario_con_adicional_sin_iva"],
            body["precio_unitario_sin_iva"] + body["adicional_unitario_sin_iva"],
            places=6,
        )
        self.assertAlmostEqual(
            body["total_sin_iva"],
            body["precio_unitario_con_adicional_sin_iva"] * body["cantidad_unidades"],
            places=6,
        )
        rec = float(body["trazabilidad"]["recargo_urgencia_aplicado"])
        self.assertAlmostEqual(body["total_con_urgencia"], body["total_sin_iva"] * (1 + rec), places=6)

    def test_cotizar_con_brillo_suma_antes_de_urgencia(self):
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
            "urgencia": "normal",
            "adicional_laminado": "laminado_brillo",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["adicional_laminado"], "laminado_brillo")
        self.assertEqual(body["regla_adicional_aplicada"], "ADICIONAL_LAMINADO_BRILLO_A3PLUS")

    def test_cotizar_con_mate_suma_antes_de_urgencia(self):
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
            "urgencia": "normal",
            "adicional_laminado": "laminado_mate",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["adicional_laminado"], "laminado_mate")
        self.assertEqual(body["regla_adicional_aplicada"], "ADICIONAL_LAMINADO_MATE_A3PLUS")

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

    def test_update_dolar_valido(self):
        status, body = self._post_json("/bajadas-v2/config/update", {"field": "dolar_actual", "value": 1500, "motivo": "test"})
        self.assertEqual(status, 200)
        self.assertEqual(body["status"], "ok")

    def test_rechaza_dolar_invalido(self):
        status, body = self._post_json("/bajadas-v2/config/update", {"field": "dolar_actual", "value": 0, "motivo": "test"})
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "validation_error")

    def test_update_recargo_valido(self):
        status, body = self._post_json(
            "/bajadas-v2/config/update",
            {"field": "recargos_urgencia.express", "value": 0.2, "motivo": "test"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["status"], "ok")

    def test_rechaza_escala_superpuesta(self):
        overlapping = [
            {"desde": 1, "hasta": 10, "etiqueta": "1 a 10", "activa": True, "orden": 1},
            {"desde": 5, "hasta": 20, "etiqueta": "5 a 20", "activa": True, "orden": 2},
        ]
        status, body = self._post_json(
            "/bajadas-v2/config/update",
            {"field": "escalas_cantidad", "value": overlapping, "motivo": "test"},
        )
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "validation_error")

    def test_validate_config_valida(self):
        status, body = self._post_json("/bajadas-v2/config/validate", {})
        self.assertEqual(status, 200)
        self.assertIn("valid", body)
        self.assertIn("errors", body)
        self.assertIn("warnings", body)

    def test_simulate_final_vs_editable(self):
        payload = {
            "quote": {
                "categoria": "Bajadas Fullcolor",
                "modo_color": "fullcolor",
                "formato": "A3+",
                "tipo_papel": "liviano",
                "material": "Ilustracion",
                "gramaje": "150g",
                "cantidad_unidades": 30,
                "cantidad_rango": "26 a 50",
                "caras": "4/0",
                "urgencia": "normal",
            },
            "use_config_editable": True,
        }
        final_before = self._read_final_config_text()
        status, body = self._post_json("/bajadas-v2/config/simulate", payload)
        final_after = self._read_final_config_text()
        self.assertEqual(status, 200)
        self.assertIn("precio_config_final", body)
        self.assertIn("precio_config_editable", body)
        self.assertIn("diferencia_absoluta", body)
        self.assertEqual(final_before, final_after)

    def test_candidate_create_valido(self):
        self._post_json("/bajadas-v2/config/restore", {"motivo": "test_setup_valido"})
        final_before = self._read_final_config_text()
        status, body = self._post_json("/bajadas-v2/config/candidate/create", {"motivo": "test_create"})
        final_after = self._read_final_config_text()
        self.assertEqual(status, 200)
        self.assertEqual(body["status"], "ok")
        self.assertIn("candidate_id", body)
        self.assertEqual(final_before, final_after)

    def test_candidate_create_invalido(self):
        editable_path = ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_editable.json"
        backup = json.loads(editable_path.read_text(encoding="utf-8"))
        broken = dict(backup)
        broken["dolar_actual"] = 0
        editable_path.write_text(json.dumps(broken, ensure_ascii=False, indent=2), encoding="utf-8")
        status, body = self._post_json("/bajadas-v2/config/candidate/create", {"motivo": "test_invalid_create"})
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "validation_error")
        editable_path.write_text(json.dumps(backup, ensure_ascii=False, indent=2), encoding="utf-8")

    def test_candidate_list_and_detail_and_reject(self):
        self._post_json("/bajadas-v2/config/restore", {"motivo": "test_setup_list"})
        status_create, body_create = self._post_json("/bajadas-v2/config/candidate/create", {"motivo": "test_list"})
        self.assertEqual(status_create, 200)
        cid = body_create["candidate_id"]

        status_list, body_list = self._get_json("/bajadas-v2/config/candidates")
        self.assertEqual(status_list, 200)
        self.assertIn("candidates", body_list)
        self.assertTrue(any(c.get("candidate_id") == cid for c in body_list["candidates"]))

        status_detail, body_detail = self._get_json(f"/bajadas-v2/config/candidate/{cid}")
        self.assertEqual(status_detail, 200)
        self.assertEqual(body_detail.get("candidate_id"), cid)

        status_reject, body_reject = self._post_json(
            f"/bajadas-v2/config/candidate/{cid}/reject",
            {"motivo_rechazo": "test_reject"},
        )
        self.assertEqual(status_reject, 200)
        self.assertEqual(body_reject.get("estado"), "RECHAZADO")

    def test_config_editable_no_afecta_cotizacion_productiva(self):
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
            "urgencia": "normal",
        }
        status_before, before = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status_before, 200)
        # Cambiar editable, no debería afectar cotización productiva
        self._post_json("/bajadas-v2/config/update", {"field": "dolar_actual", "value": 1999, "motivo": "test_no_effect"})
        status_after, after = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status_after, 200)
        self.assertEqual(before["total_con_urgencia"], after["total_con_urgencia"])

    def test_approve_candidate_sin_modificar_config_final(self):
        self._post_json("/bajadas-v2/config/restore", {"motivo": "test_setup_approve"})
        status_create, body_create = self._post_json("/bajadas-v2/config/candidate/create", {"motivo": "test_approve"})
        self.assertEqual(status_create, 200)
        cid = body_create["candidate_id"]
        final_before = self._read_final_config_text()
        status_appr, body_appr = self._post_json(
            f"/bajadas-v2/config/candidate/{cid}/approve",
            {"motivo_aprobacion": "ok"},
        )
        final_after = self._read_final_config_text()
        self.assertEqual(status_appr, 200)
        self.assertEqual(body_appr.get("estado"), "APROBADO")
        self.assertEqual(final_before, final_after)

    def test_no_aprobar_candidato_rechazado(self):
        self._post_json("/bajadas-v2/config/restore", {"motivo": "test_setup_rechazado"})
        status_create, body_create = self._post_json("/bajadas-v2/config/candidate/create", {"motivo": "test_rech"})
        self.assertEqual(status_create, 200)
        cid = body_create["candidate_id"]
        self._post_json(f"/bajadas-v2/config/candidate/{cid}/reject", {"motivo_rechazo": "x"})
        status_appr, body_appr = self._post_json(
            f"/bajadas-v2/config/candidate/{cid}/approve",
            {"motivo_aprobacion": "y"},
        )
        self.assertEqual(status_appr, 400)
        self.assertEqual(body_appr.get("error"), "validation_error")

    def test_promote_requiere_confirmacion_exacta(self):
        self._post_json("/bajadas-v2/config/restore", {"motivo": "test_setup_promote_confirm"})
        status_create, body_create = self._post_json("/bajadas-v2/config/candidate/create", {"motivo": "test_prom"})
        self.assertEqual(status_create, 200)
        cid = body_create["candidate_id"]
        self._post_json(f"/bajadas-v2/config/candidate/{cid}/approve", {"motivo_aprobacion": "ok"})
        status_prom, body_prom = self._post_json(
            f"/bajadas-v2/config/candidate/{cid}/promote",
            {"confirmacion": "MAL", "motivo": "test", "usuario": "local"},
        )
        self.assertEqual(status_prom, 400)
        self.assertEqual(body_prom.get("error"), "validation_error")

    def test_promote_no_aprobado_falla(self):
        self._post_json("/bajadas-v2/config/restore", {"motivo": "test_setup_promote_no_appr"})
        status_create, body_create = self._post_json("/bajadas-v2/config/candidate/create", {"motivo": "test_prom2"})
        self.assertEqual(status_create, 200)
        cid = body_create["candidate_id"]
        status_prom, body_prom = self._post_json(
            f"/bajadas-v2/config/candidate/{cid}/promote",
            {"confirmacion": "PROMOVER_CONFIG_BAJADAS_V2", "motivo": "test", "usuario": "local"},
        )
        self.assertEqual(status_prom, 400)
        self.assertEqual(body_prom.get("error"), "validation_error")

    def test_promote_aprobado_crea_backup_y_reemplaza_final(self):
        self._post_json("/bajadas-v2/config/restore", {"motivo": "test_setup_promote_ok"})
        self._post_json("/bajadas-v2/config/update", {"field": "dolar_actual", "value": 1777, "motivo": "test_prom_change"})
        editable_after = self._read_editable_config_text()
        status_create, body_create = self._post_json("/bajadas-v2/config/candidate/create", {"motivo": "test_promote"})
        self.assertEqual(status_create, 200)
        cid = body_create["candidate_id"]
        self._post_json(f"/bajadas-v2/config/candidate/{cid}/approve", {"motivo_aprobacion": "ok"})
        status_prom, body_prom = self._post_json(
            f"/bajadas-v2/config/candidate/{cid}/promote",
            {"confirmacion": "PROMOVER_CONFIG_BAJADAS_V2", "motivo": "test", "usuario": "local"},
        )
        self.assertEqual(status_prom, 200)
        self.assertEqual(body_prom.get("estado"), "PROMOVIDO")
        self.assertIn("backup_creado", body_prom)
        self.assertIn("1777", self._read_final_config_text())
        self.assertNotEqual(editable_after, "")
        status_history, body_history = self._get_json("/bajadas-v2/config/history")
        self.assertEqual(status_history, 200)
        self.assertTrue(any(h.get("campo") == "promote_candidate" for h in body_history.get("history", [])))

    def test_active_version_and_backups(self):
        status_active, body_active = self._get_json("/bajadas-v2/config/active-version")
        self.assertEqual(status_active, 200)
        self.assertIn("hash_config_final", body_active)
        self.assertEqual(body_active.get("estado"), "productiva")

        status_backups, body_backups = self._get_json("/bajadas-v2/config/backups")
        self.assertEqual(status_backups, 200)
        self.assertIn("backups", body_backups)

    def test_backup_detail_valido(self):
        status_backups, body_backups = self._get_json("/bajadas-v2/config/backups")
        self.assertEqual(status_backups, 200)
        self.assertTrue(len(body_backups.get("backups", [])) >= 1)
        backup_name = body_backups["backups"][0]["archivo"]
        status_detail, body_detail = self._get_json(f"/bajadas-v2/config/backups/{backup_name}")
        self.assertEqual(status_detail, 200)
        self.assertEqual(body_detail.get("archivo"), backup_name)
        self.assertIn("valid", body_detail)

    def test_restore_backup_falla_confirmacion_incorrecta(self):
        status_backups, body_backups = self._get_json("/bajadas-v2/config/backups")
        self.assertEqual(status_backups, 200)
        self.assertTrue(len(body_backups.get("backups", [])) >= 1)
        backup_name = body_backups["backups"][0]["archivo"]
        status_restore, body_restore = self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore",
            {"confirmacion": "MAL", "motivo": "test", "usuario": "local"},
        )
        self.assertEqual(status_restore, 400)
        self.assertEqual(body_restore.get("error"), "validation_error")

    def test_restore_backup_falla_path_traversal(self):
        status_restore, body_restore = self._post_json(
            "/bajadas-v2/config/backups/../evil.json/restore",
            {"confirmacion": "RESTAURAR_BACKUP_BAJADAS_V2", "motivo": "test", "usuario": "local"},
        )
        self.assertEqual(status_restore, 400)
        self.assertEqual(body_restore.get("error"), "validation_error")

    def test_restore_preview_backup_valido_no_modifica_config_final(self):
        editable_obj = json.loads(self._read_editable_config_text())
        editable_obj["dolar_actual"] = 1555.0
        editable_obj["factor_dolar"] = round(1555.0 / float(editable_obj["dolar_anterior_excel"]), 9)
        backup_name = "bajadas_v2_config_final_test_preview.json"
        backup_path = ROOT / "data" / "bajadas_v2" / "backups" / backup_name
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text(json.dumps(editable_obj, ensure_ascii=False, indent=2), encoding="utf-8")

        final_before = self._read_final_config_text()
        status_preview, body_preview = self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore-preview",
            {},
        )
        final_after = self._read_final_config_text()
        self.assertEqual(status_preview, 200)
        self.assertTrue(body_preview.get("valid"))
        self.assertIn("diff_preview", body_preview)
        self.assertEqual(final_before, final_after)

    def test_restore_preview_rechaza_path_traversal(self):
        status_preview, body_preview = self._post_json(
            "/bajadas-v2/config/backups/../evil.json/restore-preview",
            {},
        )
        self.assertEqual(status_preview, 400)
        self.assertEqual(body_preview.get("error"), "validation_error")

    def test_restore_preview_inexistente(self):
        status_preview, body_preview = self._post_json(
            "/bajadas-v2/config/backups/no_existe_123.json/restore-preview",
            {},
        )
        self.assertEqual(status_preview, 404)
        self.assertEqual(body_preview.get("error"), "not_found")

    def test_restore_preview_no_agrega_evento_restore_backup(self):
        editable_obj = json.loads(self._read_editable_config_text())
        editable_obj["dolar_actual"] = 1660.0
        editable_obj["factor_dolar"] = round(1660.0 / float(editable_obj["dolar_anterior_excel"]), 9)
        backup_name = "bajadas_v2_config_final_test_preview_history.json"
        backup_path = ROOT / "data" / "bajadas_v2" / "backups" / backup_name
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text(json.dumps(editable_obj, ensure_ascii=False, indent=2), encoding="utf-8")

        status_hist_before, hist_before = self._get_json("/bajadas-v2/config/history")
        self.assertEqual(status_hist_before, 200)
        before_count_restore = len([h for h in hist_before.get("history", []) if h.get("tipo") == "RESTORE_BACKUP"])

        status_preview, body_preview = self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore-preview",
            {},
        )
        self.assertEqual(status_preview, 200)
        self.assertIn("resumen", body_preview)
        self.assertIn("mensaje", body_preview)

        status_hist_after, hist_after = self._get_json("/bajadas-v2/config/history")
        self.assertEqual(status_hist_after, 200)
        after_count_restore = len([h for h in hist_after.get("history", []) if h.get("tipo") == "RESTORE_BACKUP"])
        self.assertEqual(before_count_restore, after_count_restore)

    def test_restore_simulate_valido_no_modifica_config_final_ni_history(self):
        editable_obj = json.loads(self._read_editable_config_text())
        editable_obj["dolar_actual"] = 1770.0
        editable_obj["factor_dolar"] = round(1770.0 / float(editable_obj["dolar_anterior_excel"]), 9)
        backup_name = "bajadas_v2_config_final_test_simulate.json"
        backup_path = ROOT / "data" / "bajadas_v2" / "backups" / backup_name
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text(json.dumps(editable_obj, ensure_ascii=False, indent=2), encoding="utf-8")

        payload = {
            "cotizacion": {
                "categoria": "Bajadas Fullcolor",
                "modo_color": "fullcolor",
                "formato": "A3+",
                "tipo_papel": "liviano",
                "material": "Ilustracion",
                "gramaje": "150g",
                "cantidad_unidades": 30,
                "cantidad_rango": "26 a 50",
                "caras": "4/0",
                "urgencia": "normal",
            }
        }
        final_before = self._read_final_config_text()
        status_h_before, h_before = self._get_json("/bajadas-v2/config/history")
        self.assertEqual(status_h_before, 200)
        history_len_before = len(h_before.get("history", []))

        status_sim, body_sim = self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore-simulate",
            payload,
        )
        self.assertEqual(status_sim, 200)
        self.assertIn("resultado_config_final", body_sim)
        self.assertIn("resultado_backup", body_sim)
        self.assertIn("diferencia_total_con_urgencia", body_sim)
        self.assertIn("trazabilidad_comparativa", body_sim)

        self.assertEqual(final_before, self._read_final_config_text())
        status_h_after, h_after = self._get_json("/bajadas-v2/config/history")
        self.assertEqual(status_h_after, 200)
        self.assertEqual(history_len_before, len(h_after.get("history", [])))

    def test_restore_simulate_rechaza_path_traversal(self):
        payload = {
            "cotizacion": {
                "categoria": "Bajadas Fullcolor",
                "modo_color": "fullcolor",
                "formato": "A3+",
                "tipo_papel": "liviano",
                "material": "Ilustracion",
                "gramaje": "150g",
                "cantidad_unidades": 30,
                "cantidad_rango": "26 a 50",
                "caras": "4/0",
                "urgencia": "normal",
            }
        }
        status_sim, body_sim = self._post_json(
            "/bajadas-v2/config/backups/../evil.json/restore-simulate",
            payload,
        )
        self.assertEqual(status_sim, 400)
        self.assertEqual(body_sim.get("error"), "validation_error")

    def test_restore_simulate_backup_invalido(self):
        backup_name = "bajadas_v2_config_final_test_simulate_invalid.json"
        backup_path = ROOT / "data" / "bajadas_v2" / "backups" / backup_name
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text("{ invalid json }", encoding="utf-8")
        payload = {
            "cotizacion": {
                "categoria": "Bajadas Fullcolor",
                "modo_color": "fullcolor",
                "formato": "A3+",
                "tipo_papel": "liviano",
                "material": "Ilustracion",
                "gramaje": "150g",
                "cantidad_unidades": 30,
                "cantidad_rango": "26 a 50",
                "caras": "4/0",
                "urgencia": "normal",
            }
        }
        status_sim, body_sim = self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore-simulate",
            payload,
        )
        self.assertEqual(status_sim, 400)
        self.assertEqual(body_sim.get("error"), "validation_error")

    def test_restore_simulate_cotizacion_incompatible(self):
        editable_obj = json.loads(self._read_editable_config_text())
        backup_name = "bajadas_v2_config_final_test_simulate_incompatible.json"
        backup_path = ROOT / "data" / "bajadas_v2" / "backups" / backup_name
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text(json.dumps(editable_obj, ensure_ascii=False, indent=2), encoding="utf-8")
        payload = {
            "cotizacion": {
                "categoria": "Bajadas Fullcolor",
                "modo_color": "fullcolor",
                "formato": "A3+",
                "tipo_papel": "liviano",
                "material": "NO_EXISTE",
                "gramaje": "999g",
                "cantidad_unidades": 30,
                "cantidad_rango": "26 a 50",
                "caras": "4/0",
                "urgencia": "normal",
            }
        }
        status_sim, body_sim = self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore-simulate",
            payload,
        )
        self.assertEqual(status_sim, 404)
        self.assertEqual(body_sim.get("error"), "combinacion_no_encontrada")

    def test_restore_backup_valido_crea_pre_restore_y_reemplaza(self):
        self._post_json("/bajadas-v2/config/restore", {"motivo": "test_setup_restore_ok"})
        editable_obj = json.loads(self._read_editable_config_text())
        editable_obj["dolar_actual"] = 1888.0
        editable_obj["factor_dolar"] = round(1888.0 / float(editable_obj["dolar_anterior_excel"]), 9)
        backup_name = "bajadas_v2_config_final_test_restore.json"
        backup_path = ROOT / "data" / "bajadas_v2" / "backups" / backup_name
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text(json.dumps(editable_obj, ensure_ascii=False, indent=2), encoding="utf-8")

        before_history_status, before_history = self._get_json("/bajadas-v2/config/history")
        self.assertEqual(before_history_status, 200)
        before_len = len(before_history.get("history", []))

        status_restore, body_restore = self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore",
            {
                "confirmacion": "RESTAURAR_BACKUP_BAJADAS_V2",
                "motivo": "test_restore",
                "usuario": "local",
            },
        )
        self.assertEqual(status_restore, 200)
        self.assertEqual(body_restore.get("status"), "ok")
        self.assertIn("backup_pre_restore_creado", body_restore)
        self.assertIn("1888.0", self._read_final_config_text())

        after_history_status, after_history = self._get_json("/bajadas-v2/config/history")
        self.assertEqual(after_history_status, 200)
        after_list = after_history.get("history", [])
        self.assertTrue(len(after_list) >= before_len + 1)
        self.assertTrue(any(h.get("tipo") == "RESTORE_BACKUP" for h in after_list))

    def test_restore_backup_no_modifica_excel_csv_pdf(self):
        excel_candidates = list((ROOT / "original").glob("*.xlsx"))
        excel_path = excel_candidates[0] if excel_candidates else None
        csv_path = ROOT.parent / "precios_pdf_objetivo_limpio.csv"
        pdf_candidates = list(ROOT.glob("*.pdf"))
        pdf_path = pdf_candidates[0] if pdf_candidates else None

        before_excel = excel_path.read_bytes() if excel_path and excel_path.exists() else None
        before_csv = csv_path.read_bytes() if csv_path.exists() else None
        before_pdf = pdf_path.read_bytes() if pdf_path and pdf_path.exists() else None

        status_backups, body_backups = self._get_json("/bajadas-v2/config/backups")
        self.assertEqual(status_backups, 200)
        self.assertTrue(len(body_backups.get("backups", [])) >= 1)
        backup_name = body_backups["backups"][0]["archivo"]
        self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore",
            {
                "confirmacion": "RESTAURAR_BACKUP_BAJADAS_V2",
                "motivo": "test_no_external_changes",
                "usuario": "local",
            },
        )

        if before_excel is not None and excel_path:
            self.assertEqual(hashlib.sha256(before_excel).hexdigest(), hashlib.sha256(excel_path.read_bytes()).hexdigest())
        if before_csv is not None:
            self.assertEqual(hashlib.sha256(before_csv).hexdigest(), hashlib.sha256(csv_path.read_bytes()).hexdigest())
        if before_pdf is not None and pdf_path:
            self.assertEqual(hashlib.sha256(before_pdf).hexdigest(), hashlib.sha256(pdf_path.read_bytes()).hexdigest())

    def test_active_version_refleja_hash_post_restore(self):
        editable_obj = json.loads(self._read_editable_config_text())
        editable_obj["dolar_actual"] = 1666.0
        editable_obj["factor_dolar"] = round(1666.0 / float(editable_obj["dolar_anterior_excel"]), 9)
        backup_name = "bajadas_v2_config_final_test_active_restore.json"
        backup_path = ROOT / "data" / "bajadas_v2" / "backups" / backup_name
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text(json.dumps(editable_obj, ensure_ascii=False, indent=2), encoding="utf-8")

        status_restore, _ = self._post_json(
            f"/bajadas-v2/config/backups/{backup_name}/restore",
            {
                "confirmacion": "RESTAURAR_BACKUP_BAJADAS_V2",
                "motivo": "test_active_hash",
                "usuario": "local",
            },
        )
        self.assertEqual(status_restore, 200)
        status_active, body_active = self._get_json("/bajadas-v2/config/active-version")
        self.assertEqual(status_active, 200)
        expected_hash = self._hash_json_obj(json.loads(self._read_final_config_text()))
        self.assertEqual(body_active.get("hash_config_final"), expected_hash)

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

    def test_error_adicional_invalido(self):
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
            "urgencia": "normal",
            "adicional_laminado": "laca+brillo",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "validation_error")

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

    def test_cotizar_autoadhesiva_papel(self):
        payload = {
            "categoria": "Bajadas Autoadhesivas",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "papel",
            "material": "Sticker",
            "gramaje": "N/A",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "normal",
            "tipo_producto": "autoadhesiva",
            "columna_precio": "papel",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["regla_aplicada"], "AUTOADHESIVA_PAPEL_HIBRIDO_B_C")
        self.assertEqual(body["fuente"], "autoadhesivas_objetivo_calibrado")
        self.assertAlmostEqual(body["total_sin_iva"], body["precio_unitario_sin_iva"] * 30, places=6)

    def test_cotizar_autoadhesiva_especial_express(self):
        payload = {
            "categoria": "Bajadas Autoadhesivas",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "especial",
            "material": "OPP blanco",
            "gramaje": "N/A",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "express",
            "tipo_producto": "autoadhesiva",
            "columna_precio": "especial",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["regla_aplicada"], "AUTOADHESIVA_ESPECIAL_HIBRIDO_B_C")
        self.assertEqual(body["fuente"], "autoadhesivas_objetivo_calibrado")
        self.assertAlmostEqual(body["precio_unitario_sin_iva"], 1389.0, places=6)
        self.assertAlmostEqual(body["precio_unitario_con_urgencia"], body["precio_unitario_sin_iva"] * 1.15, places=6)

    def test_cotizar_fullcolor_xa3(self):
        payload = {
            "categoria": "Bajadas Fullcolor",
            "modo_color": "fullcolor",
            "formato": "XA3",
            "tipo_papel": "liviano",
            "material": "Ilustracion",
            "gramaje": "150g",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "normal",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["regla_aplicada"], "FACTOR_XA3_1_10")
        self.assertAlmostEqual(float(body["trazabilidad"]["factor_aplicado"]), 1.10, places=8)

    def test_cotizar_byn_xa3(self):
        payload = {
            "categoria": "Bajadas Blanco y Negro",
            "modo_color": "blanco_y_negro",
            "formato": "XA3",
            "tipo_papel": "liviano",
            "material": "Ilustracion",
            "gramaje": "150g",
            "cantidad_unidades": 30,
            "cantidad_rango": "1",
            "caras": "1/0",
            "urgencia": "normal",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["regla_aplicada"], "FACTOR_XA3_1_10")

    def test_cotizar_autoadhesiva_xa3(self):
        payload = {
            "categoria": "Bajadas Autoadhesivas",
            "modo_color": "fullcolor",
            "formato": "XA3",
            "tipo_papel": "papel",
            "material": "Sticker",
            "gramaje": "N/A",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "normal",
            "tipo_producto": "autoadhesiva",
            "columna_precio": "papel",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertAlmostEqual(float(body["trazabilidad"]["factor_aplicado"]), 1.10, places=8)
        self.assertEqual(body["trazabilidad"]["base_formato"], "A3+")

    def test_autoadhesiva_papel_con_laca(self):
        payload = {
            "categoria": "Bajadas Autoadhesivas",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "papel",
            "material": "Sticker",
            "gramaje": "N/A",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "express",
            "tipo_producto": "autoadhesiva",
            "columna_precio": "papel",
            "adicional_laminado": "laca",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["adicional_laminado"], "laca")
        self.assertEqual(body["regla_adicional_aplicada"], "ADICIONAL_LACA_UV_A3PLUS")

    def test_autoadhesiva_especial_con_laminado_mate(self):
        payload = {
            "categoria": "Bajadas Autoadhesivas",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "especial",
            "material": "OPP blanco",
            "gramaje": "N/A",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "normal",
            "tipo_producto": "autoadhesiva",
            "columna_precio": "especial",
            "adicional_laminado": "laminado_mate",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["adicional_laminado"], "laminado_mate")
        self.assertEqual(body["regla_adicional_aplicada"], "ADICIONAL_LAMINADO_MATE_A3PLUS")

    def test_autoadhesiva_rechaza_tinta_blanca_laca_uv(self):
        payload = {
            "categoria": "Bajadas Autoadhesivas",
            "modo_color": "fullcolor",
            "formato": "A3+",
            "tipo_papel": "tinta blanca",
            "material": "N/A",
            "gramaje": "N/A",
            "cantidad_unidades": 30,
            "cantidad_rango": "26 a 50",
            "caras": "4/0",
            "urgencia": "normal",
            "tipo_producto": "autoadhesiva",
            "columna_precio": "tinta blanca",
        }
        status, body = self._post_json("/bajadas-v2/cotizar", payload)
        self.assertEqual(status, 400)
        self.assertEqual(body["error"], "validation_error")


if __name__ == "__main__":
    unittest.main()
