import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from stickers_circulares import StickersCircularesPricingEngine, load_stickers_circulares_bundle
from stickers_circulares.exceptions import PriceNotFoundError, QuoteInputError
from stickers_circulares.types import StickersCircularesQuoteInput


class StickersCircularesPricingEngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = StickersCircularesPricingEngine(load_stickers_circulares_bundle(ROOT))

    def quote(self, **kwargs):
        payload = {
            "categoria": "Stickers Circulares",
            "producto": "sticker_circular",
            "material": "obra_ilustracion_90g",
            "formato": "1cm",
            "terminacion": "sin_laca_uv",
            "cantidad_unidades": 100,
            "urgencia": "normal",
            "modo_precio": None,
            "variables_override": None,
        }
        payload.update(kwargs)
        return self.engine.quote(
            StickersCircularesQuoteInput(
                categoria=payload["categoria"],
                producto=payload["producto"],
                material=payload["material"],
                formato=payload["formato"],
                terminacion=payload["terminacion"],
                cantidad_unidades=payload["cantidad_unidades"],
                urgencia=payload["urgencia"],
                modo_precio=payload["modo_precio"],
                variables_override=payload["variables_override"],
            )
        )

    def test_min_case(self):
        result = self.quote(material="obra_ilustracion_90g", formato="1cm", terminacion="sin_laca_uv", cantidad_unidades=100)
        self.assertEqual(result.total_sin_iva, 2313)
        self.assertEqual(result.trazabilidad["modo_precio"], "formula_editable_calibrada")
        self.assertIn("arbol_calculo", result.trazabilidad)
        self.assertIsNotNone(result.trazabilidad.get("factor_ajuste_pdf"))

    def test_max_case(self):
        result = self.quote(material="fluo_kraft_marron", formato="18-20cm", terminacion="con_laca_uv", cantidad_unidades=1000)
        self.assertEqual(result.total_sin_iva, 481291)

    def test_invalid_qty(self):
        with self.assertRaises(PriceNotFoundError):
            self.quote(cantidad_unidades=750)

    def test_invalid_format(self):
        with self.assertRaises(QuoteInputError):
            self.quote(formato="99cm")

    def test_pdf_fallback_mode(self):
        result = self.quote(modo_precio="pdf_fijo")
        self.assertEqual(result.total_sin_iva, 2313)
        self.assertEqual(result.trazabilidad["modo_precio"], "pdf_fijo")

    def test_experimental_override_changes_base(self):
        base = self.quote()
        changed = self.quote(variables_override={"click_color_base": 4.2})
        self.assertEqual(base.total_sin_iva, changed.total_sin_iva)
        self.assertNotEqual(
            base.trazabilidad["precio_base_estimado"],
            changed.trazabilidad["precio_base_estimado"],
        )


if __name__ == "__main__":
    unittest.main()
