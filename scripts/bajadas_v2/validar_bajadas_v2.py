import subprocess
import sys
from pathlib import Path


def run_step(name: str, cmd: list[str], cwd: Path) -> tuple[bool, str]:
    print(f"\n[STEP] {name}")
    print(f"[CMD ] {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True)
    if proc.stdout:
        print(proc.stdout.strip())
    if proc.stderr:
        print(proc.stderr.strip())
    ok = proc.returncode == 0
    print(f"[RES ] {'OK' if ok else 'FAIL'} (exit={proc.returncode})")
    return ok, name


def main() -> int:
    root = Path(__file__).resolve().parents[2]

    steps = [
        (
            "Generar fixture de regresión (full)",
            [sys.executable, "scripts/bajadas_v2/generar_regresion_bajadas_v2.py"],
        ),
        (
            "Generar snapshot de métricas",
            [sys.executable, "scripts/bajadas_v2/snapshot_metricas_bajadas_v2.py"],
        ),
        (
            "Ejecutar suite unittest Bajadas v2",
            [sys.executable, "-m", "unittest", "discover", "-s", "tests/bajadas_v2", "-p", "test_*.py"],
        ),
    ]

    results = []
    for name, cmd in steps:
        ok, step_name = run_step(name, cmd, root)
        results.append((step_name, ok))

    all_ok = all(ok for _, ok in results)
    print("\n=== RESUMEN VALIDACION BAJADAS V2 ===")
    for step_name, ok in results:
        print(f"- {step_name}: {'PASS' if ok else 'FAIL'}")
    print(f"- RESULTADO FINAL: {'PASS' if all_ok else 'FAIL'}")
    return 0 if all_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
