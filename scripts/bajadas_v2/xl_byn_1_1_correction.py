from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class FormulaCorrectionResult:
    applied: bool
    formula_original_detectada: str
    formula_corregida: str
    motivo: str
    componente_corregido: str


def apply_xl_byn_1_1_parenthesis_fix(
    formula: str,
    *,
    formato: str | None = None,
    modo_color: str | None = None,
    caras: str | None = None,
) -> FormulaCorrectionResult:
    """Apply the XL ByN 1/1 AG-inside-parenthesis correction.

    Before:  (paper + variable) * AH * AG
    After:   (paper + variable*AG) * AH

    Correction is guarded to only run for XL + blanco_y_negro + 1/1.
    """
    original = formula
    default = FormulaCorrectionResult(
        applied=False,
        formula_original_detectada=original,
        formula_corregida=original,
        motivo="Sin corrección: fuera de alcance (solo XL blanco_y_negro 1/1).",
        componente_corregido="AG dentro del término variable",
    )

    if not formula or not formula.startswith("="):
        return default

    if not (formato == "XL" and modo_color == "blanco_y_negro" and caras == "1/1"):
        return default

    # Match either (...)*AH*AG or (...)*AG*AH
    m_ah_ag = re.match(r"^=\(([^\+\)]+)\+([^\)]+)\)\*(\$?AH\$?\d+)\*(\$?AG\$?\d+)$", formula)
    m_ag_ah = re.match(r"^=\(([^\+\)]+)\+([^\)]+)\)\*(\$?AG\$?\d+)\*(\$?AH\$?\d+)$", formula)

    if m_ah_ag:
        paper, variable, ah, ag = m_ah_ag.group(1), m_ah_ag.group(2), m_ah_ag.group(3), m_ah_ag.group(4)
        corrected = f"=({paper}+{variable}*{ag})*{ah}"
    elif m_ag_ah:
        paper, variable, ag, ah = m_ag_ah.group(1), m_ag_ah.group(2), m_ag_ah.group(3), m_ag_ah.group(4)
        corrected = f"=({paper}+{variable}*{ag})*{ah}"
    else:
        return FormulaCorrectionResult(
            applied=False,
            formula_original_detectada=original,
            formula_corregida=original,
            motivo="Sin corrección: fórmula no coincide con patrón XL ByN 1/1 esperado.",
            componente_corregido="AG dentro del término variable",
        )

    return FormulaCorrectionResult(
        applied=True,
        formula_original_detectada=original,
        formula_corregida=corrected,
        motivo="Consistencia con A3+/XA3/A4 1/1: AG debe afectar el término variable, no todo el paréntesis.",
        componente_corregido="AG dentro del término variable",
    )
