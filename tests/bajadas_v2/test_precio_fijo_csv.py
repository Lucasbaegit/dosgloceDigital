import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_v2.config_loader import load_bajadas_v2_bundle
from bajadas_v2.pricing_engine import BajadasV2PricingEngine
from bajadas_v2.types import QuoteInput


class TestPrecioFijoCsv(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(ROOT))

    def test_md7_case_uses_fixed_price(self):
        case = self.engine.fixed_cases[0]
        q = QuoteInput(
            categoria=case["categoria"],
            modo_color=case["modo_color"],
            formato=case["formato"],
            tipo_papel=case["tipo_papel"],
            material=case["material"],
            gramaje=case["gramaje"],
            cantidad_rango=case["cantidad_rango"],
            caras=case["caras"],
            terminacion=case.get("terminacion"),
            urgencia="normal",
        )
        result = self.engine.quote(q)
        self.assertEqual(result.fuente, "precio_fijo_csv")
        self.assertEqual(result.regla_aplicada, "PRECIO_FIJO_CSV")
        self.assertAlmostEqual(result.precio_sin_iva, float(case["precio_objetivo_csv"]), places=6)


if __name__ == "__main__":
    unittest.main()
