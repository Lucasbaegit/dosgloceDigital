import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_autoadhesivas import AutoadhesivasPricingEngine, load_autoadhesivas_bundle
from bajadas_autoadhesivas.types import AutoadhesivasQuoteInput


class TestAutoadhesivasPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = AutoadhesivasPricingEngine(load_autoadhesivas_bundle(ROOT))

    def test_papel_cantidad_1(self):
        out = self.engine.quote(AutoadhesivasQuoteInput(
            categoria="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+",
            tipo_producto="autoadhesiva", columna_precio="papel", cantidad_unidades=1, urgencia="normal"
        ))
        self.assertEqual(out.cantidad_rango_aplicado, "1")
        self.assertAlmostEqual(out.precio_unitario_sin_iva, 1069.0, places=6)

    def test_papel_cantidad_30(self):
        out = self.engine.quote(AutoadhesivasQuoteInput(
            categoria="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+",
            tipo_producto="autoadhesiva", columna_precio="papel", cantidad_unidades=30, urgencia="normal"
        ))
        self.assertEqual(out.cantidad_rango_aplicado, "26 a 50")
        self.assertAlmostEqual(out.total_sin_iva, 826.0 * 30, places=6)

    def test_especial_cantidad_30(self):
        out = self.engine.quote(AutoadhesivasQuoteInput(
            categoria="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+",
            tipo_producto="autoadhesiva", columna_precio="especial", cantidad_unidades=30, urgencia="normal"
        ))
        self.assertEqual(out.cantidad_rango_aplicado, "26 a 50")
        self.assertAlmostEqual(out.precio_unitario_sin_iva, 1389.0, places=6)
        self.assertAlmostEqual(out.total_sin_iva, 1389.0 * 30, places=6)

    def test_especial_cantidad_1(self):
        out = self.engine.quote(AutoadhesivasQuoteInput(
            categoria="Bajadas Autoadhesivas", modo_color="fullcolor", formato="A3+",
            tipo_producto="autoadhesiva", columna_precio="especial", cantidad_unidades=1, urgencia="normal"
        ))
        self.assertEqual(out.cantidad_rango_aplicado, "1")
        self.assertAlmostEqual(out.precio_unitario_sin_iva, 1797.0, places=6)

if __name__ == "__main__":
    unittest.main()
