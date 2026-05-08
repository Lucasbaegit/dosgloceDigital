"""Trace helpers for Autoadhesivas v1."""

from __future__ import annotations


def range_family(label: str) -> str:
    if label in {"1", "2 a 25", "26 a 50"}:
        return "tirada_corta"
    if label in {"51 a 100", "101 a 300"}:
        return "tirada_media"
    return "tirada_larga"
