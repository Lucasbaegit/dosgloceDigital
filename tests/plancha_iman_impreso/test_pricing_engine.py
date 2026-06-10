import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from plancha_iman_impreso import PlanchaImanImpresoPricingEngine, load_plancha_iman_impreso_bundle
from plancha_iman_impreso.types import PlanchaImanImpresoQuoteInput


class T(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e = PlanchaImanImpresoPricingEngine(load_plancha_iman_impreso_bundle(ROOT))

    def test_pdf_case(self):
        r=self.e.quote(PlanchaImanImpresoQuoteInput(categoria="Plancha de Im?n Impreso",producto="plancha_iman_impreso",variante="papel_300g_ilustracion",cantidad_unidades=1,urgencia="normal"))
        self.assertEqual(r.total_sin_iva,2953)

if __name__=="__main__":
    unittest.main()
