import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_adicionales_laminado import LaminadoAdicionalesPricingEngine, load_laminado_bundle
from bajadas_adicionales_laminado.types import LaminadoQuoteInput


class TestLaminadoPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = LaminadoAdicionalesPricingEngine(load_laminado_bundle(ROOT))

    def test_sin_adicional_devuelve_cero(self):
        out = self.engine.quote(LaminadoQuoteInput(
            adicional="sin_adicional",
            formato="A3+",
            cantidad_unidades=30,
            urgencia="normal",
        ))
        self.assertEqual(out.adicional_unitario_sin_iva, 0)
        self.assertEqual(out.total_adicional_sin_iva, 0)
        self.assertEqual(out.regla_aplicada, "ADICIONAL_SIN_CARGO_A3PLUS")

    def test_total_combinado_desde_precio_unitario_base(self):
        out = self.engine.quote(LaminadoQuoteInput(
            adicional="laca",
            formato="A3+",
            cantidad_unidades=30,
            urgencia="normal",
            precio_unitario_base=1000.0,
        ))
        self.assertEqual(out.rango_aplicado, "11 - 50")
        self.assertAlmostEqual(out.total_base, 30000.0, places=6)
        self.assertAlmostEqual(out.total_combinado_sin_iva, 30000.0 + (126.0430016 * 30), places=6)

    def test_total_combinado_desde_total_base(self):
        out = self.engine.quote(LaminadoQuoteInput(
            adicional="laminado_brillo",
            formato="A3+",
            cantidad_unidades=30,
            urgencia="express",
            total_base=20000.0,
        ))
        self.assertEqual(out.rango_aplicado, "11 - 50")
        self.assertAlmostEqual(out.total_combinado_sin_iva, 20000.0 + (151.2516019 * 30), places=6)
        self.assertAlmostEqual(out.total_combinado_con_urgencia, out.total_combinado_sin_iva * 1.15, places=6)


if __name__ == "__main__":
    unittest.main()

