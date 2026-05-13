import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from tarjetas_9x5 import Tarjetas9x5PricingEngine, load_tarjetas_9x5_bundle
from tarjetas_9x5.exceptions import PriceNotFoundError, QuoteInputError
from tarjetas_9x5.types import Tarjetas9x5QuoteInput


class TestTarjetas9x5PricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = Tarjetas9x5PricingEngine(load_tarjetas_9x5_bundle(ROOT))

    def _quote(self, cantidad, terminacion, caras, urgencia="normal"):
        return self.engine.quote(
            Tarjetas9x5QuoteInput(
                categoria="Tarjetas Personales",
                producto="9x5",
                formato="9x5",
                papel="300g Ilustración",
                gramaje="300g",
                terminacion=terminacion,
                caras=caras,
                cantidad_unidades=cantidad,
                urgencia=urgencia,
            )
        )

    def test_100_sin_laminar_4_0(self):
        result = self._quote(100, "sin_laminar", "4/0")
        self.assertAlmostEqual(result.total_sin_iva, 5139, places=6)

    def test_100_laminado_mate_4_4(self):
        result = self._quote(100, "laminado_mate", "4/4")
        self.assertAlmostEqual(result.total_sin_iva, 8204, places=6)

    def test_200_laca_uv_4_4(self):
        result = self._quote(200, "laca_uv", "4/4")
        self.assertAlmostEqual(result.total_sin_iva, 11265, places=6)

    def test_300_laminado_brillo_4_0(self):
        result = self._quote(300, "laminado_brillo", "4/0")
        self.assertAlmostEqual(result.total_sin_iva, 11651, places=6)

    def test_500_sin_laminar_4_4(self):
        result = self._quote(500, "sin_laminar", "4/4")
        self.assertAlmostEqual(result.total_sin_iva, 33606, places=6)

    def test_1000_laminado_mate_4_4(self):
        result = self._quote(1000, "laminado_mate", "4/4")
        self.assertAlmostEqual(result.total_sin_iva, 48401, places=6)

    def test_urgencia_express(self):
        result = self._quote(100, "sin_laminar", "4/0", urgencia="express")
        self.assertAlmostEqual(result.total_con_urgencia, 5139 * 1.15, places=6)

    def test_cantidad_fuera_de_matriz(self):
        with self.assertRaises(PriceNotFoundError):
            self._quote(750, "sin_laminar", "4/0")

    def test_terminacion_invalida(self):
        with self.assertRaises(QuoteInputError):
            self._quote(100, "barniz", "4/0")


if __name__ == "__main__":
    unittest.main()
