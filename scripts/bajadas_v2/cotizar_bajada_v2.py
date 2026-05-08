import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(root / "src"))

    from bajadas_v2 import BajadasV2PricingEngine, load_bajadas_v2_bundle
    from bajadas_v2.types import QuoteInput

    parser = argparse.ArgumentParser(description="Cotizador Bajadas v2")
    parser.add_argument("--categoria", required=True)
    parser.add_argument("--modo-color", required=True)
    parser.add_argument("--formato", required=True)
    parser.add_argument("--tipo-papel", required=True)
    parser.add_argument("--material", required=True)
    parser.add_argument("--gramaje", required=True)
    parser.add_argument("--cantidad-rango", required=True)
    parser.add_argument("--caras", required=True)
    parser.add_argument("--terminacion", default=None)
    parser.add_argument("--urgencia", default="normal")
    args = parser.parse_args()

    bundle = load_bajadas_v2_bundle(root)
    engine = BajadasV2PricingEngine(bundle)
    quote_input = QuoteInput(
        categoria=args.categoria,
        modo_color=args.modo_color,
        formato=args.formato,
        tipo_papel=args.tipo_papel,
        material=args.material,
        gramaje=args.gramaje,
        cantidad_rango=args.cantidad_rango,
        caras=args.caras,
        terminacion=args.terminacion,
        urgencia=args.urgencia,
    )
    result = engine.quote_as_dict(quote_input)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
