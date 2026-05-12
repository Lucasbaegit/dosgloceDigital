import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_v2.config_loader import load_bajadas_v2_bundle
from bajadas_v2.exceptions import PriceNotFoundError
from bajadas_v2.pricing_engine import BajadasV2PricingEngine
from bajadas_v2.trace import build_lookup_key
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

    def test_calculo_xa3_factor_110_byn(self):
        row = self._pick_row(formato="A3+", modo_color="blanco_y_negro", caras="1/0")
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

    def test_kraft_sin_comparacion_habilitado_por_pdf(self):
        q = QuoteInput(
            categoria="Bajadas Kraft",
            modo_color="blanco_y_negro",
            formato="A3",
            tipo_papel="kraft",
            material="Kraft",
            gramaje="80g",
            cantidad_rango="1",
            caras="1/0",
            cantidad_unidades=1,
            urgencia="normal",
        )
        result = self.engine.quote(q)
        self.assertAlmostEqual(result.precio_unitario_sin_iva, 251.1, places=6)
        self.assertAlmostEqual(result.total_sin_iva, 251.1, places=6)
        self.assertEqual(result.regla_aplicada, "KRAFT_A3_MATRIZ_PDF_ESPECIFICA")
        self.assertEqual(result.fuente, "kraft_pdf_pagina_5")

    def test_sin_comparacion_no_kraft_sigue_bloqueado(self):
        q = QuoteInput(
            categoria="Bajadas Fullcolor",
            modo_color="fullcolor",
            formato="A3+",
            tipo_papel="liviano",
            material="Ilustracion",
            gramaje="150g",
            cantidad_rango="1",
            caras="4/0",
            cantidad_unidades=1,
            urgencia="normal",
        )
        key = build_lookup_key(
            {
                "categoria": q.categoria,
                "modo_color": q.modo_color,
                "formato": q.formato,
                "tipo_papel": q.tipo_papel,
                "material": q.material,
                "gramaje": q.gramaje,
                "cantidad_rango": q.cantidad_rango,
                "caras": q.caras,
                "terminacion": q.terminacion,
            }
        )
        original = self.engine._comparativa_index.get(key)
        self.assertIsNotNone(original)
        try:
            self.engine._comparativa_index[key] = {
                **original,
                "estado": "SIN_COMPARACION",
                "precio_objetivo_csv": 111.0,
                "precio_estimado_v2": None,
            }
            with self.assertRaises(PriceNotFoundError) as ctx:
                self.engine.quote(q)
        finally:
            self.engine._comparativa_index[key] = original
        self.assertIn("SIN_COMPARACION", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
