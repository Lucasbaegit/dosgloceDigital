import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_v2.config_loader import load_bajadas_v2_bundle


class TestConfigLoader(unittest.TestCase):
    def test_load_final_bundle(self):
        bundle = load_bajadas_v2_bundle(ROOT)
        self.assertEqual(bundle.config["modelo_base"], "Modelo D / D2")
        self.assertTrue(bundle.config["modelo_d_congelado"])
        self.assertIn("comparativa", bundle.comparativa_final)
        self.assertIn("validacion_integridad", bundle.precios_objetivo)


if __name__ == "__main__":
    unittest.main()
