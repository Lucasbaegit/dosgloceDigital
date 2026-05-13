import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from tarjetas_postales import TarjetasPostalesPricingEngine, load_tarjetas_postales_bundle
from tarjetas_postales.exceptions import PriceNotFoundError, QuoteInputError
from tarjetas_postales.types import TarjetasPostalesQuoteInput


class TestTarjetasPostalesPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = TarjetasPostalesPricingEngine(load_tarjetas_postales_bundle(ROOT))

    def _quote(self, cantidad, terminacion, caras):
        return self.engine.quote(
            TarjetasPostalesQuoteInput(
                categoria="Tarjetas Postales",
                producto="postal",
                formato="postal",
                papel="300g Ilustracion",
                gramaje="300g",
                terminacion=terminacion,
                caras=caras,
                cantidad_unidades=cantidad,
                urgencia="normal",
            )
        )

    def test_cases(self):
        self.assertAlmostEqual(self._quote(100, "sin_laminar", "4/0").total_sin_iva, 10932, places=6)
        self.assertAlmostEqual(self._quote(100, "laminado_mate", "4/4").total_sin_iva, 18290, places=6)
        self.assertAlmostEqual(self._quote(200, "laca_uv", "4/4").total_sin_iva, 27924, places=6)
        self.assertAlmostEqual(self._quote(500, "laminado_brillo", "4/0").total_sin_iva, 48389, places=6)
        self.assertAlmostEqual(self._quote(1000, "laminado_mate", "4/4").total_sin_iva, 136795, places=6)

    def test_cantidad_fuera(self):
        with self.assertRaises(PriceNotFoundError):
            self._quote(750, "sin_laminar", "4/0")

    def test_terminacion_invalida(self):
        with self.assertRaises(QuoteInputError):
            self._quote(100, "barniz", "4/0")


if __name__ == "__main__":
    unittest.main()
