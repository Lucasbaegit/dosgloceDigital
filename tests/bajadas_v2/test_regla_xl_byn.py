import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_v2.config_loader import load_bajadas_v2_bundle
from bajadas_v2.pricing_engine import BajadasV2PricingEngine
from bajadas_v2.types import QuoteInput


class TestReglaXlByn(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(ROOT))

    def _pick_row(self, **filters):
        for row in self.engine.comparativa:
            if row.get("estado") == "SIN_COMPARACION":
                continue
            if all(row.get(k) == v for k, v in filters.items()):
                return row
        self.fail(f"No se encontró fila: {filters}")

    def test_xl_byn_uses_special_rule_and_correction_trace(self):
        row = self._pick_row(
            categoria="Bajadas Blanco y Negro",
            formato="XL",
            caras="1/1",
        )
        q = QuoteInput(
            categoria=row["categoria"],
            modo_color=row["modo_color"],
            formato=row["formato"],
            tipo_papel=row["tipo_papel"],
            material=row["material"],
            gramaje=row["gramaje"],
            cantidad_rango=row["cantidad_rango"],
            caras=row["caras"],
            terminacion=row.get("terminacion"),
            urgencia="normal",
        )
        result = self.engine.quote(q)
        self.assertEqual(result.regla_aplicada, "MODELO_D_D2_REGLA_XL_BYN")
        self.assertEqual(result.trazabilidad.regla_especial, "REGLA_ESPECIAL_XL_BYN_TIPO_PAPEL_CARAS")
        self.assertEqual(result.trazabilidad.correccion_logica, "CORRECCION_XL_BYN_1_1_PARENTESIS")

    def test_xl_fullcolor_does_not_use_xl_byn_rule(self):
        row = self._pick_row(categoria="Bajadas Fullcolor", formato="XL", caras="4/0")
        q = QuoteInput(
            categoria=row["categoria"],
            modo_color=row["modo_color"],
            formato=row["formato"],
            tipo_papel=row["tipo_papel"],
            material=row["material"],
            gramaje=row["gramaje"],
            cantidad_rango=row["cantidad_rango"],
            caras=row["caras"],
            terminacion=row.get("terminacion"),
            urgencia="normal",
        )
        result = self.engine.quote(q)
        self.assertIsNone(result.trazabilidad.regla_especial)
        self.assertIsNone(result.trazabilidad.correccion_logica)


if __name__ == "__main__":
    unittest.main()
