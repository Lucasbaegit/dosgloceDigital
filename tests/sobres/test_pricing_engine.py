import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from sobres import SobresPricingEngine, load_sobres_bundle
from sobres.exceptions import PriceNotFoundError, QuoteInputError
from sobres.types import SobresQuoteInput


class TestSobresPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = SobresPricingEngine(load_sobres_bundle(ROOT))

    def _req(self, cantidad=100, tipo="sobre_bolsa_a4_22_9x32_4", caras="4/0", urgencia="normal"):
        return SobresQuoteInput(
            categoria="Sobres",
            producto="sobre",
            tipo_sobre=tipo,
            papel="63g",
            color="blanco",
            caras=caras,
            cantidad_unidades=cantidad,
            urgencia=urgencia,
        )

    def test_100_sobre_a4(self):
        out = self.engine.quote_as_dict(self._req(cantidad=100, tipo="sobre_bolsa_a4_22_9x32_4"))
        self.assertAlmostEqual(out["precio_unitario_sin_iva"], 633, places=6)
        self.assertAlmostEqual(out["total_sin_iva"], 63300, places=6)

    def test_100_oficio_ingles(self):
        out = self.engine.quote_as_dict(self._req(cantidad=100, tipo="oficio_ingles_12x23_5"))
        self.assertAlmostEqual(out["total_sin_iva"], 44000, places=6)

    def test_1000_sobre_27x37(self):
        out = self.engine.quote_as_dict(self._req(cantidad=1000, tipo="sobre_bolsa_27x37"))
        self.assertAlmostEqual(out["total_sin_iva"], 536000, places=6)

    def test_500_sobre_25x35_3(self):
        out = self.engine.quote_as_dict(self._req(cantidad=500, tipo="sobre_bolsa_25x35_3"))
        self.assertAlmostEqual(out["total_sin_iva"], 274500, places=6)

    def test_300_oficio_ingles(self):
        out = self.engine.quote_as_dict(self._req(cantidad=300, tipo="oficio_ingles_12x23_5"))
        self.assertAlmostEqual(out["total_sin_iva"], 123000, places=6)

    def test_cantidad_fuera_matriz(self):
        with self.assertRaises(PriceNotFoundError):
            self.engine.quote_as_dict(self._req(cantidad=750))

    def test_caras_no_soportadas(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote_as_dict(self._req(cantidad=100, caras="4/4"))


if __name__ == "__main__":
    unittest.main()
