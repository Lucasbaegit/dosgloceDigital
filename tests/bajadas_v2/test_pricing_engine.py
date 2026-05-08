import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_v2.config_loader import load_bajadas_v2_bundle
from bajadas_v2.pricing_engine import BajadasV2PricingEngine
from bajadas_v2.types import QuoteInput


class TestPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(ROOT))

    def _pick_row(self, **filters):
        for row in self.engine.comparativa:
            if row.get("estado") == "SIN_COMPARACION":
                continue
            ok = all(row.get(k) == v for k, v in filters.items())
            if ok:
                return row
        self.fail(f"No se encontró fila para filtros: {filters}")

    def test_calculo_a3_base(self):
        row = self._pick_row(formato="A3+", modo_color="fullcolor")
        q = QuoteInput(
            categoria=row["categoria"],
            modo_color=row["modo_color"],
            formato=row["formato"],
            tipo_papel=row["tipo_papel"],
            material=row["material"],
            gramaje=row["gramaje"],
            cantidad_rango=row["cantidad_rango"],
            caras=row["caras"],
            cantidad_unidades=30,
            terminacion=row.get("terminacion"),
            urgencia="normal",
        )
        result = self.engine.quote(q)
        self.assertAlmostEqual(result.precio_sin_iva, float(row["precio_estimado_v2"]), places=6)
        self.assertAlmostEqual(result.total_sin_iva, result.precio_unitario_sin_iva * 30, places=6)
        self.assertEqual(result.trazabilidad.factor_aplicado, 1.0)

    def test_calculo_xa3_factor_110(self):
        row = self._pick_row(formato="A3+", modo_color="fullcolor")
        q = QuoteInput(
            categoria=row["categoria"],
            modo_color=row["modo_color"],
            formato="XA3",
            tipo_papel=row["tipo_papel"],
            material=row["material"],
            gramaje=row["gramaje"],
            cantidad_rango=row["cantidad_rango"],
            caras=row["caras"],
            cantidad_unidades=30,
            terminacion=row.get("terminacion"),
            urgencia="normal",
        )
        result = self.engine.quote(q)
        self.assertEqual(result.regla_aplicada, "FACTOR_XA3_1_10")
        self.assertAlmostEqual(result.trazabilidad.factor_aplicado, 1.10, places=8)
        self.assertAlmostEqual(result.precio_sin_iva, float(row["precio_estimado_v2"]) * 1.10, places=5)
        self.assertEqual(result.cantidad_unidades, 30)


if __name__ == "__main__":
    unittest.main()
