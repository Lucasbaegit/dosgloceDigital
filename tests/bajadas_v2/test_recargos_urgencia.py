import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_v2.config_loader import load_bajadas_v2_bundle
from bajadas_v2.exceptions import QuoteInputError
from bajadas_v2.pricing_engine import BajadasV2PricingEngine
from bajadas_v2.types import QuoteInput


class TestRecargosUrgencia(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(ROOT))
        cls.base_row = next(
            row for row in cls.engine.comparativa if row.get("estado") != "SIN_COMPARACION"
        )

    def _quote(self, urgencia: str):
        r = self.base_row
        q = QuoteInput(
            categoria=r["categoria"],
            modo_color=r["modo_color"],
            formato=r["formato"],
            tipo_papel=r["tipo_papel"],
            material=r["material"],
            gramaje=r["gramaje"],
            cantidad_rango=r["cantidad_rango"],
            caras=r["caras"],
            terminacion=r.get("terminacion"),
            urgencia=urgencia,
        )
        return self.engine.quote(q)

    def test_recargo_express(self):
        normal = self._quote("normal")
        express = self._quote("express")
        self.assertEqual(normal.trazabilidad.recargo_urgencia_aplicado, 0.0)
        self.assertAlmostEqual(
            normal.precio_unitario_con_urgencia,
            normal.precio_unitario_sin_iva,
            places=6,
        )
        self.assertAlmostEqual(
            express.precio_unitario_con_urgencia,
            normal.precio_unitario_sin_iva * 1.15,
            places=6,
        )
        self.assertEqual(express.trazabilidad.recargo_urgencia_aplicado, 0.15)

    def test_recargo_super_express(self):
        normal = self._quote("normal")
        sx = self._quote("super_express")
        self.assertAlmostEqual(sx.precio_unitario_con_urgencia, normal.precio_unitario_sin_iva * 1.30, places=6)

    def test_total_es_unitario_por_cantidad(self):
        r = self.base_row
        q = QuoteInput(
            categoria=r["categoria"],
            modo_color=r["modo_color"],
            formato=r["formato"],
            tipo_papel=r["tipo_papel"],
            material=r["material"],
            gramaje=r["gramaje"],
            cantidad_rango=r["cantidad_rango"],
            caras=r["caras"],
            cantidad_unidades=30,
            terminacion=r.get("terminacion"),
            urgencia="express",
        )
        result = self.engine.quote(q)
        self.assertEqual(result.cantidad_unidades, 30)
        self.assertAlmostEqual(result.total_sin_iva, result.precio_unitario_sin_iva * 30, places=6)
        self.assertAlmostEqual(result.total_con_urgencia, result.precio_unitario_con_urgencia * 30, places=6)

    def test_rechaza_urgencia_invalida(self):
        with self.assertRaises(QuoteInputError):
            self._quote("hoy")


if __name__ == "__main__":
    unittest.main()
