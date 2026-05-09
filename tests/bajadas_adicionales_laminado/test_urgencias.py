import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_adicionales_laminado import LaminadoAdicionalesPricingEngine, load_laminado_bundle
from bajadas_adicionales_laminado.types import LaminadoQuoteInput


class TestLaminadoUrgencias(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = LaminadoAdicionalesPricingEngine(load_laminado_bundle(ROOT))

    def test_normal_no_recarga(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laca", formato="A3+", cantidad_unidades=30, urgencia="normal"))
        self.assertAlmostEqual(out.adicional_unitario_con_urgencia, out.adicional_unitario_sin_iva, places=6)
        self.assertAlmostEqual(out.total_adicional_con_urgencia, out.total_adicional_sin_iva, places=6)

    def test_express_aplica_15(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laca", formato="A3+", cantidad_unidades=30, urgencia="express"))
        self.assertAlmostEqual(out.adicional_unitario_con_urgencia, out.adicional_unitario_sin_iva * 1.15, places=5)

    def test_super_express_aplica_30(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laca", formato="A3+", cantidad_unidades=30, urgencia="super_express"))
        self.assertAlmostEqual(out.adicional_unitario_con_urgencia, out.adicional_unitario_sin_iva * 1.30, places=5)

    def test_ya_24hs_aplica_50(self):
        out = self.engine.quote(LaminadoQuoteInput(adicional="laca", formato="A3+", cantidad_unidades=30, urgencia="ya_24hs"))
        self.assertAlmostEqual(out.adicional_unitario_con_urgencia, out.adicional_unitario_sin_iva * 1.50, places=5)


if __name__ == "__main__":
    unittest.main()
