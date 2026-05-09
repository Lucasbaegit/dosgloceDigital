import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_adicionales_laminado import LaminadoAdicionalesPricingEngine, QuoteInputError, load_laminado_bundle
from bajadas_adicionales_laminado.types import LaminadoQuoteInput


class TestLaminadoRangos(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = LaminadoAdicionalesPricingEngine(load_laminado_bundle(ROOT))

    def test_laca_cantidad_1_usa_0_10(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laca", formato="A3+", cantidad_unidades=1))
        self.assertEqual(out.rango_aplicado, "0 - 10")

    def test_brillo_cantidad_30_usa_11_50(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laminado_brillo", formato="A3+", cantidad_unidades=30))
        self.assertEqual(out.rango_aplicado, "11 - 50")

    def test_mate_cantidad_80_usa_51_100(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laminado_mate", formato="A3+", cantidad_unidades=80))
        self.assertEqual(out.rango_aplicado, "51 - 100")

    def test_cantidad_600_usa_501_1000(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laca", formato="A3+", cantidad_unidades=600))
        self.assertEqual(out.rango_aplicado, "501 - 1000")

    def test_cantidad_1500_usa_1001(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laca", formato="A3+", cantidad_unidades=1500))
        self.assertEqual(out.rango_aplicado, "1001+")

    def test_cantidad_cero_falla(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote(LaminadoQuoteInput(adicional="laca", formato="A3+", cantidad_unidades=0))


if __name__ == "__main__":
    unittest.main()

