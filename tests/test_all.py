import subprocess
import sys
import unittest
from pathlib import Path


class TestAllSuites(unittest.TestCase):
    def test_discover_bajadas_v2(self):
        root = Path(__file__).resolve().parents[1]
        cmd = [sys.executable, "-m", "unittest", "discover", "-s", "tests/bajadas_v2", "-p", "test_*.py"]
        proc = subprocess.run(cmd, cwd=str(root), capture_output=True, text=True)
        if proc.returncode != 0:
            self.fail(f"Suite tests/bajadas_v2 falló:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")

    def test_discover_api(self):
        root = Path(__file__).resolve().parents[1]
        cmd = [sys.executable, "-m", "unittest", "discover", "-s", "tests/api", "-p", "test_*.py"]
        proc = subprocess.run(cmd, cwd=str(root), capture_output=True, text=True)
        if proc.returncode != 0:
            self.fail(f"Suite tests/api falló:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")
