import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))


class TestMetricasSnapshotBajadasV2(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.comparativa_path = ROOT / "data" / "bajadas_v2" / "comparativa_bajadas_v2_final.json"
        cls.config_path = ROOT / "data" / "bajadas_v2" / "bajadas_v2_config_final.json"
        cls.precios_path = ROOT / "data" / "bajadas_v2" / "precios_pdf_objetivo_validado.json"
        cls.fixture_path = ROOT / "tests" / "bajadas_v2" / "fixtures" / "regresion_bajadas_v2_cases.json"
        cls.snapshot_path = ROOT / "data" / "bajadas_v2" / "snapshots" / "bajadas_v2_metrics_snapshot.json"

        for p in [cls.comparativa_path, cls.config_path, cls.precios_path, cls.fixture_path, cls.snapshot_path]:
            if not p.exists():
                raise unittest.SkipTest(f"Archivo requerido no existe: {p}")

        with cls.snapshot_path.open("r", encoding="utf-8") as fh:
            cls.snapshot = json.load(fh)

    def test_metricas_minimas(self):
        estados = self.snapshot["conteo_estados"]
        self.assertEqual(estados["DIFERENCIA_ALTA"], 0)
        self.assertGreaterEqual(int(self.snapshot["cantidad_casos_regresion"]), 624)
        self.assertGreaterEqual(estados["OK"], 533)
        self.assertEqual(int(self.snapshot["cantidad_precio_fijo_csv"]), 7)

    def test_archivos_criticos_y_hashes(self):
        checksums = self.snapshot.get("checksums", {})
        self.assertIn("bajadas_v2_config_final.json", checksums)
        self.assertIn("precios_pdf_objetivo_validado.json", checksums)
        self.assertIn("regresion_bajadas_v2_cases.json", checksums)
        for _, digest in checksums.items():
            self.assertIsInstance(digest, str)
            self.assertEqual(len(digest), 64)
            int(digest, 16)  # valida hex

    def test_hashes_recomputables(self):
        def sha(path: Path) -> str:
            h = hashlib.sha256()
            with path.open("rb") as fh:
                for chunk in iter(lambda: fh.read(8192), b""):
                    h.update(chunk)
            return h.hexdigest()

        checksums = self.snapshot["checksums"]
        self.assertEqual(checksums["bajadas_v2_config_final.json"], sha(self.config_path))
        self.assertEqual(checksums["precios_pdf_objetivo_validado.json"], sha(self.precios_path))
        self.assertEqual(checksums["regresion_bajadas_v2_cases.json"], sha(self.fixture_path))


if __name__ == "__main__":
    unittest.main()
