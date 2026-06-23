import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from stickers_corte_recto import StickersCorteRectoPricingEngine, load_stickers_corte_recto_bundle
from stickers_corte_recto.exceptions import PriceNotFoundError, QuoteInputError
from stickers_corte_recto.types import StickersCorteRectoQuoteInput


class TestStickersCorteRectoPricingEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = StickersCorteRectoPricingEngine(load_stickers_corte_recto_bundle(ROOT))

    def _req(self, cantidad=100, formato="6x4", terminacion="sin_laca_uv", variables_override=None):
        return StickersCorteRectoQuoteInput(
            categoria="Stickers Corte Recto",
            producto="sticker_corte_recto",
            formato=formato,
            terminacion=terminacion,
            cantidad_unidades=cantidad,
            urgencia="normal",
            variables_override=variables_override,
        )

    def test_100_6x4_sin_laca(self):
        out = self.engine.quote_as_dict(self._req(100, "6x4", "sin_laca_uv"))
        self.assertAlmostEqual(out["total_sin_iva"], 2765, places=6)

    def test_100_9x5_con_laca(self):
        out = self.engine.quote_as_dict(self._req(100, "9x5", "con_laca_uv"))
        self.assertAlmostEqual(out["total_sin_iva"], 5320, places=6)

    def test_500_10x7_sin_laca(self):
        out = self.engine.quote_as_dict(self._req(500, "10x7", "sin_laca_uv"))
        self.assertAlmostEqual(out["total_sin_iva"], 29821, places=6)

    def test_1000_10x7_con_laca(self):
        out = self.engine.quote_as_dict(self._req(1000, "10x7", "con_laca_uv"))
        self.assertAlmostEqual(out["total_sin_iva"], 61703, places=6)

    def test_formula_editable_calibrada_preserva_precio_pdf(self):
        out = self.engine.quote_as_dict(self._req(1000, "10x7", "con_laca_uv"))
        trace = out["trazabilidad"]
        self.assertAlmostEqual(out["total_sin_iva"], 61703, places=6)
        self.assertEqual(trace["modo_precio"], "formula_editable_calibrada")
        self.assertEqual(trace["modo_calculo"], "formula_calibrada_con_factor_pdf")
        self.assertIn("arbol_calculo", trace)
        self.assertIn("factor_ajuste_pdf", trace)
        keys = {item["key"] for item in trace["variables_principales_usadas"]}
        self.assertIn("factor_laca_uv_stickers_corte_recto", keys)
        self.assertIn("coeficiente_formato_stickers_corte_recto_10x7", keys)
        self.assertIn("coeficiente_cantidad_stickers_corte_recto_1000", keys)

    def test_override_modifica_base_tecnica_sin_cambiar_total_pdf(self):
        before = self.engine.quote_as_dict(self._req(1000, "10x7", "con_laca_uv"))
        req = self._req(1000, "10x7", "con_laca_uv", {"coeficiente_formato_stickers_corte_recto_10x7": 3.0})
        after = self.engine.quote_as_dict(req)
        self.assertAlmostEqual(after["total_sin_iva"], 61703, places=6)
        self.assertNotEqual(
            before["trazabilidad"]["precio_base_estimado"],
            after["trazabilidad"]["precio_base_estimado"],
        )
        self.assertNotEqual(
            before["trazabilidad"]["factor_ajuste_pdf"],
            after["trazabilidad"]["factor_ajuste_pdf"],
        )

    def test_cantidad_fuera_de_matriz(self):
        with self.assertRaises(PriceNotFoundError):
            self.engine.quote_as_dict(self._req(750, "6x4", "sin_laca_uv"))

    def test_formato_invalido(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote_as_dict(self._req(100, "A4", "sin_laca_uv"))

    def test_terminacion_invalida(self):
        with self.assertRaises(QuoteInputError):
            self.engine.quote_as_dict(self._req(100, "6x4", "laca"))


if __name__ == "__main__":
    unittest.main()
