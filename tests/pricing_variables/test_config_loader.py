import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from pricing_variables import load_pricing_variables_bundle


class TestPricingVariablesConfigLoader(unittest.TestCase):
    def test_bundle_loads_all_files(self):
        bundle = load_pricing_variables_bundle(ROOT)
        self.assertEqual(bundle.config_variables_base["modo_precio_default"], "pdf_fijo")
        self.assertIn("variables_globales", bundle.config_variables_base)
        self.assertGreaterEqual(len(bundle.papeles.get("items", [])), 1)
        self.assertGreaterEqual(len(bundle.clicks.get("items", [])), 1)
        self.assertGreaterEqual(len(bundle.terminaciones.get("items", [])), 1)
        self.assertGreaterEqual(len(bundle.multiplicadores.get("items", [])), 1)


if __name__ == "__main__":
    unittest.main()

