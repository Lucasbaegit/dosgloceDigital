import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from folletos import FolletosPricingEngine, load_folletos_bundle
from folletos.exceptions import PriceNotFoundError, QuoteInputError
from folletos.types import FolletosQuoteInput


class TestFolletosPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = FolletosPricingEngine(load_folletos_bundle(ROOT))

    def _quote(self, papel, gramaje, modo_color, cantidad, formato, caras):
        return self.engine.quote(
            FolletosQuoteInput(
                categoria="Folletos",
                producto="folleto",
                formato=formato,
                papel=papel,
                gramaje=gramaje,
                modo_color=modo_color,
                caras=caras,
                cantidad_unidades=cantidad,
                urgencia="normal",
            )
        )

    def test_cases(self):
        self.assertAlmostEqual(self._quote("150g Ilustracion", "150g", "fullcolor", 100, "10x10", "4/0").total_sin_iva, 6496, places=6)
        self.assertAlmostEqual(self._quote("150g Ilustracion", "150g", "fullcolor", 1000, "A4", "4/4").total_sin_iva, 391651, places=6)
        self.assertAlmostEqual(self._quote("150g Ilustracion", "150g", "escala_grises", 300, "15x21", "1/1").total_sin_iva, 21339, places=6)
        self.assertAlmostEqual(self._quote("80g Ilustracion", "80g", "fullcolor", 500, "10x15", "4/4").total_sin_iva, 46543, places=6)
        self.assertAlmostEqual(self._quote("80g Ilustracion", "80g", "escala_grises", 1000, "A4", "1/1").total_sin_iva, 119247, places=6)

    def test_cantidad_fuera(self):
        with self.assertRaises(PriceNotFoundError):
            self._quote("150g Ilustracion", "150g", "fullcolor", 750, "10x10", "4/0")

    def test_formato_invalido(self):
        with self.assertRaises(QuoteInputError):
            self._quote("150g Ilustracion", "150g", "fullcolor", 100, "A5", "4/0")

    def test_caras_no_compatibles(self):
        with self.assertRaises(QuoteInputError):
            self._quote("150g Ilustracion", "150g", "escala_grises", 100, "10x10", "4/4")


if __name__ == "__main__":
    unittest.main()
