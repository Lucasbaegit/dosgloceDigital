import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_autoadhesivas import AutoadhesivasPricingEngine, load_autoadhesivas_bundle
from bajadas_autoadhesivas.exceptions import QuoteInputError
from bajadas_autoadhesivas.types import AutoadhesivasQuoteInput


class TestAutoadhesivasRangos(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = AutoadhesivasPricingEngine(load_autoadhesivas_bundle(ROOT))

    def _req(self, qty):
        return AutoadhesivasQuoteInput(
            categoria="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+",
            tipo_producto="autoadhesiva", columna_precio="papel", cantidad_unidades=qty, urgencia="normal"
        )

    def test_rango_600(self):
        out = self.engine.quote(self._req(600))
        self.assertEqual(out.cantidad_rango_aplicado, "501 a 1000")
        self.assertAlmostEqual(out.total_sin_iva, 632.0 * 600, places=6)

    def test_fuera_rango(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote(self._req(5001))

    def test_especial_rango_600(self):
        out = self.engine.quote(
            AutoadhesivasQuoteInput(
                categoria="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+",
                tipo_producto="autoadhesiva", columna_precio="especial", cantidad_unidades=600, urgencia="normal"
            )
        )
        self.assertEqual(out.cantidad_rango_aplicado, "501 a 1000")
        self.assertAlmostEqual(out.total_sin_iva, 1062.0 * 600, places=6)

if __name__ == "__main__":
    unittest.main()
