import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from tarjetas_troqueladas_circulares import TarjetasTroqueladasCircularesPricingEngine, load_tarjetas_troqueladas_circulares_bundle
from tarjetas_troqueladas_circulares.types import TarjetasTroqueladasCircularesQuoteInput


class T(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e = TarjetasTroqueladasCircularesPricingEngine(load_tarjetas_troqueladas_circulares_bundle(ROOT))

    def test_pdf_case(self):
        r=self.e.quote(TarjetasTroqueladasCircularesQuoteInput(categoria="Tarjetas Troqueladas Circulares",producto="tarjeta_troquelada_circular",formato="9cm",caras="4/4",cantidad_unidades=1000,urgencia="normal"))
        self.assertEqual(r.total_sin_iva,121784)

    def test_laminado_brillo_una_cara_suma_diez_por_ciento(self):
        r = self.e.quote(
            TarjetasTroqueladasCircularesQuoteInput(
                categoria="Tarjetas Troqueladas Circulares",
                producto="tarjeta_troquelada_circular",
                formato="1cm",
                caras="4/0",
                cantidad_unidades=100,
                urgencia="normal",
                adicional_laminado="laminado_brillo",
                caras_adicional_laminado=1,
            )
        )
        self.assertAlmostEqual(r.total_sin_iva, 2949.1, places=6)

    def test_laminado_mate_dos_caras_suma_veinte_por_ciento(self):
        r = self.e.quote(
            TarjetasTroqueladasCircularesQuoteInput(
                categoria="Tarjetas Troqueladas Circulares",
                producto="tarjeta_troquelada_circular",
                formato="1cm",
                caras="4/0",
                cantidad_unidades=100,
                urgencia="normal",
                adicional_laminado="laminado_mate",
                caras_adicional_laminado=2,
            )
        )
        self.assertAlmostEqual(r.total_sin_iva, 3217.2, places=6)

if __name__=="__main__":
    unittest.main()
