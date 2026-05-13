import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from imanes_corte_recto import ImanesCorteRectoPricingEngine, load_imanes_corte_recto_bundle
from imanes_corte_recto.exceptions import PriceNotFoundError, QuoteInputError
from imanes_corte_recto.types import ImanesCorteRectoQuoteInput


class TestImanesCorteRectoPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = ImanesCorteRectoPricingEngine(load_imanes_corte_recto_bundle(ROOT))

    def _req(self, cantidad=100, formato="6x4", terminacion="sin_laca_uv"):
        return ImanesCorteRectoQuoteInput(
            categoria="Imanes Corte Recto",
            producto="iman_corte_recto",
            formato=formato,
            papel="300g Ilustracion",
            gramaje="300g",
            terminacion=terminacion,
            cantidad_unidades=cantidad,
            urgencia="normal",
        )

    def test_100_6x4_sin_laca(self):
        out = self.engine.quote_as_dict(self._req(100, "6x4", "sin_laca_uv"))
        self.assertAlmostEqual(out["total_sin_iva"], 7526, places=6)

    def test_100_9x5_con_laca(self):
        out = self.engine.quote_as_dict(self._req(100, "9x5", "con_laca_uv"))
        self.assertAlmostEqual(out["total_sin_iva"], 12972, places=6)

    def test_500_10x7_sin_laca(self):
        out = self.engine.quote_as_dict(self._req(500, "10x7", "sin_laca_uv"))
        self.assertAlmostEqual(out["total_sin_iva"], 76865, places=6)

    def test_1000_10x7_con_laca(self):
        out = self.engine.quote_as_dict(self._req(1000, "10x7", "con_laca_uv"))
        self.assertAlmostEqual(out["total_sin_iva"], 153680, places=6)

    def test_cantidad_fuera_de_matriz(self):
        with self.assertRaises(PriceNotFoundError):
            self.engine.quote_as_dict(self._req(750, "6x4", "sin_laca_uv"))

    def test_formato_invalido(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote_as_dict(self._req(100, "A4", "sin_laca_uv"))

    def test_terminacion_invalida(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote_as_dict(self._req(100, "6x4", "laca"))


if __name__ == "__main__":
    unittest.main()
