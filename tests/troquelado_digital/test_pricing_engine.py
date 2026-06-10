import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from troquelado_digital import TroqueladoDigitalPricingEngine, load_troquelado_digital_bundle
from troquelado_digital.types import TroqueladoDigitalQuoteInput


class T(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e = TroqueladoDigitalPricingEngine(load_troquelado_digital_bundle(ROOT))

    def test_basic(self):
        r=self.e.quote(TroqueladoDigitalQuoteInput(categoria="Troquelado Digital",producto="troquelado_digital",familia_tamano="1x1_a_2x2",cantidad_unidades=2,urgencia="normal"))
        self.assertEqual(r.precio_unitario_sin_iva,780)

if __name__=="__main__":
    unittest.main()
