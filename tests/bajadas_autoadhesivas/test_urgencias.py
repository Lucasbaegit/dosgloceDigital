import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_autoadhesivas import AutoadhesivasPricingEngine, load_autoadhesivas_bundle
from bajadas_autoadhesivas.exceptions import QuoteInputError
from bajadas_autoadhesivas.types import AutoadhesivasQuoteInput


class TestAutoadhesivasUrgencias(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = AutoadhesivasPricingEngine(load_autoadhesivas_bundle(ROOT))

    def _req(self, urg):
        return AutoadhesivasQuoteInput(
            categoria="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+",
            tipo_producto="autoadhesiva", columna_precio="papel", cantidad_unidades=30, urgencia=urg
        )

    def test_normal_no_recargo(self):
        out = self.engine.quote(self._req("normal"))
        self.assertAlmostEqual(out.precio_unitario_sin_iva, out.precio_unitario_con_urgencia, places=6)

    def test_express_15(self):
        out = self.engine.quote(self._req("express"))
        self.assertAlmostEqual(out.precio_unitario_con_urgencia, out.precio_unitario_sin_iva * 1.15, places=6)

    def test_tinta_blanca_laca_uv_fuera(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote(AutoadhesivasQuoteInput(
                categoria="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+",
                tipo_producto="autoadhesiva", columna_precio="tinta blanca", cantidad_unidades=30, urgencia="normal"
            ))

if __name__ == "__main__":
    unittest.main()
