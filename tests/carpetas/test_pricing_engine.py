import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from carpetas import CarpetasPricingEngine, load_carpetas_bundle
from carpetas.exceptions import PriceNotFoundError, QuoteInputError
from carpetas.types import CarpetasQuoteInput


class TestCarpetasPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = CarpetasPricingEngine(load_carpetas_bundle(ROOT))

    def _req(self, cantidad=1, terminacion="sin_laminar", caras="4/0", solapa=False, urgencia="normal"):
        return CarpetasQuoteInput(
            categoria="Carpetas",
            producto="carpeta_a4",
            formato="A4",
            papel="300g Ilustracion",
            gramaje="300g",
            terminacion=terminacion,
            caras=caras,
            cantidad_unidades=cantidad,
            solapa_impresa=solapa,
            urgencia=urgencia,
        )

    def test_cantidad_1_sin_solapa(self):
        out = self.engine.quote_as_dict(self._req(cantidad=1, terminacion="sin_laminar", caras="4/0", solapa=False))
        self.assertAlmostEqual(out["precio_unitario_sin_iva"], 1762, places=6)
        self.assertAlmostEqual(out["total_sin_iva"], 1762, places=6)

    def test_cantidad_1_con_solapa(self):
        out = self.engine.quote_as_dict(self._req(cantidad=1, terminacion="sin_laminar", caras="4/0", solapa=True))
        self.assertAlmostEqual(out["precio_unitario_sin_iva"], 2017, places=6)
        self.assertAlmostEqual(out["total_sin_iva"], 2017, places=6)

    def test_cantidad_25_laminado_mate_4_4(self):
        out = self.engine.quote_as_dict(self._req(cantidad=25, terminacion="laminado_mate", caras="4/4", solapa=False))
        self.assertAlmostEqual(out["precio_unitario_sin_iva"], 2054, places=6)
        self.assertAlmostEqual(out["total_sin_iva"], 51350, places=6)

    def test_cantidad_100_laca_uv_4_4_con_solapa(self):
        out = self.engine.quote_as_dict(self._req(cantidad=100, terminacion="laca_uv", caras="4/4", solapa=True))
        self.assertAlmostEqual(out["precio_unitario_sin_iva"], 1871, places=6)
        self.assertAlmostEqual(out["total_sin_iva"], 187100, places=6)

    def test_cantidad_1000_laminado_brillo_4_0(self):
        out = self.engine.quote_as_dict(self._req(cantidad=1000, terminacion="laminado_brillo", caras="4/0", solapa=False))
        self.assertAlmostEqual(out["total_sin_iva"], 1037000, places=6)

    def test_cantidad_1001_fuera_matriz(self):
        with self.assertRaises(PriceNotFoundError):
            self.engine.quote_as_dict(self._req(cantidad=1001))

    def test_terminacion_invalida(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote_as_dict(self._req(terminacion="barniz"))


if __name__ == "__main__":
    unittest.main()
