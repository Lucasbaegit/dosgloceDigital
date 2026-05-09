import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_adicionales_laminado import LaminadoAdicionalesPricingEngine, QuoteInputError, load_laminado_bundle
from bajadas_adicionales_laminado.types import LaminadoQuoteInput


class TestLaminadoNoCombinables(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = LaminadoAdicionalesPricingEngine(load_laminado_bundle(ROOT))

    def test_adicional_invalido_falla(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote(LaminadoQuoteInput(
                adicional="laminado_brillo+laminado_mate",
                formato="A3+",
                cantidad_unidades=30,
            ))

    def test_no_permita_lista_multiples(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote(LaminadoQuoteInput(
                adicional="['laca','laminado_brillo']",
                formato="A3+",
                cantidad_unidades=30,
            ))


if __name__ == "__main__":
    unittest.main()

