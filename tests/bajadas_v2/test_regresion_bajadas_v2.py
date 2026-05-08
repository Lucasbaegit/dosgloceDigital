import json
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from bajadas_v2.config_loader import load_bajadas_v2_bundle
from bajadas_v2.pricing_engine import BajadasV2PricingEngine
from bajadas_v2.types import QuoteInput


class TestRegresionBajadasV2(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture_path = ROOT / "tests" / "bajadas_v2" / "fixtures" / "regresion_bajadas_v2_cases.json"
        if not cls.fixture_path.exists():
            raise unittest.SkipTest(
                "Fixture de regresión no existe. Ejecutar scripts/bajadas_v2/generar_regresion_bajadas_v2.py"
            )

        with cls.fixture_path.open("r", encoding="utf-8") as fh:
            cls.fixture = json.load(fh)

        cls.tol_abs = float(cls.fixture["meta"].get("tolerancia_absoluta_default", 1.0))
        cls.tol_pct = float(cls.fixture["meta"].get("tolerancia_porcentual_default", 0.5))
        cls.engine = BajadasV2PricingEngine(load_bajadas_v2_bundle(ROOT))

    def _build_input(self, payload):
        return QuoteInput(
            categoria=payload["categoria"],
            modo_color=payload["modo_color"],
            formato=payload["formato"],
            tipo_papel=payload["tipo_papel"],
            material=payload["material"],
            gramaje=payload["gramaje"],
            cantidad_rango=payload["cantidad_rango"],
            caras=payload["caras"],
            terminacion=payload.get("terminacion"),
            urgencia=payload.get("urgencia", "normal"),
        )

    def test_precio_sin_iva_regresion(self):
        failures = []
        for case in self.fixture["cases"]:
            quote_input = self._build_input(case["input"])
            result = self.engine.quote(quote_input)
            expected = float(case["expected"]["precio_sin_iva"])
            actual = float(result.precio_sin_iva)
            delta_abs = abs(actual - expected)
            delta_pct = (delta_abs / expected * 100.0) if expected else (0.0 if delta_abs == 0 else math.inf)

            if not (delta_abs <= self.tol_abs or delta_pct <= self.tol_pct):
                failures.append(
                    {
                        "id": case["id"],
                        "expected": expected,
                        "actual": actual,
                        "delta_abs": delta_abs,
                        "delta_pct": delta_pct,
                        "fuente": result.fuente,
                        "regla_aplicada": result.regla_aplicada,
                    }
                )

        if failures:
            preview = failures[:20]
            msg = ["Fallos de regresión detectados (top 20):"]
            for f in preview:
                msg.append(
                    f"- {f['id']} | exp={f['expected']:.6f} act={f['actual']:.6f} "
                    f"abs={f['delta_abs']:.6f} pct={f['delta_pct']:.6f}% "
                    f"fuente={f['fuente']} regla={f['regla_aplicada']}"
                )
            msg.append(f"Total fallos: {len(failures)} de {len(self.fixture['cases'])}")
            self.fail("\n".join(msg))

    def test_urgencias_en_muestra(self):
        # subset determinístico: primeros 20 casos
        cases = self.fixture["cases"][:20]
        for case in cases:
            base_input = dict(case["input"])
            base_input["urgencia"] = "normal"
            base = self.engine.quote(self._build_input(base_input))
            b = base.precio_sin_iva

            express_input = dict(case["input"])
            express_input["urgencia"] = "express"
            express = self.engine.quote(self._build_input(express_input))
            self.assertAlmostEqual(express.precio_con_recargo_urgencia, b * 1.15, places=6)

            sx_input = dict(case["input"])
            sx_input["urgencia"] = "super_express"
            sx = self.engine.quote(self._build_input(sx_input))
            self.assertAlmostEqual(sx.precio_con_recargo_urgencia, b * 1.30, places=6)

            ya_input = dict(case["input"])
            ya_input["urgencia"] = "ya_24hs"
            ya = self.engine.quote(self._build_input(ya_input))
            self.assertAlmostEqual(ya.precio_con_recargo_urgencia, b * 1.50, places=6)


if __name__ == "__main__":
    unittest.main()
