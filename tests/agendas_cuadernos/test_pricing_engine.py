import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from agendas_cuadernos import AgendasCuadernosPricingEngine, load_agendas_cuadernos_bundle
from agendas_cuadernos.types import AgendasCuadernosQuoteInput


class T(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.e = AgendasCuadernosPricingEngine(load_agendas_cuadernos_bundle(ROOT))

    def test_pdf_case(self):
        r=self.e.quote(AgendasCuadernosQuoteInput(categoria="Agendas / Cuadernos",producto="agenda_2026",formato="A5",paginas=72,cantidad_unidades=2,urgencia="normal"))
        self.assertEqual(r.total_sin_iva,6000)

if __name__=="__main__":
    unittest.main()
